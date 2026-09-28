# Build Engine v2 release status

## Infrastructure

The first infrastructure release is `e1b3e1d6fb26f2e40b6e320ab79d7404f64b12fe` on `codex/build-engine-control`. It was pushed to the existing GitHub repository and deployed to the existing `red-spectrum-website-factory` Vercel project. No customer source was included and no DNS changes were made.

Implemented: versioned data-only compositions, scoped renderer/design tokens, local optimized image pipeline with provenance, vector logo variants, private draft artifacts, six-width QA enforcement, and a branded bridge to verified protected previews. Existing schema/renderers remain supported.

## One authorized customer attempt

- Request: `f3cdcd07-8416-4025-8ae5-41605ed1930e`
- Canonical slug: `unique-home-enterprise`
- Job: `22a00ee7-f422-48a8-83c0-f7a873a2cc94`
- Submitted once through the production Admin REBUILD WEBSITE control.
- Worker claimed and checked out the isolated build branch.
- Recorded progression: queued, claimed, planning, generating, failed.
- Failure: `INVALID_OUTPUT` at generation validation.
- No new customer files, checkpoint, build commit, QA, or deployment were created.
- No subsequent job or AI generation was submitted.

The exact rejected field cannot be established: the original response was not retained. Review found that provider-side schema bounds were less strict than server validation. The follow-up correction aligns text/array/image bounds and reports only closed validation codes, never returned content, secrets, or raw errors. This is preventative hardening, not proof of the original field-level cause.

## Preserved prior output

The previous job `20fe3f80-656b-41db-81bf-ea1c71b0a98d` remains preserved. The branded URL `https://preview.redspectrum.ai/unique-home-enterprise` responds with the previous UNIQUE HOME site, not the requested new redesign. Do not describe it as the new v2 output.

## Verification

Passed: lint/build, v2 contract tests, approved-asset traversal and tenant rejection, worker auth/lease/duplicate/scope tests, checkpoint security tests, QA diagnostic tests, legacy generator tests, and admin approval gates. Existing registered customer routes returned HTTP 200; unauthenticated admin routes redirected to login. Admin request overflow checks passed at 320/768/1440. Six-width QA is implemented but was NOT reached for the new customer job.

## Remaining gate

The customer redesign is not ready for review. There is no immutable generated artifact to recover from this attempt. A further generation needs a separately authorized retry/revision; do not mutate the failed job into a later success state or reuse the old customer output as the redesign.

Customer service list, hours, service area, business/legal details and final publication approval remain missing. No independently verified matching public profile was found. EBG Properties and similarly named businesses are excluded. Contact details remain customer-provided, not independently verified.

No customer production publication, Preview Ready or Customer Approved action, email, lead delivery, Myndy, payment, customer lookup, or DNS change was performed.

## Exact infrastructure files

- `app/api/branded-preview/[slug]/[[...path]]/route.ts`
- `proxy.ts`
- `components/customer-website.tsx`
- `components/generated-site.tsx`
- `components/generated-site.css`
- `lib/customers/schema.ts`
- `lib/customers/design-contract.ts`
- `lib/webfactory/build-paths.ts`
- `lib/webfactory/build-jobs.ts`
- `lib/webfactory/build-worker.ts`
- `lib/webfactory/worker-contract.ts`
- `scripts/build-worker/generator.mjs`
- `scripts/build-worker/generator-v2.mjs`
- `scripts/build-worker/qa.mjs`
- `scripts/test-build-worker.mjs`
- `scripts/test-preview-approval.mjs`
- `scripts/test-design-v2.mjs`
- `tsconfig.json`
- `docs/build-engine-v2.md`
- `docs/build-engine-v2-release-status.md`

Local-only operator scripts at the main checkout: `scripts/verify-unique-build-console.mjs`, `scripts/launch-unique-v2-approved.mjs`, and `scripts/status-unique-v2.mjs`. The launcher must not be rerun without checking history and new authorization.
