# Controlled Build Engine release

Prepared from production baseline d4f62c2fb4114abd87a28d410429ef7d378e12b7 in the existing clean release checkout. Original dirty development files are preserved. No customer assets, lead-delivery modifications, unrelated AI model changes, or integration activations are included.

The release includes authenticated persistent build jobs, controlled worker protocol, Windows worker tools, Admin Build Console, migrations 0008/0009, scoped tests and documentation. The admin AI default remains the production baseline's model; this release does not change it.

Verified locally on the release: lint, production build, generator tests, job persistence/idempotency/cancellation tests, worker lease/claim/QA tests, saved-slug workflow, catalog privacy, route/tenant identity, browser login/logout, confirmation, automatic polling, manual fallback, and responsive widths 320/768/1440. Nasir was inspected read-only; no build was started. Windows worker smoke test passes on the supervised PC.

Authorized production configuration update: WEBFACTORY_BUILD_EXECUTOR and the same private WEBFACTORY_BUILD_WORKER_SECRET from the existing worker were added to the existing project. Other variables were preserved; both email flags remain false. VERCEL_TOKEN is still missing. No CLI login credential was repurposed as a hosted runtime secret.

Production migrations remain unverified because the provider masks its database credential and the available local connection has not been confirmed as the current production database. Do not apply migrations to an assumed target. Await confirmation/secure configuration, verify schema, apply only missing migrations transactionally, then deploy the reviewed commit to the existing project. Do not start the worker until production auth checks pass and the queue is checked to prevent an unapproved build claim.

This branch is ready for code review; it is not evidence of production deployment or a connected production worker. No main merge, DNS changes, customer email, payment, or real customer build is authorized by this report.
