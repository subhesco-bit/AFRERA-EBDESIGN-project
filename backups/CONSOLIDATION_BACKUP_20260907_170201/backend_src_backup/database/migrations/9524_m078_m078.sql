-- Folded from backend/src/modules/M078/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Rainwater Harvesting Schema (M078) / -- Rainwater collection, storage management, and distribution systems
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS distribution_points (
    point_id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50),
    point_type VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    connection_type VARCHAR(50),
    capacity DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_distribution_points_system ON distribution_points(system_id);
