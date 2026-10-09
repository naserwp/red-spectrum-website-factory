# Autonomous worker recovery

## Verified diagnosis — 2026-10-10

RUS job `f0565b20-d1de-47f0-b673-cd1b1bf006dd` belongs to request `3b60307c-133a-401d-93b6-116017264ea8`, slug `rus-transportation`, approved brief `f964ff5a-5fbe-49ef-9390-4b8f6c8e4b8a`. It was created at `2026-10-08T22:20:37.153Z`. The immutable snapshot equals the saved brief, completed at `2026-10-08T22:20:14.977Z`. There is no separate numeric revision column; the brief UUID identifies the revision.

Initial database evidence: queued, no started timestamp, worker ID, lease, result SHA or preview. Its only event was authorization. The configured worker endpoint rejects unauthenticated requests (401) and accepts the worker credential before validating an invalid non-mutating action (400). No Node build-worker process or WebFactory scheduled task was found on the configured Windows host. The configured baseline was `763e84637d03226d6cd045d3401c5ca2d4660e95`, older than verified READY production `9fce70fdca8d54e5e3459116c41f7a1a62bca91e`.

Root cause: durable queue without a running supervised polling worker on its configured host. No evidence of failed claims or expired RUS leases. A separate queued Unique Management Group job precedes RUS; a generic FIFO start would execute that unrelated job first.

## Implementation

- `run.mjs --once --job-id <exact UUID>` uses the existing atomic targeted claim. Unknown/malformed flags fail before claiming. A missing target never falls back to another customer. Failure produces nonzero process status.
- Polling connection failures use bounded exponential backoff with jitter. External generation, pushes and deployments are not blindly retried. Existing lease fencing, immutable QA checkpoint recovery and admin retry limits remain in force.
- Structured stage and completion logs contain IDs, timestamps and statuses, never brief text or credentials.
- Migration 0012 stores authenticated worker pulses. Dashboard health is online only for a pulse within 90 seconds; absent schema/connectivity is unknown. Enable `WEBFACTORY_BUILD_HEALTH_ENABLED=true` after the matching control-plane release.
- The optional Windows supervisor runs as the existing interactive account, ignores duplicate instances and restarts failed processes. It depends on that account being signed in and the PC remaining awake; it is not an always-on cloud service. The installer does not replace an existing task or start the queue implicitly.
- GPT-6 model selection supports high reasoning via the Responses API. Set `WEBFACTORY_AI_MODEL=gpt-6-astra`; no automatic model fallback is performed. Availability was verified through the configured account's model listing.
- The v2 generator receives the approved brief as untrusted data, requests FAQ content and industry-specific inquiry topics, and continues to prohibit unverified claims. Transportation selects licensed roadway/truck photographs with provenance and an original geometric road mark. No image-generation service is claimed.

## Release boundary

Apply only migration 0012 when releasing health reporting. Deploy/release the control-plane branch separately; do not merge or reassign the shared hostname automatically. Configure a reviewed exact baseline SHA and verify credentials before starting the supervisor. Review existing queue scope before enabling general FIFO processing. Live email, Myndy activation, customer approval, production aliasing and DNS remain separate.

## Execution report — 2026-10-10

**Partially verified; permanent operation and the latest refinements are blocked.** Two real initial builds reached verified isolated previews. Subsequent refinement continuations did not complete. Current persisted states are RUS `failed` and synthetic customer `queued`. Earlier successful evidence is retained in `qa_result.previousRuns`; it must not be represented as current-run success.

### A. Root cause

The original RUS queue had no running/supervised poller and an outdated configured baseline. Its exact identity and approved snapshot are recorded above. Later full rebuilds exposed a second executor defect: npm was launched directly, but nested `npm run customers:validate` could not resolve npm inside the restricted Windows environment. The error was reproduced with the worker's exact environment. Adding the reviewed Node and npm installation directories to that command's PATH fixed it; the preserved generated artifact then compiled through the actual worker helper.

