-- Folded from backend/src/modules/M101/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Tractor Management Schema (M101) / -- Comprehensive tractor fleet management, maintenance tracking, and operational monitoring
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS tractor_registry (
    tractor_registry_id VARCHAR(50) PRIMARY KEY,
    tractor_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    make VARCHAR(100) NOT NULL,
    model VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    engine_number VARCHAR(50),
    chassis_number VARCHAR(50),
    registration_number VARCHAR(50),
    hp INTEGER NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    purchase_date DATE,
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    insurance_expiry DATE,
    status VARCHAR(20) DEFAULT 'active',
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tractor_maintenance_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES tractor_registry(tractor_registry_id),
    maintenance_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    odometer_reading INTEGER,
    work_hours INTEGER,
    parts_replaced JSONB,
    labor_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2),
    service_center VARCHAR(200),
    next_service_date DATE,
    notes TEXT,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tractor_performance_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES tractor_registry(tractor_registry_id),
    period VARCHAR(20) NOT NULL,
    fuel_efficiency JSONB NOT NULL,
    work_hours JSONB NOT NULL,
    field_coverage JSONB NOT NULL,
    operational_cost JSONB NOT NULL,
    maintenance_frequency JSONB NOT NULL,
    recommendations JSONB,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tractor_usage_logs (
    usage_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES tractor_registry(tractor_registry_id),
    operation_type VARCHAR(50) NOT NULL,
    field_id VARCHAR(50),
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    fuel_consumed DECIMAL(10,2),
    implement_used VARCHAR(100),
    operator_id VARCHAR(50),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tractor_insurance_records (
    insurance_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES tractor_registry(tractor_registry_id),
    policy_number VARCHAR(50) NOT NULL,
    insurance_provider VARCHAR(100) NOT NULL,
    policy_type VARCHAR(50) NOT NULL,
    coverage_amount DECIMAL(12,2),
    premium_amount DECIMAL(10,2),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tractor_registry_farmer ON tractor_registry(farmer_id);

CREATE INDEX IF NOT EXISTS idx_tractor_registry_status ON tractor_registry(status);

CREATE INDEX IF NOT EXISTS idx_tractor_registry_state ON tractor_registry(state);

CREATE INDEX IF NOT EXISTS idx_tractor_maintenance_registry ON tractor_maintenance_records(registry_id);

CREATE INDEX IF NOT EXISTS idx_tractor_maintenance_date ON tractor_maintenance_records(service_date);

CREATE INDEX IF NOT EXISTS idx_tractor_performance_registry ON tractor_performance_logs(registry_id);

CREATE INDEX IF NOT EXISTS idx_tractor_usage_registry ON tractor_usage_logs(registry_id);

CREATE INDEX IF NOT EXISTS idx_tractor_usage_dates ON tractor_usage_logs(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_tractor_insurance_registry ON tractor_insurance_records(registry_id);

CREATE INDEX IF NOT EXISTS idx_tractor_insurance_expiry ON tractor_insurance_records(expiry_date);
