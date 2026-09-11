# Red Spectrum Website Factory workflow

## 1. Intake and evidence

Create the customer brief before writing production copy. Every customer fact is `verified`, `draft`, or `missing`, with a source where available. Public research may confirm facts but must not be used to infer unsupported claims.

## 2. Independent customer package

Run `npm run customer:new -- <slug> "<Business Name>"` to create `customers/<slug>/`. The script refuses reserved slugs and existing folders. Keep the configuration, source notes, PDF, Myndy package, outreach drafts, form test, and approval record inside that folder. Public brand and image files belong in `public/customers/<slug>/`.

## 3. Design direction

Choose a starting pattern based on the customer’s industry and conversion goal. Change composition, type, section order, imagery, content density, and interaction model as needed. A template is a production pattern, not a finished customer design.

## 4. Content and brand

Use supplied brand files where suitable. When no logo exists, create an original concept and a small favicon. Record the source and approval state for public business information and imagery. Do not publish draft labels as verified facts.

## 5. Contact delivery

The shared server route resolves the recipient from server-only customer delivery configuration and sends through the factory SendGrid account. Keep the customer form `disabled` until the recipient email is directly verified, use `test` for the controlled submission to the internal test inbox only, and switch to `live` only after the result is recorded. Leads persist durably before notification delivery; no browser field can choose a recipient, sender or mode.

## 6. Myndy

Create a distinct agent name, avatar brief, greeting, verified business context, FAQs, qualification questions, and escalation rules. Keep the embed placeholder disabled until the real agent ID and script are supplied.

## 7. Verification and delivery

Verify every route, viewport, link, form state, image, metadata field, schema object, and page in the PDF. Complete the approval checklist and unresolved-information list. Register the customer at `https://preview.redspectrum.ai/<slug>` in the single factory deployment only after the package passes validation.
