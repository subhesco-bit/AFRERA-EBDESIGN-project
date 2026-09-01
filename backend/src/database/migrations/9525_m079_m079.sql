-- Folded from backend/src/modules/M079/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Watershed Management Schema (M079) / -- Comprehensive watershed planning, ecosystem management, and conservation
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS watershed_plans (
    plan_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) UNIQUE NOT NULL,
    watershed_name VARCHAR(200) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    area_hectares DECIMAL(15,2) NOT NULL,
    ecosystem_type VARCHAR(50) NOT NULL,
    population_served INTEGER,
    primary_water_sources JSONB,
    degradation_level VARCHAR(20),
    conservation_priorities JSONB,
    funding_available DECIMAL(15,2),
    timeline_years INTEGER,
    status VARCHAR(20) DEFAULT 'draft',
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ecological_assessments (
    assessment_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) REFERENCES watershed_plans(watershed_id),
    assessment_date DATE NOT NULL,
    vegetation_cover_percentage DECIMAL(5,2),
    wildlife_habitat_score DECIMAL(5,2),
    water_retention_capacity DECIMAL(5,2),
    soil_stability_score DECIMAL(5,2),
    biodiversity_index DECIMAL(5,2),
    ecosystem_health_score DECIMAL(5,2),
    assessment_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hydrological_data (
    data_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) REFERENCES watershed_plans(watershed_id),
    record_date DATE NOT NULL,
    groundwater_level DECIMAL(10,2),
    surface_water_availability DECIMAL(15,2),
    rainfall_mm DECIMAL(10,2),
    flow_regime VARCHAR(50),
    water_quality_index DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS land_use_patterns (
    pattern_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) REFERENCES watershed_plans(watershed_id),
    land_use_type VARCHAR(50) NOT NULL,
    area_hectares DECIMAL(15,2) NOT NULL,
    percentage_total DECIMAL(5,2),
    vegetation_density VARCHAR(20),
    soil_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS biodiversity_inventory (
    inventory_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) REFERENCES watershed_plans(watershed_id),
    species_name VARCHAR(200) NOT NULL,
    species_type VARCHAR(50) NOT NULL,
    population_estimate INTEGER,
    conservation_status VARCHAR(50),
    habitat_requirements JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conservation_implementations (
    implementation_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) REFERENCES watershed_plans(watershed_id),
    measure_type VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    area_hectares DECIMAL(15,2),
    budget_allocation DECIMAL(15,2),
    implementation_date DATE,
    expected_outcomes JSONB,
    monitoring_schedule JSONB,
    status VARCHAR(20) DEFAULT 'initiated',
    ai_planning JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watershed_health_monitoring (
    monitoring_id VARCHAR(50) PRIMARY KEY,
    watershed_id VARCHAR(50) REFERENCES watershed_plans(watershed_id),
    monitoring_date DATE NOT NULL,
    ecological_health_score DECIMAL(5,2),
    hydrological_health_score DECIMAL(5,2),
    biodiversity_health_score DECIMAL(5,2),
    water_quality_index DECIMAL(5,2),
    soil_health_score DECIMAL(5,2),
    threats_identified JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_watershed_plans_id ON watershed_plans(watershed_id);

CREATE INDEX IF NOT EXISTS idx_watershed_plans_location ON watershed_plans(state, district);

CREATE INDEX IF NOT EXISTS idx_ecological_assessments_watershed ON ecological_assessments(watershed_id);

CREATE INDEX IF NOT EXISTS idx_hydrological_data_watershed ON hydrological_data(watershed_id);

CREATE INDEX IF NOT EXISTS idx_land_use_patterns_watershed ON land_use_patterns(watershed_id);

CREATE INDEX IF NOT EXISTS idx_biodiversity_inventory_watershed ON biodiversity_inventory(watershed_id);

CREATE INDEX IF NOT EXISTS idx_conservation_implementations_watershed ON conservation_implementations(watershed_id);

CREATE INDEX IF NOT EXISTS idx_watershed_health_watershed ON watershed_health_monitoring(watershed_id);
