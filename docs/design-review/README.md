# Template design review — 11 September 2026

Scope: existing template previews only. No real customers, deployments, recipient activation, or Myndy activation were created.

## References inspected before editing

All three requested projects were available locally and inspected read-only. No reference project was modified. Source inspection, not a claim of pixel-for-pixel matching:

- J&M Trucking: `E:/Office/customer_Projects/Dia Muhammad - J&M trucking logistics LLC/J&M trucking logistics LLC-web/src/app/page.tsx` and `globals.css`. Dramatic photographic hero, navy/orange hierarchy, process narrative.
- 360 Vitality Fitness: `E:/Office/customer_Projects/Angela D. Williams - 360 Vitality Fitness LLC/360 Vitality Fitness LLC- web/app/page.tsx` and `globals.css`. Clear service pathways, approachable movement photography, varied long-form sections.
- Mutual Street Perks: `E:/Office/customer_Projects/mutual-street-perks/web/mutual-street-perks-web/app/page.tsx`, `app/globals.css`, `components/home/hero.tsx`, and `story-section.tsx`. Editorial typography, warm surfaces, asymmetrical story sections.

Unavailable references: none. The benchmark projects were not launched or audited as part of this scope.

## What changed

- **Forge & Field:** the old split hero and short card row became an immersive architectural hero, two-column introduction, image-led service index, project-discussion sequence, preparation story, and strong enquiry close. Ink blue, warm neutral surfaces, rust actions, sturdy sans-serif type.
- **Ledger & Line:** the old compact hero and three-card strip became an oversized serif masthead, panoramic office image with a consultation panel, editorial service index, collaborative story, dark philosophy section, and preparation feature. Sage, forest, warm paper, fine rules.
- **Stillwater:** the old overlay hero and card strip became an arched movement portrait, floating note, spacious statement, image-led pathways, group-practice story, gentle next-step section, and rounded actions. Soft greens, restrained gradients, lighter typography.
- Services now has three detailed, anchored service stories and useful expandable questions. About has a distinct editorial introduction, supporting image, and process section. Contact pairs industry-specific preparation copy with the existing form. Privacy has a readable policy layout with explicit review requirements.
- Nine different stock photos across the three concepts; each home and services page uses three different images. Imagery is reused coherently between pages, never represented as actual staff, premises, or completed work. Image sources and inspected descriptions are in the typed design data.
- Native keyboard-operable mobile navigation, active-page indicators, skip link, 48px menu control, generous form fields, visible focus, and reduced-motion overrides. Entrance motion never hides the heading; hover movement is subtle.
- Removed illustrative telephone and email links that could appear operational. All business copy remains visibly draft. No reviews, counters, certifications, prices, history, or guarantees were added.

## Exact implementation files

- Modified: `components/template-site.tsx` — template-only renderer and industry-specific compositions.
- Added: `components/template-preview.css` — styles scoped beneath `.tp`, responsive layouts, focus and reduced-motion rules.
- Added: `lib/factory/template-designs.ts` — typed illustrative content and image art direction, separate from customer records.
- Added under `docs/design-review/`: this report, screenshot gallery, before/after captures, browser audit helpers and JSON results. Helpers: `audit.js`, `accessibility.js`, `interaction-state.js`, `test-interactions.ps1`.

No changes to customer route files, schema validation, registry, tenant resolution, lead endpoint, shared contact-form component, delivery approval gates, customer Myndy integration, package generation, environment configuration, or dependencies. The preview includes an inert hidden Myndy placeholder. Existing customer infrastructure remains separate.

## Verification evidence

- `npm run lint`: passed, no warnings in final run.
- `npm run build`: passed including TypeScript, 20 static pages, and customer validation. **0 customers / 0 delivery packages**.
- All 15 template routes reviewed at **1440×1000** and **390×844**. Full-page screenshots below: 30 before and 30 after, plus three disabled-form captures.
- [Route/image/layout results](audit-results.json): one H1 per page, metadata present, no horizontal overflow, no failed images, no cross-template links, no dead same-page anchors, no fake contact links, inactive Myndy placeholders.
- [Contrast results](contrast-results.json): solid-background text checks passed on all 30 page/viewport combinations; lowest measured ratio 5.10:1. Image/gradient sections were excluded from this numerical helper and visually reviewed; this is not a complete WCAG certification.
- [Interaction results](interaction-results.json): all three menus open by keyboard; menu Services links navigate within the selected template; first FAQ opens; blank required fields and unchecked consent remain invalid; valid sample submission shows the disabled-form alert, with **zero lead endpoint requests**.
- [Reduced-motion results](reduced-motion-results.json): preference detected on all three desktop homes, zero active animations.
- Reviewed every captured page for heading hierarchy, spacing, imagery, copy, and overflow. Fixed a faint entrance-animation capture and corrected two image descriptions during review.
- Verification used a dedicated local production server on port 3002. The user's port-3000 development server was not stopped. No remote deployment was performed.

