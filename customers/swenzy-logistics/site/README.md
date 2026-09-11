# Swenzy website source
The source of truth is customer.config.json; the same approved data must be synchronized into customers/manifest.json.
Renderer: components/customers/swenzy-website.tsx.
Scoped styles: components/customers/swenzy.css.
Client interactions and lifecycle: components/customers/swenzy-interactive.tsx.
Shared route: app/[customerSlug]/[[...page]]/page.tsx.
Shared gated endpoint: app/api/leads/[customerSlug]/route.ts.
Assets: public/customers/swenzy-logistics/.
One repository, one master deployment; no separate repository or project was created.
