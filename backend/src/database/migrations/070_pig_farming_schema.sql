-- ============================================================================
-- 070_pig_farming_schema.sql   (2026-08-10)
--
-- WHY THIS EXISTS
-- M126 - Pig Farming Management (Livestock domain) is listed as "BUILT" in the
-- gap analysis, but only has an auto-generated placeholder schema
-- (3000_M126_generated.sql) with a generic JSONB table. This migration adds
-- proper domain-specific tables for pig herd management, weight tracking,
-- and breeding tracking.
--
-- DOMAIN-SPECIFIC LOGIC
-- Pig farming differs from other livestock in several key ways:
-- - Individual animal tracking (pigs are individually tagged)
-- - Weight tracking is critical (pigs are sold by weight)
-- - Feed conversion ratio (FCR) is a key metric (feed input vs weight gain)
-- - Breeding cycles (sows have multiple litters per year)
-- - Health monitoring (pigs are susceptible to specific diseases)
-- ============================================================================

CREATE TABLE IF NOT EXISTS pig_herd (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tag_id VARCHAR(50) NOT NULL UNIQUE,
  breed VARCHAR(100),
  dob DATE,
  sex VARCHAR(10) NOT NULL CHECK (sex IN ('male', 'female')),
  status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'breeding', 'lactating', 'fattening', 'market_ready', 'sold', 'culled', 'dead')),
  weight_kg NUMERIC(6,2),
  pen_id VARCHAR(50),
  notes TEXT,
  last_vaccination_date DATE,
  last_breeding_date DATE,
  last_farrowing_date DATE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pig_herd_status ON pig_herd(status);
CREATE INDEX IF NOT EXISTS idx_pig_herd_sex ON pig_herd(sex);

CREATE TABLE IF NOT EXISTS pig_weight_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES pig_herd(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  weight_kg NUMERIC(6,2) NOT NULL CHECK (weight_kg >= 0),
  body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 5),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, record_date)
);

CREATE INDEX IF NOT EXISTS idx_pig_weight_animal_date ON pig_weight_records(animal_id, record_date);

CREATE TABLE IF NOT EXISTS pig_feed_consumption (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES pig_herd(id) ON DELETE CASCADE,
  record_date DATE NOT NULL,
  feed_type VARCHAR(50) NOT NULL,
  quantity_kg NUMERIC(6,2) NOT NULL CHECK (quantity_kg >= 0),
  cost_per_kg NUMERIC(8,2) CHECK (cost_per_kg >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (animal_id, record_date, feed_type)
);

CREATE INDEX IF NOT EXISTS idx_pig_feed_animal_date ON pig_feed_consumption(animal_id, record_date);

CREATE TABLE IF NOT EXISTS pig_breeding_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id UUID NOT NULL REFERENCES pig_herd(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES pig_herd(id) ON DELETE SET NULL,
  breeding_date DATE NOT NULL,
  expected_farrowing_date DATE,
  actual_farrowing_date DATE,
  piglets_born INTEGER CHECK (piglets_born >= 0),
  piglets_weaned INTEGER CHECK (piglets_weaned >= 0),
  piglets_survived INTEGER CHECK (piglets_survived >= 0),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pig_breeding_sow ON pig_breeding_records(sow_id);
CREATE INDEX IF NOT EXISTS idx_pig_breeding_dates ON pig_breeding_records(breeding_date, expected_farrowing_date);

CREATE TABLE IF NOT EXISTS pig_vaccination_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  animal_id UUID NOT NULL REFERENCES pig_herd(id) ON DELETE CASCADE,
  vaccine_name VARCHAR(100) NOT NULL,
  vaccination_date DATE NOT NULL,
  next_due_date DATE,
  administered_by VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_pig_vaccination_animal ON pig_vaccination_records(animal_id);