The next generation attempt stopped with `PROVIDER_FAILED`. A minimal authenticated diagnostic independently returned HTTP 429, `credit_balance_exhausted`, type `insufficient_quota`. No billing change or repeated provider probing was performed. Future failures now expose the safe code `PROVIDER_QUOTA_EXHAUSTED` without raw provider messages.

### B. Worker architecture/configuration

Existing PostgreSQL durable queue, authenticated HTTP control plane, atomic leases, one job per worker, heartbeat/cancellation fencing, isolated Git checkout and Vercel Git preview integration remain in use. Builds run in the external Node 24 worker, not Vercel request handlers. Exact-job recovery never falls through to another queued customer.

Executed recovery configuration: GPT-6 Astra/high reasoning, existing server-side credentials, reviewed exact Git baseline, dedicated `E:/Office/customer_Projects/rs-webfactory-builds` storage. No secrets were committed. Staged local control services used the real database with notification sending disabled. Worker health migration 0012 exists and passed isolated-schema tests, but is **not applied to the production database**. The production health table was confirmed absent. The Windows supervisor is prepared, **not installed or running**. It needs an awake, signed-in host and is not a 24/7 cloud service.

### C. Pipeline changes

Strict targeted CLI options; bounded polling backoff; safe stage logs; nonzero failed/unclaimed exit status; model/reasoning configuration; original approved-brief context; seven-width screenshot retention; per-attempt storage; explicit provider-credit failure reporting. Local compilation can retry once while the lease remains valid; deterministic TypeScript errors and paid generation are not automatically retried.

The guarded same-job rebuild action requires unchanged saved slug/current brief and build approval, serializes concurrent requests, blocks customer-approved workflows, preserves prior results, and caps full restarts at three. A successful replacement deployment retains prior branch ancestry without force-pushing. RUS reached that cap; it was not raised or bypassed. The earlier verified preview is now separately exposed in the staged dashboard's history.

### D. Slug/routing reliability

The database-confirmed slugs remained exactly `rus-transportation` and `webfactory-automation-qa-20261010`. Final database readback showed exactly **one build job per request**, despite continuations. Existing atomic reservation, collision, reserved-name, stale-save and approval tests passed. Optional FAQ data adds a dedicated FAQ route only to new v2 generated sites that supply it. Existing tenant routes remain intact. The worker diagnostic API now accepts `/faq`, and deployment verification follows and verifies that route when advertised.

### E. Generated branding and content

The real worker generated customer configuration, manifest registration, original SVG logo/light-dark variants/mark/favicon, three optimized licensed photographs per build, source/license/hash inventories, inactive Myndy context, missing-fact notes and unsent outreach drafts. Transportation imagery and a road-style mark were selected for RUS. Long wordmarks now fit the SVG bounds. No image-generation backend was invoked or claimed.

RUS copy treats transportation offerings and driver opportunities as inquiries requiring confirmation. Confirm services, equipment/fleet claims, coverage, licensing/certifications, history, hours, address, contact publication and privacy terms before release. Do not treat the older AI brief's assertions as verified facts. Latest local RUS files include a separate FAQ page and linked header/footer logos. These refinements are **not in the earlier deployed preview**.

### F. QA and limits

- Final code: `npm run lint`, `npm run build`, and `npx tsc --noEmit` passed. The final build validated all eight existing registered customer packages and generated 100 static pages.
- Initial RUS automated run: 152 assertions, five pages, six widths, then authenticated deployment/identity verification.
- Initial second-customer automated run: 172 assertions, five pages, seven widths, then authenticated deployment/identity verification.
- Preserved revised RUS artifact (attempt 2): real worker-helper compilation passed after the PATH repair; offline browser QA passed **248 assertions**, six pages including FAQ, at **320, 375, 430, 768, 1024, 1440 and 1920px**. This offline result did not mark the failed job complete and did not deploy it.
- Visual inspection covered desktop and mobile screenshots. At 430px, keyboard Enter opened FAQ answers and mobile navigation; one H1, nonempty image alternatives, footer home link and no horizontal overflow were verified. This is not a formal accessibility certification.
- Passed existing/new tests: build generator, design v2, worker options, targeted claims, nested npm, bounded compilation retry, QA diagnostics/checkpoints, protected previews (including FAQ 404), isolated-database worker auth/leases/cancellation/stages/recovery, build-job duplicate/idempotency guards, admin slug reservations, preview approval/catalog and non-sending SendGrid validation/escaping.
- Failure coverage includes provider failures, unsafe output/paths, unavailable/missing credentials, wrong tenant/route, missing deployment, lease expiry, duplicate claims, cancellation, immutable artifact mutation and retry limits. Destructive production chaos tests and live Myndy/email-provider outage tests were not run. Generated integrations remain inactive. Existing customer regression coverage is manifest preservation, build/validation and targeted tests, not a complete visual audit of every existing website.

