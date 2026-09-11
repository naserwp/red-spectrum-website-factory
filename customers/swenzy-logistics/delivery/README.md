# Swenzy Logistics - delivery and readiness
Date: 2026-09-12
Status: CUSTOMER REVIEW READY ON VERCEL. NOT LAUNCH APPROVED.

## Preview
Public Vercel preview: https://red-spectrum-website-factory.vercel.app/swenzy-logistics
Intended production-preview URL: https://preview.redspectrum.ai/swenzy-logistics (attached in Vercel; DNS record still required).
One factory Vercel project is linked. No customer domain was changed.

## Package contents
- swenzy-logistics-website-deployed.pdf: refreshed five-page desktop review PDF captured from the deployed Vercel preview. Static PDF, not an interactive form. The prior locked PDF is retained unchanged.
- swenzy-logistics-source.zip: complete factory runtime source snapshot including only Swenzy real-customer configuration/assets; no secrets, private brief or other customer records.
- swenzy-logistics-review-package.zip: PDF, source, logo exports, imagery/originals, Miles assets/context, unsent drafts and review evidence.
- ../qa/: desktop/mobile screenshots for every page, original-site baseline, schema/API and integration evidence.
- ../outreach/: accurate UNSENT email and SMS drafts. No customer messages were sent.

## Branding asset paths (repository-relative)
- public/customers/swenzy-logistics/brand/logo-light.svg
- public/customers/swenzy-logistics/brand/logo-dark.svg
- public/customers/swenzy-logistics/brand/logo-light.png
- public/customers/swenzy-logistics/brand/logo-dark.png
- public/customers/swenzy-logistics/brand/favicon.svg
- public/customers/swenzy-logistics/brand/icon-32.png
- public/customers/swenzy-logistics/brand/icon-180.png
- public/customers/swenzy-logistics/brand/icon-512.png
- public/customers/swenzy-logistics/images/highway-dawn.webp
- public/customers/swenzy-logistics/images/route-planning.webp
- public/customers/swenzy-logistics/images/open-road.webp
- public/customers/swenzy-logistics/images/miles-avatar.webp
- customers/swenzy-logistics/myndy/assets/miles-original.png

## What changed
The basic existing single-page site was inspected but not modified. The new preview has a full-bleed transport hero, original S/highway logo, navy/amber palette, editorial content sections, a route-focused Services page, a Baton Rouge About composition, a detailed Contact form and a dedicated Privacy page.
Illustrative assets are disclosed. No fabricated claims, testimonials, rates or service territory were added.

## Verification
- npm run build: PASS; 26 generated factory/demo/customer pages.
- npm run lint: PASS.
- node scripts/test-swenzy.mjs: PASS; registry consistency and approval/isolation gates.
- Deployed `node scripts/verify-swenzy.mjs`: PASS; all five routes at 1440x1000 and 390x844, loaded images, no overflow, metadata/favicons, one widget element per customer page.
- Deployed API: disabled delivery 503; invalid email and honeypot 400; unknown tenant 404. Protected retry GET/POST without a secret: 401.
- Internal brief, agent context and manifest URLs: 404.
- Every PDF page rendered and visually inspected.
- No live provider submission or inbox receipt has been claimed.

## Integration status
SendGrid: disabled. Exact Accountex inbox, authenticated sender, SendGrid Mail Send key and isolated durable PostgreSQL connection are pending. Hidden rate-limit/retry secrets and a daily protected retry schedule are configured. External API acceptance: NOT TESTED. Inbox receipt: NOT VERIFIED.
Myndy: exact supplied widget integrated. No chat/voice session was initiated and no provider settings were edited. Miles name/avatar/knowledge and human handoff require manual configuration and testing.
Review qa/interaction-verification.json and qa/integration-status.md for final lifecycle/UI evidence and limitations.

## Launch gates
Confirm phone discrepancy, customer contact details, content/branding and privacy practices. Configure approved provider settings; separately test and verify inbox receipt. Add the required SiteGround preview DNS record and complete GitHub remote linkage. Obtain customer approval before launch.

## Exact implementation files changed / added
Modified shared files:
- .env.example (shared server-only SendGrid/PostgreSQL variables only)
- customers/manifest.json (one registered customer)
- lib/customers/schema.ts (validated Myndy enablement; existing form gates retained)
- components/customer-website.tsx (exact-slug Swenzy renderer dispatch)
- app/[customerSlug]/[[...page]]/page.tsx (invalid metadata-route guard, tenant metadata)
- app/api/leads/[customerSlug]/route.ts (malformed-body handling, exact Swenzy test subject, genuine provider success check)

Added customer implementation:
- components/customers/swenzy-website.tsx
- components/customers/swenzy-interactive.tsx
- components/customers/swenzy.css
- public/customers/swenzy-logistics/ (listed brand/image assets)
- customers/swenzy-logistics/ (brief, site config, brand originals, Miles context/assets, outreach, QA and delivery files)
- scripts/prepare-swenzy-assets.mjs
- scripts/test-swenzy.mjs
- scripts/verify-swenzy.mjs
- scripts/verify-swenzy-interactions.mjs
- scripts/capture-swenzy-pdf.mjs
- scripts/build-swenzy-pdf.py
- scripts/package-swenzy.py

Existing factory landing page, demo template designs, other projects and environment values were not rewritten.
