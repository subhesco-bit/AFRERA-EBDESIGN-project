-- ============================================================================
-- 067_poultry_management_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- M123 - Poultry Management (Livestock domain) is listed as "BUILT" in the
-- gap analysis, but only has an auto-generated placeholder schema
-- (3000_M123_generated.sql) with a generic JSONB table. This migration adds
-- proper domain-specific tables for poultry flock management, egg production,
-- and feed consumption tracking.
--
-- DOMAIN-SPECIFIC LOGIC
-- Poultry management differs from dairy in several key ways:
-- - Flock-based management (birds are managed in groups, not individually tagged)
-- - Egg production tracking (daily egg count by flock, not milk yield per animal)
-- - Feed conversion ratio (FCR) calculation (feed input vs egg output)
-- - Mortality tracking (daily mortality rate per flock)
-- - Vaccination schedules differ (more frequent, different diseases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS poultry_flocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_code VARCHAR(50) NOT NULL UNIQUE,
  flock_type VARCHAR(30) NOT NULL CHECK (flock_type IN ('broiler', 'layer', 'duck', 'quail', 'turkey')),
  breed VARCHAR(100),
  placement_date DATE NOT NULL,
  initial_bird_count INTEGER NOT NULL CHECK (initial_bird_count > 0),
  current_bird_count INTEGER NOT NULL CHECK (current_bird_count >= 0),
  house_id VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'sold', 'culled', 'closed')),
  notes TEXT,
  last_vaccination_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_poultry_flocks_status ON poultry_flocks(status);
CREATE INDEX IF NOT EXISTS idx_poultry_flocks_type ON poultry_flocks(flock_type);

CREATE TABLE IF NOT EXISTS poultry_egg_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_id UUID NOT NULL REFERENCES poultry_flocks(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  total_eggs INTEGER NOT NULL CHECK (total_eggs >= 0),
  good_eggs INTEGER NOT NULL CHECK (good_eggs >= 0),
  damaged_eggs INTEGER NOT NULL CHECK (damaged_eggs >= 0),
  average_weight_grams NUMERIC(5,2),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (flock_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_poultry_eggs_flock_date ON poultry_egg_production(flock_id, record_date);

CREATE TABLE IF NOT EXISTS poultry_feed_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_id UUID NOT NULL REFERENCES poultry_flocks(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  feed_type VARCHAR(50) NOT NULL,
  quantity_kg NUMERIC(8,2) NOT NULL CHECK (quantity_kg >= 0),
  cost_per_kg NUMERIC(8,2) CHECK (cost_per_kg >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (flock_id, record_date, feed_type)
);

CREATE INDEX IF NOT EXISTS idx_poultry_feed_flock_date ON poultry_feed_consumption(flock_id, record_date);

CREATE TABLE IF NOT EXISTS poultry_mortality (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_id UUID NOT NULL REFERENCES poultry_flocks(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  bird_count INTEGER NOT NULL CHECK (bird_count > 0),
  cause VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (flock_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_poultry_mortality_flock_date ON poultry_mortality(flock_id, record_date);

CREATE TABLE IF NOT EXISTS poultry_vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flock_id UUID NOT NULL REFERENCES poultry_flocks(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(100) NOT NULL,
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  administered_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_poultry_vaccination_flock ON poultry_vaccination_records(flock_id);
