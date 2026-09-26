import "server-only";

import { getCustomerDelivery, getSendGridConfig, leadEmailEnabled, type LeadDeliveryMode } from "./config";
import { sendSendGridNotification } from "./email";
import { createLeadStore, type StoredLead } from "./store";
import { hashValue, leadDedupeKey, type WebsiteLeadInput } from "./validation";
import type { CustomerSite } from "@/lib/customers/schema";

const RATE_LIMIT_MAXIMUM = 8;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

function errorCode(error: unknown) {
  const message = error instanceof Error ? error.message : "send_error";
  return /^sendgrid_\d{3}$/.test(message) ? message : "send_error";
}

function retrySubject(lead: StoredLead) {
  return lead.deliveryMode === "test" ? "[TEST] New website lead — Swenzy Logistics" : "New website lead — Swenzy Logistics";
}

export async function acceptWebsiteLead(site: CustomerSite, lead: WebsiteLeadInput, clientIp: string) {
  const mode = site.form.mode as LeadDeliveryMode | "disabled";
  if (mode === "disabled" || !site.form.recipientConfirmed || (mode === "live" && !site.form.testPassed)) return { state: "inactive" as const };
  if (!leadEmailEnabled(mode)) return { state: "inactive" as const };
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
  if (persisted.duplicate) return { state: "duplicate" as const, leadId: persisted.lead.leadId };
  const claimed = await store.claim(persisted.lead.leadId);
  if (!claimed) return { state: "accepted" as const, leadId: persisted.lead.leadId };
  try {
    const messageId = await sendSendGridNotification(config, { recipient: claimed.recipientEmail, subject: recipient.subject, lead: claimed });
    await store.markAccepted(claimed.leadId, messageId);
    return { state: "accepted" as const, leadId: claimed.leadId };
  } catch (error) {
    await store.markFailed(claimed.leadId, claimed.attemptCount, errorCode(error));
    return { state: "accepted_pending_retry" as const, leadId: claimed.leadId };
  }
}

export async function retryPendingLeadNotifications(limit = 10) {
  if (!leadEmailEnabled("test") && !leadEmailEnabled("live")) return { attempted: 0, accepted: 0, failed: 0, disabled: true };
  const config = getSendGridConfig();
  if (!config) throw new Error("Lead delivery is not configured.");
  const store = createLeadStore(config.databaseUrl);
  const leadIds = await store.pendingRetryIds(Math.min(Math.max(limit, 1), 25));
  let accepted = 0; let failed = 0;
  for (const leadId of leadIds) {
    const lead = await store.claim(leadId);
    if (!lead) continue;
    try {
      const messageId = await sendSendGridNotification(config, { recipient: lead.recipientEmail, subject: retrySubject(lead), lead });
      await store.markAccepted(lead.leadId, messageId); accepted++;
    } catch (error) {
      await store.markFailed(lead.leadId, lead.attemptCount, errorCode(error)); failed++;
    }
  }
  return { attempted: accepted + failed, accepted, failed };
}
