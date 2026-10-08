# Verification — October 8, 2026

## Completed locally

- Customer schema and local asset validation: eight registered tenants validated.
- Production build: passed, including Next.js TypeScript checks and static generation. Standalone TypeScript check also passed.
- All eleven Broom routes: HTTP 200, exact tenant marker and noindex metadata. Invalid service route: HTTP 404.
- All seven existing customer homepages: HTTP 200 using an allowed preview host. Unique Management Group correctly returns 404 on production-mode localhost; direct HTTP with its allowed host passes. Other customer manifest entries are deeply identical to main commit 287f9b1.
- Disabled Broom lead API: synthetic local submission returns 503 and "Form delivery is not active." The disabled branch returns before persistence or email calls.
- Browser: 11 pages × 320 / 768 / 1440 widths = 33 checks. No horizontal overflow; one h1 per page; local images load; meaningful alt text and confirmed phone/email links present; no Myndy script/widget rendered.
- axe-core 4.10.3: no WCAG 2 A/AA or WCAG 2.1 AA violations in the Broom experience across those 33 checks. Automated auditing is not a substitute for a full manual accessibility certification.
- FAQ expansion, mobile menu expansion, keyboard skip-to-content and disabled form verified.
- Twelve unique homepage navigation destinations, including all service pages and contact chat anchor: all HTTP 200.
- Public gallery privacy regression: passed. Broom rendered HTML contains no internal request ID.
- Desktop and mobile screenshots inspected; scroll transitions preserve visible content and respect reduced motion. Local WebP images avoid remote image dependencies.
- No other customer source/assets changed. No environment files, credentials or provider tokens added to the change set.

## Corrected during checks

- Existing Broom draft had only four home sections where the current design contract requires five; corrected configuration.
- Corrected the import path for the existing Myndy component before final build.
- Changed scroll transitions to avoid hidden headings outside the viewport.
- Browser screenshot capture now waits for responsive images after viewport changes.
- A new test variable violated the Next.js lint rule; renamed it. Temporary downloaded accessibility checker was moved to a non-source extension so the exact project lint command does not lint vendor test code.
- The regression harness now uses direct local HTTP for a custom Host header; the existing UMG host restriction was preserved.

## Incomplete or intentionally gated

- Inherited test-umg-leads.mjs and test-unique-home-leads.mjs could not complete without isolated database/provider configuration. They are not passes. No live credentials were supplied to rerun them; no live customer notifications were enabled.
- Real Broom form persistence/email delivery tests: not run, activation not approved.
- Live Myndy agent behavior/privacy tests: not run, Broom agent ID missing.
- Mailbox login, incoming/outgoing mail and message authentication: not run; owner/provider access required.
- Complete authoritative zone export and DKIM-selector inventory: pending. Public DNS snapshot is not a full zone export.
- Field Core Web Vitals cannot be measured for a new unpublished site; no field performance score is claimed.
- Production branded preview, production domain HTTPS/redirects and post-cutover tests await their separate approvals.

The initial sandboxed build failed because Windows denied compiler path access. The subsequent authorized unsandboxed production builds passed. Existing nested-workspace lockfile warnings are environmental and were not suppressed by changing shared project configuration.
