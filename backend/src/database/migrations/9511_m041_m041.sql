-- Folded from backend/src/modules/M041/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Village Registry Schema (M041) / -- Comprehensive village and community management
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS village_resources (
    resource_id VARCHAR(50) PRIMARY KEY,
    village_id VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50),
    resource_name VARCHAR(200),
    capacity DECIMAL(15,2),
    current_utilization DECIMAL(5,2),
    condition VARCHAR(20),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    responsible_person VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_village_resources_village ON village_resources(village_id);

CREATE INDEX IF NOT EXISTS idx_village_resources_type ON village_resources(resource_type);
