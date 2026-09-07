-- Folded from backend/src/modules/M103/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Equipment Inventory Schema (M103) / -- Comprehensive equipment inventory management, tracking, and optimization
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS equipment_status_history (
    history_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    condition VARCHAR(20),
    location VARCHAR(200),
    notes TEXT,
    ai_analysis JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_usage_logs (
    usage_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    operator_id VARCHAR(50),
    field_id VARCHAR(50),
    usage_notes TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_maintenance_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50),
    maintenance_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    service_center VARCHAR(200),
    cost DECIMAL(10,2),
    parts_replaced JSONB,
    next_service_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_equipment_status_registry ON equipment_status_history(registry_id);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_registry ON equipment_usage_logs(registry_id);

CREATE INDEX IF NOT EXISTS idx_equipment_usage_dates ON equipment_usage_logs(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_registry ON equipment_maintenance_records(registry_id);

CREATE INDEX IF NOT EXISTS idx_equipment_maintenance_date ON equipment_maintenance_records(service_date);