Offline evidence: `E:/Office/customer_Projects/rs-webfactory-builds/f0565b20-d1de-47f0-b673-cd1b1bf006dd-attempt-2-qa/qa-evidence.json` and 42 corresponding PNGs. Second-customer initial screenshots: `E:/Office/customer_Projects/rs-webfactory-builds/deffe69a-623e-4c16-8242-51d7534999f6-qa/`.

### G. GitHub

Infrastructure branch: `codex/rs-autonomous-build`; draft PR: https://github.com/naserwp/red-spectrum-website-factory/pull/7. Final tested implementation commit: `d5446a8fe19754d0dcc7ba601d239c3d83f66159` (a later documentation-only commit records this report).

Important fixes: `976e770` targeted recovery/health; `c042060` same-job history/FAQ; `93b1df4` wordmark bounds/FAQ verification; `af79fbb` restricted Windows npm resolution; `d5446a8` preserved-preview UI/provider credit diagnostics. No merge or force push was performed. The original dirty checkout and unrelated customer work were preserved in place.

### H–I. Verified isolated deployments

Final infrastructure code preview: https://red-spectrum-website-factory-bkbkzjpkp-naserwps-projects.vercel.app — deployment `dpl_EqSvESykQbZFXGCv1eSU4j3NuHco`, READY, non-production, exact SHA `d5446a8fe19754d0dcc7ba601d239c3d83f66159`.

| Build | Earlier verified result | Deployment | Completed (UTC) |
| --- | --- | --- | --- |
| Original RUS job `f0565b20-d1de-47f0-b673-cd1b1bf006dd` | `ddff5aef950b5b4963aeecea9a85e74da62f03c8` | `dpl_BLSWCGbUgrapUmFXMKhXg12Xnj8t` | 2026-10-09 18:51:00 |
| Browser-created second job `deffe69a-623e-4c16-8242-51d7534999f6` | `f618803df7ae650c375e36d98cfa75a1cafa09c8` | `dpl_CnT8JouFAfv4zZxEAVMNUvWcSSeD` | 2026-10-09 19:03:35 |

- RUS: https://red-spectrum-website-factory-arzlrhvei-naserwps-projects.vercel.app/rus-transportation
- Second customer: https://red-spectrum-website-factory-akypfr23a-naserwps-projects.vercel.app/webfactory-automation-qa-20261010

Both previews remain protected. Exact deployment project, non-production target, result SHA, customer identity, all five routes and noindex were verified. Both were subsequently opened successfully in the user's signed-in Chrome session. They are earlier verified revisions, not the incomplete refinements. Production remained READY at `9fce70fdca8d54e5e3459116c41f7a1a62bca91e`; no shared hostname or customer DNS was changed.

### J. Actual final dashboard/database state

- RUS: current run **failed / PROVIDER_FAILED**, full-restart counter **3**; one earlier verified run and two failed compilation runs preserved. The quota-specific code is a subsequent implementation improvement, not a retroactive rewrite of this recorded failure.
- Second customer: current refinement **queued**, counter **1**; earlier verified result preserved. It was not dispatched after API credit exhaustion was confirmed.
- Both workflows: **build_approved**; Preview Ready and Customer Approved remain pending. Both request notification statuses are `disabled`.
- The unrelated UMG job `73a55454-5a6f-462e-b932-454dfe45f1a8` remains queued and was not claimed or changed.
- The released dashboard was checked through the browser and correctly showed RUS failed and the second continuation queued. New health/history controls are staged in PR 7, not released to the shared admin hostname.

