-- Folded from backend/src/modules/M076/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Water Budgeting Schema (M076) / -- Comprehensive water resource management and budgeting
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS water_usage_records (
    record_id VARCHAR(50) PRIMARY KEY,
    budget_id VARCHAR(50),
    location_id VARCHAR(50) NOT NULL,
    usage_date DATE NOT NULL,
    usage_amount DECIMAL(15,2) NOT NULL,
    usage_type VARCHAR(50) NOT NULL,
    efficiency_metric DECIMAL(5,2),
    period VARCHAR(20) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_usage_history (
    history_id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    date DATE NOT NULL,
    usage_amount DECIMAL(15,2) NOT NULL,
    source_type VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS crop_patterns (
    pattern_id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    crop_type VARCHAR(100) NOT NULL,
    area DECIMAL(15,2) NOT NULL,
    water_requirement DECIMAL(15,2) NOT NULL,
    season VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS groundwater_levels (
    level_id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    level DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    well_id VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_water_usage_records_budget ON water_usage_records(budget_id);

CREATE INDEX IF NOT EXISTS idx_water_usage_records_date ON water_usage_records(usage_date);

CREATE INDEX IF NOT EXISTS idx_water_usage_history_location ON water_usage_history(location_id);

CREATE INDEX IF NOT EXISTS idx_crop_patterns_location ON crop_patterns(location_id);

CREATE INDEX IF NOT EXISTS idx_groundwater_levels_location ON groundwater_levels(location_id);
