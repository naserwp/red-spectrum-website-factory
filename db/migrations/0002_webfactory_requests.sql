BEGIN;
CREATE SCHEMA IF NOT EXISTS webfactory;
CREATE TABLE IF NOT EXISTS webfactory.requests (
  id uuid PRIMARY KEY,
  submission_id uuid NOT NULL UNIQUE,
  access_hash text NOT NULL,
  name text NOT NULL,
  business text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL DEFAULT '',
  industry text NOT NULL,
  website text NOT NULL DEFAULT '',
  details text NOT NULL,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewing','building','preview_ready','approved','on_hold')),
  notification_status text NOT NULL DEFAULT 'disabled' CHECK (notification_status IN ('disabled','pending','sending','accepted','failed','uncertain')),
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS webfactory_requests_created ON webfactory.requests (created_at DESC);
CREATE TABLE IF NOT EXISTS webfactory.rate_limits (key text PRIMARY KEY, count integer NOT NULL, expires_at timestamptz NOT NULL);
COMMIT;
