-- ============================================================================
-- 068_goat_farming_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- M124 - Goat Farming Management (Livestock domain) is listed as "BUILT" in the
-- gap analysis, but only has an auto-generated placeholder schema
-- (3000_M124_generated.sql) with a generic JSONB table. This migration adds
-- proper domain-specific tables for goat herd management, milk production,
-- and breeding tracking.
--
-- DOMAIN-SPECIFIC LOGIC
-- Goat farming differs from dairy cattle in several key ways:
-- - Individual animal tracking (goats are individually tagged, like dairy cattle)
-- - Milk production is lower per animal but higher fat content
-- - Breeding cycles are shorter (goats reach maturity faster)
-- - Multiple kidding (birth) events per year possible
-- - Feed requirements differ (browsers vs grazers)
-- ============================================================================

CREATE TABLE IF NOT EXISTS goat_herd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id VARCHAR(50) NOT NULL UNIQUE,
  breed VARCHAR(100),
  dob DATE,
  sex VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'milking', 'dry', 'pregnant', 'sold', 'culled', 'dead')),
  weight_kg NUMERIC(5,2),
  house_id VARCHAR(50),
  notes TEXT,
  last_vaccination_date DATE,
  last_breeding_date DATE,
  last_kidding_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goat_herd_status ON goat_herd(status);
CREATE INDEX IF NOT EXISTS idx_goat_herd_sex ON goat_herd(sex);

CREATE TABLE IF NOT EXISTS goat_milk_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES goat_herd(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  session VARCHAR(10) NOT NULL DEFAULT 'morning' CHECK (session IN ('morning', 'evening')),
  quantity_liters NUMERIC(5,2) NOT NULL CHECK (quantity_liters >= 0),
  fat_content_pct NUMERIC(4,2) CHECK (fat_content_pct >= 0 AND fat_content_pct <= 100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, record_date, session)
);

CREATE INDEX IF NOT EXISTS idx_goat_milk_animal_date ON goat_milk_production(animal_id, record_date);

CREATE TABLE IF NOT EXISTS goat_feed_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES goat_herd(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  feed_type VARCHAR(50) NOT NULL,
  quantity_kg NUMERIC(6,2) NOT NULL CHECK (quantity_kg >= 0),
  cost_per_kg NUMERIC(8,2) CHECK (cost_per_kg >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, record_date, feed_type)
);

CREATE INDEX IF NOT EXISTS idx_goat_feed_animal_date ON goat_feed_consumption(animal_id, record_date);

CREATE TABLE IF NOT EXISTS goat_breeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  female_id UUID NOT NULL REFERENCES goat_herd(id) ON DELETE CASCADE,
  male_id UUID REFERENCES goat_herd(id) ON DELETE SET NULL,
  breeding_date DATE NOT NULL,
  expected_kidding_date DATE,
  actual_kidding_date DATE,
  kids_count INTEGER CHECK (kids_count >= 0),
  kids_survived INTEGER CHECK (kids_survived >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goat_breeding_female ON goat_breeding_records(female_id);
CREATE INDEX IF NOT EXISTS idx_goat_breeding_dates ON goat_breeding_records(breeding_date, expected_kidding_date);

CREATE TABLE IF NOT EXISTS goat_vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES goat_herd(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(100) NOT NULL,
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  administered_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_goat_vaccination_animal ON goat_vaccination_records(animal_id);
