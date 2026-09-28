# Immutable recovery evidence

Reviewed artifacts can be registered without replaying generation. This is an
operator-only, read-only path and is deliberately separate from worker writes.

The verifier requires an exact request, slug, revision UUID, Git commit,
artifact fingerprint, isolated workspace root and customer build branch. It
records every accepted evidence path, Git blob SHA, classification and
provenance. It rejects dirty or moved workspaces, traversal, absolute paths,
other customers, environment/credential/secret paths, unreviewed shared files,
links/junctions and bytes that differ from either Git or the fingerprint.

Classifications:

- `WORKER_MUTABLE`: paths already accepted by `customerBuildPath`. Recovery
  does not add to or alter that allowlist.
- `RECOVERY_EVIDENCE_ONLY`: reviewed customer renderer/CSS, its fixed registry
  bridge, and customer-named QA evidence. These paths are read/fingerprinted;
  they are never granted to the worker.
- `PRIVATE_DELIVERY_EVIDENCE`: the exact customer's delivery and Myndy files.
  They may establish provenance but are not exposed by branded preview routing.
- `FORBIDDEN`: every other path, including arbitrary shared code and secret
  locations.

`scripts/register-reviewed-recovery.mjs` independently verifies the protected,
non-production Vercel deployment before writing `ready_for_review`. It records
that no generation occurred. The branded route changes only when the verified
row becomes visible. If branded verification fails, the new row is failed so
the prior verified mapping remains available. Preview Ready and Customer
Approved are never set by recovery.
