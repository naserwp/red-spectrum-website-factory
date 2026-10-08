-- Additive Multi Trans sidecars; existing customer tables and delivery behavior are unchanged.
CREATE TABLE IF NOT EXISTS website_lead_mtg_details (
  lead_id uuid PRIMARY KEY REFERENCES website_leads(lead_id),
  customer_slug text NOT NULL CHECK (customer_slug = 'multi-trans-global-logistics'),
  delivery_mode text NOT NULL CHECK (delivery_mode IN ('test','live')),
  idempotency_key uuid NOT NULL,
  payload_hash text NOT NULL,
  request_source text NOT NULL CHECK (request_source IN ('quote','contact')),
  details jsonb NOT NULL,
  consent_version text NOT NULL,
  consent_at timestamptz NOT NULL,
  sync_consent boolean NOT NULL DEFAULT false,
  UNIQUE (customer_slug, delivery_mode, idempotency_key)
);
CREATE TABLE IF NOT EXISTS website_lead_mtg_deliveries (
  id uuid PRIMARY KEY,
  lead_id uuid NOT NULL REFERENCES website_lead_mtg_details(lead_id),
  customer_slug text NOT NULL CHECK (customer_slug = 'multi-trans-global-logistics'),
  kind text NOT NULL CHECK (kind IN ('test_email','customer_email','internal_email','myndy_contact')),
  target text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending','sending','accepted','retryable','failed','uncertain','not_configured','not_requested')),
  attempt_count integer NOT NULL DEFAULT 0,
  next_retry_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  provider_receipt text,
  error_code text,
  UNIQUE (lead_id, kind)
);
CREATE INDEX IF NOT EXISTS website_lead_mtg_retry_idx ON website_lead_mtg_deliveries (state,next_retry_at);

ALTER TABLE website_lead_mtg_deliveries ADD COLUMN IF NOT EXISTS readback_verified_at timestamptz;
