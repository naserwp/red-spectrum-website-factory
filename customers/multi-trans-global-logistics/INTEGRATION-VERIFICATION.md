# Multi Trans communications verification

Scope: PR #4; customer `multi-trans-global-logistics`; request `2819bf01-793b-4df0-9409-8d53c8df71ee`. No shared production, DNS, email hosting, approval state or other customer configuration changes.

## Implemented

- Dedicated agent `agent_1791499171_dFkdItb29IQasjpC9SdkgA`, named Multi Trans Freight Assistant. Reuses unchanged CustomerMyndy on the common 27-page customer shell, rendered directly using CustomerMyndy without an extra load step.
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

The dedicated credential was subsequently supplied locally. Authenticated /me returned the exact Multi Trans workspace and contacts read/write scopes. A synthetic contact was created and read back successfully (ct_c52d4cd538897aee). The key was added to this branch preview only; public sync activation remains off. The older direct chat endpoint still returned 500, but the currently published widget routes through Communications and returned accurate company-specific answers. The retrieval configuration mismatch and failed provider lead-capture require account-side diagnostics. Do not describe this integration as fully end-to-end verified.

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

## Deployed checks (703291d)

Deployment dpl_4w1zY5rt8yHYwUcbFQp9sWimyUsi was READY at the exact branch SHA 703291daef4a6655a915990e9a1bbe2db515b755.
Preview: https://red-spectrum-website-factory-hlykvbtv0-naserwps-projects.vercel.app/multi-trans-global-logistics

27 deployed pages, 135 layouts (320/375/768/1024/1440), 12 axe WCAG checks with zero violations, seven existing-customer routes, no browser exceptions. Titles, canonical paths, noindex and single H1 checked on every page. Real widget opens at 320/375/1440, stays within viewport and hides during navigation/form use. Third-party widget content is not included in the site's axe result.

Deployed quote lead: 17566af6-c523-4f94-bc85-319287197151; Gmail INBOX 1a11dd1d952db4c7.
Deployed contact lead: 09ff1810-50b8-4afe-953a-047f46bf685a; Gmail INBOX 1a11dd1e5212c22d.
Both saved, accepted by SendGrid and read in the controlled inbox; duplicate POSTs returned the same lead IDs. Sender accountexec@theredspectrum.com is verified in SendGrid's verified_senders API.

The actual widget now has lead_collection_form=true and route_widget_messages_to_communications=true. Two business-specific questions were submitted through its real UI with synthetic details. Communications accepted them with HTTP 201 and returned agent-tagged AI responses:
- WMcdcf8c86a3144a6a9c5e6518db1956: correct company, (773) 592-9382, mtglobal39@gmail.com and freight quote requirements.
- WM4574529968034ee6acf135de9779f5: correctly declined guaranteed pickup/instant price, listed inquiry categories, and required team confirmation of specialized equipment and coverage.
The provider configuration still reports rag.enabled=false and an empty nested knowledge_base despite the top-level KB association. Correct observed answers are verified; active retrieval internals are not. Provider-owned external-lead-capture returned 401. Widget messages and website contact synchronization are separate flows.

Scoped ESLint, TypeScript and local webpack production build passed. Vercel's normal production build also passed. No package changes. Browser screenshots, machine-readable results and provider/DB receipts are retained under the customer QA directory.

## Exact integration file changes

- app/admin/requests/[id]/page.tsx: adds communications panel only for the exact Multi Trans request.
- app/api/admin/multi-trans/leads/retry/route.ts: authenticated tenant-scoped retry.
- app/api/leads/multi-trans-global-logistics/route.ts: secure JSON intake.
- app/multi-trans-global-logistics/[[...page]]/page.tsx: runtime form-mode rendering.
- components/customers/mtg-assistant.tsx: widget obstruction protection for navigation, inquiry forms and footer privacy controls.
- components/customers/mtg-lead-form.tsx: contact and quote forms, validation and truthful receipts.
- components/customers/mtg-interactive.tsx: accurate local-planner wording.
- components/customers/mtg-website.tsx: forms/widget and privacy notices.
- components/customers/mtg.css: scoped forms/widget styling.
- components/webfactory/mtg-integration-status.tsx: read-only delivery status.
- customers/manifest.json and customers/multi-trans-global-logistics/site/customer.config.json: Multi Trans agent configuration only.
- db/migrations/0012_multi_trans_communications.sql: additive lead details/outbox and read-back timestamp.
- lib/customers/mtg-content.ts: accurate form FAQ.
- lib/leads/mtg-config.ts, mtg-validation.ts, mtg-service.ts, mtg-myndy.ts: server gates, input validation, durable delivery and authorized contact adapter.
- scripts/test-mtg-leads.mjs, test-mtg-myndy.mjs, test-multi-trans.mjs: isolated backend/provider and browser verification.
- customers/multi-trans-global-logistics/README.md, INTEGRATION-VERIFICATION.md and qa/integration-* files: current evidence and instructions.

No CustomerMyndy implementation changes, no other customer configuration changes, and no production/approval transition. Live customer delivery and real contact-sync activation remain separate approvals.

The direct-widget follow-up removes the extra Load AI assistant step. The common mtg-website.tsx shell now imports and renders CustomerMyndy explicitly, using the exact configured agent ID. No shared widget implementation or other customer agent changed.

Controlled full-flow test: lead 1745a273-b87e-4a06-b643-f0cf1257564f persisted, SendGrid receipt mUdZESTzRc26Xwhie1dNOg reached Gmail INBOX message 1a11dd67a3e98f05, Myndy contact ct_3c57922782dc0767 read-back verified. Both delivery tasks had attempt_count=1; repeating the same submission reused the lead and receipts. Authorization flags were process-only for this synthetic test; no public activation flags changed.
