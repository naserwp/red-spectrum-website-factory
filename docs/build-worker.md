# Controlled build worker v1

Initial-host update: use the supervised Windows PC. See [Windows startup and configuration](windows-build-worker.md); it supersedes Linux-only and mandatory worker-token requirements below. The protocol/approval gates remain unchanged.

## Architecture and honest status

The admin/serverless application owns approval and persistent jobs; it never writes its deployed filesystem. A separately supervised **Linux Node 24 worker** polls the authenticated `/api/internal/build-worker` endpoint. No worker host or credentials were provisioned by this change. Until configured, the admin retains its explicit missing-executor failure. Tests are not a real Nasir deployment.

This is a constrained **new-customer generator**, not an unrestricted coding agent. OpenAI selects validated template/palette enums; public copy comes from the approved brief, remains draft, and is screened. No Gemini or Claude provider implementation currently exists in the inspected project. Missing OpenAI configuration fails closed; there is no implicit provider fallback or rate-limit bypass. No AI output becomes executable code, a path, import or command. Existing-slug updates are deliberately rejected in v1; rebuilding a failed/unmerged new-site job is supported in a fresh isolated branch, not overwriting an already registered customer.

## Configuration names

Control plane: `LEADS_DATABASE_URL`, existing `WEBFACTORY_ADMIN_USER`, `WEBFACTORY_ADMIN_PASSWORD`, `WEBFACTORY_SESSION_SECRET`, plus `WEBFACTORY_BUILD_EXECUTOR`, `WEBFACTORY_BUILD_WORKER_SECRET`, `VERCEL_TOKEN`.

Worker: `WEBFACTORY_BUILD_CONTROL_URL`, `WEBFACTORY_BUILD_WORKER_SECRET`, `WEBFACTORY_BUILD_ROOT`, `WEBFACTORY_BUILD_BASE_SHA`, `GH_TOKEN`, `VERCEL_TOKEN`, `OPENAI_API_KEY`, `AGENT_BROWSER_CLI`; optional `WEBFACTORY_AI_MODEL`.

Set executor selector to `controlled-worker-v1` only after the worker service is installed. Use a dedicated random secret of at least 32 characters over HTTPS (loopback HTTP allowed for development). Never use NEXT_PUBLIC variables. Use a fine-grained GitHub token restricted to contents write for the existing repository, and a Vercel token limited to the existing team/project. The worker has no database/admin/email credentials. Build subprocesses receive an allowlisted environment without worker/provider/GitHub/Vercel credentials.

## Install / operate

1. Review and commit the implementation on an isolated infrastructure branch; do not merge main automatically. Choose an audited baseline commit with the customer architecture and package lock. Set its exact SHA in the worker configuration. Baseline application scripts are trusted code, never taken from a customer prompt.
2. Apply additive migration `0009_webfactory_build_worker.sql` using the existing migration command.
3. Run the control API locally or on a separately approved environment reachable by the worker. Do not deploy production as part of this setup.
4. Provision a dedicated non-root Linux worker user/container with Node 24, Git, npm, installed agent-browser/Chromium and a private persistent working directory. No host filesystem mounts beyond worker storage. Install only pinned, reviewed dependencies/tooling.
5. Inject the required secrets via the service manager, not shell command arguments. Start `node scripts/build-worker/run.mjs` under a supervisor. `--once` attempts one queued job for controlled testing. No secrets or raw command output are printed.
6. Approve the Nasir request's saved `nasirtesting` slug/current brief; click Build. Only a real worker claim advances progress. Keep all production email/payment/lookup/Myndy settings unchanged.

## Pipeline / isolation

Queue → atomic SKIP LOCKED claim → planning → generating → applying_changes → validating → building → qa_running → preview_deploying → preview_verifying → ready_for_review.

Each job has a random hashed lease credential, a two-minute lease refreshed every 20 seconds, ordered progress and private events. Cancellation is acknowledged by the worker at a safe boundary before further stages; queued jobs cancel immediately. Running commands are bounded; cancellation does not claim to undo an existing Git push/deployment. Lease expiry fails the job and fences late progress/completion. It never automatically requeues possibly completed external side effects. Admin must inspect retained checkout/branch and deliberately submit a new job. No automatic retries of pushes or deployments.

