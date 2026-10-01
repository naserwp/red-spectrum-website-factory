# L&C lead workflow — local verification

Canonical registry slug: lc-real-estate.
Local site: http://localhost:3012/lc-real-estate
Local contact: http://localhost:3012/lc-real-estate/contact
Intended production: https://red-spectrum-website-factory.vercel.app/lc-real-estate
No deployment or DNS changes performed.

## Implementation

The existing /api/leads/[customerSlug], PostgreSQL lead store, rate limiter and SendGrid mailer are reused. L&C's private recipient is resolved server-side. Browser-supplied recipient/sender/mode overrides are rejected.

Validated investment interest, budget preference and property type are stored as additive nullable columns and included in escaped HTML/plain-text notification content. Reply-To is the validated visitor email. A failed or pending notification is not presented as success; the form preserves entered values and distinguishes a saved inquiry with unconfirmed notification.

Retries resolve the correct tenant's subject and honor tenant/mode gates and stored recipient consistency. An atomic two-minute claim lease prevents concurrent send attempts. Attempts remain bounded at three. SendGrid does not provide application-level exactly-once delivery here: a process failure after provider acceptance but before recording it can still require operator review.

## Safety and verification

- L&C registry mode: test; recipientConfirmed: true; testPassed: false.
- Local customer-email and internal-notification gates remain false.
- Existing customer recipients and modes unchanged.
- 0007_lead_investment_details.sql applied through the existing lead migration runner.
- Real PostgreSQL committed save/read tested in disposable cloned tables, outside the live retry queue. Only those test tables were removed.
- Validation, missing consent/fields, invalid email, honeypot, delivery-field tampering, tenant isolation, Reply-To, HTML escaping, duplicate handling, rate limit and bounded retries passed.
- DB failure returned generic 503; provider failure returned saved/pending, not success.
- No real email sent. Provider acceptance and inbox receipt remain untested.
- Browser: five L&C pages and internal links, 320/768/1440 overflow, images, form error/input retention and mocked success state passed.
- /, /designs, /request, /admin/login, Swenzy, J&M, 360 Vitality and JM0616STUDIO returned 200. /admin and /admin/ai redirect unauthenticated visitors.
- Designs includes L&C from the canonical manifest with a verified local preview link; no recipient, contact email or admin request links exposed.
- Configured secrets absent from browser bundles; private lead recipient absent from L&C HTML.

## Remaining holds

Two admin requests match the exact supplied customer email, both without saved customer_slug:

- 4757a1f8-da29-4392-b953-404068fdef55
- 1d9e135c-8376-4464-9fe6-15cf3ae82756

The owner must identify which request should own this site. Neither request, its brief nor its action log has been changed. Do not resolve by name alone or silently assign a duplicate. After selection, establish the exact build receipt/request association, save customer_slug through the existing workflow and record its activation-preparation event. Do not reset approved history or mark delivery passed without evidence.

Local configuration is ready to attempt ONE explicitly authorized email test. The user subsequently selected nasir@factiiv.io as L&C's customer-specific TEST recipient. The live recipient and all other customers' test/live routing remain unchanged. Sender authentication and SendGrid key validity require that test. Keep delivery gates off until authorization.

Vercel Production env NAMES present: LEADS_DATABASE_URL, SENDGRID_API_KEY, LEADS_FROM_EMAIL, LEADS_FROM_NAME, LEADS_TEST_TO_EMAIL, LEADS_RATE_LIMIT_SALT, LEADS_RETRY_CRON_SECRET, CRON_SECRET, WEBFACTORY_CUSTOMER_EMAILS_ENABLED, WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED. Values were not pulled or inspected. Production gate values and runtime configuration must be verified before deployment/activation.

Not ready for live lead activation. No deployment is authorized by this task.

## Exact files changed in this task

- components/customers/lc-inquiry-form.tsx
- components/customers/lc-website.tsx
- customers/manifest.json (L&C entry only)
- customers/lc-real-estate/site/customer.config.json
- customers/lc-real-estate/delivery/README.md
- customers/lc-real-estate/delivery/qa-results.md
- lib/leads/config.ts
- lib/leads/validation.ts
- lib/leads/store.ts
- lib/leads/email.ts
- lib/leads/service.ts
- app/api/leads/[customerSlug]/route.ts
- db/migrations/0007_lead_investment_details.sql
- scripts/migrate-leads.mjs
- scripts/test-lc-leads.mjs
- scripts/test-lc-preview.mjs
- docs/lc-lead-activation.md

Verification screenshot outputs refreshed: outputs/lc-{home,about,services,contact,privacy}-{320,768,1440}.png.
Other pre-existing dirty files were preserved. The database and browser guidance informed isolated test storage, server-only gates and runtime verification.
