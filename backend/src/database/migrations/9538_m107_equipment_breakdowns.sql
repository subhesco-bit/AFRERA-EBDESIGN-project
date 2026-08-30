-- Folded from backend/src/modules/M107/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Breakdown Maintenance Schema (M107) / -- Equipment breakdown management, emergency repairs, and downtime tracking
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS downtime_logs (
    downtime_id VARCHAR(50) PRIMARY KEY,
    breakdown_id VARCHAR(50),
    equipment_id VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_hours DECIMAL(10,2),
    cost_impact DECIMAL(12,2),
    affected_operations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_parts_inventory (
    part_id VARCHAR(50) PRIMARY KEY,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(50),
    category VARCHAR(50),
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_downtime_logs_equipment ON downtime_logs(equipment_id);

CREATE INDEX IF NOT EXISTS idx_downtime_logs_dates ON downtime_logs(start_time, end_time);

CREATE INDEX IF NOT EXISTS idx_repair_parts_category ON repair_parts_inventory(category);
