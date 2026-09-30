import { canonicalCustomerUrl } from "@/lib/customers/domains";
import { slugFromPreviewUrl } from "./slug-rules";

export function canonicalBrandedPreview(slug: string) {
  return `https://preview.redspectrum.ai/${slug}`;
}

export function customerFacingPreview(slug: string, submittedUrl?: string | null) {
  if (submittedUrl && isCustomerFacingPreview(slug, submittedUrl) && canonicalCustomerUrl(slug)) return canonicalCustomerUrl(slug)!;
  return canonicalBrandedPreview(slug);
}

export function isCustomerFacingPreview(slug: string, value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.username || url.password || url.port || url.search || url.hash) return false;
    const path = url.pathname.replace(/\/$/, "") || "/";
    return (url.origin + path === canonicalBrandedPreview(slug) && slugFromPreviewUrl(value) === slug) || url.origin + path === canonicalCustomerUrl(slug);
  } catch {
    return false;
  }
}

export function workflowSummary(input: { stage: string; websiteVerified: boolean; qaPassed: boolean; slug?: string | null; productionPublished?: boolean; domainConnected?: boolean }) {
  const previewReady = input.websiteVerified && ["preview_ready", "customer_approved"].includes(input.stage);
  const approved = input.websiteVerified && input.stage === "customer_approved";
  return {
    websiteBuilt: input.websiteVerified ? "Verified" : "Not verified",
    qa: input.qaPassed ? "Passed" : "Not recorded",
    preview: input.slug ? canonicalBrandedPreview(input.slug) : "Not assigned",
    identity: input.websiteVerified ? "Verified" : "Pending",
    previewReady: previewReady ? "Complete" : input.websiteVerified ? "Not approved" : "Upcoming",
    customerApproved: approved ? "Complete" : previewReady ? "Not approved" : "Upcoming",
    production: input.productionPublished ? "Published" : "Not published",
    domain: input.domainConnected ? "Connected" : "Not connected",
    next: approved ? "Complete" : previewReady ? "Customer Approved" : input.websiteVerified ? "Preview Ready" : "Website Built",
  };
}

export function canMarkPreviewReady(stage: string, confirmed: boolean, websiteVerified: boolean) {
  return confirmed && websiteVerified && stage === "build_approved";
}

export function canMarkCustomerApproved(stage: string, confirmed: boolean, websiteVerified: boolean) {
  return confirmed && websiteVerified && stage === "preview_ready";
}
