# Protected preview verification

Internal `ready_for_review` does not mean public availability. The server and
worker now distinguish deployment existence, authenticated access, customer
identity and anonymous public access. Evidence is stored in the private job's
`qa_result.preview_access`; no migration is required.

Before accessing a preview, verify the exact Vercel project, READY state,
non-production target, immutable URL and Git commit using the authorized API.
For a Vercel authentication response, reuse the project's existing automation
bypass through the documented `x-vercel-protection-bypass` request header.
No credentials are put in URLs, browser props, cookies, evidence or logs. No
credential-bearing redirects are followed. Missing access fails closed.
No protection settings or bypass credentials are created/rotated by verification.

Five required pages must have the exact customer JSON-LD identity, noindex/title,
tenant-scoped navigation, no other registered business names and no private IDs
or configuration markers. Public, external redirects and protected responses
have separate semantics; 500s are never mistaken for successful protection.

Admins use the ordinary Open Preview URL and their authorized Vercel sign-in.
The UI states `Preview protection: Protected`; no shared bypass link is exposed.
The existing request/admin session does not confer Vercel team membership.

`scripts/recover-existing-preview.mjs` defaults to read-only checks. The explicitly
authorized `--queue-existing-preview` operation is pinned to job
`be19fdd6-cd63-4313-9c75-c8c187486024`, commit
`b9732f1dbe3876b67ef5f51cbdb68e619eff1a99` and deployment
`dpl_9yBgHkpsmgVv8NL2EN9fGqQuGRQq`. It verifies the existing checkpoint, clean
branch/commit, all 92 saved QA checks and approval/slug, then audits a one-time
requeue of the same job. The worker skips generation, build, QA and deployment,
rechecks integrity and verifies the existing preview. The control plane separately
verifies deployment/access before completing the job. A changed recovery tuple
is rejected. Preview Ready and Customer Approved remain separate admin decisions.

Tests: `scripts/test-protected-preview.mjs`, `scripts/test-build-worker.mjs`,
`scripts/test-windows-worker.mjs`, `scripts/test-qa-checkpoint.mjs`, and
`scripts/verify-protected-console.mjs` (browser-only fixture; `--live` reads the
persisted result). No customer emails, payments, lookup or DNS are involved.

Reference: https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation
