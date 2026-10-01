# RS WebFactory V2 staging handoff

Branch: `redesign/webfactory-v2`. The V2 interface is implemented in `components/webfactory/v2/` and routed from the staging app. Copies of replaced route components remain in `components/webfactory/legacy/` for reference and rollback. The original customer website components, API handlers, database modules, authorization, build jobs, slug rules and lead service remain in place.

## Connected behavior

- Public request form calls the existing `submitRequest` server action. Submission, idempotency, rate limiting, consent, persistence and the request cookie are still server owned. A chosen design direction is included in the editable brief; the form requires 20 further characters from the customer.
- Admin login and protected sections use the existing signed admin session. Request list, project detail, AI chat, reviews, slug controls, build controls and action history retain their existing backend implementations.
- Public customer previews use the existing safe preview catalog and customer site routes. Registered `/preview/[slug]` paths redirect to those routes; branded preview handling remains in the existing proxy/API.
- Lead forms and notification configuration are unchanged. Internal notifications remain governed by the existing explicit enablement setting.

## Explicitly unavailable

- Client account signup, login, ownership, messaging, uploads, profile editing, approvals and private delivery downloads have no safe backend here. Client routes show clearly labeled sample views; other IDs return 404. They never query real customer records.
- Admin delivery packages, team roles and integrations without verified APIs are read-only. The recovery pilot route contains no payment or execution controls.
- Checkout remains manual review. It collects no card data and does not charge, retrieve credit eligibility or initiate recovery.

## Verification

- `npm run lint`
- `npm run build`
- `node scripts/test-v2-routes.mjs` with `V2_TEST_BASE_URL` pointing to the local staging server
- `node scripts/test-preview-catalog.mjs`
- `node scripts/test-route-readiness.mjs` with the staging server at `http://localhost:3012`
- `node scripts/test-lead-endpoint.mjs` with `LEAD_TEST_BASE_URL` pointing to the local staging server and live delivery disabled

The local staging checkout has no `.env.local`. Authentication, database writes, AI responses, secure client sessions and private delivery require staging-specific configuration and a later acceptance pass. No production credential should be copied into this checkout for UI review.

## Human acceptance pass (5–10 minutes)

1. Open `/` and `/designs` at desktop and mobile sizes. Scroll a design card manually, then open its separate full example link.
2. Open `/designs/forge-%26-field`, follow “Request this direction”, and confirm the chosen direction appears in the real request form.
3. Check `/request`, `/processing`, `/privacy` and `/checkout` for correct navigation, unavailable states and no payment collection.
4. Open `/admin/login`; with approved staging credentials, inspect `/admin`, `/admin/requests`, a request detail and `/admin/ai`. Confirm server-recorded status, reviews, slug, QA and AI behavior before any workflow mutation.
5. Open `/client` and `/client/projects/sample-project`. Confirm sample labeling, disabled private actions and a 404 for an unknown client ID.
6. Open a registered customer preview and confirm its own navigation and lead form state. Review one narrow mobile screen for overflow.

No merge, production deployment, DNS change or payment enablement is part of this staging branch.

## Exact files changed

- `.gitignore`
- `app/admin/activity/page.tsx`
- `app/admin/ai/page.tsx`
- `app/admin/delivery/[id]/page.tsx`
- `app/admin/delivery/page.tsx`
- `app/admin/designs/page.tsx`
- `app/admin/integration/page.tsx`
- `app/admin/login/page.tsx`
- `app/admin/page.tsx`
- `app/admin/pilot/page.tsx`
- `app/admin/production/page.tsx`
- `app/admin/requests/[id]/page.tsx`
- `app/admin/requests/demo/page.tsx`
- `app/admin/requests/page.tsx`
- `app/admin/settings/page.tsx`
- `app/admin/users/page.tsx`
- `app/checkout/page.tsx`
- `app/client/delivery/[id]/page.tsx`
- `app/client/files/page.tsx`
- `app/client/login/page.tsx`
- `app/client/messages/page.tsx`
- `app/client/page.tsx`
- `app/client/profile/page.tsx`
- `app/client/projects/[id]/page.tsx`
- `app/client/projects/page.tsx`
- `app/designs/[slug]/page.tsx`
- `app/designs/page.tsx`
- `app/page.tsx`
- `app/preview/[slug]/[[...section]]/page.tsx`
- `app/privacy/page.tsx`
- `app/processing/page.tsx`
- `app/request/page.tsx`
- `app/sitemap/page.tsx`
- `app/templates/[template]/[[...page]]/page.tsx`
- `components/webfactory/forms.tsx`
- `components/webfactory/legacy/admin-ai-page.tsx`
- `components/webfactory/legacy/admin-login-page.tsx`
- `components/webfactory/legacy/admin-page.tsx`
- `components/webfactory/legacy/admin-request-detail-page.tsx`
- `components/webfactory/legacy/checkout-page.tsx`
- `components/webfactory/legacy/designs-page.tsx`
- `components/webfactory/legacy/home-page.tsx`
- `components/webfactory/legacy/privacy-page.tsx`
- `components/webfactory/legacy/processing-page.tsx`
- `components/webfactory/legacy/request-page.tsx`
- `components/webfactory/legacy/template-route-page.tsx`
- `components/webfactory/v2/admin/section.tsx`
- `components/webfactory/v2/catalog.ts`
- `components/webfactory/v2/client/project.tsx`
- `components/webfactory/v2/client/section.tsx`
- `components/webfactory/v2/previews/template.css`
- `components/webfactory/v2/previews/template.tsx`
- `components/webfactory/v2/public/design-grid.tsx`
- `components/webfactory/v2/public/home.tsx`
- `components/webfactory/v2/public/manual-preview.tsx`
- `components/webfactory/v2/shell.tsx`
- `components/webfactory/v2/v2.css`
- `docs/webfactory-v2-staging.md`
- `proxy.ts`
- `public/v2/brand/red-spectrum-wordmark-v2.png`
- `public/v2/designs/design-0.jpg`
- `public/v2/designs/design-1.jpg`
- `public/v2/designs/design-2.jpg`
- `public/v2/designs/design-3.jpg`
- `public/v2/designs/design-4.jpg`
- `public/v2/designs/design-5.jpg`
- `public/v2/designs/design-6.jpg`
- `public/v2/fonts/Inter-0.woff2`
- `public/v2/fonts/Inter-1.woff2`
- `public/v2/fonts/Inter-2.woff2`
- `public/v2/fonts/Inter-3.woff2`
- `public/v2/fonts/Outfit-0.woff2`
- `public/v2/fonts/Outfit-1.woff2`
- `public/v2/fonts/Outfit-2.woff2`
- `public/v2/fonts/Outfit-3.woff2`
- `scripts/test-v2-routes.mjs`
