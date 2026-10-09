# Multi Trans branded preview activation

The isolated PR build exists, but the shared deployment currently rewrites the branded slug to a worker-only proxy. Multi Trans has no Build Engine job because it was built in PR #4. No job, brief approval or customer approval is fabricated to resolve that mismatch.

## Prepared change

- `proxy.ts`: pass only the exact Multi Trans slug and its descendants to the dedicated App Router route. That route validates all 27 supported pages and rejects unknown paths. Native assets, hydration, Myndy and existing same-origin form endpoints remain intact.
- `lib/webfactory/mtg-manual-build.ts`: immutable, exact request/slug association to the previously verified isolated deployment and QA report.
- `app/admin/requests/[id]/page.tsx`: display manual PR evidence for this request only. Website identity becomes verified only after a live branded-route check succeeds. Approval state remains database-owned and unchanged; historical QA is explicitly labeled with its tested revision.
- `components/webfactory/build-panel.tsx`: optional manual-build explanation for Multi Trans. Other requests retain existing behavior and all approval buttons retain their existing gates.

## Validation

- All 27 Multi Trans branded paths pass routing checks.
- Ten non-target routing comparisons match HEAD, including Broom Home, other tenants, admin and lead API paths.
- Manual evidence is unavailable for a different request ID or customer slug.
- TypeScript and scoped ESLint pass.

## Release boundary

The live branded URL and live admin dashboard require the shared control-plane deployment to contain these changes and the existing Multi Trans PR implementation. The prior prohibition on shared production deployment remains in effect until the user explicitly authorizes this scoped release. No DNS, email-hosting, customer approval, live-email activation or unrelated customer configuration changes are needed.

Before an authorized release, compare with the then-current main branch and production deployment, preserve concurrent customer changes, run the production build, and verify the actual public branded URL and authenticated dashboard after deployment. Do not promote an older branch snapshot over newer shared work.
