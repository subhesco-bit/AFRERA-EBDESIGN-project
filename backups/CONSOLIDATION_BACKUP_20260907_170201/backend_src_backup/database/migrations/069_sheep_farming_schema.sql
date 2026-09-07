-- ============================================================================
-- 069_sheep_farming_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- M125 - Sheep Farming Management (Livestock domain) is listed as "BUILT" in the
-- gap analysis, but only has an auto-generated placeholder schema
-- (3000_M125_generated.sql) with a generic JSONB table. This migration adds
-- proper domain-specific tables for sheep flock management, wool production,
-- and breeding tracking.
--
-- DOMAIN-SPECIFIC LOGIC
-- Sheep farming differs from other livestock in several key ways:
-- - Individual animal tracking (sheep are individually tagged)
-- - Wool production tracking (shearing cycles, fleece weight, wool quality)
-- - Meat production (lamb for market, mutton for processing)
-- - Breeding cycles (seasonal breeding, lambing periods)
-- - Grazing management (pasture rotation, flock movement)
-- ============================================================================

CREATE TABLE IF NOT EXISTS sheep_flock (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id VARCHAR(50) NOT NULL UNIQUE,
  breed VARCHAR(100),
  dob DATE,
  sex VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'breeding', 'lactating', 'dry', 'market_ready', 'sold', 'culled', 'dead')),
  weight_kg NUMERIC(5,2),
  wool_type VARCHAR(50),
  pasture_id VARCHAR(50),
  notes TEXT,
  last_vaccination_date DATE,
  last_breeding_date DATE,
  last_lambing_date DATE,
  last_shearing_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sheep_flock_status ON sheep_flock(status);
CREATE INDEX IF NOT EXISTS idx_sheep_flock_sex ON sheep_flock(sex);

CREATE TABLE IF NOT EXISTS sheep_wool_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES sheep_flock(id) ON DELETE CASCADE,
  shearing_date DATE NOT NULL,
  fleece_weight_kg NUMERIC(5,2) NOT NULL CHECK (fleece_weight_kg >= 0),
  wool_grade VARCHAR(50),
  fiber_micron NUMERIC(4,2),
  staple_length_mm NUMERIC(5,2),
  yield_pct NUMERIC(4,2) CHECK (yield_pct >= 0 AND yield_pct <= 100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, shearing_date)
);

CREATE INDEX IF NOT EXISTS idx_sheep_wool_animal_date ON sheep_wool_production(animal_id, shearing_date);

CREATE TABLE IF NOT EXISTS sheep_feed_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES sheep_flock(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  feed_type VARCHAR(50) NOT NULL,
  quantity_kg NUMERIC(6,2) NOT NULL CHECK (quantity_kg >= 0),
  cost_per_kg NUMERIC(8,2) CHECK (cost_per_kg >= 0),
  grazing_hours NUMERIC(4,2) CHECK (grazing_hours >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, record_date, feed_type)
);

CREATE INDEX IF NOT EXISTS idx_sheep_feed_animal_date ON sheep_feed_consumption(animal_id, record_date);

CREATE TABLE IF NOT EXISTS sheep_breeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  female_id UUID NOT NULL REFERENCES sheep_flock(id) ON DELETE CASCADE,
  male_id UUID REFERENCES sheep_flock(id) ON DELETE SET NULL,
  breeding_date DATE NOT NULL,
  expected_lambing_date DATE,
  actual_lambing_date DATE,
  lambs_count INTEGER CHECK (lambs_count >= 0),
  lambs_survived INTEGER CHECK (lambs_survived >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sheep_breeding_female ON sheep_breeding_records(female_id);
CREATE INDEX IF NOT EXISTS idx_sheep_breeding_dates ON sheep_breeding_records(breeding_date, expected_lambing_date);

CREATE TABLE IF NOT EXISTS sheep_vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES sheep_flock(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(100) NOT NULL,
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  administered_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sheep_vaccination_animal ON sheep_vaccination_records(animal_id);
