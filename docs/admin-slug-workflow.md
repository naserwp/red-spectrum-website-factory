# Customer slug and action log — local update

## Manual slug follow-up
Added approved-host URL paste detection with an explicit Save confirmation, an Update Build Prompt button that uses only saved state, and a warning beside the separate preview URL input. No new migration was needed.
Files changed for this follow-up: `components/webfactory/slug-panel.tsx`, `components/webfactory/build-panel.tsx`, `lib/webfactory/slug-rules.ts`, `scripts/test-admin-slugs.mjs`, `scripts/test-admin-slug-ui.mjs`, and this document.

Test locally after admin login:
http://localhost:3012/admin/requests/c22f0dc2-5b94-4998-a8fb-f873790802ad

AI workspace: http://localhost:3012/admin/ai

## Slug flow
1. Review the clean suggestion and edit Customer Slug. Historical UUID-based AI suggestions remain visible in collapsed details, but are not selected automatically.
2. Check Slug Availability. A check does not reserve the address.
3. Save Slug reserves it transactionally. A unique database index plus registry checks prevents collisions. Reserved Factory routes, uppercase, spaces and special characters are rejected.
   Pasting an exact HTTPS URL from either approved preview host into Customer Slug extracts only its clean path segment and asks “Detected slug: … Save this slug?” No automatic save occurs. Credentials, other hosts, encoded/traversal paths, queries, fragments and extra segments are rejected.
4. Review and approve the brief. Saved slugs override historical brief JSON in generated build prompts and request-scoped AI context.
5. Copy the current build prompt and run Codex manually. Saving a slug does not create files, publish a preview, or approve a build.
   “Update Build Prompt” refreshes the server-rendered prompt from the saved request slug. It is disabled while the input differs from the saved slug. Typing into the separate preview URL field never changes the slug.

Changing an unbuilt site's saved slug resets build approval. A request with existing local build evidence or a recorded preview cannot be renamed here. Existing requests are not automatically assigned slugs; confirm their current address explicitly. Existing public customer routes remain unchanged.

The primary and fallback URLs are generated from the current input. They are intended addresses, not evidence of deployment. AI slug regeneration opens a prefilled chat; sending still requires admin consent. Suggestions are never automatically saved.

## Prompts and logs
The seven-stage timeline includes Slug Confirmed. The prompt card shows the confirmed address, build stage, configured model and admin notes. Build, rebuild, QA and unsent email outputs have copy controls. Missing outputs are disabled; rebuild/QA records from another saved slug are not reused.

The action table shows the latest 100 server-recorded events with UTC time, pseudonymous session, action, before/after state, slug, preview address and notes. Database triggers record request creation, generated/regenerated briefs, slug changes, build approvals, review changes, preview readiness and customer approval. Explicit availability checks and completed AI review/rebuild generations are also recorded. Saved rebuild drafts are distinguishable from generation events. Legacy records are labelled unattributed; missing historical state is not invented. Clipboard copying is a local browser action, not a logged server success.

## Migration
`db/migrations/0006_webfactory_slugs_actions.sql` adds nullable request slug/confirmation fields, a unique index, the action table/index, bounded legacy-event import and Factory-only audit triggers. Existing preview/review fields are reused. Existing requests and briefs are not overwritten. Repeated migration runs do not re-import modern audited build events.

## Verification
- Migration applied and rerun safely.
- `scripts/test-admin-slugs.mjs`: syntax/reserved routes, registry and request collisions, concurrent reservation, stale saves, reapproval, preview lock, saved-slug AI context/prompts and action logging. Synthetic fixtures are removed.
- Existing AI brief/chat and review tests retained, with the former UUID uniqueness assertion updated to clean suggestions; isolation is now checked at reservation time.
- `scripts/test-admin-slug-ui.mjs`: authenticated Save/Check controls, database persistence, action log, AI context, example request page and 320/768/1440 layouts.
- Existing route/auth checks: `scripts/test-admin-review-ui.mjs`.
- Evidence: `outputs/admin-slug-verification.json`, `outputs/admin-slug-*.png`, `outputs/admin-actions-*.png`.

## Exact files changed in this update
New:
- `lib/webfactory/slug-rules.ts`, `lib/webfactory/slugs.ts`
- `app/api/admin/requests/[id]/slug/route.ts`
- `components/webfactory/slug-panel.tsx`, `prompt-tools.tsx`, `slug-workflow.css`
- `db/migrations/0006_webfactory_slugs_actions.sql`
- `scripts/test-admin-slugs.mjs`, `scripts/test-admin-slug-ui.mjs`
- This document.

Updated:
- `app/admin/requests/[id]/page.tsx`, `app/admin/ai/page.tsx`
- `app/api/admin/requests/[id]/build/route.ts`, `app/api/admin/ai/chat/route.ts`
- `components/webfactory/build-panel.tsx`, `review-panel.tsx`, `ai-chat.tsx`, `workflow-timeline.tsx`, `workflow.css`
- `lib/webfactory/server.ts`, `brief-schema.ts`, `ai-workflow.ts`, `chat-store.ts`, `reviews.ts`, `review-actions.ts`
- `scripts/migrate-webfactory.mjs`, `test-ai-brief.mjs`, `test-admin-reviews.mjs`

No deployment, DNS change, real customer slug reassignment, email sending, payment activation or customer lookup activation. No API key or environment secret is sent to the browser. Existing unrelated work is preserved.
