# Multi Trans communications verification

Scope: PR #4; customer `multi-trans-global-logistics`; request `2819bf01-793b-4df0-9409-8d53c8df71ee`. No shared production, DNS, email hosting, approval state or other customer configuration changes.

## Implemented

- Dedicated agent `agent_1791499171_dFkdItb29IQasjpC9SdkgA`, named Multi Trans Freight Assistant. Reuses unchanged CustomerMyndy on the common 27-page customer shell, loaded only after visitor choice.
- Contact and freight quote JSON endpoint with strict validation, origin checking, 16 KB body limit, honeypot, durable rate limiting, consent version/time and optional contact-sync consent.
- Existing PostgreSQL website_leads reused. Migration 0012 adds only Multi Trans details and per-recipient delivery sidecars, plus a read-back verification timestamp. Applied additively for controlled tests.
- Transactional idempotency and atomic delivery claims. 429 responses are delayed and bounded to three attempts; ambiguous timeout/5xx outcomes are held for reconciliation, never blindly resent. Admin-only tenant-scoped retry endpoint.
- Customer recipient: mtglobal39@gmail.com. Separate internal recipient: existing WEBFACTORY_REQUEST_NOTIFY_EMAIL, verified controlled inbox accountexec@theredspectrum.com. No CC/BCC delivery coupling.
- Preview branch uses WEBFACTORY_MTG_LEADS_MODE=test. Customer live sending requires BOTH WEBFACTORY_MTG_LIVE_APPROVED=true and WEBFACTORY_MTG_RECIPIENT_VERIFIED=true. Neither has been enabled. Generic customer form remains disabled to avoid activating unrelated shared lead handlers.
- Myndy server credential: MYNDY_API_KEY_MULTI_TRANS. Never use NEXT_PUBLIC_ or another customer's key. Owner and sync approval flags remain off. Adapter verifies authenticated /me workspace and scopes before sending contact data, uses the documented contact webhook without a message field, then reads the contact back using the documented public contacts API. A read failure never repeats creation.
- Existing admin request page has a separate scoped communications status panel; it does not advance build/customer/production approval.

## Controlled delivery evidence

2026-10-08 UTC; recipient accountexec@theredspectrum.com only:

| Inquiry | Durable lead | SendGrid receipt | Inbox evidence |
| --- | --- | --- | --- |
| Quote | ae046e33-d547-4a4d-b7ee-e41f0c504fb0 | w2auGgd8Tpq0xkb3tObmaA | Gmail 1a11dba805a03202, INBOX |
| Contact | 15f6ab9d-2f93-432f-8896-985cd11b85c1 | nZ-wPyF7QZmSDxDSDffIhQ | Gmail 1a11dbaa5a2a071a, INBOX |

Independent database queries confirmed accepted delivery records with attempt_count=1. Repeating both inputs returned the same IDs without sending again. Myndy was not requested for these tests. No real customer email was sent.

Isolated real-PostgreSQL tests passed: concurrent duplicates, conflicting payload, consent persistence, escaped HTML, per-recipient isolation, 429 retry timing/claim, held 5xx/timeouts, rate limit, honeypot, recipient injection, origin/content type/body size, HTTP success and unauthenticated admin retry rejection. Disposable test schema was removed. Mocked Myndy tests passed ownership mismatch blocking, exact read-back validation, Retry-After and read failure handling; these are not live synchronization evidence.

## Myndy diagnostics and remaining gates

Public widget and agent/ownership configuration endpoints respond 200 for the supplied agent. Published top-level knowledge_base_ids contains `7ba39147-1d5e-4d33-b82b-1981d48aee3b`. The returned conversation prompt has empty knowledge_base and rag.enabled=false; this association alone does not prove retrieval is active. Do not change provider configuration using guessed endpoints.

A business-specific question sent to the same chat endpoint used by the official widget returned HTTP 500 with `Conversation error for agent agent_1791499171_dFkdItb29IQasjpC9SdkgA:` and no further diagnostic detail. The real widget opened chat after synthetic visitor details; its provider-owned external-lead-capture call returned 401. This is separate from the website's working PostgreSQL/SendGrid flow.

Dedicated credential was absent in local and Vercel configuration at the last check. Live contact creation/read-back is pending authorized key setup and authenticated workspace verification. Company-answer accuracy and active KB retrieval remain unverified; provider-side configuration or diagnostics access is required. Do not describe this integration as fully end-to-end verified.

Provider documentation checked:
- https://myndy.ai/docs/guides — KB must be active for this agent and changes saved.
- https://myndy.ai/docs/communications-api — X-API-Key ownership, contacts scopes, /me, contacts read-back and Retry-After.
- Customer-supplied contact webhook contract — POST https://hello.myndy.ai/api/webhooks/contacts; upsert by exact email/phone; omit message to avoid SMS conversation insertion.
- https://myndy.ai/docs/api-reference — no detailed agent/KB management endpoint contract published.

## Verification commands

`node scripts/validate-customers.mjs`

`node scripts/test-mtg-myndy.mjs`

`node --env-file=<secure-local-env-file> scripts/test-mtg-leads.mjs`

`node --experimental-strip-types scripts/test-multi-trans.mjs` (MTG_QA_URL selects test deployment)

Build, browser and deployed evidence is recorded below as final checks complete.
