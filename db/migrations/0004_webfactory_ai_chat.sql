BEGIN;
CREATE TABLE IF NOT EXISTS webfactory.ai_conversations (
  id uuid PRIMARY KEY,
  admin_session_hash text NOT NULL,
  request_id uuid REFERENCES webfactory.requests(id),
  customer_slug text,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS ai_conversations_session ON webfactory.ai_conversations(admin_session_hash,created_at DESC);
CREATE TABLE IF NOT EXISTS webfactory.ai_messages (
  id uuid PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES webfactory.ai_conversations(id),
  turn_id uuid NOT NULL,
  role text NOT NULL CHECK(role IN ('user','assistant')),
  content text NOT NULL DEFAULT '',
  status text NOT NULL CHECK(status IN ('pending','complete','failed')),
  model text,
  token_usage jsonb,
  failure_code text,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE(conversation_id,turn_id,role)
);
CREATE INDEX IF NOT EXISTS ai_messages_history ON webfactory.ai_messages(conversation_id,created_at);
CREATE UNIQUE INDEX IF NOT EXISTS ai_messages_one_pending ON webfactory.ai_messages(conversation_id) WHERE status='pending';
COMMIT;
