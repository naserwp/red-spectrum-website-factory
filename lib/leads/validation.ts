import { createHash } from "node:crypto";

import { z } from "zod";

export const websiteLeadSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().min(7).max(40),
  service: z.string().trim().min(2).max(160),
  message: z.string().trim().min(5).max(3000),
  consent: z.literal("on"),
  botcheck: z.string().max(0).optional(),
  investmentInterest: z.string().trim().max(160).optional(),
  budgetRange: z.string().trim().max(100).optional(),
  propertyType: z.string().trim().max(100).optional(),
});

export const uniqueHomeInquiryAreas = ["Marketing", "Consulting", "Advertising", "Real estate-related inquiry", "General business inquiry"] as const;

export const uniqueHomeLeadSchema = websiteLeadSchema.extend({
  phone: z.string().trim().max(40).optional().transform((value) => value ?? ""),
  service: z.enum(uniqueHomeInquiryAreas),
});

export const lcLeadSchema = websiteLeadSchema.extend({
  investmentInterest: z.enum(["Property opportunities", "Portfolio support", "General consultation", "Other / not sure"]),
  budgetRange: z.enum(["Prefer to discuss", "Under $100,000", "$100,000–$500,000", "$500,000–$1 million", "Over $1 million"]),
  propertyType: z.enum(["Exploring options", "Residential", "Commercial", "Mixed-use"]),
}).refine(input => input.service === input.investmentInterest);

export type WebsiteLeadInput = z.infer<typeof websiteLeadSchema>;

const forbiddenDeliveryFields = new Set(["recipient", "sender", "from", "to", "mode", "deliverymode"]);

export function hasForbiddenDeliveryField(values: Record<string, FormDataEntryValue>) {
  return Object.keys(values).some((key) => forbiddenDeliveryFields.has(key.toLowerCase()));
}

export function hashValue(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

export function leadDedupeKey(customerSlug: string, input: WebsiteLeadInput, receivedAt: Date) {
  const window = Math.floor(receivedAt.getTime() / (15 * 60 * 1000));
  const fields = [customerSlug, window, input.name.toLowerCase(), input.email.toLowerCase(), input.phone, input.service, input.message];
  // Preserve existing customers' dedupe keys when no investment fields are submitted.
  if (input.investmentInterest || input.budgetRange || input.propertyType) fields.push(input.investmentInterest ?? "", input.budgetRange ?? "", input.propertyType ?? "");
  return hashValue(fields.join("\u0000"));
}
