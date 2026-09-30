import "server-only";

import { z } from "zod";

import type { CustomerSite } from "@/lib/customers/schema";

const emailSchema = z.string().trim().email().max(200);

const customerDelivery = {
  "unique-management-group": {
    liveRecipient: "info@uniquemanagementgroup.com",
    subject: "New website inquiry — Unique Management Group LLC",
  },
  "lc-real-estate": {
    liveRecipient: "accountexec@theredspectrum.com",
    testRecipient: "nasir@factiiv.io",
    subject: "New website lead — L&C Real Estate Investment Group",
  },
  "swenzy-logistics": {
    liveRecipient: "rs@swenzylogistics.net",
    subject: "New website lead — Swenzy Logistics",
  },
  "jm-trucking": {
    liveRecipient: "diamuhammad@yahoo.com",
    subject: "New website lead — J&M Trucking Logistics",
  },
  "360-vitality-fitness": {
    liveRecipient: "get360vitalityfitness@gmail.com",
    subject: "New website lead — 360 Vitality Fitness",
  },
  "unique-home-enterprise": {
    liveRecipient: "contact@uniquehomeenterprise.com",
    subject: "New website lead — UNIQUE HOME ENTERPRISE LLC",
  },
} as const;

export type LeadDeliveryMode = "test" | "live";

export function leadEmailEnabled(mode: LeadDeliveryMode) {
  return (mode === "test" ? process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED : process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED) === "true";
}

/**
 * The two flags above are a single global switch per mode — turning one on would activate every customer currently in
 * that mode, not just the one being brought online. When an allowlist is configured for a mode, it additionally
 * restricts delivery in that mode to the listed slugs; leaving it unset preserves today's global-only behavior for
 * every other customer, so activating one new customer never changes another customer's delivery.
 */
export function leadDeliveryAllowedForSlug(slug: string, mode: LeadDeliveryMode) {
  // UMG's authorized branded-preview form has its own activation gate, preserving every existing tenant allowlist.
  if (slug === 'unique-management-group' && mode === 'live') return process.env.WEBFACTORY_UMG_CONTACT_ENABLED === 'true';
  const raw = (mode === "test" ? process.env.WEBFACTORY_LEAD_TEST_ACTIVE_SLUGS : process.env.WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS)?.trim();
  if (!raw) return true;
  return raw.split(",").map((value) => value.trim()).filter(Boolean).includes(slug);
}

export function getCustomerDelivery(site: CustomerSite, mode: LeadDeliveryMode) {
  const configured = customerDelivery[site.slug as keyof typeof customerDelivery];
  if (!configured) throw new Error(`No trusted delivery configuration exists for ${site.slug}.`);
  const testRecipient = "testRecipient" in configured ? configured.testRecipient : process.env.LEADS_TEST_TO_EMAIL;
  const recipient = mode === "test" ? testRecipient : configured.liveRecipient;
  return { recipient: emailSchema.parse(recipient), subject: mode === "test" ? `[TEST] ${configured.subject}` : configured.subject };
}

export function getSendGridConfig() {
  const apiKey = process.env.SENDGRID_API_KEY?.trim();
  const fromEmail = process.env.LEADS_FROM_EMAIL?.trim();
  const fromName = process.env.LEADS_FROM_NAME?.trim();
  const rateLimitSalt = process.env.LEADS_RATE_LIMIT_SALT?.trim();
  const databaseUrl = process.env.LEADS_DATABASE_URL?.trim();
  if (!apiKey || !fromEmail || !fromName || !rateLimitSalt || !databaseUrl) return null;
  return {
    apiKey,
    fromEmail: emailSchema.parse(fromEmail),
    fromName: z.enum(["Red Spectrum Leads", "Red Spectrum WebFactory"]).parse(fromName),
    rateLimitSalt,
    databaseUrl,
  };
}
