# Broom Home Enterprises LLC

Customer request: `6417efec-04c9-497c-a735-229d51219944`  
Exact tenant: `broom-home-enterprises-llc`

## Website

Eleven routes: Home, Services, About, Contact, FAQ, Privacy, and service details for Rentals, Buying, Selling, Building and Holding. Uses the existing factory manifest and catch-all router. Broom-specific server-rendered components and scoped CSS keep other customer implementations intact. Unknown service routes return 404. No new packages or environment variables.

Navy `#132238`, gold `#B9965A`, warm ivory `#F6F2E9`, serif display type, asymmetrical layouts, local optimized photography and an original interlocking BH identity. Five SVG brand files: logo, dark logo, stacked logo, mark and favicon. Images are Pexels photographs also linked by the previous Broom website; see image-sources.json for provenance and license. No property is represented as a Broom listing.

All preview routes are noindex. Organization structured data contains the verified business name, phone and email; no invented address or license. No sitemap inclusion while this tenant remains a review preview. Customer domain mapping is intentionally absent until a separately approved release and cutover.

## Safe integration state

The existing lead API checks disabled tenant delivery before storage, provider configuration or notifications. Broom is registered with form.mode=disabled, recipientConfirmed=false and testPassed=false. The form interface is disabled and accurately explains that nothing is sent or stored. Phone and email links work. Activation requires confirmed recipient, tested storage/provider, passing authorized test submissions and separate administrator approval; add the trusted recipient mapping only at that stage.

Myndy context is complete in myndy/agent-context.md. The existing CustomerMyndy component is connected behind enabled=false. There is no dedicated verified Broom agent ID. Never substitute another tenant's agent. Separate behavior/privacy verification and activation authorization are required.

## Admin and release gates

The request was received with no saved brief, workflow or slug at first inspection. A later read found a shorter saved slug. The supported slug endpoint reserved the exact required `broom-home-enterprises-llc` using an optimistic expected-value check. The supported generation endpoint saved a draft brief; it was regenerated after the exact slug was reserved. No approval was granted.

Local creation and an isolated review deployment are authorized by the user brief, but dashboard Build Approved, Website Built, Preview Ready and Customer Approved gates remain intact. The current workflow cannot record Website Built before Build Approved. Do not bypass that gate with SQL or forged worker receipts. Local QA/deployment evidence is supplied in this folder and saved through the existing admin review endpoint as a draft QA note. The public branded preview proxy remains gated and the production website has not been merged or deployed.

The generated AI brief is a draft based on the original request, not a substitute for the supplied master brief or an approved specification. Review it against the implemented site before approving. Customer approval and production/domain authorization remain separate actions.

## Files

- `app/[customerSlug]/[[...page]]/page.tsx`: Broom-only route validation, metadata and renderer.
- `components/customers/broom-website.tsx`: all eleven page layouts, navigation, form state and gated chat.
- `components/customers/broom.css`: isolated responsive styling and reduced-motion support.
- `lib/customers/broom-content.ts`: typed services, FAQs and route allowlist.
- `customers/manifest.json`: one Broom registration; existing entries preserved.
- `customers/broom-home-enterprises-llc/site/customer.config.json`: refined inherited customer configuration.
- `public/customers/broom-home-enterprises-llc/`: five SVG logo files and eight local WebP photographs.
- `scripts/test-broom.mjs`: tenant, assets, routes, noindex, disabled form and existing customer regression checks.
- This private customer directory: sources, draft brief, Myndy context, DNS snapshot, QA evidence and handoff instructions.

## Verification

Run `npm run lint`, `npm run build`, `npx tsc --noEmit --incremental false`, and `node scripts/test-broom.mjs`. Set BROOM_QA_ORIGIN to a running isolated build for route/API checks. Browser evidence covers 320, 768 and 1440 pixels. Test submissions use synthetic data against the local disabled API only; no email is sent.

Two inherited integration scripts, test-umg-leads.mjs and test-unique-home-leads.mjs, could not complete without database/provider configuration in the isolated checkout. They are not recorded as passing and must not be enabled against live customers just to finish this task.

Unknown business information remains omitted: office address, service boundaries, licenses, listings, personnel biographies, history, testimonials, statistics and credentials. Final privacy retention/rights information requires business confirmation. See domain-cutover.md for email protection and remaining release prerequisites.
