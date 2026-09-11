# Lead form evidence
Status: DISABLED / EXTERNAL DELIVERY NOT TESTED.
Recipient: pending exact Accountex test inbox. No address guessed.
Server environment: SendGrid and durable PostgreSQL configuration are required and intentionally absent. The factory does not use a customer-specific browser-accessible form key.
Customer inbox rs@swenzylogistics.net is configured only in server-side trusted delivery mapping for future live mode; it is not a test recipient and cannot be selected by browser input.

## Executed deployed checks
The reproducible script `scripts/verify-swenzy.mjs` posted synthetic data only to `https://red-spectrum-website-factory.vercel.app`:
- Valid deployed form while disabled: 503, "Form delivery is not active."
- Honeypot populated: 400.
- Invalid email: 400.
- Unknown tenant: 404.
- Browser-submitted recipient/sender/mode tampering: 400.
See `verification.json` for timestamped responses. No database row or SendGrid request was possible while delivery is disabled.
The browser shows a disabled submit button with an explanation. Native validation, consent and labeled inputs are present.

## External test
1. SendGrid API submission/acceptance: NOT ATTEMPTED (configuration unavailable).
2. Actual Accountex inbox receipt: NOT VERIFIED.
No live/test notification was sent. HTTP success alone will never be recorded as inbox receipt.

## Controlled enablement
Set SENDGRID_API_KEY, LEADS_FROM_EMAIL, LEADS_FROM_NAME, LEADS_TEST_TO_EMAIL and LEADS_DATABASE_URL in the existing deployment environment after verifying the exact Accountex internal inbox and authenticated sender. The rate-limit and retry secrets are configured as hidden Vercel secrets; Vercel Cron uses a matching CRON_SECRET. Never commit secrets.
Update only this customer's form to mode=test and recipientConfirmed=true; leave testPassed=false.
Test subject is: [TEST] New website lead — Swenzy Logistics.
Use synthetic data, capture SendGrid API acceptance separately from independent inbox receipt.
The server writes a pending lead to PostgreSQL before sending, tracks accepted/failed delivery, deduplicates repeated submissions in a 15-minute window, and supports a protected bounded retry endpoint. It returns generic safe errors without exposing upstream details.
Record recipient verification and inbox evidence before any live-mode decision. Customer delivery needs separately confirmed recipient configuration and a passing test.
