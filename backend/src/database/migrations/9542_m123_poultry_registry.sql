-- Folded from backend/src/modules/M123/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Poultry Management Schema (M123) / -- Comprehensive poultry farming, health monitoring, and production management
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS poultry_registry (
    flock_registry_id VARCHAR(50) PRIMARY KEY,
    flock_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    bird_type VARCHAR(50) NOT NULL,
    bird_count INTEGER NOT NULL,
    age_weeks INTEGER NOT NULL,
    housing_type VARCHAR(50),
    location VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    feed_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'registered',
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poultry_health_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES poultry_registry(flock_registry_id),
    health_status VARCHAR(50) NOT NULL,
    mortality_rate DECIMAL(5,2),
    feed_consumption JSONB,
    water_consumption JSONB,
    vaccination_records JSONB,
    treatment_history JSONB,
    egg_production JSONB,
    weight_gains JSONB,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poultry_breed_characteristics (
    breed_id SERIAL PRIMARY KEY,
    breed_name VARCHAR(100) UNIQUE NOT NULL,
    origin VARCHAR(100),
    purpose VARCHAR(50),
    ideal_temperature DECIMAL(5,2),
    humidity_range VARCHAR(20),
    space_per_bird VARCHAR(20),
    lifespan_weeks INTEGER,
    nutritional_requirements JSONB,
    common_diseases JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_poultry_health_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_requirements JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS poultry_performance_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES poultry_registry(flock_registry_id),
    period VARCHAR(20) NOT NULL,
    egg_production_metrics JSONB,
    feed_efficiency DECIMAL(5,2),
    health_metrics JSONB,
    mortality_analysis JSONB,
    weight_gains JSONB,
    recommendations JSONB,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_poultry_registry_farmer ON poultry_registry(farmer_id);

CREATE INDEX IF NOT EXISTS idx_poultry_registry_breed ON poultry_registry(breed);

CREATE INDEX IF NOT EXISTS idx_poultry_registry_location ON poultry_registry(state, district);

CREATE INDEX IF NOT EXISTS idx_poultry_health_records_registry ON poultry_health_records(registry_id);

CREATE INDEX IF NOT EXISTS idx_poultry_performance_registry ON poultry_performance_tracking(registry_id);

CREATE INDEX IF NOT EXISTS idx_regional_poultry_health_location ON regional_poultry_health_patterns(state, district);
