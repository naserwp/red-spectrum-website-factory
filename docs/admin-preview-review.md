# Admin preview review — local setup

Local workspace: http://localhost:3012/admin/ai
Request review: /admin/requests/[request-id]#review

## Workflow
1. Open the request, inspect its preview yourself, and save observations and requested changes.
2. Use a review action to open the request-scoped AI workspace. Actions only prefill a prompt. Review the context and consent checkbox, then press Send.
3. AI answers are session-private until an admin explicitly saves an answer to the request's shared review history. Select change request, rebuild prompt, QA checklist, or approval checklist. Saving never overwrites an approved brief.
4. Mark Changes Requested to reopen QA/customer approval. Generate and copy a scoped rebuild prompt, explicitly approve its scope, then run Codex manually. AI has no file tools or deployment capability.
5. Verify changes manually. Record the exact allowed public preview URL and use the existing gated Mark Preview Ready / Mark Customer Approved controls. A URL or AI checklist is not evidence of completed testing.

## Database
Migration: `db/migrations/0005_webfactory_reviews.sql`.
Run `npm run webfactory:migrate`. Adds only `webfactory.request_review_events` and its index; no OPS tables.
Append-only review records contain request ID, optional customer slug, notes, requested changes, optional session-owned AI answer, status and timestamp. Source-answer adoption is idempotent and checks request/session ownership. Replayed save IDs do not reopen a completed approval.

## Model and limits
Server-only `OPENAI_API_KEY` required. `WEBFACTORY_AI_MODEL` overrides the default `gpt-6-astra`; model access was checked read-only with HTTP 200. No live customer-context generation was performed during verification. The provider uses structured Responses output, `store:false`, no tools and bounded output/time limits. Unsupported configured models fail rather than silently falling back.
Preview review is context-based; the assistant does not browse the preview or inspect screenshots. Supply observations. QA plans are draft checklists, not executed tests.

## Verification
- Additive migration applied.
- Production build/TypeScript and lint checked.
- `node scripts/test-ai-chat.mjs`: missing-key fail-closed, redaction, no-tools, structured output and failure handling without provider calls.
- `node scripts/test-admin-reviews.mjs`: real database persistence, duplicate protection, exact tenant URLs, source-message session/request isolation, approval gates and re-review behavior; only its synthetic fixtures are removed afterward.
- `scripts/test-admin-review-ui.mjs`: authenticated browser session required; tests public routes, unauthenticated admin/API denial, selected JM0616STUDIO context, explicit-send behavior and 320/768/1440 overflow.
- Evidence: `outputs/admin-review-verification.json` and `outputs/admin-review-{ai,request}-{320,768,1440}.png`.

## Changed in this update
- Admin pages: `app/admin/ai/page.tsx`, `app/admin/requests/[id]/page.tsx`.
- UI: `components/webfactory/ai-chat.tsx`, `review-panel.tsx`, `reviews.css`.
- Backend: `app/api/admin/reviews/route.ts`; `lib/webfactory/reviews.ts`, `review-actions.ts`, `chat-store.ts`, `chat-provider.ts`, `ai-provider.ts`, `ai-workflow.ts`.
- Migration and runner: `db/migrations/0005_webfactory_reviews.sql`, `scripts/migrate-webfactory.mjs`.
- Checks: `scripts/test-admin-reviews.mjs`, `scripts/test-admin-review-ui.mjs`.

No deployment, DNS change, customer messages, payment activation, lookup activation, Myndy activation, automatic build or brief overwrite. Existing customer assets are unchanged by this update. Existing unrelated local work is preserved.
