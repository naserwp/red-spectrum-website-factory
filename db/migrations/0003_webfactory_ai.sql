BEGIN;
CREATE TABLE IF NOT EXISTS webfactory.ai_briefs (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES webfactory.requests(id),
  status text NOT NULL CHECK (status IN ('generating','generated','failed')),
  model text NOT NULL,
  brief jsonb,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS ai_briefs_request ON webfactory.ai_briefs(request_id,created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS ai_briefs_one_running ON webfactory.ai_briefs(request_id) WHERE status='generating';
CREATE TABLE IF NOT EXISTS webfactory.build_workflows (
  request_id uuid PRIMARY KEY REFERENCES webfactory.requests(id),
  active_brief_id uuid REFERENCES webfactory.ai_briefs(id),
  stage text NOT NULL DEFAULT 'draft' CHECK (stage IN ('draft','build_approved','preview_ready','customer_approved')),
  preview_url text,
  updated_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS webfactory.build_events (
  id bigserial PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES webfactory.requests(id),
  brief_id uuid REFERENCES webfactory.ai_briefs(id),
  event text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
COMMIT;
