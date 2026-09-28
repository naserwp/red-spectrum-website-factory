# Supervised Windows build worker

This replaces the Linux-only initial-host requirement. No production deployment, environment update, startup task, email or customer build was performed.

## Local operation

From `E:\Office\customer_Projects\rs-website-factory` run `npm run build-worker -- --check` for configuration-only validation. After control-plane deployment is separately approved and verified, run `npm run build-worker`. Ctrl+C stops it. Restart the same command to poll again.

`npm run build-worker:setup` prepares `.env.worker.local` only when absent; it never overwrites existing configuration. The launcher selects installed Node 24, including the bundled runtime on this PC. The local environment is Git-ignored and its Windows ACL is restricted to this account and SYSTEM. Never upload it, display it, or include it in packages.

Worker root: `E:\Office\customer_Projects\rs-webfactory-builds`. Job checkouts and branches are isolated from development. Completed/failed directories are retained for review, not automatically removed. Do not delete an active job directory. The synthetic test directory is also retained.

Git uses native Git Credential Manager (noninteractive); optional GH_TOKEN is not required here. Vercel API reads reuse the authenticated CLI; optional VERCEL_TOKEN is not required on this worker. Chrome and agent-browser paths are discovered and stored privately. Git pushes only isolated build branches; existing Vercel Git integration must deploy non-production branches. Never merge automatically.

Queued jobs remain durable while the PC is off. Interrupted claimed jobs expire to failed, not automatically retried; an admin must review before a new attempt. Cancellation/lease loss stops further pipeline stages. Windows process trees are terminated on shutdown/timeouts. This supervised account is not a security sandbox for arbitrary repository scripts: only the pinned, reviewed baseline may run.

## Control-plane deployment prerequisites (NOT applied)

Set server-side Vercel Production variables:

- WEBFACTORY_BUILD_EXECUTOR (`controlled-worker-v1`)
- WEBFACTORY_BUILD_WORKER_SECRET (exact same private value as worker)
- VERCEL_TOKEN (control-plane-only API verification credential scoped to existing team/project; the hosted server cannot reuse this PC's CLI session)
- LEADS_DATABASE_URL
- WEBFACTORY_ADMIN_USER
- WEBFACTORY_ADMIN_PASSWORD
- WEBFACTORY_SESSION_SECRET
- WEBFACTORY_CUSTOMER_EMAILS_ENABLED (`false`)
- WEBFACTORY_INTERNAL_NOTIFICATIONS_ENABLED (`false`)

The hosted build control plane does not need OPENAI_API_KEY for execution; existing admin AI features still require it independently. The worker uses OPENAI_API_KEY locally. Migrations 0008/0009 are required; do not recreate existing tables. Existing unrelated integration variables must be preserved.

Review/stage only intended control-plane files from the dirty checkout before a separately approved deployment. Production currently lacks the worker endpoint. Transfer the shared secret securely, never through chat. Verify unauthenticated rejection and authenticated empty polling before approving any real customer build.

## Optional Task Scheduler (not installed)

After manual operation is verified, create a task under the same Windows account, only while logged on, with no overlapping instances. Program: Node 24 executable. Arguments: `--env-file=.env.worker.local scripts/build-worker/run.mjs`. Start in: `E:\Office\customer_Projects\rs-website-factory`. Trigger: user logon; restart on failure. Native credential-manager/CLI access depends on that same profile. Do not run as SYSTEM. Installation requires separate approval.

## Verification

Current results: Windows synthetic worker including Chrome PASS; generator PASS; database build jobs PASS; worker protocol PASS; admin slug tests PASS; lint PASS; production build PASS. The separate read-only admin-console regression is now fixed and PASS, including exact login redirect, logout, confirmation, actual polling and mobile layouts. See [pre-production audit](build-control-preproduction.md) for the diagnosis and remaining environment/migration gates. Local worker endpoint rejects unauthenticated requests with 401; production returns 404. No production jobs were claimed. Git/Vercel authentication was tested read-only; no new remote branch push or provider generation was exercised.

Files changed for Windows support: `package.json`, `scripts/build-worker/run.mjs`, new `runtime.mjs`, `launcher.mjs`, `setup.mjs`, new `scripts/test-windows-worker.mjs`, `scripts/test-build-console.mjs` (read-only option/native Windows browser), this document, and supersession notes in `docs/build-worker.md` / `docs/build-worker-configuration-readiness.md`. Private `.env.worker.local` was generated and ACL-restricted, not committed. No migration was added.

`npm run build-worker:test` uses a loopback synthetic control server, no real claims, and tests private configuration, startup/polling/restart/shutdown plus isolated Git branch operations. Existing generator, build-job, and worker-protocol tests cover scoped file creation, claim concurrency, cancellation, stale expiration and no fabricated readiness. The real-request console test may be run with `--read-only` to prevent creating a Nasir job.
