BEGIN;
CREATE TABLE IF NOT EXISTS webfactory.request_review_events (
  id uuid PRIMARY KEY,
  request_id uuid NOT NULL REFERENCES webfactory.requests(id),
  customer_slug text,
  kind text NOT NULL CHECK (kind IN ('review','change_request','rebuild_prompt','qa_checklist','approval_checklist')),
  review_status text NOT NULL CHECK (review_status IN ('draft','building','preview_ready','changes_requested','rebuilding','approved')),
  preview_url text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  requested_changes text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  source_message_id uuid REFERENCES webfactory.ai_messages(id),
  admin_session_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(request_id, source_message_id, kind)
);
CREATE INDEX IF NOT EXISTS request_review_history ON webfactory.request_review_events(request_id, created_at DESC);
COMMIT;
