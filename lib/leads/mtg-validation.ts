import { z } from 'zod';

export const mtgConsentVersion = 'mtg-contact-2026-10-09-v1';
export const mtgLeadSchema = z.object({
  idempotencyKey: z.string().uuid(),
  source: z.enum(['quote', 'contact']),
  name: z.string().trim().min(2).max(100),
  company: z.string().trim().max(120).default(''),
  email: z.string().trim().email().max(200),
  phone: z.string().trim().max(40).default(''),
  origin: z.string().trim().max(160).default(''),
  destination: z.string().trim().max(160).default(''),
  service: z.string().trim().min(2).max(160),
  size: z.string().trim().max(200).default(''),
  pieces: z.string().trim().max(100).default(''),
  date: z.string().refine(value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value, 'Invalid date').default(''),
  details: z.string().trim().min(5).max(2000),
  consent: z.literal(true),
  syncConsent: z.boolean().default(false),
  botcheck: z.string().max(0).default(''),
}).strict().superRefine((value, ctx) => {
  if (value.source === 'quote') for (const key of ['origin', 'destination'] as const) {
    if (!value[key]) ctx.addIssue({ code: 'custom', path: [key], message: 'Required for a freight quote' });
  }
});
export type MtgLeadInput = z.infer<typeof mtgLeadSchema>;
