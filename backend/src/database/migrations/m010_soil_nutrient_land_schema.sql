-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

-- Migration M010: Soil, Nutrient & Land Mapping Schema
-- System 10 - Soil, Nutrient & Land Mapping
-- Created: 2026-09-08
-- Description: Database schema for soil analysis, nutrient management, and land mapping

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SOIL SAMPLING TABLES
-- ============================================================================

-- Soil samples table
CREATE TABLE IF NOT EXISTS soil_samples (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id VARCHAR(100) UNIQUE NOT NULL,
  farmer_id UUID NOT NULL,
  farm_id UUID,
  location JSONB NOT NULL,
  state VARCHAR(100) NOT NULL,
  district VARCHAR(100) NOT NULL,
  sample_depth VARCHAR(50),
  sample_type VARCHAR(50) NOT NULL, -- surface, subsoil, composite
  crop_planned VARCHAR(100),
  irrigation_type VARCHAR(100),
  collection_date DATE NOT NULL,
  collector_name VARCHAR(255),
  lab_preference VARCHAR(255),
  ai_optimization JSONB,
  status VARCHAR(50) DEFAULT 'submitted', -- submitted, received, testing, analyzed, report_ready
  tracking_number VARCHAR(50),
  assigned_lab VARCHAR(255),
  estimated_completion_date DATE,
  analyzed_at TIMESTAMP,
  collected_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
-- soil_samples already exists from another migration, keyed on sample_id. This
-- file keys it on `id` and references soil_samples(id) below, which PostgreSQL
-- rejected with "there is no unique constraint matching given keys". A unique
-- index on id makes the foreign key implementable without dropping or re-keying
-- the existing table -- neither definition is disturbed.
--
-- Rows written under the other definition have a NULL id (the unique index
-- permits many NULLs) and cannot be referenced until they are backfilled. That
-- is a reconciliation still owed, not something this index papers over.
CREATE UNIQUE INDEX IF NOT EXISTS idx_soil_samples_id ON soil_samples (id);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS sample_id VARCHAR(100);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS farm_id UUID;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS location JSONB;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS sample_depth VARCHAR(50);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS sample_type VARCHAR(50);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS crop_planned VARCHAR(100);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS irrigation_type VARCHAR(100);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS collection_date DATE;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS collector_name VARCHAR(255);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS lab_preference VARCHAR(255);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS ai_optimization JSONB;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'submitted';
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS tracking_number VARCHAR(50);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS assigned_lab VARCHAR(255);
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS estimated_completion_date DATE;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMP;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS collected_by UUID;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE soil_samples ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- SOIL ANALYSIS TABLES
-- ============================================================================

-- Soil analysis table
CREATE TABLE IF NOT EXISTS soil_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sample_id UUID NOT NULL REFERENCES soil_samples(id) ON DELETE CASCADE,
  lab_results JSONB NOT NULL,
  nutrient_levels JSONB NOT NULL,
  ph_analysis JSONB NOT NULL,
  organic_matter JSONB NOT NULL,
  soil_texture JSONB NOT NULL,
  ai_recommendations JSONB,
  overall_health_score DECIMAL(3,2), -- 0.00 to 1.00
  confidence DECIMAL(3,2),
  analyzed_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS sample_id UUID;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS lab_results JSONB;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS nutrient_levels JSONB;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS ph_analysis JSONB;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS organic_matter JSONB;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS soil_texture JSONB;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS ai_recommendations JSONB;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS overall_health_score DECIMAL(3,2);
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS confidence DECIMAL(3,2);
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS analyzed_by UUID;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE soil_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- NUTRIENT MANAGEMENT TABLES
-- ============================================================================

-- Nutrient recommendations table
CREATE TABLE IF NOT EXISTS nutrient_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  analysis_id UUID NOT NULL REFERENCES soil_analysis(id) ON DELETE CASCADE,
  crop_type VARCHAR(100) NOT NULL,
  variety VARCHAR(100),
  expected_yield DECIMAL(15,2),
  fertilizer_plan JSONB NOT NULL,
  integrated_approach JSONB,
  sustainability_metrics JSONB,
  monitoring_schedule JSONB,
  ai_optimization JSONB,
  recommended_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS analysis_id UUID;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS variety VARCHAR(100);
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS expected_yield DECIMAL(15,2);
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS fertilizer_plan JSONB;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS integrated_approach JSONB;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS sustainability_metrics JSONB;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS monitoring_schedule JSONB;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS ai_optimization JSONB;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS recommended_by UUID;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE nutrient_recommendations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- LAND MAPPING TABLES
-- ============================================================================

-- Land mapping table
CREATE TABLE IF NOT EXISTS land_mapping (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL,
  farm_id UUID,
  survey_number VARCHAR(100),
  khasra_number VARCHAR(100),
  area_hectares DECIMAL(15,2),
  area_acres DECIMAL(15,2),
  soil_type VARCHAR(100),
  land_use VARCHAR(100), -- agricultural, residential, commercial, forest, waste
  irrigation_source VARCHAR(100),
  gis_boundary JSONB NOT NULL,
  ai_boundary_detection JSONB,
  satellite_imagery JSONB,
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, rejected
  verified_by UUID,
  verified_at TIMESTAMP,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS farm_id UUID;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS survey_number VARCHAR(100);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS khasra_number VARCHAR(100);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS area_hectares DECIMAL(15,2);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS area_acres DECIMAL(15,2);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS soil_type VARCHAR(100);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS land_use VARCHAR(100);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS irrigation_source VARCHAR(100);
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS gis_boundary JSONB;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS ai_boundary_detection JSONB;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS satellite_imagery JSONB;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS verified_by UUID;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE land_mapping ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- GIS boundaries table
CREATE TABLE IF NOT EXISTS gis_boundaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  boundary_type VARCHAR(100) NOT NULL, -- village, district, state, farm, plot
  boundary_name VARCHAR(255) NOT NULL,
  parent_boundary_id UUID REFERENCES gis_boundaries(id),
  geometry JSONB NOT NULL,
  properties JSONB,
  administrative_level VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS boundary_type VARCHAR(100);
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS boundary_name VARCHAR(255);
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS parent_boundary_id UUID;
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS geometry JSONB;
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS properties JSONB;
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS administrative_level VARCHAR(50);
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE gis_boundaries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- SOIL HEALTH TABLES
-- ============================================================================

-- Soil health cards table
CREATE TABLE IF NOT EXISTS soil_health_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  farmer_id UUID NOT NULL,
  farm_id UUID,
  overall_health_score DECIMAL(3,2), -- 0.00 to 1.00
  nutrient_status JSONB NOT NULL,
  ph_status JSONB NOT NULL,
  organic_matter_status JSONB NOT NULL,
  ai_insights JSONB,
  recommendations JSONB,
  valid_until DATE NOT NULL,
  generated_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS id UUID DEFAULT uuid_generate_v4();
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS farm_id UUID;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS overall_health_score DECIMAL(3,2);
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS nutrient_status JSONB;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS ph_status JSONB;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS organic_matter_status JSONB;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS ai_insights JSONB;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS recommendations JSONB;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS valid_until DATE;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS generated_by UUID;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE soil_health_cards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Soil sample indexes
CREATE INDEX IF NOT EXISTS idx_soil_samples_farmer ON soil_samples(farmer_id);
CREATE INDEX IF NOT EXISTS idx_soil_samples_status ON soil_samples(status);
CREATE INDEX IF NOT EXISTS idx_soil_samples_state ON soil_samples(state);
CREATE INDEX IF NOT EXISTS idx_soil_samples_district ON soil_samples(district);

-- Soil analysis indexes
CREATE INDEX IF NOT EXISTS idx_soil_analysis_sample ON soil_analysis(sample_id);
CREATE INDEX IF NOT EXISTS idx_soil_analysis_health_score ON soil_analysis(overall_health_score);

-- Nutrient recommendation indexes
CREATE INDEX IF NOT EXISTS idx_nutrient_recommendations_analysis ON nutrient_recommendations(analysis_id);
CREATE INDEX IF NOT EXISTS idx_nutrient_recommendations_crop ON nutrient_recommendations(crop_type);

-- Land mapping indexes
CREATE INDEX IF NOT EXISTS idx_land_mapping_farmer ON land_mapping(farmer_id);
CREATE INDEX IF NOT EXISTS idx_land_mapping_soil_type ON land_mapping(soil_type);
CREATE INDEX IF NOT EXISTS idx_land_mapping_verification ON land_mapping(verification_status);

-- GIS boundary indexes
CREATE INDEX IF NOT EXISTS idx_gis_boundaries_type ON gis_boundaries(boundary_type);
CREATE INDEX IF NOT EXISTS idx_gis_boundaries_parent ON gis_boundaries(parent_boundary_id);
CREATE INDEX IF NOT EXISTS idx_gis_boundaries_admin_level ON gis_boundaries(administrative_level);

-- Soil health card indexes
CREATE INDEX IF NOT EXISTS idx_soil_health_cards_farmer ON soil_health_cards(farmer_id);
CREATE INDEX IF NOT EXISTS idx_soil_health_cards_valid_until ON soil_health_cards(valid_until);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_soil_samples_updated_at BEFORE UPDATE ON soil_samples
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soil_analysis_updated_at BEFORE UPDATE ON soil_analysis
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrient_recommendations_updated_at BEFORE UPDATE ON nutrient_recommendations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_land_mapping_updated_at BEFORE UPDATE ON land_mapping
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_gis_boundaries_updated_at BEFORE UPDATE ON gis_boundaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_soil_health_cards_updated_at BEFORE UPDATE ON soil_health_cards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE soil_samples IS 'Soil sample collection and tracking';
COMMENT ON TABLE soil_analysis IS 'Soil test results and AI-powered analysis';
COMMENT ON TABLE nutrient_recommendations IS 'Fertilizer and nutrient management recommendations';
COMMENT ON TABLE land_mapping IS 'Land mapping with GIS integration';
COMMENT ON TABLE gis_boundaries IS 'GIS boundary definitions for administrative areas';
COMMENT ON TABLE soil_health_cards IS 'Soil health cards for farmers';