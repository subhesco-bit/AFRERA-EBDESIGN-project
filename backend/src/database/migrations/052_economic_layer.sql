-- ============================================================================
-- 052_economic_layer.sql   (was 999_economic_layer.sql — renumbered 2026-08-05)
--
-- Economic Layer MVP: village profiles, regional demand, cost break-ups,
-- revenue contracts.
--
-- TWO PROBLEMS FIXED IN THE RENUMBER
--
-- 1. NUMBERING. This file was 999_economic_layer.sql, sharing the 999_ prefix
--    with 999_schema_reconciliation.sql. Ordering between two files with the
--    same number depends on the alphabetical tiebreak in whatever lists the
--    directory — it happened to be correct (e before s) but nothing enforced
--    it, and reconciliation MUST run last. The 990–999 band is reserved for
--    cross-cutting passes; a feature migration belongs in the numbered
--    sequence, so this is now 052.
--
-- 2. A SILENT COLLISION. `demand_forecasts` is already declared in
--    015_advanced_features.sql (ML output: forecast_data JSONB, accuracy,
--    model_version) and again in 030_institutional_procurement_schema.sql
--    (institutional menu planning). 015 runs first and wins, so the CREATE
--    below never took effect and region_id, forecast_date, forecast_qty and
--    confidence were never created. The migration reported success.
--
--    Caught by tools/schema-collisions.js, which fails CI on exactly this.
--
--    Resolution: 015 stays authoritative — it is the richest of the three and
--    other code already reads it. This file's columns are additive scalars
--    (a single quantity for a region on a date, rather than a JSONB blob), so
--    they are added by ALTER instead of being lost. Recorded in
--    backend/src/database/schema-decisions.json.
-- ============================================================================

CREATE TABLE IF NOT EXISTS village_profiles (
  village_id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  district TEXT,
  population INTEGER,
  avg_income NUMERIC,
  assets JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Kept for documentation of intent; a no-op because 015 already holds the name.
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  region_id INTEGER,
  forecast_date DATE NOT NULL,
  forecast_qty NUMERIC,
  confidence NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- The four columns the CREATE above could never create.
--
-- NOT NULL is not re-applied to forecast_date: the table already holds rows
-- written against 015's shape, and adding a NOT NULL column without a default
-- to a populated table fails outright.
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS region_id INTEGER;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS forecast_date DATE;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS forecast_qty NUMERIC;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS confidence NUMERIC;

COMMENT ON COLUMN demand_forecasts.forecast_qty IS
  'Scalar regional quantity forecast (052_economic_layer). Distinct from '
  'forecast_data JSONB, which carries 015''s richer ML model output.';
COMMENT ON COLUMN demand_forecasts.confidence IS
  'Confidence for the scalar regional forecast. Note 015 also carries '
  '"accuracy" — accuracy is measured after the fact, confidence is claimed '
  'before it. They are not the same number and must not be averaged together.';

CREATE TABLE IF NOT EXISTS cost_breakups (
  id SERIAL PRIMARY KEY,
  product_id INTEGER,
  region_id INTEGER,
  period_start DATE,
  period_end DATE,
  components JSONB,
  total_cost NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- A period that ends before it starts silently poisons every aggregate that
  -- filters on it, and nothing else in this file would catch it.
  CONSTRAINT cost_breakup_period_valid CHECK (
    period_start IS NULL OR period_end IS NULL OR period_end >= period_start
  )
);

CREATE TABLE IF NOT EXISTS revenue_contracts (
  contract_id SERIAL PRIMARY KEY,
  buyer_id INTEGER,
  seller_group_id INTEGER,
  product_set JSONB,
  qty_committed NUMERIC,
  price_per_unit NUMERIC,
  start_date DATE,
  end_date DATE,
  escrow_account JSONB,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),

  -- A revenue contract with a negative quantity or price is not a contract,
  -- it is a data-entry accident that would flow straight into revenue totals.
  CONSTRAINT revenue_contract_qty_sane CHECK (qty_committed IS NULL OR qty_committed >= 0),
  CONSTRAINT revenue_contract_price_sane CHECK (price_per_unit IS NULL OR price_per_unit >= 0),
  CONSTRAINT revenue_contract_dates_valid CHECK (
    start_date IS NULL OR end_date IS NULL OR end_date >= start_date
  ),
  CONSTRAINT revenue_contract_status_known CHECK (
    status IN ('draft','offered','accepted','active','completed','cancelled','disputed')
  )
);

CREATE INDEX IF NOT EXISTS idx_village_profiles_region ON village_profiles (state, district);
CREATE INDEX IF NOT EXISTS idx_cost_breakups_product ON cost_breakups (product_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_revenue_contracts_buyer ON revenue_contracts (buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_revenue_contracts_active ON revenue_contracts (end_date)
  WHERE status IN ('accepted','active');