The worker clones only `naserwp/red-spectrum-website-factory`, checks out the reviewed SHA into a new job directory, and creates `webfactory/build/<job-id>-<slug>`. It never uses main as its working branch, force-pushes, merges, or deletes unrelated checkouts. Before any project commands it validates the diff, exact manifest append, unchanged existing customer records, allowed paths, symlinks and secret values. No .env files are copied. The only writes allowed are the manifest append, this customer's configuration/Myndy draft, and three generated SVG concepts. Package installs use `npm ci --ignore-scripts`; lint and build are fixed commands.

Forms and Myndy are disabled in generated configuration. Contact fields remain missing instead of importing private request contacts. Public content is draft; the brief, request UUID, private change notes and executor tokens are never bundled into customer assets. Abstract SVG imagery/logo are original placeholders, not fabricated customer projects.

## QA and previews

Worker runs lint, production build (including customer validation), five required routes, JSON-LD identity, noindex/title, public identifier checks, tenant navigation, loaded images and 320/768/1440 overflow checks using Chromium. Failed checks block push. This is baseline automated QA, not a claim of perfect accessibility or factual verification.

After QA, it commits only the validated file list and pushes only the isolated branch. The **existing GitHub–Vercel integration** creates the preview. The worker polls the existing project's deployment API by exact SHA; it does not create a duplicate project or a second manual deployment. If automatic branch deployments are disabled or preview protection prevents unauthenticated verification, it fails instead of calling the preview ready.

Both worker and control plane verify the real preview. The control plane checks Vercel project ID, non-production target, READY state, exact SHA/hostname and all five customer identity routes. Only then is `ready_for_review` saved and a website_built audit event recorded. Preview Ready/Customer Approved remain separate decisions; no production alias is changed.

## Tests

- `node scripts/test-build-generator.mjs`: actual temporary customer files, manifest preservation, disabled integrations and provider failure cases (mocked transport).
- `node scripts/test-build-worker.mjs`: isolated database schema; auth, duplicate claims, heartbeat, cancellation, stale fencing, stage ordering, scope/QA gates, mocked verified completion, all pipeline failure boundaries. No real provider/push/deployment.
- `node scripts/test-build-jobs.mjs`: original queue control-plane regression.
- `npm run lint`, `npm run build`.

## Remaining integration blockers

Local presence check: OpenAI is configured; worker selector/secret/control URL/root/baseline, GitHub worker token and Vercel worker token are not. Interactive desktop Git/Vercel login is not treated as an unattended worker credential. No Nasir files or deployment were created. A working worker host, reviewed baseline and scoped credentials are required before the real end-to-end test.

## Local verification results

Migration 0009 applied. Generator tests created real synthetic files in a disposable directory, then removed them. Isolated database tests passed for authentication, atomic claim, duplicate worker exclusion, heartbeat, stale-job fencing, cancellation, ordered stages, forbidden scope, failure boundaries, and mocked successful preview verification. Existing build-job and slug workflow regressions passed. Unauthenticated worker and admin API requests both returned 401.

Nasir was read back from the database: `customer_slug=nasirtesting`, `stage=build_approved`, latest prior job `failed`. No real worker job was run because preflight reported the missing configuration names. No files for Nasir, GitHub branch, or Vercel preview were created in this task. Successful remote deployment/QA remains unverified until infrastructure is supplied.

## Changed files in this continuation

- `.env.example`
- `app/api/internal/build-worker/route.ts`
- `app/admin/requests/[id]/page.tsx`
- `components/webfactory/build-console.tsx`
- `lib/webfactory/build-executor.ts`
- `lib/webfactory/build-jobs.ts`
- `lib/webfactory/build-worker.ts`
- `lib/webfactory/worker-contract.ts`
- `lib/webfactory/ai-workflow.ts`
- `db/migrations/0009_webfactory_build_worker.sql`
- `scripts/migrate-webfactory.mjs`
- `scripts/build-worker/generator.mjs`
- `scripts/build-worker/pipeline.mjs`
- `scripts/build-worker/run.mjs`
- `scripts/test-build-generator.mjs`
- `scripts/test-build-worker.mjs`
- `scripts/test-admin-slugs.mjs` (dependency stub only)
- `docs/build-worker.md`

Vercel deployment lookup is based on the documented existing-project SHA filter: https://vercel.com/docs/rest-api/deployments/list-deployments . No Vercel/DNS configuration was modified.
