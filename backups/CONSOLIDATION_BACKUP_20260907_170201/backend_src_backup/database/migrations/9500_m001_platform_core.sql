-- Folded from backend/src/modules/M001/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Platform Core Schema (M001) / -- Core platform infrastructure, initialization, and system-wide operations
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS platform_health_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP NOT NULL,
    overall_status VARCHAR(20) NOT NULL,
    database_status JSONB NOT NULL,
    cache_status JSONB NOT NULL,
    api_gateway_status JSONB NOT NULL,
    message_queue_status JSONB NOT NULL,
    file_storage_status JSONB NOT NULL,
    metrics JSONB NOT NULL,
    alerts JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    time_range VARCHAR(50) NOT NULL,
    metric_types JSONB NOT NULL,
    granularity VARCHAR(20) NOT NULL,
    performance_metrics JSONB NOT NULL,
    resource_metrics JSONB NOT NULL,
    business_metrics JSONB NOT NULL,
    user_metrics JSONB NOT NULL,
    system_metrics JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS configuration_updates (
    update_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50),
    updates JSONB NOT NULL,
    rollback_config JSONB NOT NULL,
    validation_result JSONB NOT NULL,
    impact_analysis JSONB,
    updated_by VARCHAR(50),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS platform_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    component VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    details JSONB,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS feature_flags (
    flag_id VARCHAR(50) PRIMARY KEY,
    flag_name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    enabled BOOLEAN DEFAULT false,
    percentage_rollout INTEGER DEFAULT 0,
    target_segments JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_health_logs_timestamp ON platform_health_logs(timestamp);

CREATE INDEX IF NOT EXISTS idx_platform_metrics_time_range ON platform_metrics(time_range);

CREATE INDEX IF NOT EXISTS idx_configuration_updates_config ON configuration_updates(config_id);

CREATE INDEX IF NOT EXISTS idx_platform_alerts_status ON platform_alerts(status);

CREATE INDEX IF NOT EXISTS idx_platform_alerts_component ON platform_alerts(component);

CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(enabled);
