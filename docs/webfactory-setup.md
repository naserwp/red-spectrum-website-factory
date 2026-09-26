# RS WebFactory setup and handoff

## Homepage identity refinement

The homepage hero now identifies RS WebFactory directly and describes custom websites, lead forms, AI assistant setup and preview packages. Its neutral capability overview uses the factory mark and contains no customer imagery. Designs separates templates from customer preview cards. Customer routes remain independent.

Files for this refinement: `app/page.tsx`, `app/designs/page.tsx`, `components/webfactory/factory-overview.tsx`, and `components/webfactory/factory-overview.css`.

Verified the homepage at 320px, 768px and 1440px without horizontal overflow; checked Designs, Request, Admin Login, Checkout and Processing at 390px. All three customer homepages and all three template previews return HTTP 200. Unauthenticated admin access redirects to login. The earlier verified request-storage failure and manual-review checkout behavior remain in place. Database-backed success paths remain blocked by the configured hostname failing DNS resolution.

## Local routes

- Home: http://localhost:3012/
- Designs: http://localhost:3012/designs
- Customer Request: http://localhost:3012/request
- Admin Login: http://localhost:3012/admin/login
- Admin Dashboard: http://localhost:3012/admin (requires session)
- Customer Payment / Checkout: http://localhost:3012/checkout
- Project Processing: http://localhost:3012/processing
- Privacy: http://localhost:3012/privacy

Intended production factory origin: https://webfactory.redspectrum.ai. Customer previews retain https://preview.redspectrum.ai/[customer-slug]. DNS and Vercel domain changes were not performed in this pass. Preview indexing stays disabled.

## Configuration

Set secrets through the local ignored environment file or hosting provider. Do not put values in this document or public packages.

| Variable | Purpose / status |
| --- | --- |
| WEBFACTORY_ADMIN_USER | Configured locally; set the production username separately |
| WEBFACTORY_ADMIN_PASSWORD | Configured locally using the approved test value; production explicitly rejects that test value |
| WEBFACTORY_SESSION_SECRET | Generated locally; at least 32 characters required; supply a separate production secret |
| LEADS_DATABASE_URL | Reuse isolated Factory PostgreSQL; current configured hostname fails DNS resolution (ENOTFOUND) |
| SENDGRID_API_KEY | Server-only; no customer messages sent |
| LEADS_FROM_EMAIL | Must be an authenticated, confirmed sender before internal notifications are enabled |
| LEADS_FROM_NAME | Red Spectrum WebFactory |
| WEBFACTORY_REQUEST_NOTIFY_EMAIL | Confirmed internal recipient required |
| WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED | false by default; explicit gate after sender/recipient confirmation |
| WEBFACTORY_CUSTOMER_EMAILS_ENABLED | false; no customer mail automation is implemented or triggered |
| CUSTOMER_INTELLIGENCE_API_URL | Reserved, unconnected placeholder |
| CUSTOMER_INTELLIGENCE_API_KEY | Reserved, server-only placeholder |

## Persistent request workflow

After correcting the database connection, run `npm run webfactory:migrate`. It applies only `db/migrations/0002_webfactory_requests.sql` to the isolated `webfactory` schema. No OPS tables are referenced. The attempted migration did not connect to the configured database.

Requests validate on the server, use a honeypot and shared PostgreSQL rate limits, and persist before notification. A unique submission ID prevents duplicate inserts. Missing database/migration fails closed. The form preserves entered text for retry. Request status is accessible through a random browser cookie; the database stores only the cookie token hash. There is no public name/email lookup endpoint.

Admin sessions use signed, expiring HTTP-only cookies, SameSite protection, constant-time credential comparison, and production Secure cookies. Every status update and notification action checks authentication and request origin. Production login rate limits use PostgreSQL; local development login uses a bounded temporary counter so the approved UI can be reviewed before database setup.

The dashboard displays real stored requests only and supports received, reviewing, building, preview ready, approved and on hold. Changing a project status does not deploy a website, authorize payment or enable customer integrations. Website creation remains an admin-operated workflow.

Internal notifications are disabled by default. When enabled, SendGrid uses only the configured internal recipient, with HTML-escaped and plain-text content. Accepted means API acceptance, not inbox receipt. Uncertain sends require review and are not retried automatically. Customer email automation remains disabled.

## Checkout and customer intelligence

UI only. Requires email or phone as an identity-verification starting point; entering contact details does not verify identity. No API lookup, credit limit calculation, charge, card collection or financial approval occurs. Manual Review Required is displayed. Provider selection and a verified-identity API contract are needed for future activation.

## Files changed in this pass

- `app/page.tsx`, `app/layout.tsx`, `app/designs/page.tsx`
- `components/webfactory/shell.tsx`, `webfactory.css`, `forms.tsx`
- `public/brand/webfactory/mark.svg`
- `app/request/page.tsx`, `app/admin/login/page.tsx`, `app/admin/page.tsx`
- `app/checkout/page.tsx`, `app/processing/page.tsx`, `app/privacy/page.tsx`
- `app/webfactory-actions.ts`, `lib/webfactory/server.ts`
- `db/migrations/0002_webfactory_requests.sql`, `scripts/migrate-webfactory.mjs`, `package.json`
- `.env.example`, ignored `.env.local` (values never included in delivery)
- `app/[customerSlug]/[[...page]]/page.tsx`: existing 360 metadata, strict route validation and typing fixes
- `components/customers/customer-myndy.tsx`: existing effect cleanup and custom-element initialization fix
- `components/customers/vitality-website.tsx`: unused imports removed for lint
- `docs/webfactory-setup.md`

## Known limits

Live database persistence and admin status writes cannot be verified until the connection is corrected and the migration applied. Internal notification delivery is not tested or enabled. Payments and intelligence are intentionally inactive. This pass preserves existing customer configuration and does not claim that the earlier full customer migration/Myndy enablement work is complete.
