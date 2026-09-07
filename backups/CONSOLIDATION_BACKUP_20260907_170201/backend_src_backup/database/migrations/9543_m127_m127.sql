-- Folded from backend/src/modules/M127/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Animal Health Management Schema (M127) / -- Comprehensive health monitoring, disease management, and veterinary services
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS animal_health_records (
    health_record_id VARCHAR(50) PRIMARY KEY,
    animal_id VARCHAR(50) NOT NULL,
    animal_type VARCHAR(50) NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    health_status VARCHAR(50) NOT NULL,
    symptoms JSONB,
    diagnosis TEXT,
    treatment JSONB,
    veterinarian_id VARCHAR(50),
    location VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vaccination_schedules (
    vaccination_id VARCHAR(50) PRIMARY KEY,
    animal_id VARCHAR(50) NOT NULL,
    animal_type VARCHAR(50) NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    vaccine_type VARCHAR(50) NOT NULL,
    vaccine_name VARCHAR(200) NOT NULL,
    scheduled_date DATE NOT NULL,
    administered_date DATE,
    veterinarian_id VARCHAR(50),
    location VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    ai_optimization JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_disease_patterns (
    pattern_id SERIAL PRIMARY KEY,
    animal_type VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_requirements JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS animal_registry (
    animal_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    animal_type VARCHAR(50) NOT NULL,
    breed VARCHAR(100),
    age INTEGER,
    location VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS herd_health_monitoring (
    monitoring_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    animal_type VARCHAR(50) NOT NULL,
    overall_health_score DECIMAL(5,2),
    disease_outbreaks JSONB,
    vaccination_coverage DECIMAL(5,2),
    treatment_compliance DECIMAL(5,2),
    recommendations JSONB,
    monitored_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_animal_health_records_animal ON animal_health_records(animal_id);

CREATE INDEX IF NOT EXISTS idx_animal_health_records_farmer ON animal_health_records(farmer_id);

CREATE INDEX IF NOT EXISTS idx_vaccination_schedules_animal ON vaccination_schedules(animal_id);

CREATE INDEX IF NOT EXISTS idx_vaccination_schedules_date ON vaccination_schedules(scheduled_date);

CREATE INDEX IF NOT EXISTS idx_regional_disease_patterns_location ON regional_disease_patterns(state, district);

CREATE INDEX IF NOT EXISTS idx_animal_registry_farmer ON animal_registry(farmer_id);

CREATE INDEX IF NOT EXISTS idx_herd_health_monitoring_farmer ON herd_health_monitoring(farmer_id);
