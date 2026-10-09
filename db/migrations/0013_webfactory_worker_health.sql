BEGIN;
CREATE TABLE IF NOT EXISTS webfactory.build_workers (
 worker_id text PRIMARY KEY,
 last_seen_at timestamptz NOT NULL DEFAULT now(),
 started_at timestamptz NOT NULL DEFAULT now()
);
REVOKE ALL ON webfactory.build_workers FROM PUBLIC;
COMMIT;
