# Multi Trans Global Logistics INC — isolated website preview

- Exact request: `2819bf01-793b-4df0-9409-8d53c8df71ee`
- Confirmed slug: `multi-trans-global-logistics`
- Branch: `codex/multi-trans-global-logistics`
- Base: `607f9298a2324e92a2266aa07349be0be0b652e9` (origin/main)
- Existing Vercel project: `prj_HV68RI67tT0LXTfEA1mguG6F3Ddo`
- Intended branded path: `https://preview.redspectrum.ai/multi-trans-global-logistics`
- Delivery scope: isolated preview only. No main merge, production promotion, shared-domain reassignment, admin approval changes, DNS/mail changes, customer contact or live submission.

## Identity and evidence

Read-only database inspection on 2026-10-09 confirmed the request ID, business, Timothy Blakley, `mtglobal39@gmail.com`, phone `17735929382`, slug and confirmation timestamp `2026-10-08T21:46:01.602Z`. Request status was `received`; no build jobs existed. No database writes were performed.

The main checkout had 168 changed/untracked entries. Its branch and files were not used as a source for the implementation. Broom PR #3 was open at head `061a731b9352b1b0bf044ce00eb22e400ae5642a`; no Broom file, branch, PR, release or workflow record was modified.

The pasted brief ends at the homepage bullet `- Service`. The implementation follows all supplied requirements and fills out the site architecture using the documented existing-site navigation.

## Research and content decisions

Research source: https://multitransgloballogistics.com/ and its About, service, quote, FAQ, contact and legal links. See `research/source-audit.json` for direct-fetch results. Browser search retrieval provided readable homepage, About, dry van, freight forwarding, bulk liquid, intermodal, logistics, long-haul and refrigerated pages. Search retrieval initially returned verification screens or fetch errors on several pages. Ordinary direct public requests subsequently returned the page bodies, including FAQ, quote, Contact and service pages. Legal wrappers linked to public Termageddon policy documents, which were read separately. No verification challenge was bypassed.

The existing homepage advertises LTL, FTL and hot-shot freight in addition to its detailed service menu. Freight Shipping and Freight Transportation also mention rail, air and small freight; these remain research findings requiring business confirmation rather than newly asserted standalone capabilities. The old privacy policy (April 7, 2026) describes collection and marketing uses; its cookie policy lists a LinkNow functional cookie. The original terms include content-upload provisions. These old-platform provisions are not represented as behavior of the new local-only planner. The new site has 16 individual service guides, with original practical copy explaining shipment information to prepare. The general trucking-company page is represented by About and Trucking Services rather than duplicated filler. Specialized capabilities remain expressly subject to confirmation.

Contact discrepancy: the old site publishes `(312) 667-3901`, `info@multitransgloballogistics.com`, Phoenix IL 60426, Chicago/Evanston/Naperville context, and Monday-Friday 7AM-7PM. The request-provided phone and email take priority. Old contact values, hours and location are not included in metadata or structured data. Service Areas describes the historical context with qualification; there is no unverified map pin or street address.

Do not carry over unsupported fleet sizes, licensing/insurance, guaranteed delivery, lowest rates, tracking technology, reviews, nationwide coverage, customs brokerage or hazardous-material authority. Refrigerated and bulk liquid cargo acceptance require specific confirmation. No invented testimonials, ratings or customer logos appear.

## Brand and assets

Original geometric MTG monogram with directional slant; navy `#101B2B`, orange `#F47B20`, steel `#53677C` and cool gray `#F3F5F7`. Header and footer link to the exact tenant homepage.

Files in `public/customers/multi-trans-global-logistics/`: horizontal/light/dark logos, stacked logo, standalone mark, favicon, social SVG and PNG, highway WebP and warehouse WebP. The two photos were generated for this task and are marked as illustrative, not actual fleet or facilities. Logos are original SVG artwork. No other customer's artwork is reused. All assets are local and require no external image requests.

## Website and safe inquiry flow

27 pages: home, About, service index, 16 service guides, Industries, Service Areas, FAQ, quote planner, Contact, Privacy, Terms and Cookies. Dedicated route under the exact customer slug; invalid routes return 404. Existing customer routes are preserved.

The quote planner validates required input, prepares a reviewable summary locally, supports copying, and offers an explicitly user-initiated email-app link. It does not submit to an API, persist data, send email, reserve equipment or report false success. The optional planner remains local. Dedicated contact/quote submissions now use a separate, gated PostgreSQL/SendGrid handler in internal test mode; the generic manifest form stays disabled. The dedicated Myndy widget is rendered directly on all customer pages. See INTEGRATION-VERIFICATION.md for current delivery, provider tests and activation gates. Payment and live tracking are not enabled.

All pages are noindex/nofollow. Titles, descriptions, Open Graph, Twitter images, favicon, breadcrumbs and Organization/Service structured data are tenant-specific. Canonicals use the intended preview path. Production domain registration and indexable SEO activation remain release tasks requiring approval. No shared sitemap or robots configuration is changed.

## Approval checklist

Business review: proposed identity, customer contact details, current services/equipment/authority, operating areas/hours, legal notices and imagery. Live form activation requires recipient verification, an authorized delivery test and approval through the existing workflow. The existing admin request remains unchanged; a local receipt records exact identity without implying approval.

## Changed files

- `app/multi-trans-global-logistics/[[...page]]/page.tsx`: dedicated route, route validation, dynamic customer pages and metadata.
- `components/customers/mtg-website.tsx`: server-rendered website sections, pages, navigation shell and structured data.
- `components/customers/mtg-interactive.tsx`: mobile navigation and local inquiry planner.
- `components/customers/mtg.css`: customer-scoped responsive styles.
- `lib/customers/mtg-content.ts`: typed service content and FAQ data.
- `customers/manifest.json`: one new review-stage customer; existing entries preserved.
- `customers/multi-trans-global-logistics/site/customer.config.json`: customer configuration copy.
- `customers/multi-trans-global-logistics/site/build-receipt.json`: exact request/slug association and isolation evidence.
- `customers/multi-trans-global-logistics/research/source-audit.json`: research checks.
- `public/customers/multi-trans-global-logistics/*`: the 10 original customer assets listed above.
- `scripts/test-multi-trans.mjs`: customer-focused browser and SEO QA.
- This README and `qa/verification.json`: delivery documentation and evidence.

## Local verification

Production build, TypeScript, scoped ESLint and diff whitespace checks pass. Browser QA: 27 pages at 320, 375, 768, 1024 and 1440 pixels (135 layouts), no horizontal overflow or clipped headings, no browser exceptions. Tenant links, invalid routes, metadata, schema, menu Escape/focus, footer homepage, FAQs, quote validation/summary/invalidation, no POST or storage, desktop no-JavaScript navigation and five existing-customer routes pass. Six primary pages at 375 and 1440 pixels have zero axe-core 4.10.3 WCAG 2 A/AA and 2.1 AA violations. Automated accessibility checks are not a complete manual accessibility audit; native browser zoom and field performance are not measured.
