-- Folded from backend/src/modules/M002/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Platform Configuration Schema (M002) / -- Dynamic configuration management, feature flags, and settings
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS configuration_history (
    history_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    changed_by VARCHAR(50),
    change_reason TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuration_templates (
    template_id VARCHAR(50) PRIMARY KEY,
    template_name VARCHAR(200) UNIQUE NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    configurations JSONB NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environment_configs (
    env_config_id VARCHAR(50) PRIMARY KEY,
    environment VARCHAR(50) UNIQUE NOT NULL,
    config_overrides JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_configuration_history_config ON configuration_history(config_id);

CREATE INDEX IF NOT EXISTS idx_environment_configs_env ON environment_configs(environment);
