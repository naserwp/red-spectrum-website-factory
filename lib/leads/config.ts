import "server-only";

import { z } from "zod";

import type { CustomerSite } from "@/lib/customers/schema";

const emailSchema = z.string().trim().email().max(200);

const customerDelivery = {
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
} as const;

export type LeadDeliveryMode = "test" | "live";

export function leadEmailEnabled(mode: LeadDeliveryMode) {
  return (mode === "test" ? process.env.WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED : process.env.WEBFACTORY_CUSTOMER_EMAILS_ENABLED) === "true";
}

export function getCustomerDelivery(site: CustomerSite, mode: LeadDeliveryMode) {
  const configured = customerDelivery[site.slug as keyof typeof customerDelivery];
  if (!configured) throw new Error(`No trusted delivery configuration exists for ${site.slug}.`);
  const recipient = mode === "test" ? process.env.LEADS_TEST_TO_EMAIL : configured.liveRecipient;
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
