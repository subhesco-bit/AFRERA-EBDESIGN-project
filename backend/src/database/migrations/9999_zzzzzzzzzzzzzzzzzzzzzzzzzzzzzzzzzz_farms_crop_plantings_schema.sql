-- Farms + per-farmer crop plantings.
--
-- Closes the "crops (per-farmer planting model)" and "digital_twins (duplicate
-- service)" entries in schema-decisions.json. Neither a `farms` table nor a
-- per-farmer planted-crop-instance table has ever existed in this codebase;
-- backend/src/services/digitalTwinService.js's verifyFarm()/getFarmRealTimeData()/
-- verifyCrop()/getCropRealTimeData() were written against both, and have been
-- broken since they were written (see schema-decisions.json for the full trail).
--
-- Scope: this migration + the accompanying digitalTwinService.js rewrite covers
-- ONLY the digital-twin consumer. advancedAnalyticsService.js's and
-- predictiveIntelligenceService.js's crop-related queries reference a SECOND,
-- separate imagined shape (crop_type/variety/quality_grade/growing_period_days/
-- climate_requirements directly on `crops`, a `harvests` table, and
-- order_items.crop_id where the real column is order_items.product_id) that is
-- not resolved here - reconciling how orders/order_items relate to crops vs
-- products is a distinct, unverified design question, deliberately left
-- deferred rather than guessed. See schema-decisions.json.

-- 2026-09-08: `farms` collides with an EARLIER, incompatible `CREATE TABLE
-- IF NOT EXISTS farms` in 001_skeleton_complete_schema.sql (which runs first
-- in filename order). Since 001's version wins, this file's own CREATE was a
-- silent no-op leaving the live table without name/area/current_status/
-- location - every query in aiAgenticCompanionService.generateFarmInsights()
-- against those columns would fail. Switched to ALTER ... ADD COLUMN IF NOT
-- EXISTS against whichever `farms` actually exists, same conservative
-- collision policy used elsewhere in this migration set (see FIXES.md).
CREATE TABLE IF NOT EXISTS farms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS area DECIMAL(10,2); -- hectares
ALTER TABLE farms ADD COLUMN IF NOT EXISTS soil_type VARCHAR(50);
ALTER TABLE farms ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS current_status VARCHAR(50) DEFAULT 'active';
CREATE INDEX IF NOT EXISTS idx_farms_farmer ON farms(farmer_id);

-- 2026-09-08: same collision class on `crops` - 001_skeleton_complete_schema.sql
-- ALSO declares `CREATE TABLE IF NOT EXISTS crops` with `id SERIAL` (integer),
-- and (like farms above) 001 runs first and wins over 041_rural_life_os_schema.sql's
-- later, incompatible `id UUID` version. crop_id below was declared UUID to
-- match 041's crops - matching the wrong, non-live table definition. A UUID
-- column referencing crops(id) INTEGER is a type mismatch Postgres rejects
-- outright, which would have failed this table's creation (and, per
-- migrate.js's failure handling, halted every migration after this one on
-- the very first real run). Fixed to INTEGER to match the crops table that
-- actually exists.
CREATE TABLE IF NOT EXISTS crop_plantings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  farmer_id UUID NOT NULL REFERENCES farmers(id),
  crop_id INTEGER NOT NULL REFERENCES crops(id), -- the static catalog (001, not 041 - see note above)
  -- 2026-08-31: variety_id was declared UUID, but regional_variety_directory.id
  -- (9999_zzz_regional_variety_directory_schema.sql) is SERIAL/INTEGER - "foreign
  -- key constraint cannot be implemented" against a real database. Fixed to match.
  variety_id INTEGER REFERENCES regional_variety_directory(id),
  planting_date DATE,
  expected_harvest_date DATE,
  growth_stage VARCHAR(50) DEFAULT 'planted', -- 'planted'|'germination'|'vegetative'|'flowering'|'maturity'|'harvested'
  current_health VARCHAR(50), -- 'good'|'stressed'|'diseased'|'unknown' - honest text, not a fabricated score
  expected_yield_kg DECIMAL(10,2),
  actual_yield_kg DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active', -- 'active'|'harvested'|'failed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crop_plantings_farm ON crop_plantings(farm_id);
CREATE INDEX IF NOT EXISTS idx_crop_plantings_farmer ON crop_plantings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_plantings_status ON crop_plantings(status);
