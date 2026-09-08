-- Migration for Enhanced M021 Farmer Registration
-- Farmer Domain
-- Version: 3021
-- Date: 2026-08-11

-- Farmers Table (Enhanced)
CREATE TABLE IF NOT EXISTS farmers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  date_of_birth DATE,
  gender VARCHAR(20),
  address JSONB,
  land_size DECIMAL(10, 2),
  primary_crop VARCHAR(100),
  skills JSONB,
  education VARCHAR(100),
  farming_experience INTEGER, -- years
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Verifications Table
CREATE TABLE IF NOT EXISTS farmer_verifications (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE UNIQUE,
  documents JSONB,
  identity_proof JSONB,
  land_proof JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  approved_by UUID REFERENCES users(id),
  notes TEXT,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Farmer Onboarding Table
CREATE TABLE IF NOT EXISTS farmer_onboarding (
  id SERIAL PRIMARY KEY,
  farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE UNIQUE,
  checklist JSONB NOT NULL,
  current_step INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
--
-- 2026-09-08 (DB audit follow-up): `farmers` collides with the EARLIER,
-- incompatible `CREATE TABLE IF NOT EXISTS farmers` in 000_base_schema.sql
-- (id UUID, user_id/fpo_id/farmer_id/fdi_score/... - the FDI-scoring
-- shape). 000 sorts first and wins, so this file's own `CREATE TABLE
-- farmers` above is a silent no-op and the live table has NEITHER `email`
-- nor `primary_crop`. The two indexes below on those columns would throw
-- "column does not exist" on a real run and, per migrate.js's
-- archive-and-halt failure handling, would stop EVERY migration after
-- this one from ever executing - discovered statically (no Postgres
-- running in this environment) while fixing the M021 module-schema gap.
-- Removed here rather than fixed in place, because the real columns don't
-- exist yet at this point in migration order; both are re-added (via
-- ALTER TABLE, plus equivalent indexes idx_farmers_email_m021 /
-- idx_farmers_primary_crop_m021) later in
-- 9999_zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz_module_schema_gaps_batch1.sql,
-- which runs last by filename order. `idx_farmers_status` is unaffected -
-- `status` already exists on the real (000_base_schema.sql) table.
CREATE INDEX IF NOT EXISTS idx_farmers_status ON farmers(status);
CREATE INDEX IF NOT EXISTS idx_farmer_verifications_farmer_id ON farmer_verifications(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_verifications_status ON farmer_verifications(status);
CREATE INDEX IF NOT EXISTS idx_farmer_onboarding_farmer_id ON farmer_onboarding(farmer_id);

COMMENT ON TABLE farmers IS 'Farmer registration and profile data';
COMMENT ON TABLE farmer_verifications IS 'Farmer identity and land verification';
COMMENT ON TABLE farmer_onboarding IS 'Farmer onboarding workflow tracking';