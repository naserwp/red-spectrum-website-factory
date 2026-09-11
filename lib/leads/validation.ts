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
});

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
  return hashValue([customerSlug, window, input.name.toLowerCase(), input.email.toLowerCase(), input.phone, input.service, input.message].join("\u0000"));
}
