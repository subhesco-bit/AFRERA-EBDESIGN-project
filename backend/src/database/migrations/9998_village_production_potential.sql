-- 9998_village_production_potential.sql
-- Production intensity, per-acre yield and village growth potential.
-- Adds land/capacity-aware measurements without changing the canonical Village model.

BEGIN;

ALTER TABLE village_production_records
  ADD COLUMN IF NOT EXISTS production_area_acres NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS yield_per_acre NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS production_capacity_units NUMERIC(18,4),
  ADD COLUMN IF NOT EXISTS capacity_unit VARCHAR(30),
  ADD COLUMN IF NOT EXISTS potential_production_quantity NUMERIC(18,3),
  ADD COLUMN IF NOT EXISTS potential_production_source VARCHAR(60),
  ADD COLUMN IF NOT EXISTS potential_production_confidence NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS metadata_potential JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD CONSTRAINT village_production_area_nonnegative CHECK (production_area_acres IS NULL OR production_area_acres >= 0),
  ADD CONSTRAINT village_production_yield_nonnegative CHECK (yield_per_acre IS NULL OR yield_per_acre >= 0),
  ADD CONSTRAINT village_production_capacity_nonnegative CHECK (production_capacity_units IS NULL OR production_capacity_units >= 0),
  ADD CONSTRAINT village_production_potential_nonnegative CHECK (potential_production_quantity IS NULL OR potential_production_quantity >= 0),
  ADD CONSTRAINT village_production_confidence_range CHECK (potential_production_confidence IS NULL OR potential_production_confidence BETWEEN 0 AND 100);

CREATE INDEX IF NOT EXISTS idx_village_production_area
  ON village_production_records(village_id, commodity_id, production_area_acres);

CREATE TABLE IF NOT EXISTS village_production_benchmarks (
  id BIGSERIAL PRIMARY KEY,
  commodity_id BIGINT NOT NULL REFERENCES village_production_commodities(id) ON DELETE CASCADE,
  state VARCHAR(100),
  district VARCHAR(150),
  block VARCHAR(150),
  production_system VARCHAR(80),
  season VARCHAR(60),
  benchmark_yield_per_acre NUMERIC(18,4),
  benchmark_unit VARCHAR(30) NOT NULL DEFAULT 'kg',
  benchmark_capacity_units NUMERIC(18,4),
  capacity_unit VARCHAR(30),
  source_name VARCHAR(255),
  source_reference TEXT,
  verified_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (benchmark_yield_per_acre IS NULL OR benchmark_yield_per_acre >= 0),
  CHECK (benchmark_capacity_units IS NULL OR benchmark_capacity_units >= 0)
);

CREATE INDEX IF NOT EXISTS idx_village_production_benchmarks_lookup
  ON village_production_benchmarks(commodity_id, state, district, block, season, active);

CREATE TABLE IF NOT EXISTS village_commodity_potential_profiles (
  village_id INTEGER NOT NULL REFERENCES villages(id) ON DELETE CASCADE,
  commodity_id BIGINT NOT NULL REFERENCES village_production_commodities(id) ON DELETE CASCADE,
  potential_area_acres NUMERIC(18,4),
  benchmark_yield_per_acre NUMERIC(18,4),
  benchmark_unit VARCHAR(30),
  potential_production_quantity NUMERIC(18,3),
  current_production_quantity NUMERIC(18,3) NOT NULL DEFAULT 0,
  production_gap_quantity NUMERIC(18,3),
  production_utilization_pct NUMERIC(7,2),
  potential_marketable_quantity NUMERIC(18,3),
  current_marketable_quantity NUMERIC(18,3),
  potential_market_value NUMERIC(18,2),
  current_market_value NUMERIC(18,2),
  opportunity_score NUMERIC(7,2),
  calculation_source VARCHAR(80) NOT NULL DEFAULT 'benchmark',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  PRIMARY KEY (village_id, commodity_id),
  CHECK (potential_area_acres IS NULL OR potential_area_acres >= 0),
  CHECK (benchmark_yield_per_acre IS NULL OR benchmark_yield_per_acre >= 0),
  CHECK (potential_production_quantity IS NULL OR potential_production_quantity >= 0),
  CHECK (current_production_quantity >= 0),
  CHECK (production_gap_quantity IS NULL OR production_gap_quantity >= 0),
  CHECK (production_utilization_pct IS NULL OR production_utilization_pct BETWEEN 0 AND 100),
  CHECK (potential_marketable_quantity IS NULL OR potential_marketable_quantity >= 0),
  CHECK (current_marketable_quantity IS NULL OR current_marketable_quantity >= 0),
  CHECK (opportunity_score IS NULL OR opportunity_score BETWEEN 0 AND 100)
);

CREATE INDEX IF NOT EXISTS idx_village_commodity_potential_opportunity
  ON village_commodity_potential_profiles(village_id, opportunity_score DESC);

CREATE OR REPLACE VIEW village_production_potential AS
SELECT
  v.id AS village_id,
  v.name AS village_name,
  v.state,
  v.district,
  v.block,
  c.id AS commodity_id,
  c.commodity_code,
  c.commodity_name,
  c.category,
  c.default_unit,
  COALESCE(SUM(p.quantity), 0) AS current_production_quantity,
  COALESCE(SUM(p.production_area_acres), 0) AS reported_production_area_acres,
  CASE WHEN COALESCE(SUM(p.production_area_acres), 0) > 0
    THEN ROUND((SUM(p.quantity) / NULLIF(SUM(p.production_area_acres),0))::numeric, 4)
    ELSE NULL END AS current_yield_per_acre,
  COALESCE(pp.potential_area_acres, 0) AS potential_area_acres,
  pp.benchmark_yield_per_acre,
  pp.benchmark_unit,
  pp.potential_production_quantity,
  pp.production_gap_quantity,
  pp.production_utilization_pct,
  pp.potential_marketable_quantity,
  pp.current_marketable_quantity,
  pp.potential_market_value,
  pp.current_market_value,
  pp.opportunity_score,
  pp.calculation_source,
  pp.calculated_at
FROM villages v
JOIN village_production_records p ON p.village_id = v.id
JOIN village_production_commodities c ON c.id = p.commodity_id
LEFT JOIN village_commodity_potential_profiles pp
  ON pp.village_id = v.id AND pp.commodity_id = c.id
GROUP BY v.id, v.name, v.state, v.district, v.block,
         c.id, c.commodity_code, c.commodity_name, c.category, c.default_unit,
         pp.potential_area_acres, pp.benchmark_yield_per_acre, pp.benchmark_unit,
         pp.potential_production_quantity, pp.production_gap_quantity,
         pp.production_utilization_pct, pp.potential_marketable_quantity,
         pp.current_marketable_quantity, pp.potential_market_value,
         pp.current_market_value, pp.opportunity_score, pp.calculation_source,
         pp.calculated_at;

COMMIT;
