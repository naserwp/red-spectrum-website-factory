# Broom Home recovery and release report

Verified October 9, 2026 (Asia/Almaty; evidence timestamps are UTC).

The website and recovery fixes are verified on the protected preview. Public branded release is blocked by explicit production and administrative approval requirements. It is not 100% launched, and the public branded URLs do not currently work.

## Website and working review URLs

All eleven pages below returned 200 with exact Broom tenant identity through authenticated Vercel access. Ordinary unauthenticated requests redirect to Vercel authentication; deployment protection remains enabled.

- [Home](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc)
- [Services](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/services)
- [Rentals](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/services/rentals)
- [Buying](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/services/buying)
- [Selling](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/services/selling)
- [Building](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/services/building)
- [Holding](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/services/holding)
- [About](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/about)
- [Contact](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/contact)
- [FAQ](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/faq)
- [Privacy](https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app/broom-home-enterprises-llc/privacy)

Both slugs were tested on all eleven deployed paths. The short alias /broom-home-enterprises returns 308 to /broom-home-enterprises-llc with the path preserved. The database already confirms the long slug on the original request, so it remains canonical. There is exactly one reservation and one manifest tenant. Canonical metadata and Organization JSON-LD use the long slug; previews remain noindex. Redirects are not treated as canonical identity-verification success.

Five SVG files are verified: logo.svg, logo-dark.svg, logo-stacked.svg, mark.svg and favicon.svg. Eight locally hosted WebP images are verified: architecture, building, city, development, hero, home, interior and rental. Images are illustrative, not property listings. Sources and licensing are recorded in image-sources.json. Navy, ivory and gold branding and the existing eleven layouts are preserved.

Myndy: prepared but disabled. No verified Broom-specific agent ID or callable provisioning tool is available. Broom Home Guide knowledge context is in myndy/agent-context.md. No other customer's agent is reused. Contact form delivery remains disabled; phone and email links are verified.

## GitHub and Vercel

