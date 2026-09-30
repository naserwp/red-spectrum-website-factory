# UMG customer-review delivery

Status: ready_for_review. Customer approval: NO. Customer production publication: NO.

Branded URL: https://preview.redspectrum.ai/unique-management-group

This delivery serves UMG directly on the branded preview host, with a tenant-specific hostname gate. Other customers retain their existing routing and build records. The custom domain is not attached or routed. A later domain launch requires an explicit routing and origin-gate change following approval.

## Scope
- Consulting, business management, strategy, and business visibility positioning based on the customer clarification.
- Seven official services, grouped into three areas, with dedicated service detail routes.
- Existing official logo retained byte-for-byte; navy, blue, and sky palette preserved.
- Sixteen local optimized WebP photographs. Source URLs, Unsplash license reference, dimensions, byte sizes, and hashes are in image-inventory.json. Photographs are illustrative, not actual team, office, clients, or properties.
- Contact form active on the branded preview. Server validation, consent, honeypot, rate limiting, durable PostgreSQL persistence, duplicate suppression, and SendGrid notification. Only recipient: info@uniquemanagementgroup.com. Visitor email is Reply-To. Optional company is preserved in the stored message and notification.
- Activation uses WEBFACTORY_UMG_CONTACT_ENABLED=true in the existing Vercel project, alongside the existing mail master switch. No other tenant allowlist was changed.
- UMG Myndy widget and contact integration remain disabled. No new Myndy secret or dependency.
- Successful submissions redirect to the branded thank-you page. Failures retain inputs. All preview pages, including thank-you, are noindex; thank-you is absent from navigation and sitemap enumeration.

## Checks
- scripts/test-umg-leads.mjs: real PostgreSQL disposable schema, mocked outbound mail, zero real emails.
- scripts/test-umg-pages.mjs: 13 routes × 6 widths (320, 375, 768, 1024, 1440, 1920), axe-core 4.10.3 WCAG A/AA, metadata and legacy-content checks, mocked browser error/success flow.
- scripts/test-umg-isolation.mjs: other customer configs unchanged; original logo preserved.
- Existing UNIQUE HOME contact/Myndy regression tests retained and passing.

Automated accessibility checks do not replace a full manual assistive-technology audit. No customer approval, DNS change, production-domain attachment, or real customer submission was performed.
