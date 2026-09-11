# One-project Vercel hosting

## Intended production structure

Use one Git repository and one Vercel project for the factory and all customer previews:

- `https://preview.redspectrum.ai/<customer-slug>`
- `https://preview.redspectrum.ai/<customer-slug>/services`
- `https://preview.redspectrum.ai/<customer-slug>/about`
- `https://preview.redspectrum.ai/<customer-slug>/contact`
- `https://preview.redspectrum.ai/<customer-slug>/privacy`

The factory’s internal routes remain `/`, `/brief`, `/standards`, and `/templates/*`. These values, plus `/api` and `/_next`, are reserved and cannot be customer slugs.

## Customer isolation

`customers/manifest.json` is the runtime registry. Every registered customer is one complete, schema-validated object. Routes resolve exactly one object by exact slug; unknown slugs return 404. Customer-owned images, logos, and favicons must begin with `/customers/<customer-slug>/`, which prevents a configuration from referencing another customer’s local assets.

Customer delivery packages live in `customers/<customer-slug>/`. Public assets live in `public/customers/<customer-slug>/`. Do not create another repository or Vercel project for an individual preview.

## Registration gate

`npm run customer:new -- <slug> "<Business Name>"` creates a non-routable draft package. Review `site/customer.config.json`, place its assets in the customer’s public asset namespace, then add the reviewed configuration to `customers/manifest.json`. The build rejects reserved or duplicate slugs, cross-customer asset paths, invalid approval states, and unsafe form activation.

## Lead forms

Set the shared server-only SendGrid and durable database variables from `.env.example`. Customer live recipients live in the server-only delivery registry, not browser input or public configuration. The internal test inbox is `LEADS_TEST_TO_EMAIL`; test sends never CC a customer.

Form states are:

- `disabled`: no delivery
- `test`: requires a confirmed recipient and permits a controlled test marked `[TEST]`
- `live`: requires a confirmed recipient and a recorded passing test

The browser never selects the recipient, sender or mode. The server resolves all three from the exact registered customer slug and trusted configuration.

## Domain setup

After the repository is connected to one Vercel project, add `preview.redspectrum.ai` as the project domain and configure the requested DNS record in the authoritative DNS provider. Domain and DNS changes are intentionally deferred until deployment is separately authorized.
