-- Folded from backend/src/modules/M005/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Environment Management Schema (M005) / -- Environment configuration, staging, and deployment management
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS environment_variables (
    var_id VARCHAR(50) PRIMARY KEY,
    env_id VARCHAR(50),
    var_name VARCHAR(200) NOT NULL,
    var_value TEXT NOT NULL,
    var_type VARCHAR(50) NOT NULL,
    encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deployment_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    env_id VARCHAR(50),
    deployment_type VARCHAR(50) NOT NULL,
    version VARCHAR(50),
    status VARCHAR(20) NOT NULL,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    logs TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    env_id VARCHAR(50),
    metric_type VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_environment_variables_env ON environment_variables(env_id);

CREATE INDEX IF NOT EXISTS idx_deployment_logs_env ON deployment_logs(env_id);

CREATE INDEX IF NOT EXISTS idx_environment_metrics_env ON environment_metrics(env_id);
