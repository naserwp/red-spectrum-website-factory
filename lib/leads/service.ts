import "server-only";

import { getCustomerDelivery, getSendGridConfig, leadDeliveryAllowedForSlug, leadEmailEnabled, type LeadDeliveryMode } from "./config";
import { sendSendGridNotification } from "./email";
import { createLeadStore } from "./store";
import { getCustomerSite } from "@/lib/customers/registry";
import { hashValue, leadDedupeKey, type WebsiteLeadInput } from "./validation";
import type { CustomerSite } from "@/lib/customers/schema";
import { myndyContactSyncConfigured, safeMyndyError, syncUniqueHomeContact } from "./myndy-contacts";
import type { LeadStore, StoredLead } from "./store";

async function syncContact(store: LeadStore, lead: StoredLead) {
  if (lead.deliveryMode !== "live" || !myndyContactSyncConfigured(lead.customerSlug)) return;
  try {
    if (!await store.claimMyndy(lead.leadId)) return;
    try {
      await syncUniqueHomeContact(lead);
      await store.finishMyndy(lead.leadId);
    } catch (error) {
      // Never automatically replay an ambiguous provider result and risk duplicate contacts.
      await store.finishMyndy(lead.leadId, safeMyndyError(error));
    }
  } catch {
    console.error("unique_home_myndy_status_unavailable");
  }
}

const RATE_LIMIT_MAXIMUM = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "send_error";
  return /^sendgrid_\d{3}$/.test(message) ? message : "send_error";
}

export async function acceptWebsiteLead(site: CustomerSite, lead: WebsiteLeadInput, clientIp: string) {
  const mode = site.form.mode as LeadDeliveryMode | "disabled";
  if (mode === "disabled" || !site.form.recipientConfirmed || (mode === "live" && !site.form.testPassed)) return { state: "inactive" as const };
  if (!leadEmailEnabled(mode, site.slug) || !leadDeliveryAllowedForSlug(site.slug, mode)) return { state: "inactive" as const };
  const config = getSendGridConfig();
  if (!config) return { state: "unconfigured" as const };
  const store = createLeadStore(config.databaseUrl);
  const now = new Date();
  const recipient = getCustomerDelivery(site, mode);
  const windowStart = Math.floor(now.getTime() / RATE_LIMIT_WINDOW_MS) * RATE_LIMIT_WINDOW_MS;
  const bucketKey = hashValue(`${site.slug}\u0000${hashValue(clientIp + config.rateLimitSalt)}\u0000${windowStart}`);
  const allowed = await store.consumeRateLimit(bucketKey, new Date(windowStart + RATE_LIMIT_WINDOW_MS), RATE_LIMIT_MAXIMUM);
  if (!allowed) return { state: "rate_limited" as const };
  const persisted = await store.persist({ customerSlug: site.slug, mode, recipient: recipient.recipient, dedupeKey: leadDedupeKey(site.slug, lead, now), receivedAt: now, lead });
  if (persisted.duplicate) {
    if (persisted.lead.notificationStatus === "accepted") await syncContact(store, persisted.lead);
    return { state: persisted.lead.notificationStatus === "accepted" ? "duplicate" as const : "notification_pending" as const, leadId: persisted.lead.leadId };
  }
  const claimed = await store.claim(persisted.lead.leadId);
  if (!claimed) return { state: "notification_pending" as const, leadId: persisted.lead.leadId };
  try {
    const messageId = await sendSendGridNotification(config, { recipient: claimed.recipientEmail, subject: recipient.subject, lead: claimed });
    await store.markAccepted(claimed.leadId, messageId);
    await syncContact(store, claimed);
    return { state: "accepted" as const, leadId: claimed.leadId };
  } catch (error) {
    await store.markFailed(claimed.leadId, claimed.attemptCount, errorCode(error));
    return { state: "notification_pending" as const, leadId: claimed.leadId };
  }
}

export async function retryPendingLeadNotifications(limit = 10) {
  if (!leadEmailEnabled("test") && !leadEmailEnabled("live") && !leadEmailEnabled("live", "broom-home-enterprises-llc")) return { attempted: 0, accepted: 0, failed: 0, disabled: true };
  const config = getSendGridConfig();
  if (!config) throw new Error("Lead delivery is not configured.");
  const store = createLeadStore(config.databaseUrl);
  const leadIds = await store.pendingRetryIds(Math.min(Math.max(limit, 1), 25));
  let accepted = 0; let failed = 0;
  for (const leadId of leadIds) {
    const pending = await store.get(leadId);
    if (!pending || !leadEmailEnabled(pending.deliveryMode, pending.customerSlug)) continue;
    const site = getCustomerSite(pending.customerSlug);
    if (!site || site.form.mode !== pending.deliveryMode || !site.form.recipientConfirmed || (pending.deliveryMode === "live" && !site.form.testPassed) || !leadDeliveryAllowedForSlug(site.slug, pending.deliveryMode)) continue;
    // Never retry a disabled tenant or silently send an old lead to a changed recipient.
    let delivery;
    try { delivery = getCustomerDelivery(site, pending.deliveryMode); } catch { continue; }
    if (delivery.recipient !== pending.recipientEmail) continue;
    const lead = await store.claim(leadId);
    if (!lead) continue;
    try {
      const messageId = await sendSendGridNotification(config, { recipient: lead.recipientEmail, subject: delivery.subject, lead });
      await store.markAccepted(lead.leadId, messageId); accepted++;
      await syncContact(store, lead);
    } catch (error) {
      await store.markFailed(lead.leadId, lead.attemptCount, errorCode(error)); failed++;
    }
  }
  return { attempted: accepted + failed, accepted, failed };
}
