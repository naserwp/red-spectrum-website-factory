# Preview V2 release checklist

## Candidate
- Release branch: `codex/preview-v2-release` (local only; no push, merge or deployment).
- Baseline: `364e678ee4a6bedc256b0bb73c856e3b08f0b6fe` (`origin/main`).
- Approved UI source: `3fb85071b4c900983cbcfaa4d18d7ca9bf29a46d`.
- Target: existing `https://preview.redspectrum.ai/` and existing `/<customer-slug>` URLs.
- Apply this release branch, not the full staging branch: staging ancestry includes changes outside this UI migration.

## Presentation changes
- `app/page.tsx`, `app/designs/page.tsx`, `app/designs/[slug]/page.tsx`: V2 home, design catalog and design details.
- `app/layout.tsx`: public metadata and existing preview branding context.
- `app/request/page.tsx`, `app/processing/page.tsx`, `app/privacy/page.tsx`: V2 presentation of existing flows.
- `app/templates/[template]/[[...page]]/page.tsx`: V2 template display; existing privacy pages retained.
- `components/webfactory/customer-previews.tsx`: catalog anchor only.
- `components/webfactory/forms.tsx`: optional editable design direction; existing server action remains.
- `components/webfactory/v2/catalog.ts`, `public/design-grid.tsx`, `public/home.tsx`, `public/manual-preview.tsx`, `previews/template.tsx`, `previews/template.css`, `shell.tsx`, `v2.css`: public presentation, local fonts, responsive layout and sample designs.
- `public/v2/`: 16 branding, design image and font assets.
- Deviations from source: public shell excludes unused admin/client workspace UI, preserves existing admin login; unsupported client status link removed; design canonical points to the existing preview host.

## Preservation gates
- No changes to `app/api`, `app/webfactory-actions.ts`, `lib`, `db`, `customers`, `public/customers`, `proxy.ts`, customer route renderer, custom customer components, environment files, dependency manifests, migrations or hosting settings.
- Existing seven customer records, slugs, manifests, delivery files and registered assets retained byte-for-byte.
- No database migration or data mutation; local verification uses isolated staging configuration.
- Existing branded proxy/build mapping and tenant restrictions retained.
- Existing lead handlers retained; no live lead, email, AI or payment requests used for verification.
- AI Builder, AI Logo Generator, automated SEO/research and experimental backend excluded.
- No DNS or Vercel changes required by this presentation-only candidate.

## Verification
- `npm run lint`: PASS, no reported errors or warnings.
- `npm run build`: PASS, production build and TypeScript checks completed; 95 pages generated.
- `npm run customers:validate`: PASS, seven customer sites and seven delivery packages.
- Local production runtime: 100 successful assertions including home, designs, request, processing, privacy, six design detail pages, six template roots, 21 customer home/services/contact pages, 53 registered assets and negative tenant/access routes.
- Customer rendering checks use localhost plus the existing preview Host allowlist for UMG. They do not exercise remote branded worker deployments; those remain unchanged.
- Existing UMG/UHE lead endpoints respond 405 to GET; handler and form source are unchanged. UMG contact form and consent fields render; UHE online form remains intentionally disabled. Delivery was not tested with a live submission.
- Home/designs contain no manifest phone/email values or tested private system fields. Existing customer renderers still display customer-provided contact details, including some draft contacts in the baseline; owner verification is a separate existing content concern.
- Unauthenticated admin redirects; unknown customers and disallowed tenant routes/lead endpoints return 404. Public customer assets remain public as before. These checks do not constitute a full security audit.
- Browser review: desktop 1440px; mobile 375px and 320px; home/designs/request fit viewport, mobile menu opens with existing routes. Local UHE contact and currently hosted UMG contact checked on mobile. No browser errors reported in checked pages.
- Preview noindex, design canonical, favicon, logo and design image paths verified. Existing robots/sitemap behavior and customer metadata generators are preserved.

## Known existing availability
The current hosted preview has working Unique Home Enterprise and Unique Management Group routes. Five other registered slugs returned 404 before this migration: `lc-real-estate`, `jm0616studio`, `swenzy-logistics`, `jm-trucking`, `360-vitality-fitness`. Local registered site rendering and hosted branded build availability are separate checks. This migration preserves existing branded routing and does not publish missing builds.

REAL SPIEL is not a customer record in the main baseline. Its staged draft must not be added by this UI-only migration. A branded URL requires separately approved customer registration plus an existing workflow request and verified branded worker build/deployment mapping. UI styling alone cannot fix its 404.

## Rollback
Retain the currently serving Vercel deployment ID before release. If presentation or routing checks fail after an approved deployment, restore that prior deployment. For source rollback, revert this release commit through a reviewed commit; no database rollback is needed. Preserve customer files, data, secrets and DNS throughout.

## Human approval
- [ ] Review the exact release commit and changed file list.
- [ ] Confirm main has not advanced; if it has, review integration impact before merge.
- [ ] Accept the existing five hosted 404s or handle their build mappings separately.
- [ ] Record the current deployment ID for rollback.
- [ ] Confirm existing production environment values and branch/domain attachment remain intact.
- [ ] Explicitly approve merge of this UI-only release branch.
- [ ] Separately approve deployment to the existing preview deployment.
- [ ] After deployment, check home/designs/mobile, both active branded customers, assets and tenant isolation; authorize any controlled lead-delivery test separately.

No approval has been granted to merge or deploy.
