# Factory database readiness

Use exactly one definition in ignored `.env.local`:

```dotenv
LEADS_DATABASE_URL="postgresql://USER:PERCENT_ENCODED_PASSWORD@HOST:5432/DATABASE?sslmode=verify-full"
```

Use the provider-issued PostgreSQL connection URL and required connection parameters. Percent-encode reserved characters in username/password, including `$`, `@`, `#`, and `%`; do not double-encode an already encoded credential. Never paste a `psql` command. In Vercel set the key `LEADS_DATABASE_URL` with only the URL as its value: no assignment prefix, shell command, or surrounding quotes. Never use a NEXT_PUBLIC prefix.

Run `npm run webfactory:diagnose` for environment parsing, DNS, connection and rollback-only migration verification. Run `npm run webfactory:migrate` to apply the reviewed Factory schema migration. Diagnostics print only hostname, booleans and allowlisted error codes, never connection strings or raw driver messages. The rollback check briefly obtains DDL locks and retains no changes. Migration scope is the `webfactory` schema only.

## Local verification, 2026-09-27

- Removed duplicate database key and extracted the existing URL from a pasted psql command; no credentials changed.
- DNS, Postgres connection, rollback diagnostic and actual migration passed.
- A labelled synthetic browser request saved and appeared in authenticated admin.
- Status changed to reviewing and persisted in PostgreSQL and Project Processing.
- Logout redirected protected admin access to login.
- Customer and internal emails stayed disabled; payment remains manual-only.
- The labelled synthetic request is retained for audit; no customer outreach occurred.

## Vercel server-only configuration (no deployment performed)

Required for Factory request/admin: LEADS_DATABASE_URL, WEBFACTORY_ADMIN_USER, WEBFACTORY_ADMIN_PASSWORD, WEBFACTORY_SESSION_SECRET (at least 32 characters). Replace local test credentials before production.

Keep WEBFACTORY_CUSTOMER_EMAILS_ENABLED=false and WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED=false.

Preserve existing lead backend configuration: SENDGRID_API_KEY, LEADS_FROM_EMAIL, LEADS_FROM_NAME=Red Spectrum WebFactory, LEADS_TEST_TO_EMAIL, LEADS_RATE_LIMIT_SALT, LEADS_RETRY_CRON_SECRET, CRON_SECRET (same retry secret). These do not authorize sending a test or activating live delivery.

Optional while inactive: WEBFACTORY_REQUEST_NOTIFY_EMAIL, CUSTOMER_INTELLIGENCE_API_URL, CUSTOMER_INTELLIGENCE_API_KEY. No payment provider variables are required for manual-review UI.

Use isolated preview database/configuration for Vercel Preview rather than exposing production data. Scope secrets to the intended environments. Production authentication and deployed smoke checks remain to be verified after separately authorized deployment.
