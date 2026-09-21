BEGIN;
ALTER TABLE product_listings ALTER COLUMN id SET DEFAULT gen_random_uuid()::text;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS market_reach TEXT NOT NULL DEFAULT 'india' CHECK (market_reach IN ('india','local'));
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS cold_chain_required BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS shelf_life_hours INTEGER CHECK (shelf_life_hours IS NULL OR shelf_life_hours > 0);
CREATE INDEX IF NOT EXISTS idx_product_listings_national_origin ON product_listings(state_id,listing_status) WHERE market_reach='india';
COMMIT;
