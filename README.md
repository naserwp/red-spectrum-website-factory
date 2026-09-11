# Red Spectrum Website Factory

A reusable, single-repository production workspace for building distinct, evidence-backed business website previews in one Vercel project. Customer sites resolve at `https://preview.redspectrum.ai/<customer-slug>` and remain isolated by exact slug, configuration, assets, and form settings.

## Start locally

```powershell
npm ci
npm run dev
```

Open the local URL printed by the development server. The factory includes:

- `/` — factory dashboard and template library
- `/brief` — evidence-aware customer brief builder with JSON export
- `/standards` — delivery and verification gates
- `/templates/forge` — home-services pattern
- `/templates/ledger` — professional-services pattern
- `/templates/stillwater` — wellness-and-care pattern

Each template also supports `/services`, `/about`, `/contact`, and `/privacy`.

## Create an independent customer package

```powershell
npm run customer:new -- example-business "Example Business"
```

This creates `customers/example-business/` from the standardized package and refuses to overwrite an existing folder. Follow [docs/FACTORY_WORKFLOW.md](docs/FACTORY_WORKFLOW.md) before writing production copy or activating integrations.

The new package is intentionally not routable. Review its configuration and assets, then register the complete customer object in `customers/manifest.json`. Run `npm run customers:validate` before every build. See [docs/VERCEL_HOSTING.md](docs/VERCEL_HOSTING.md) for the one-project routing and domain model.

## Safe form configuration

Customer contact forms submit through the factory’s server route. Store one server-side environment value per customer in the same Vercel project:

```text
SENDGRID_API_KEY=
```

The configuration remains `disabled` until the recipient is independently confirmed. Use `test` for one controlled submission, record the result, and use `live` only when `testPassed` is true. Never commit access keys.

## Content integrity

Every business fact is `verified`, `draft`, or `missing`. Do not invent or infer addresses, reviews, certifications, prices, guarantees, history, service areas, or other factual claims. Template content is visibly marked as illustrative draft and must be replaced with customer-approved material.