### K. Remaining blockers and release boundary

1. OpenAI API credits are exhausted. No automatic billing or credit purchase is authorized or performed.
2. Original RUS has reached the deliberate three-restart cap. A reviewed recovery of its preserved artifact/original job is required; do not create a duplicate or silently reset its limit. API funding alone does not clear this guard.
3. Separate production release authorization is required for PR 7 and migration 0012. This follows the user's explicit shared-branch/hostname release boundary.
4. Install and activate the prepared supervisor only after reviewing the existing queue and selecting an appropriate host. General FIFO activation would otherwise claim the unrelated queued UMG job. No permanent worker is currently installed or running.
5. The latest FAQ/footer refinements have local QA evidence but no completed deployment through the durable job workflow. Do not claim permanent end-to-end acceptance or mark the current failed/queued jobs ready.

No production promotion, DNS/email changes, customer communication, payment execution, Myndy activation or customer approval occurred. Production email feature settings were preserved; notification sending was disabled specifically for staged/test processes and generated forms.

### L. Real second-customer automation proof

Through the browser, a synthetic request was submitted with notifications disabled, then reviewed in the signed-in admin. Its saved slug was confirmed, a real AI brief was generated, Approve for Build was clicked, and BUILD CUSTOMER WEBSITE created the durable job. Request: `6ab29566-ff77-4d45-a6aa-e0dfbb11937f`; brief: `82abc766-0930-4e6a-bf1a-10ecd79f6723`; job and verified deployment are above.

The real worker claimed that job, used the same slug, generated real tenant files and assets, preserved other manifest entries, passed lint/build/browser QA, pushed its isolated branch, verified the Vercel preview, and reported ready_for_review. The dashboard showed that state and its actual QA evidence before the later refinement continuation was queued. **No customer website files were manually authored or edited to produce this result.** Its subsequent queued refinement must be distinguished from this completed initial test.

## Exact files changed

All paths are relative to the isolated worktree `C:/Users/USER/.codex/worktrees/rs-autonomous-build/rs-website-factory`.

| Purpose | Files |
| --- | --- |
| Worker configuration/health | `.env.example`; `db/migrations/0012_webfactory_worker_health.sql`; `scripts/migrate-webfactory.mjs`; `scripts/build-worker/install-supervisor.ps1` |
| Queue, API, evidence and dashboard | `app/api/admin/requests/[id]/build-jobs/route.ts`; `components/webfactory/build-console.tsx`; `lib/webfactory/build-jobs.ts`; `lib/webfactory/build-worker.ts`; `lib/webfactory/worker-contract.ts`; `lib/webfactory/preview-verification.ts`; `lib/webfactory/qa-diagnostics.ts` |
| Generation and execution | `scripts/build-worker/run.mjs`; `scripts/build-worker/runtime.mjs`; `scripts/build-worker/options.mjs`; `scripts/build-worker/model.mjs`; `scripts/build-worker/build-retry.mjs`; `scripts/build-worker/provider-error.mjs`; `scripts/build-worker/generator.mjs`; `scripts/build-worker/generator-v2.mjs`; `scripts/build-worker/qa.mjs` |
| Opt-in FAQ and shared generated-site fixes | `app/[customerSlug]/[[...page]]/page.tsx`; `lib/customers/design-contract.ts`; `components/generated-site.tsx`; `components/generated-site.css` |
| Tests | `scripts/test-build-worker.mjs`; `scripts/test-build-retry.mjs`; `scripts/test-design-v2.mjs`; `scripts/test-nested-npm.mjs`; `scripts/test-protected-preview.mjs`; `scripts/test-qa-diagnostics.mjs`; `scripts/test-targeted-worker-claim.mjs`; `scripts/test-worker-options.mjs` |
| Report | `docs/autonomous-build-recovery.md` |

Customer artifacts live on their worker branches and in dedicated build directories, not in the infrastructure PR. Existing customer configurations were not edited by this PR.
