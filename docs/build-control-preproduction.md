# Build control plane: pre-production verification

## Regression diagnosis and fix

Test: `scripts/test-build-console.mjs --read-only`.

Expected: login, open approved Nasir request, inspect durable failed-executor history without creating a build, check canonical slug, polling, confirmation, manual fallback, privacy, routes and responsive layout.

Actual: synchronous Windows browser invocation timed out on navigation without exposing a useful stage. After using the worker's async native browser transport, login succeeded but a glob URL wait failed despite `/admin` being reached. A plain `/admin` URL wait also returned early on `/admin/login` (substring matching). The test could navigate away before the server-action redirect/session completed.

Fix: shared async native Windows browser transport with bounded timeout, stdin-only credential input, safe stage diagnostics, and exact pathname polling before authenticated navigation. All existing assertions remain. Added actual automatic-poll observation, confirmation gate, manual fallback presence and login/logout authorization checks. No authentication bypass, weaker assertion, application password change, or real Nasir job was needed.

## Contract

The local control API and worker use the same platform-neutral JSON contract: shared-secret authentication, atomic claim, hashed lease, heartbeat, ordered progress, fail, cancellation acknowledgment, and verified completion. Expired jobs are fenced and failed, never silently retried. Completion requires QA plus independent Vercel project/SHA/tenant identity checks. No Linux paths or shell commands are part of the server contract. Production still lacks this endpoint; compatibility there cannot be claimed until a separately approved deployment.

## Environment separation

Control plane required: `WEBFACTORY_BUILD_EXECUTOR`, `WEBFACTORY_BUILD_WORKER_SECRET`, `VERCEL_TOKEN`, `LEADS_DATABASE_URL`, `WEBFACTORY_ADMIN_USER`, `WEBFACTORY_ADMIN_PASSWORD`, `WEBFACTORY_SESSION_SECRET`.

Windows worker required: `WEBFACTORY_BUILD_CONTROL_URL`, `WEBFACTORY_BUILD_WORKER_SECRET`, `WEBFACTORY_BUILD_ROOT`, `WEBFACTORY_BUILD_BASE_SHA`, `OPENAI_API_KEY`, `AGENT_BROWSER_CLI`. This PC uses `VERCEL_CLI` plus its existing login; a worker `VERCEL_TOKEN` is an alternative, not an additional requirement. Native Git Credential Manager supplies Git authentication; `GH_TOKEN` is optional. `AGENT_BROWSER_EXECUTABLE_PATH` is configured for installed Chrome, optional if a supported default browser is installed. `WEBFACTORY_BUILD_EXECUTOR` is used by the server, not the worker runtime. `WEBFACTORY_AI_MODEL` is an optional worker model override.

Optional/unrelated to build execution: `WEBFACTORY_CUSTOMER_EMAILS_ENABLED`, `WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED` (preserve disabled); `SENDGRID_API_KEY`, `LEADS_FROM_EMAIL`, `LEADS_FROM_NAME`, `LEADS_TEST_TO_EMAIL`, `WEBFACTORY_REQUEST_NOTIFY_EMAIL`, `LEADS_RATE_LIMIT_SALT`, `LEADS_RETRY_CRON_SECRET`, `CRON_SECRET`, `CUSTOMER_INTELLIGENCE_API_URL`, `CUSTOMER_INTELLIGENCE_API_KEY`. Existing lead/email variables must be preserved, not removed. OpenAI settings on Vercel support existing admin AI features but are not needed there by the worker control API.

Production read-only audit: the three new variables `WEBFACTORY_BUILD_EXECUTOR`, `WEBFACTORY_BUILD_WORKER_SECRET`, `VERCEL_TOKEN` are absent. Database/admin variables are present, but Vercel masks their sensitive values. A masked value is not a usable credential or a failed secret-length check. Customer/internal email enabling flags are false. No environment setting was changed and no email was sent.

## Migration status and safe procedure

Production 0008/0009: **unverified**. Vercel returns a sensitive placeholder for the database URL; do not infer that local storage is the current production database. `scripts/audit-build-control.mjs` reads production settings, never prints values, removes its temporary ignored file, and inspects the schema only when a real database credential is available. It never applies migrations.

With a securely supplied, explicitly confirmed production connection, first inspect the two build tables, required columns, status constraint (including `claimed`), active-job uniqueness indexes and queue index. If missing, schedule a short maintenance window with worker dispatch off, take the normal database backup, and apply 0008 then 0009 using the existing migration runner. Each SQL file is transactional and preserves rows. 0009 briefly replaces constraints/indexes and should not run concurrently with active builds. Do not replay unrelated migrations blindly or overwrite local environment files. Verify schema afterward before enabling the executor.

## Release file boundaries (nothing staged or committed)

- Build engine: `lib/webfactory/build-executor.ts`, `lib/webfactory/build-jobs.ts`, `lib/webfactory/build-worker.ts`, `lib/webfactory/worker-contract.ts`, `app/api/admin/requests/[id]/build-jobs/route.ts`, `app/api/internal/build-worker/route.ts`.
- Admin console: `components/webfactory/build-console.tsx`; build-related hunks in `components/webfactory/build-panel.tsx`, `components/webfactory/prompt-tools.tsx`, `app/admin/requests/[id]/page.tsx`, `lib/webfactory/ai-workflow.ts`. These files also contain earlier request/review work: review hunks, not blanket staging.
- Worker: `scripts/build-worker/{run,runtime,launcher,setup,pipeline,generator}.mjs`, worker scripts in `package.json`, worker examples in `.env.example` (force-track only the reviewed example, never local secrets).
- Migrations: `db/migrations/0008_webfactory_build_jobs.sql`, `0009_webfactory_build_worker.sql`, registration in `scripts/migrate-webfactory.mjs`.
- Tests: `scripts/test-build-{console,generator,jobs,worker}.mjs`, `scripts/test-windows-worker.mjs`, worker dependency stub in `scripts/test-admin-slugs.mjs`, `scripts/audit-build-control.mjs`.
- Docs: `docs/build-engine.md`, `docs/build-worker.md`, `docs/build-worker-configuration-readiness.md`, `docs/windows-build-worker.md`, this report.

Existing customer sites/assets/packages, lead delivery changes, migration 0007, broader admin AI/review/slug/designs work and other dirty files are not automatically included. Preserve them. Prepare a reviewed release checkout from current remote main and resolve dependencies explicitly; do not commit the entire dirty tree.

This fix changes only the browser transport/test, read-only audit, and readiness documentation. No deployment, DNS, production worker polling, real build, payment or email activation was performed.
