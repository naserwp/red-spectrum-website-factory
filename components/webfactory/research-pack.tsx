import type { ProjectRequest } from "@/lib/webfactory/server";
import type { WebsiteBrief } from "@/lib/webfactory/brief-schema";

export function ResearchPack({ request, brief }: { request: ProjectRequest; brief?: WebsiteBrief }) {
  let oldWebsite: string | null = null;
  try { const url = new URL(request.website); if (["https:", "http:"].includes(url.protocol)) oldWebsite = url.href; } catch { /* A business name is not a website URL. */ }
  const items: [string, string][] = [
    ["Request summary", request.details?.trim() || "No description supplied."],
    ["Business / industry", `${request.business} · ${request.industry || "Industry not supplied"}`],
    ["Known public facts", "None independently verified in this workflow. Customer-submitted details are draft evidence only."],
    ["Public sources checked", "External research has not been performed by this workflow. Record any sources and findings before approval."],
    ["Existing website", oldWebsite ? `${oldWebsite} · supplied URL; content has not been reviewed automatically.` : "No valid existing website URL supplied."],
    ["Likely services", brief?.services.join("; ") || "Derive draft directions from the customer request; confirm scope with the customer."],
    ["Suggested pages", brief?.pages.map(page => page.name).join(" · ") || "Home · Services · About · Contact · Privacy"],
    ["Brand / logo direction", brief ? `${brief.brandDirection} Logo concept: ${brief.logoConcept}` : "Original preview identity; request customer brand assets before final approval."],
    ["Image direction", brief?.imagePrompts.join("; ") || "Customer-provided permitted images or original generated/local licensed illustrations; disclose illustrative images."],
    ["Content risks", brief?.verificationNotes.join("; ") || "Do not assert licensing, results, staff, service area, reviews, pricing, or guarantees without verification."],
    ["Intended lead recipient", "Not confirmed by this pack. Keep inquiry delivery disabled until the recipient and test are approved."],
    ["Build plan", "Save slug → generate and review brief → approve → create isolated customer files → run QA → verify preview."],
    ["QA plan", "Validate schema and tenant assets; test navigation, disabled lead state, privacy, preview identity, and 320 / 375 / 390 / 430 / 768 / 1024 / 1440 / 1920 px; run lint and build."],
  ];
  return <section className="wf-panel" aria-label="Admin-only research and brief pack"><p className="wf-section-label">Research / brief pack · admin only</p><h2>Evidence before build</h2><p>This pack is a review aid. AI suggestions and customer-submitted statements remain unverified until an admin records evidence.</p><div className="wf-workflow-grid">{items.map(([title, value]) => <article className="wf-brief-card" key={title}><h3>{title}</h3><p>{value}</p></article>)}</div></section>;
}
