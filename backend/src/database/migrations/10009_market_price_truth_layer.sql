-- Phase 048 — Market Price Intelligence truth layer
-- Extends the existing price_intelligence table; does NOT create a duplicate price store.
-- Source-specific raw tables (mandi_prices, farmer_listings, orders/transactions) remain evidence sources.

ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS market_level VARCHAR(30);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS price_kind VARCHAR(30);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS observed_at TIMESTAMPTZ;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS source_authority VARCHAR(40);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(4,3);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS confidence_basis JSONB;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS source_record_id VARCHAR(200);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS source_published_at TIMESTAMPTZ;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS commodity VARCHAR(160);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS variety VARCHAR(160);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS grade VARCHAR(80);
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS eligible_for_benchmark BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS currency CHAR(3) NOT NULL DEFAULT 'INR';
ALTER TABLE price_intelligence ADD COLUMN IF NOT EXISTS geography JSONB;

CREATE UNIQUE INDEX IF NOT EXISTS uq_price_intelligence_source_record
  ON price_intelligence(source_type, source_name, source_record_id)
  WHERE source_record_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_price_truth_product_observed
  ON price_intelligence(product_id, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_truth_name_observed
  ON price_intelligence(product_name, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_truth_benchmark
  ON price_intelligence(eligible_for_benchmark, market_level, observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_price_truth_source
  ON price_intelligence(source_authority, source_type, observed_at DESC);

COMMENT ON COLUMN price_intelligence.market_level IS
  'Economic layer represented by the observation: farm_gate_ask, farm_gate_floor, realised_trade, mandi_wholesale, wholesale, retail, competitor_retail, prototype.';
COMMENT ON COLUMN price_intelligence.price_kind IS
  'Meaning of the number: min, modal, max, ask, floor, trade, listed, effective, retail, wholesale, prototype.';
COMMENT ON COLUMN price_intelligence.observed_at IS
  'When the price was actually observed/traded/published; do not substitute row creation time.';
COMMENT ON COLUMN price_intelligence.source_authority IS
  'Authority class such as official_government, first_party_transaction, first_party_listing, partner, manual_observation, prototype, estimated.';
COMMENT ON COLUMN price_intelligence.verification_status IS
  'Truth state such as OBSERVED_OFFICIAL, OBSERVED_FIRST_PARTY, PUBLISHED_OFFICIAL, DECLARED_FIRST_PARTY, PROTOTYPE_ONLY, ESTIMATED.';
COMMENT ON COLUMN price_intelligence.confidence_score IS
  'Deterministically derived 0..1 confidence from source authority, freshness, match quality, geography specificity and data completeness.';
COMMENT ON COLUMN price_intelligence.confidence_basis IS
  'Machine-readable factors used to derive confidence_score.';
COMMENT ON COLUMN price_intelligence.eligible_for_benchmark IS
  'TRUE only when the observation is sufficiently comparable, current and evidence-backed to participate in market benchmark calculations.';
COMMENT ON COLUMN price_intelligence.source_record_id IS
  'Idempotency/provenance identifier in the source system or source-specific raw table.';
COMMENT ON COLUMN price_intelligence.geography IS
  'Structured geography for the observation (country/state/district/market/coordinates where available).';

CREATE OR REPLACE VIEW v_market_price_truth AS
SELECT
  id, product_id, product_name, commodity, variety, grade,
  market_level, price_kind,
  currency, unit, price_per_kg_inr,
  listed_price, effective_price,
  source_type, source_name, source_authority,
  collection_method, source_url, source_record_id,
  source_location, geography,
  observed_at, source_published_at, created_at,
  verification_status, match_confidence,
  confidence_score, confidence_basis,
  eligible_for_benchmark,
  is_organic, is_gi_tagged, in_stock
FROM price_intelligence;
