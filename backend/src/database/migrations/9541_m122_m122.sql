-- Folded from backend/src/modules/M122/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Cattle Registry Schema (M122) / -- Comprehensive livestock management and cattle registry system
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS cattle_health_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50),
    health_status VARCHAR(50) NOT NULL,
    weight DECIMAL(10,2),
    body_condition_score DECIMAL(3,1),
    vaccination_records JSONB,
    treatment_history JSONB,
    reproductive_status VARCHAR(50),
    milk_production JSONB,
    feed_intake JSONB,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cattle_breed_characteristics (
    breed_id SERIAL PRIMARY KEY,
    breed_name VARCHAR(100) UNIQUE NOT NULL,
    origin VARCHAR(100),
    purpose VARCHAR(50),
    ideal_weight_range JSONB,
    ideal_body_condition DECIMAL(3,1),
    common_health_issues JSONB,
    nutritional_requirements JSONB,
    temperament VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_cattle_health_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_schedule JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cattle_performance_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50),
    period VARCHAR(20) NOT NULL,
    weight_gain DECIMAL(10,2),
    feed_efficiency DECIMAL(5,2),
    health_metrics JSONB,
    reproductive_performance JSONB,
    milk_production_metrics JSONB,
    recommendations JSONB,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_cattle_health_records_registry ON cattle_health_records(registry_id);

CREATE INDEX IF NOT EXISTS idx_cattle_performance_registry ON cattle_performance_tracking(registry_id);

CREATE INDEX IF NOT EXISTS idx_regional_health_location ON regional_cattle_health_patterns(state, district);
