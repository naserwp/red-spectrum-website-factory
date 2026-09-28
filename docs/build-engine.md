# Build Engine — local control plane

No repository executor is connected. OpenAI brief/chat APIs generate text only; no Gemini/Claude repository adapter was found. `scripts/create-customer.mjs` scaffolds a package locally, but does not register, validate, build or deploy it. GitHub/Vercel release tooling is not an application build worker.

## Implemented

- Private authenticated `/api/admin/requests/[id]/build-jobs` GET/POST with same-origin mutation checks, strict inputs, bounded request text, rate limiting and safe error messages.
- Saved database slug and current approved brief loaded under transaction locks. Browser cannot supply a slug, provider, commands, status or preview URL.
- Immutable job snapshot, instruction version, actor, timestamps, artifact slots, QA slots, and append-only event history.
- Persistent failed job with `BUILD_EXECUTOR_NOT_CONFIGURED`; no external API call, repository mutation, preview URL or workflow promotion.
- Same submission UUID is idempotent; partial unique indexes prevent concurrent active request/slug builds.
- Cancellation is permitted only for undispatched queued jobs. Running executor cancellation must be confirmed before terminal status is recorded; failed jobs stay failed.
- Rebuild scope is explicitly confirmed and snapshotted in a new job. Prior history remains. Existing AI workspace supplies draft plans; no automatic plan approval.
- UI polls private history, shows safe logs, and keeps manual copy tools under Advanced / Manual Build Fallback.

## Configuration

Existing `LEADS_DATABASE_URL`, `WEBFACTORY_ADMIN_USER`, `WEBFACTORY_ADMIN_PASSWORD`, `WEBFACTORY_SESSION_SECRET` are required for storage/auth. No executor key is invented: adding an OpenAI key does not enable repository execution. Existing provider credentials remain planning-only.

Migration: `0008_webfactory_build_jobs.sql` (additive, included in `npm run webfactory:migrate`).

## Exact missing integration / next step

Implement a reviewed `WebsiteBuildExecutor` adapter AND a durable authenticated worker that owns an isolated checkout of the existing repository and can create changes. It must consume only approved immutable job snapshots, revalidate request slug/brief before dispatch, enforce per-customer path ownership, allow only controlled registry additions, reject symlinks/path traversal/arbitrary shell input, leave leads/Myndy inactive, and run fixed QA commands. Restrict credentials to that repository and the existing Vercel project. Do not merge production.

Worker stages: planning → generating → applying_changes → validating → building → qa_running → preview_deploying → preview_verifying → ready_for_review. Use leased dispatch, durable external references, idempotent claims, bounded retries and authenticated callbacks. Do not trust AI-generated status, raw logs or self-reported QA.

Required independent evidence: route/customer identity, required pages, tenant isolation, navigation, metadata, public privacy, 320/768/1440 mobile checks, lint, production build. Validate diff allowlist and disabled integrations before any isolated preview deployment. Capture the real HTTPS deployment URL, verify project identity and every required customer page. Only then persist ready_for_review. Preview Ready / Customer Approved remain separately gated decisions.

These execution, QA-runner and isolated-deployment stages are CONTRACTS, not functioning automation in this release. The adapter currently resolves to null. No endpoint accepts fabricated successful artifacts.

## Verification

`node scripts/test-build-jobs.mjs` uses temporary database fixtures and cleans them up. Tests authorization prerequisites, canonical slug snapshot, concurrent idempotency, active-job gate, failure persistence, cancellation, isolation and unchanged workflow. Browser verification exercises the real Nasir request with one failure job, leaving it build_approved and not built.

### Completed local verification (2026-09-28)

- Migration applied to the configured database. Existing request data preserved.
- Lint, TypeScript/production build and git whitespace check passed.
- Database fixture tests passed; temporary fixtures removed.
- Real admin login and unauthenticated GET/POST rejection passed.
- Nasir request `c22f0dc2-5b94-4998-a8fb-f873790802ad`: button created a persistent failed job with saved slug `nasirtesting`; approved-brief snapshot uses that exact slug. Error is `BUILD_EXECUTOR_NOT_CONFIGURED`. No artifacts/preview URL. Stage remains build_approved; `/nasirtesting` remains 404.
- Poll refresh and 320/768/1440 overflow checks passed. Screenshots: `outputs/build-console-{320,768,1440}.png`.
- Public Designs contains neither the request UUID nor private build error/events. Existing home, Designs, Request, login and five registered customer routes returned 200.
- No deployment, Git push, DNS change, customer email, payment, lookup, or Myndy activation.

### Files changed for this task

- `app/admin/requests/[id]/page.tsx` — primary next-action wording.
- `app/api/admin/requests/[id]/build-jobs/route.ts` — private job API.
- `components/webfactory/build-console.tsx` — confirmation, job history/polling, safe logs and rebuild scope.
- `components/webfactory/build-panel.tsx` — primary Build action and advanced fallback.
- `components/webfactory/prompt-tools.tsx` — collapsed manual tools.
- `lib/webfactory/build-executor.ts` — vendor-neutral executor contract, deliberately unavailable resolver and QA contract.
- `lib/webfactory/build-jobs.ts` — transactional job lifecycle.
- `db/migrations/0008_webfactory_build_jobs.sql` — durable tables/indexes.
- `scripts/migrate-webfactory.mjs` — migration registration.
- `scripts/test-build-jobs.mjs`, `scripts/test-build-console.mjs` — database/browser verification.
- `docs/build-engine.md` — capability and handoff record.

Unrelated pre-existing working-tree edits remain untouched. No automated repository execution, executable QA worker or preview-deployment adapter is claimed by these passing control-plane tests.
