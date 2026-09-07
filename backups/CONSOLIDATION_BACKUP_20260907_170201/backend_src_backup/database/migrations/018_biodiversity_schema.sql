-- Biodiversity Intelligence Database Schema
-- CAP-217 to CAP-223: Species Database, Native Crops Database, Traditional Varieties Database,
-- Medicinal Plants Database, Wild Foods Database, Conservation Tracking, AI Risk Prediction

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

-- ============================================================================
-- SPECIES DATABASE (CAP-217)
-- ============================================================================

CREATE TABLE IF NOT EXISTS species_database (
    id SERIAL PRIMARY KEY,
    scientific_name VARCHAR(255) NOT NULL UNIQUE,
    common_name VARCHAR(255),
    family VARCHAR(100),
    genus VARCHAR(100),
    species VARCHAR(100),
    subspecies VARCHAR(100),
    local_names JSONB,
    taxonomy JSONB,
    distribution JSONB,
    habitat JSONB,
    conservation_status VARCHAR(50),
    population_trend VARCHAR(50),
    threats JSONB,
    ecological_role TEXT,
    economic_importance JSONB,
    cultural_significance TEXT,
    media_files JSONB,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_species_scientific ON species_database(scientific_name);
CREATE INDEX IF NOT EXISTS idx_species_family ON species_database(family);
CREATE INDEX IF NOT EXISTS idx_species_genus ON species_database(genus);
CREATE INDEX IF NOT EXISTS idx_species_conservation ON species_database(conservation_status);
CREATE INDEX IF NOT EXISTS idx_species_habitat ON species_database USING GIN(habitat);

-- ============================================================================
-- NATIVE CROPS DATABASE (CAP-218)
-- ============================================================================

CREATE TABLE IF NOT EXISTS native_crops_database (
    id SERIAL PRIMARY KEY,
    crop_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    indigenous_names JSONB,
    origin_region VARCHAR(255),
    growing_regions JSONB,
    climate_requirements JSONB,
    soil_requirements JSONB,
    growing_season VARCHAR(100),
    nutritional_profile JSONB,
    culinary_uses JSONB,
    cultural_significance TEXT,
    traditional_varieties JSONB,
    cultivation_practices JSONB,
    yield_data JSONB,
    pest_disease_profile JSONB,
    market_value JSONB,
    conservation_status VARCHAR(50),
    media_files JSONB,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_native_crops_name ON native_crops_database(crop_name);
CREATE INDEX IF NOT EXISTS idx_native_crops_region ON native_crops_database(origin_region);
CREATE INDEX IF NOT EXISTS idx_native_crops_growing ON native_crops_database USING GIN(growing_regions);
CREATE INDEX IF NOT EXISTS idx_native_crops_conservation ON native_crops_database(conservation_status);

-- ============================================================================
-- TRADITIONAL VARIETIES DATABASE (CAP-219)
-- ============================================================================

CREATE TABLE IF NOT EXISTS traditional_varieties_database (
    id SERIAL PRIMARY KEY,
    variety_name VARCHAR(255) NOT NULL,
    crop_id INTEGER,
    scientific_name VARCHAR(255),
    indigenous_names JSONB,
    origin_community VARCHAR(255),
    region VARCHAR(255),
    characteristics JSONB,
    adaptation_traits JSONB,
    genetic_markers JSONB,
    cultivation_history TEXT,
    seed_saving_practices TEXT,
    culinary_properties JSONB,
    nutritional_profile JSONB,
    resistance_profile JSONB,
    yield_characteristics JSONB,
    cultural_significance TEXT,
    conservation_status VARCHAR(50),
    seed_availability VARCHAR(50),
    media_files JSONB,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_traditional_varieties_name ON traditional_varieties_database(variety_name);
CREATE INDEX IF NOT EXISTS idx_traditional_varieties_crop ON traditional_varieties_database(crop_id);
CREATE INDEX IF NOT EXISTS idx_traditional_varieties_region ON traditional_varieties_database(region);
CREATE INDEX IF NOT EXISTS idx_traditional_varieties_conservation ON traditional_varieties_database(conservation_status);

-- ============================================================================
-- MEDICINAL PLANTS DATABASE (CAP-220)
-- ============================================================================

CREATE TABLE IF NOT EXISTS medicinal_plants_database (
    id SERIAL PRIMARY KEY,
    plant_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    family VARCHAR(100),
    common_names JSONB,
    indigenous_names JSONB,
    parts_used JSONB,
    active_compounds JSONB,
    traditional_uses JSONB,
    ailments_treated JSONB,
    preparation_methods JSONB,
    dosage_guidelines TEXT,
    contraindications TEXT,
    side_effects TEXT,
    scientific_validation JSONB,
    cultivation_requirements JSONB,
    conservation_status VARCHAR(50),
    habitat VARCHAR(255),
    distribution JSONB,
    harvest_practices TEXT,
    sustainability_status VARCHAR(50),
    media_files JSONB,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_medicinal_plants_name ON medicinal_plants_database(plant_name);
CREATE INDEX IF NOT EXISTS idx_medicinal_plants_scientific ON medicinal_plants_database(scientific_name);
CREATE INDEX IF NOT EXISTS idx_medicinal_plants_family ON medicinal_plants_database(family);
CREATE INDEX IF NOT EXISTS idx_medicinal_plants_ailments ON medicinal_plants_database USING GIN(ailments_treated);
CREATE INDEX IF NOT EXISTS idx_medicinal_plants_conservation ON medicinal_plants_database(conservation_status);

-- ============================================================================
-- WILD FOODS DATABASE (CAP-221)
-- ============================================================================

CREATE TABLE IF NOT EXISTS wild_foods_database (
    id SERIAL PRIMARY KEY,
    food_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    food_type VARCHAR(100),
    common_names JSONB,
    indigenous_names JSONB,
    seasonality JSONB,
    habitat VARCHAR(255),
    distribution JSONB,
    harvesting_practices TEXT,
    preparation_methods JSONB,
    nutritional_profile JSONB,
    culinary_uses JSONB,
    cultural_significance TEXT,
    safety_considerations TEXT,
    sustainability_status VARCHAR(50),
    abundance_level VARCHAR(50),
    traditional_management TEXT,
    conservation_status VARCHAR(50),
    media_files JSONB,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wild_foods_name ON wild_foods_database(food_name);
CREATE INDEX IF NOT EXISTS idx_wild_foods_type ON wild_foods_database(food_type);
CREATE INDEX IF NOT EXISTS idx_wild_foods_seasonal ON wild_foods_database USING GIN(seasonality);
CREATE INDEX IF NOT EXISTS idx_wild_foods_sustainability ON wild_foods_database(sustainability_status);

-- ============================================================================
-- CONSERVATION TRACKING (CAP-222)
-- ============================================================================

CREATE TABLE IF NOT EXISTS conservation_tracking (
    id SERIAL PRIMARY KEY,
    species_id INTEGER,
    species_type VARCHAR(100),
    conservation_status VARCHAR(50),
    population_data JSONB,
    threat_assessment JSONB,
    conservation_measures JSONB,
    protected_areas JSONB,
    breeding_programs TEXT,
    reintroduction_efforts TEXT,
    habitat_restoration TEXT,
    community_involvement JSONB,
    funding_sources JSONB,
    monitoring_methods JSONB,
    success_metrics JSONB,
    challenges JSONB,
    next_steps TEXT,
    reported_by INTEGER,
    verified_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_conservation_species ON conservation_tracking(species_id);
CREATE INDEX IF NOT EXISTS idx_conservation_type ON conservation_tracking(species_type);
CREATE INDEX IF NOT EXISTS idx_conservation_status ON conservation_tracking(conservation_status);

-- ============================================================================
-- BIODIVERSITY RISK PREDICTIONS (CAP-223)
-- ============================================================================

CREATE TABLE IF NOT EXISTS biodiversity_risk_predictions (
    id SERIAL PRIMARY KEY,
    species_id INTEGER,
    species_type VARCHAR(100),
    region VARCHAR(255),
    time_horizon VARCHAR(50),
    scenarios JSONB,
    prediction_result JSONB,
    confidence_score DECIMAL(5,2),
    model_version VARCHAR(50),
    requested_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_biodiversity_risk_species ON biodiversity_risk_predictions(species_id);
CREATE INDEX IF NOT EXISTS idx_biodiversity_risk_type ON biodiversity_risk_predictions(species_type);
CREATE INDEX IF NOT EXISTS idx_biodiversity_risk_region ON biodiversity_risk_predictions(region);
CREATE INDEX IF NOT EXISTS idx_biodiversity_risk_created ON biodiversity_risk_predictions(created_at DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_species_database_updated_at ON species_database;
CREATE TRIGGER update_species_database_updated_at BEFORE UPDATE ON species_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_native_crops_database_updated_at ON native_crops_database;
CREATE TRIGGER update_native_crops_database_updated_at BEFORE UPDATE ON native_crops_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_traditional_varieties_database_updated_at ON traditional_varieties_database;
CREATE TRIGGER update_traditional_varieties_database_updated_at BEFORE UPDATE ON traditional_varieties_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_medicinal_plants_database_updated_at ON medicinal_plants_database;
CREATE TRIGGER update_medicinal_plants_database_updated_at BEFORE UPDATE ON medicinal_plants_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_wild_foods_database_updated_at ON wild_foods_database;
CREATE TRIGGER update_wild_foods_database_updated_at BEFORE UPDATE ON wild_foods_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_conservation_tracking_updated_at ON conservation_tracking;
CREATE TRIGGER update_conservation_tracking_updated_at BEFORE UPDATE ON conservation_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
