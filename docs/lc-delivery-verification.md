# L&C delivery verification

Read-only inspection of the latest real L&C lead, followed by isolated regression tests. No real email was sent during this verification, no retry was triggered against the real queue, and production/DNS were not modified.

## Latest stored submission

- Lead: 1ea847a4-f34e-4ee8-bc29-9dd5afa96116
- Customer: lc-real-estate
- Received: 2026-09-27 23:21:02.071 UTC
- Notification accepted: 2026-09-27 23:21:10.346 UTC
- Delivery mode: test
- Actual stored recipient: nasir@factiiv.io
- State: sendgrid_accepted — inbox delivery not yet confirmed
- Attempts: 1; duplicate count: 0; next retry: none; last error: none.
- Non-synthetic provider message ID exists but is not printed or returned publicly.
- Name, email, phone, investment interest, budget preference, property type and message are populated and pass the current validation schema. Original submitted payload was not supplied for byte-for-byte comparison.

The mailer records acceptance only after SendGrid HTTP 202. The accepted row and provider ID support that SendGrid was invoked and accepted this notification. This does not establish delivered, bounced or inbox receipt; no delivery-event webhook or persisted delivery events were found.

## Recipient and sender

L&C's server-only production recipient is accountexec@theredspectrum.com. Its customer-specific test override is nasir@factiiv.io, which takes precedence over LEADS_TEST_TO_EMAIL. Thus this submission used a test override, not the production recipient and not the generic test inbox variable.

Configured FROM email/name are present and pass configuration validation. They are not printed. The payload sets Reply-To from the validated stored visitor email. Historical sender/Reply-To values are not separately persisted in a payload audit.

Local test delivery is enabled and restricted to L&C. Other customer slugs were confirmed blocked by the test allowlist; live delivery remains off.

## Queue/security

Failed notifications remain in website_leads with error/retry state. Retry processing updates the existing lead, checks the tenant/mode/recipient gates, claims with a two-minute lease and stops after three attempts. The latest accepted lead is not eligible.

Customer-scoped dedupe prevents identical submissions within its 15-minute bucket. This is not an unlimited exactly-once guarantee: resubmission outside that bucket can create a new lead, and a crash after SendGrid acceptance but before DB acknowledgement can create duplicate-email risk.

Public success response is allowlisted to ok, leadId and message. Provider IDs, recipient, environment configuration and raw internal errors are not included. Input tampering, tenant isolation, escaping, duplicate handling and retries are covered by blocked-transport tests.

## Production

Existing Vercel Production environment names present:
LEADS_DATABASE_URL, SENDGRID_API_KEY, LEADS_FROM_EMAIL, LEADS_FROM_NAME, LEADS_TEST_TO_EMAIL, LEADS_RATE_LIMIT_SALT, LEADS_RETRY_CRON_SECRET, CRON_SECRET, WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED, WEBFACTORY_CUSTOMER_EMAILS_ENABLED.

WEBFACTORY_LEAD_TEST_ACTIVE_SLUGS and WEBFACTORY_LEAD_LIVE_ACTIVE_SLUGS were absent from the Production name listing. Configure the appropriate customer allowlist before enabling a shared production delivery gate. Production values were not downloaded/changed. The public /lc-real-estate route returned 404, so the local customer mapping/site is not verified as deployed.

## Changes in this verification

- app/api/leads/[customerSlug]/route.ts: L&C-only customer-friendly success wording.
- scripts/test-lc-leads.mjs: process-local disabled-gate fixtures after network blocking; assert clean success response and public response keys.
- docs/lc-delivery-verification.md: this report.

No database migration added. Regression tests use disposable cloned tables and mock SendGrid; only those synthetic tables are removed.