- Branch: codex/broom-home-completion.
- Verified implementation commit: 0ed7ea19443859434123a4b585be744ecebba8a5.
- [Existing draft PR #1](https://github.com/naserwp/red-spectrum-website-factory/pull/1): open, mergeable; not merged.
- Latest main was fetched and is an ancestor of this branch: 287f9b1b5dd7882e9d86d0d7249471522f18884b. No merge conflicts require resolution.
- Project: red-spectrum-website-factory; project ID prj_HV68RI67tT0LXTfEA1mguG6F3Ddo.
- Deployment ID: dpl_DFFGhZZdxU7LVxKeuCR2esmYV4aL; status READY; preview environment; deployed SHA 0ed7ea19443859434123a4b585be744ecebba8a5.
- Deployment: https://red-spectrum-website-factory-krhmz10jz-naserwps-projects.vercel.app.
- Delivery-evidence commits after this implementation commit change only private documentation and QA artifacts.

The existing local Vercel authentication successfully accessed the project and protected deployment. The connector had returned project NOT_FOUND; CLI/API fallback succeeded. No protection settings were changed. Browser verification used an existing project automation credential scoped to the exact deployment origin; no credentials are included in artifacts.

## Branded preview: observed failure and cause

https://preview.redspectrum.ai/broom-home-enterprises and https://preview.redspectrum.ai/broom-home-enterprises-llc both returned 404. All 22 corresponding page requests failed on that hostname. Root/basic pages returned “Preview not available”; FAQ returned “Not found”; nested services also returned 404. These are recorded failures, not passing tests.

Vercel's alias API confirms preview.redspectrum.ai still targets production deployment dpl_Eov43iz23A6Ujy9Qe8LN1hZ9vuKy at main commit 287f9b1. It does not target this PR deployment. Publishing the recovery requires a separately authorized shared production merge/release. Reassigning the shared hostname to this preview would also be a production routing change and has not been done.

The existing proxy additionally requires a trusted build-job receipt for the exact request, slug and active brief. This request has no build approval or build job. A manually created PR/READY deployment is not such a receipt. Merging alone does not satisfy that requirement. The prepared proxy supports all eleven Broom routes and all thirteen assets, preserves the alias redirect and rejects private/other-tenant paths, but deliberately retains the verified-build gate.

## Dashboard and persisted state

Request: 6417efec-04c9-497c-a735-229d51219944. Before and after recovery: request status received; workflow draft; preview_url null.

| Stage | Verified state |
| --- | --- |
| Request Received | Complete |
| AI Brief Generated | Complete; generated brief 3c5b09be-2a62-4c74-978b-7a21499e3905 |
| Slug Confirmed | broom-home-enterprises-llc; confirmed 2026-10-08T17:34:53.879Z |
| Build Approved | Pending explicit administrator action |
| Website Built | Implementation verified in this report; no trusted server build-job receipt |
| Preview Ready | Pending working branded identity and explicit approval |
| Customer Approved | Pending real customer authorization |

No regeneration or slug mutation was necessary in this recovery: the current brief and reservation already match. There are zero build jobs for the request; build events contain only earlier generation start/completion events. No missing worker completion event was invented.

Fixed actual UI/calculation bugs: the next action respects earlier brief/slug/build approval prerequisites; Website Built uses trusted build evidence independently of branded reachability; recorded approvals survive transient route outages; gallery availability cannot grant or erase approval; saved draft QA notes display; unverified planned URLs are not mislabeled as recorded previews. The authenticated deployed dashboard now shows Build Approved as the next step, with the first three indicators complete and later indicators pending. Both approval buttons remain disabled in this state. Authentication, exact request identity, reload persistence and public gallery privacy passed locally and on the deployed preview.

Evidence was saved using POST /api/admin/reviews, kind qa_checklist, status draft, response 200/saved=true, then read back. The request action log records qa_checklist_saved with draft → draft. No build, preview or customer approval was granted. See qa/admin-state.json, qa/build-state.json, qa/recovery-evidence-readback.json and qa/deployed-admin-browser-results.json.

## Executed verification

- npm run lint: pass, final run zero warnings/errors.
- npm run build: pass; eight customer packages validated and production build completed. Existing multiple-lockfile workspace-root warning remains informational.
- Standalone TypeScript check: pass; final production build also completed TypeScript validation.
- Local routes: eleven canonical 200s, eleven short-slug 308s, exact canonicals/noindex, invalid-route 404, disabled lead API 503, all seven existing customer homepages.
- Protected deployed HTTP checks: 44 pass — eleven canonical pages, eleven alias redirects, seven other customer homepages, thirteen assets and two invalid/private-path 404s.
- Responsive/browser checks: 33 local and 33 deployed cases at 320/768/1440; images loaded, no horizontal overflow, one H1, phone/email links, no active Myndy, zero detected WCAG A/AA axe violations within Broom content.
- All eleven deployed pages: exact Organization identity and canonical URL; no fabricated address.
- Navigation: twelve internal destinations, keyboard skip link, FAQ toggle, mobile menu and disabled form controls pass.
- Focused tests pass: Broom proxy gating/asset isolation; branded asset rewriting; preview approval evidence; workflow prerequisite precedence; gallery persistence/privacy.
- Authenticated admin login, seven indicators, disabled approval controls, saved draft notes, request identity and reload persistence pass.

Initial remote accessibility automation failed because its helper targeted a different browser session; the helper was corrected and all 33 deployed cases then passed. Two inherited lead integration scripts remain incomplete without isolated provider/database fixtures; they were not rerun with live customer credentials. Mailbox send/receive, active chat, real lead delivery, production cutover and real customer approval have not been tested or claimed.

Screenshots: [desktop home](qa/deployed-home-1440.png), [tablet home](qa/deployed-home-768.png), [mobile home](qa/deployed-home-320.png), [desktop contact](qa/deployed-contact-1440.png), [tablet contact](qa/deployed-contact-768.png), [mobile contact](qa/deployed-contact-320.png), [deployed admin](qa/deployed-admin-recovery.png).

## Exact recovery source changes

- app/[customerSlug]/[[...page]]/page.tsx
- app/admin/requests/[id]/page.tsx
- app/api/branded-preview/[slug]/[[...path]]/route.ts
- components/webfactory/build-panel.tsx
- components/webfactory/workflow-timeline.tsx
- lib/webfactory/preview-catalog.ts
- lib/webfactory/workflow-state.ts
- proxy.ts
- scripts/test-branded-asset-routing.mjs
- scripts/test-broom-preview.mjs
- scripts/test-broom.mjs
- scripts/test-preview-catalog.mjs
- scripts/test-umg-admin-workflow.mjs

These thirteen files contain the recovery logic and regressions. This report, README.md, domain-cutover.md and files under this customer's qa/ directory hold refreshed evidence; qa/recovery-file-list.txt is the exact recovery change inventory. Existing customer configurations, dependencies, API approval mutations and environment files are unchanged.

## DNS, mailbox and remaining approvals

No domain registration, nameserver, DNS record, mailbox hosting, email delivery, payment, production merge or production deployment was changed. No external notifications were sent. Current MX and SPF remain Hosted Email values; reseller ownership and actual mailbox operation are not inferred from DNS.

Read-only Vercel responses recommend apex IPv4 76.76.21.21 and CNAME cname.vercel-dns.com. for this project. Neither Broom domain is attached. These are captured API recommendations, not an applied cutover. domain-cutover.md contains the full inventory, mailbox tests, website-only change scope and rollback procedure. Refresh exact values after authorized attachment; obtain a full zone export for DKIM and mail aliases first.

Required next actions:

1. Administrator reviews the saved brief and this implementation, explicitly authorizes Build Approved, then uses the supported tracked build/evidence workflow. No SQL or forged job receipt is an acceptable substitute.
2. Separately authorize merging PR #1 into main and releasing the shared production project so the corrected admin and branded proxy code is active. After both code and trusted job evidence are available, rerun all 22 branded route checks and exact tenant verification before recording Preview Ready.
3. Obtain real customer approval separately. Keep Customer Approved pending until then.
4. Live Broom domain cutover, mailbox verification, dedicated Myndy provisioning and form activation remain separate scopes requiring the stated access and approvals.

The next decision is administrator build authorization and shared production release authorization. No routine development command is delegated to the user.
