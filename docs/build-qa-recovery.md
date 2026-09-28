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
