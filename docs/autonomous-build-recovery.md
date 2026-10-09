# Autonomous worker recovery

## Verified diagnosis — 2026-10-10

RUS job `f0565b20-d1de-47f0-b673-cd1b1bf006dd` belongs to request `3b60307c-133a-401d-93b6-116017264ea8`, slug `rus-transportation`, approved brief `f964ff5a-5fbe-49ef-9390-4b8f6c8e4b8a`. It was created at `2026-10-08T22:20:37.153Z`. The immutable snapshot equals the saved brief, completed at `2026-10-08T22:20:14.977Z`. There is no separate numeric revision column; the brief UUID identifies the revision.

Initial database evidence: queued, no started timestamp, worker ID, lease, result SHA or preview. Its only event was authorization. The configured worker endpoint rejects unauthenticated requests (401) and accepts the worker credential before validating an invalid non-mutating action (400). No Node build-worker process or WebFactory scheduled task was found on the configured Windows host. The configured baseline was `763e84637d03226d6cd045d3401c5ca2d4660e95`, older than verified READY production `9fce70fdca8d54e5e3459116c41f7a1a62bca91e`.

Root cause: durable queue without a running supervised polling worker on its configured host. No evidence of failed claims or expired RUS leases. A separate queued Unique Management Group job precedes RUS; a generic FIFO start would execute that unrelated job first.

## Implementation

- `run.mjs --once --job-id <exact UUID>` uses the existing atomic targeted claim. Unknown/malformed flags fail before claiming. A missing target never falls back to another customer. Failure produces nonzero process status.
- Polling connection failures use bounded exponential backoff with jitter. External generation, pushes and deployments are not blindly retried. Existing lease fencing, immutable QA checkpoint recovery and admin retry limits remain in force.
- Structured stage and completion logs contain IDs, timestamps and statuses, never brief text or credentials.
- Migration 0012 stores authenticated worker pulses. Dashboard health is online only for a pulse within 90 seconds; absent schema/connectivity is unknown. Enable `WEBFACTORY_BUILD_HEALTH_ENABLED=true` after the matching control-plane release.
- The optional Windows supervisor runs as the existing interactive account, ignores duplicate instances and restarts failed processes. It depends on that account being signed in and the PC remaining awake; it is not an always-on cloud service. The installer does not replace an existing task or start the queue implicitly.
- GPT-6 model selection supports high reasoning via the Responses API. Set `WEBFACTORY_AI_MODEL=gpt-6-astra`; no automatic model fallback is performed. Availability was verified through the configured account's model listing.
- The v2 generator receives the approved brief as untrusted data, requests FAQ content and industry-specific inquiry topics, and continues to prohibit unverified claims. Transportation selects licensed roadway/truck photographs with provenance and an original geometric road mark. No image-generation service is claimed.

## Release boundary

Apply only migration 0012 when releasing health reporting. Deploy/release the control-plane branch separately; do not merge or reassign the shared hostname automatically. Configure a reviewed exact baseline SHA and verify credentials before starting the supervisor. Review existing queue scope before enabling general FIFO processing. Live email, Myndy activation, customer approval, production aliasing and DNS remain separate.

## Outstanding acceptance evidence

This document is an implementation/diagnostic record, not evidence of a completed RUS preview or permanent worker installation. Record the actual run outcome, commit/deployment references, browser QA, second-customer test and any remaining blockers in the final execution report. Do not infer completion from a reserved slug, successful build, mocked deployment, or supervisor configuration alone.
