-- Additive: existing customer lead rows and notification states are preserved.
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS investment_interest text;
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS budget_range text;
ALTER TABLE website_leads ADD COLUMN IF NOT EXISTS property_type text;
