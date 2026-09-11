CREATE TABLE IF NOT EXISTS website_leads (
  lead_id UUID PRIMARY KEY,
  customer_slug TEXT NOT NULL,
  delivery_mode TEXT NOT NULL CHECK (delivery_mode IN ('test', 'live')),
  dedupe_key TEXT NOT NULL UNIQUE,
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notification_status TEXT NOT NULL CHECK (notification_status IN ('pending', 'accepted', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  duplicate_count INTEGER NOT NULL DEFAULT 0,
  next_retry_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  failed_at TIMESTAMPTZ,
  provider_message_id TEXT,
  last_error_code TEXT,
  recipient_email TEXT NOT NULL,
  visitor_name TEXT NOT NULL,
  visitor_email TEXT NOT NULL,
  visitor_phone TEXT NOT NULL,
  requested_service TEXT NOT NULL,
  message TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS website_leads_retry_idx
  ON website_leads (notification_status, next_retry_at, received_at);

CREATE TABLE IF NOT EXISTS website_lead_rate_limits (
  bucket_key TEXT PRIMARY KEY,
  request_count INTEGER NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
