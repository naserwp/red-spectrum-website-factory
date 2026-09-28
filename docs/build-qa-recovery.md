# QA diagnostics and immutable retry

The preserved Nasir build failed `mobile-overflow` on `/contact` at 320px:
document scroll width 336px, viewport 320px. The common header crowded its
menu icon and the large contact heading did not wrap its long word within
the 265px content column. The shared header now provides a real mobile menu;
inner headings wrap. No overflow assertion was removed or hidden with CSS.

`qa.mjs` records a closed-vocabulary check name, pass/fail, page, viewport,
duration and timestamp. Human-readable reasons come only from the fixed
`qa-diagnostics.ts` catalog. Raw browser errors, page contents and exception
stacks are never sent to the control plane. Results append under the existing
private `qa_result.attempts` JSONB property; no schema migration is needed.

After lint/build, new jobs record a source/compiled-artifact SHA-256 checkpoint.
Admin Retry QA is available only for QA failures with this checkpoint, current
saved slug/brief approval, no active job and fewer than three retries. The
same job is re-leased. The worker verifies fingerprint, customer, baseline and
branch, skips generation/apply/build, and runs strict QA again. A pass continues
to isolated preview deployment/verification, never production or approval.
Changed or missing artifacts fail closed. Attempts remain in job history.

Legacy job `87d75333-6525-406c-82dd-b4591833c2b3` has no checkpoint and its old
compiled site is genuinely invalid. It cannot safely resume as the same
immutable artifact. A diagnostic copy reused the exact generated customer
files with only the shared UI correction; the original failed workspace and
job remain preserved. A corrected revision requires separate build approval;
no new Nasir job is authorized by the diagnostic utilities.

Regression commands:

- `node scripts/test-qa-diagnostics.mjs`
- `node scripts/test-qa-checkpoint.mjs`
- `node scripts/test-build-worker.mjs` (isolated synthetic DB schema)
- `node scripts/test-windows-worker.mjs` (synthetic polling server)
- `node scripts/test-build-generator.mjs` (synthetic local files only)

No customer email, payment, lookup, DNS or approval settings are changed.

## Checkpoint version 2: contained Next.js dependency links

Job `be19fdd6-cd63-4313-9c75-c8c187486024` completed lint/build but the old
checkpoint walker rejected every symlink. Its `.next/node_modules/pg-587764f78a6c7a9c`
link resolves to `node_modules/pg` inside that same isolated job directory.

Keep compiled `.next` output in the private immutable fingerprint: this permits
QA to exercise the exact preserved compilation instead of silently rebuilding
with changed dependencies or configuration. Git still excludes `.next`. The
checkpoint contains source/config, compiled bytes, dependency-link canonical
mapping and linked dependency contents. Mutable `.next/cache` bytes are excluded
from the digest, but its paths are still checked for unsafe links.

Only framework links under `.next/node_modules` (including nested dependency
links reached from there) may resolve into this workspace's `node_modules`.
Canonical `realpath` plus platform-aware `path.relative` containment checks reject
external, main-checkout, other-job, broken, secret/config, cyclic and arbitrary
source links. Source symlinks remain forbidden. Traversal is bounded. Checkpoint
storage itself cannot be redirected by `.git` or checkpoint-file links. Version 1
checkpoints are not silently accepted as version 2. Recheck the fingerprint before
deployment as well as before resumed QA.

`scripts/recover-preserved-checkpoint.mjs` defaults to read-only preflight and is
hard-bound to this approved failed job, baseline and artifact fingerprint. With
`--queue-same-artifact`, it records a private immutable checkpoint, locks/rechecks
approval, slug and absence of active jobs, then requeues the SAME job with
`resume:true` and an explicit recovery event. It cannot create a new job or invoke
AI. It refuses repeats after successful queueing. The original model name was not
persisted before failure; metadata explicitly says `original-model-unrecorded`,
not an invented observed model. No schema change or control-plane deployment is
required: the existing checkpoint resume protocol is reused.

### Preserved-revision outcome, 2026-09-28

The same job recovered with fingerprint
`bcd3ec4dec6ae84f30e78925442de1538f22d46859b3e17f5f40b5e1d9407da5`.
It skipped generation and passed 92 QA checks against the preserved compilation.
The worker created isolated commit `b9732f1dbe3876b67ef5f51cbdb68e619eff1a99`,
changing only the six allowed customer/manifest paths, and pushed its build branch.
The existing Vercel project created preview `dpl_9yBgHkpsmgVv8NL2EN9fGqQuGRQq`.

The preview is READY on Vercel, but unauthenticated HTTPS redirects (302) to
Vercel `/sso-api`. The current worker/control-plane verification requires direct
HTTP 200, so it stopped at preview verification; the exception is currently stored
as `WORKER_INTERRUPTED`. Authenticated `vercel curl` can render Nasir. Deployment
protection was NOT disabled, and no additional recovery was submitted. A reviewed
protected-preview verification path is needed before retrying this same deployed
artifact. The existing QA-only recovery expects HEAD at baseline, so it must NOT
be used now that the worker has committed/pushed the artifact.

Website Built/Preview Ready/Customer Approved were not recorded. The workflow
remains Build Approved. No production promotion, main merge, email or DNS change.
