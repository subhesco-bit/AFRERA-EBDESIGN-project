-- ============================================================================
-- 053_village_profile_operational_reconciliation.sql
--
-- Reconciles the existing authoritative village_profiles table (052) with
-- villageProfileService.js. No second village master is introduced.
--
-- 052 created the canonical table with: village_id, name, state, district,
-- population, avg_income, assets, created_at. The application service expects
-- additional operational/economic fields. Add those fields here so existing
-- deployments can migrate safely without replacing the authoritative table.
-- ============================================================================

ALTER TABLE village_profiles
  ADD COLUMN IF NOT EXISTS village_name TEXT,
  ADD COLUMN IF NOT EXISTS block TEXT,
  ADD COLUMN IF NOT EXISTS households INTEGER,
  ADD COLUMN IF NOT EXISTS main_crops TEXT,
  ADD COLUMN IF NOT EXISTS soil_type TEXT,
  ADD COLUMN IF NOT EXISTS irrigation_coverage NUMERIC,
  ADD COLUMN IF NOT EXISTS avg_income_per_household NUMERIC,
  ADD COLUMN IF NOT EXISTS literacy_rate NUMERIC,
  ADD COLUMN IF NOT EXISTS electrified_households INTEGER,
  ADD COLUMN IF NOT EXISTS road_access BOOLEAN,
  ADD COLUMN IF NOT EXISTS market_distance_km NUMERIC,
  ADD COLUMN IF NOT EXISTS financial_institutions_count INTEGER,
  ADD COLUMN IF NOT EXISTS schools_count INTEGER,
  ADD COLUMN IF NOT EXISTS health_centers_count INTEGER,
  ADD COLUMN IF NOT EXISTS cooperative_societies_count INTEGER,
  ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Preserve the original 052 canonical name while exposing the application
-- contract under village_name. Existing rows are backfilled, not duplicated.
UPDATE village_profiles
SET village_name = name
WHERE village_name IS NULL;

UPDATE village_profiles
SET avg_income_per_household = avg_income
WHERE avg_income_per_household IS NULL
  AND avg_income IS NOT NULL;

ALTER TABLE village_profiles
  ADD CONSTRAINT village_profiles_population_sane
    CHECK (population IS NULL OR population >= 0),
  ADD CONSTRAINT village_profiles_households_sane
    CHECK (households IS NULL OR households >= 0),
  ADD CONSTRAINT village_profiles_irrigation_sane
    CHECK (irrigation_coverage IS NULL OR (irrigation_coverage >= 0 AND irrigation_coverage <= 100)),
  ADD CONSTRAINT village_profiles_literacy_sane
    CHECK (literacy_rate IS NULL OR (literacy_rate >= 0 AND literacy_rate <= 100)),
  ADD CONSTRAINT village_profiles_electrified_sane
    CHECK (electrified_households IS NULL OR electrified_households >= 0),
  ADD CONSTRAINT village_profiles_market_distance_sane
    CHECK (market_distance_km IS NULL OR market_distance_km >= 0),
  ADD CONSTRAINT village_profiles_financial_institutions_sane
    CHECK (financial_institutions_count IS NULL OR financial_institutions_count >= 0),
  ADD CONSTRAINT village_profiles_schools_sane
    CHECK (schools_count IS NULL OR schools_count >= 0),
  ADD CONSTRAINT village_profiles_health_centers_sane
    CHECK (health_centers_count IS NULL OR health_centers_count >= 0),
  ADD CONSTRAINT village_profiles_cooperatives_sane
    CHECK (cooperative_societies_count IS NULL OR cooperative_societies_count >= 0);

CREATE INDEX IF NOT EXISTS idx_village_profiles_block
  ON village_profiles (state, district, block);

CREATE INDEX IF NOT EXISTS idx_village_profiles_name
  ON village_profiles (village_name);

CREATE INDEX IF NOT EXISTS idx_village_profiles_last_updated
  ON village_profiles (last_updated DESC);

COMMENT ON TABLE village_profiles IS
  'Authoritative village master/profile record. Operational village modules must reference this table; do not create a duplicate village master.';
