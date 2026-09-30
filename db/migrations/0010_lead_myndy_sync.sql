ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS myndy_sync_status text;
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS myndy_sync_attempts integer NOT NULL DEFAULT 0;
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS myndy_synced_at timestamptz;
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS myndy_last_error text;
