# SendGrid lead backend

The factory lead endpoint is POST /api/leads/[customerSlug]. It accepts only lead fields; it rejects browser attempts to submit recipient, sender, from, to, mode, or deliveryMode.

The server resolves customer, mode, recipient and subject from trusted configuration:

- customer configuration controls only disabled, test, and live release gates;
- lib/leads/config.ts contains the server-only live-recipient registry;
- test mode uses only LEADS_TEST_TO_EMAIL;
- SendGrid uses only LEADS_FROM_EMAIL and LEADS_FROM_NAME;
- visitor email is used only as validated Reply-To.

## Required deployment environment

Set these server-only values in the existing factory deployment:

| Variable | Required value |
| --- | --- |
| SENDGRID_API_KEY | Factory Mail Send key with no browser exposure |
| LEADS_FROM_EMAIL | Exact authenticated Accountexec sender address |
| LEADS_FROM_NAME | Red Spectrum Leads |
| LEADS_TEST_TO_EMAIL | Exact authorized internal test inbox |
| LEADS_DATABASE_URL | TLS PostgreSQL connection for the persistent lead store |
| LEADS_RATE_LIMIT_SALT | Random server-only value for hashed rate-limit buckets |
| LEADS_RETRY_CRON_SECRET | Random server-only bearer token for the retry job |

Provision PostgreSQL first; local files, browser storage and in-memory maps are deliberately unsupported. Apply the schema once with LEADS_DATABASE_URL set, then run npm run leads:migrate.

## Durable delivery flow

1. Validate the slug and request shape.
2. Reject delivery routing field tampering.
3. Resolve mode and recipient server-side.
4. Atomically consume a shared, durable per-customer/IP rate-limit bucket.
5. Persist the lead as pending before calling SendGrid.
6. Claim a bounded delivery attempt, then send an escaped HTML and plain-text message.
7. Record accepted with provider message ID, or failed with a sanitized code and exponential retry time.

The retry endpoint is POST /api/internal/leads/retry with an Authorization Bearer token. It processes at most 10 due notifications per call and caps every lead at three attempts. Protect and schedule it only in the existing production deployment.

## Controlled verification

Do not set Swenzy to live. When credentials and the internal inbox are ready:

1. Apply the migration.
2. Set only Swenzy to test with recipientConfirmed true.
3. Submit one synthetic lead. Confirm database row, SendGrid API acceptance and independent inbox receipt separately.
4. Submit the identical lead within 15 minutes; confirm the durable duplicate record increments and no second SendGrid call is made.
5. In a non-production test environment, simulate a SendGrid non-2xx response; confirm failed, retry time and the three-attempt cap.
6. Confirm the browser cannot influence recipient/sender/mode and another customer cannot access Swenzy's route or lead recipient.

Only after recording those results and explicit customer approval may a future live-mode change be considered.
