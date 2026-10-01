# Saved-slug build workflow — local verification

Verified locally on 2026-09-28. No deployment, DNS changes, customer messages, payments or lookup activation.

## Behavior

- The request's saved customer_slug overrides historical AI suggestions in the current prompt and AI context. Generation completion re-reads the saved slug under the request lock.
- Generated handoffs show the exact Vercel fallback and preview-domain URLs. No preview URL is parsed to choose a build slug.
- Route verification requires a registered slug, an allowed URL, HTTP 200 HTML, and matching business name plus canonical tenant URL in JSON-LD. Generic pages, wrong tenants, redirects, unavailable routes and unknown slugs fail closed.
- Verify Website Built records an idempotent website_built action only after verification. It does not approve the preview, create files or deploy.
- Preview/customer approval rechecks the route. Notes/review endpoints cannot bypass readiness gates.
- Designs shows working registered routes as preview ready, preserves approved/change-request status for working previews, and shows unavailable sites as building with no preview link.
- Public data remains allowlisted; request links, timestamps and action counts are authenticated-only.

## Results

- Lint and production build (including TypeScript): passed.
- Database-backed slug persistence, conflicts, concurrent reservation, current-slug prompts/context, approval gates and action logs: passed. Only generated test fixtures were removed.
- Review history, duplicate handling, session/request isolation and review reopening: passed.
- Actual route identity and wrong-tenant/generic-page rejection: passed.
- Public route/privacy, authenticated admin visibility and 320/768/1440 overflow checks: passed.
- Nasir's rendered slug and build prompt use nasirtesting; its route returns 404 and readiness remains disabled.
- Existing public routes /, /designs, /request, /admin/login and all four registered customer routes return 200. Admin/dashboard/AI routes require authentication and load after login locally.

## Current catalog

Swenzy Logistics, J&M Trucking Logistics, 360 Vitality Fitness, JM0616STUDIO, Nasir test (pending), and the older synthetic verification request (pending).

## Files changed this turn

- app/admin/requests/[id]/page.tsx
- app/api/admin/requests/[id]/build/route.ts
- components/webfactory/build-panel.tsx
- components/webfactory/workflow-timeline.tsx
- components/webfactory/prompt-tools.tsx
- lib/webfactory/ai-workflow.ts
- lib/webfactory/brief-schema.ts
- lib/webfactory/reviews.ts
- lib/webfactory/preview-catalog.ts
- lib/webfactory/route-readiness.ts (new)
- scripts/test-admin-slugs.mjs
- scripts/test-admin-reviews.mjs
- scripts/test-preview-catalog.mjs
- scripts/test-designs-ui.mjs
- scripts/test-route-readiness.mjs (new)
- eslint.config.mjs and tsconfig.json (exclude ignored release/output copies)
- docs/build-readiness-verification.md

No migration or new environment variables. Existing request_actions storage is reused.

## Release gate

Local checks pass. Production deployment is not authorized in this task and has not occurred. Before a release, select/review the required uncommitted workflow dependencies and resolve the production admin credential verification blocker reported in the previous deployment. Do not pull all production secrets or change passwords as a workaround. Nasir still needs an actual customer website build; this is not a reason to fabricate a preview or enable its link.
