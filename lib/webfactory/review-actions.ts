export const reviewActions = [
  ["slug", "Regenerate Slug with AI", "Suggest three clean short lowercase customer slugs using business identity only, without UUIDs. Do not claim availability or save a slug. Admin must check availability and explicitly save their choice. Preserve the current saved slug until then."],
  ["review", "Review Website Preview", "Review the supplied website context. Separate known evidence from checks requiring a browser; do not claim you opened the URL."],
  ["design", "Suggest Design Improvements", "Suggest prioritized, business-specific typography, layout, imagery and mobile improvements."],
  ["copy", "Improve Page Copy", "Improve page copy using verified facts only, with before/after draft suggestions."],
  ["home", "Recreate Homepage Concept", "Create a distinctive homepage concept with section order, visual direction and responsive behavior."],
  ["brief", "Recreate Full Website Brief", "Draft a revised full website brief without overwriting the approved brief."],
  ["rebuild", "Generate Change Request for Codex", "Generate a scoped Codex rebuild prompt using saved requested changes. Preserve tenant isolation and existing assets. Require explicit admin build approval before file edits. No deployment or integrations."],
  ["qa", "Generate QA/Test Plan", "Create an unchecked QA checklist covering desktop/mobile at 320/768/1440, every page, navigation, forms enabled/disabled, images, SEO, tenant leakage, Myndy status, Red Spectrum footer, accessibility, lint and production build. Distinguish planned checks from executed results."],
  ["approval", "Final Approval Checklist", "Create an unchecked customer approval checklist; do not grant approval or claim tests passed."],
  ["feedback", "Customer Feedback Reply", "Draft an unsent customer feedback reply accurately separating active and pending features."],
] as const;
export function reviewPrompt(action: string) {
  const item = reviewActions.find(([id]) => id === action);
  return item ? `${item[2]} Use only verified context, list missing information, and label the output DRAFT — ADMIN REVIEW REQUIRED.` : "";
}