Limitations: Chromium desktop/mobile emulation, not physical-device or cross-browser certification. No live email delivery or Myndy behavior tested (intentionally disabled). The preserved shared form's unavailable message refers to verified contact details; the surrounding preview notice explicitly states that none are supplied. Stock licensing/identity suitability and final business/privacy copy still require customer-specific review before publication.

## Before / after screenshots

Open [the comparison gallery](gallery.html) for side-by-side selection. Individual full-resolution files:

| Template / page | Desktop before | Desktop after | Mobile before | Mobile after |
|---|---|---|---|---|
| forge / home | [Before](before/forge-desktop.png) | [After](after/forge-desktop.png) | [Before](before/forge-mobile.png) | [After](after/forge-mobile.png) |
| forge / services | [Before](before/forge-services-desktop.png) | [After](after/forge-services-desktop.png) | [Before](before/forge-services-mobile.png) | [After](after/forge-services-mobile.png) |
| forge / about | [Before](before/forge-about-desktop.png) | [After](after/forge-about-desktop.png) | [Before](before/forge-about-mobile.png) | [After](after/forge-about-mobile.png) |
| forge / contact | [Before](before/forge-contact-desktop.png) | [After](after/forge-contact-desktop.png) | [Before](before/forge-contact-mobile.png) | [After](after/forge-contact-mobile.png) |
| forge / privacy | [Before](before/forge-privacy-desktop.png) | [After](after/forge-privacy-desktop.png) | [Before](before/forge-privacy-mobile.png) | [After](after/forge-privacy-mobile.png) |
| ledger / home | [Before](before/ledger-desktop.png) | [After](after/ledger-desktop.png) | [Before](before/ledger-mobile.png) | [After](after/ledger-mobile.png) |
| ledger / services | [Before](before/ledger-services-desktop.png) | [After](after/ledger-services-desktop.png) | [Before](before/ledger-services-mobile.png) | [After](after/ledger-services-mobile.png) |
| ledger / about | [Before](before/ledger-about-desktop.png) | [After](after/ledger-about-desktop.png) | [Before](before/ledger-about-mobile.png) | [After](after/ledger-about-mobile.png) |
| ledger / contact | [Before](before/ledger-contact-desktop.png) | [After](after/ledger-contact-desktop.png) | [Before](before/ledger-contact-mobile.png) | [After](after/ledger-contact-mobile.png) |
| ledger / privacy | [Before](before/ledger-privacy-desktop.png) | [After](after/ledger-privacy-desktop.png) | [Before](before/ledger-privacy-mobile.png) | [After](after/ledger-privacy-mobile.png) |
| stillwater / home | [Before](before/stillwater-desktop.png) | [After](after/stillwater-desktop.png) | [Before](before/stillwater-mobile.png) | [After](after/stillwater-mobile.png) |
| stillwater / services | [Before](before/stillwater-services-desktop.png) | [After](after/stillwater-services-desktop.png) | [Before](before/stillwater-services-mobile.png) | [After](after/stillwater-services-mobile.png) |
| stillwater / about | [Before](before/stillwater-about-desktop.png) | [After](after/stillwater-about-desktop.png) | [Before](before/stillwater-about-mobile.png) | [After](after/stillwater-about-mobile.png) |
| stillwater / contact | [Before](before/stillwater-contact-desktop.png) | [After](after/stillwater-contact-desktop.png) | [Before](before/stillwater-contact-mobile.png) | [After](after/stillwater-contact-mobile.png) |
| stillwater / privacy | [Before](before/stillwater-privacy-desktop.png) | [After](after/stillwater-privacy-desktop.png) | [Before](before/stillwater-privacy-mobile.png) | [After](after/stillwater-privacy-mobile.png) |

Disabled-form captures: [Forge](after/forge-form-disabled-mobile.png), [Ledger](after/ledger-form-disabled-mobile.png), [Stillwater](after/stillwater-form-disabled-mobile.png).
