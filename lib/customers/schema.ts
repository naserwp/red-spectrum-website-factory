import { z } from "zod";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const hexPattern = /^#[0-9a-fA-F]{6}$/;

export const customerPages = ["home", "services", "about", "contact", "privacy"] as const;
export type CustomerPage = (typeof customerPages)[number];

const verifiedTextSchema = z.object({
  value: z.string().trim(),
  status: z.enum(["verified", "draft", "missing"]),
  source: z.string().trim().optional(),
}).superRefine((field, context) => {
  if (field.status === "verified" && (!field.value || !field.source)) {
    context.addIssue({ code: "custom", message: "Verified values require content and a source." });
  }
  if (field.status === "missing" && field.value) {
    context.addIssue({ code: "custom", message: "Missing values must be empty." });
  }
});

const serviceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  status: z.enum(["verified", "draft"]),
  source: z.string().trim().optional(),
});

export const customerSiteSchema = z.object({
  schemaVersion: z.literal("1.0"),
  slug: z.string().regex(slugPattern),
  status: z.enum(["draft", "review", "approved"]),
  templateId: z.enum(["forge", "ledger", "stillwater"]),
  business: z.object({
    name: z.string().trim().min(1),
    industry: z.string().trim().min(1),
    tagline: z.string().trim().min(1),
    summary: z.string().trim().min(1),
  }),
  contact: z.object({
    phone: verifiedTextSchema,
    email: verifiedTextSchema,
    address: verifiedTextSchema,
    serviceAreas: verifiedTextSchema,
  }),
  services: z.array(serviceSchema).min(1).max(12),
  pages: z.object({
    home: z.object({ eyebrow: z.string().trim(), headline: z.string().trim().min(1), intro: z.string().trim().min(1), ctaLabel: z.string().trim().min(1) }),
    services: z.object({ headline: z.string().trim().min(1), intro: z.string().trim().min(1) }),
    about: z.object({ headline: z.string().trim().min(1), paragraphs: z.array(z.string().trim().min(1)).min(1) }),
    contact: z.object({ headline: z.string().trim().min(1), intro: z.string().trim().min(1) }),
    privacy: z.object({ headline: z.string().trim().min(1), body: z.array(z.string().trim().min(1)).min(1) }),
  }),
  branding: z.object({
    primary: z.string().regex(hexPattern),
    secondary: z.string().regex(hexPattern),
    accent: z.string().regex(hexPattern),
    surface: z.string().regex(hexPattern),
    logoPath: z.string().trim(),
    faviconPath: z.string().trim(),
  }),
  images: z.object({
    hero: z.object({ src: z.string().trim().min(1), alt: z.string().trim().min(1), width: z.number().int().positive(), height: z.number().int().positive() }),
    gallery: z.array(z.object({ src: z.string().trim().min(1), alt: z.string().trim().min(1), width: z.number().int().positive(), height: z.number().int().positive() })).max(12),
  }),
  seo: z.object({ title: z.string().trim().min(1).max(70), description: z.string().trim().min(1).max(170) }),
  schema: z.object({ type: z.string().trim().min(1), description: z.string().trim().min(1) }),
  form: z.object({
    provider: z.literal("sendgrid"),
    mode: z.enum(["disabled", "test", "live"]),
    recipientConfirmed: z.boolean(),
    testPassed: z.boolean(),
  }),
  myndy: z.object({
    agentName: z.string().trim().min(1),
    greeting: z.string().trim().min(1),
    avatarBrief: z.string().trim().min(1),
    knowledgeContextPath: z.string().trim().min(1),
    embed: z.object({ enabled: z.boolean(), agentId: z.string(), scriptUrl: z.string() }),
  }),
}).superRefine((site, context) => {
  const assetPrefix = `/customers/${site.slug}/`;
  if (site.myndy.embed.enabled && (site.myndy.embed.scriptUrl !== "https://widget.myndy.ai/myndy-convai-widget.es.js" || !/^agent_[A-Za-z0-9_]+$/.test(site.myndy.embed.agentId))) {
    context.addIssue({ code: "custom", path: ["myndy", "embed"], message: "An enabled Myndy embed requires the approved HTTPS script and a valid agent ID." });
  }
  const localAssets = [site.branding.logoPath, site.branding.faviconPath, site.images.hero.src, ...site.images.gallery.map((image) => image.src)].filter(Boolean);

  for (const asset of localAssets) {
    if (!asset.startsWith(assetPrefix)) context.addIssue({ code: "custom", path: ["images"], message: `Customer assets must begin with ${assetPrefix}` });
  }
  if (site.form.mode !== "disabled" && !site.form.recipientConfirmed) context.addIssue({ code: "custom", path: ["form"], message: "Testing and live delivery require a confirmed recipient." });
  if (site.form.mode === "live" && !site.form.testPassed) context.addIssue({ code: "custom", path: ["form"], message: "Live delivery requires a recorded passing test." });
  if (site.status === "approved") {
    for (const field of [site.contact.phone, site.contact.email]) {
      if (field.status !== "verified") context.addIssue({ code: "custom", path: ["contact"], message: "Approved sites require verified phone and email." });
    }
    if (!site.branding.logoPath || !site.branding.faviconPath) context.addIssue({ code: "custom", path: ["branding"], message: "Approved sites require logo and favicon files." });
  }
});

export const customerManifestSchema = z.object({
  schemaVersion: z.literal("1.0"),
  customers: z.array(customerSiteSchema),
}).superRefine((manifest, context) => {
  const reserved = new Set(["api", "brief", "standards", "templates", "_next"]);
  const seen = new Set<string>();
  for (const [index, customer] of manifest.customers.entries()) {
    if (reserved.has(customer.slug)) context.addIssue({ code: "custom", path: ["customers", index, "slug"], message: "Slug is reserved by the factory." });
    if (seen.has(customer.slug)) context.addIssue({ code: "custom", path: ["customers", index, "slug"], message: "Customer slug must be unique." });
    seen.add(customer.slug);
  }
});

export type CustomerSite = z.infer<typeof customerSiteSchema>;
