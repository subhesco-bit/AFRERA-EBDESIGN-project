-- Platform Core Schema (M001)
-- Core platform infrastructure, initialization, and system-wide operations

CREATE TABLE IF NOT EXISTS platform_configurations (
    config_id VARCHAR(50) PRIMARY KEY,
    platform_name VARCHAR(200) NOT NULL,
    version VARCHAR(20) NOT NULL,
    environment VARCHAR(50) NOT NULL,
    deployment_type VARCHAR(50) NOT NULL,
    database_config JSONB NOT NULL,
    cache_config JSONB NOT NULL,
    security_config JSONB NOT NULL,
    feature_flags JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

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
    config_id VARCHAR(50) REFERENCES platform_configurations(config_id),
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

CREATE INDEX idx_platform_configurations_status ON platform_configurations(status);
CREATE INDEX idx_platform_health_logs_timestamp ON platform_health_logs(timestamp);
CREATE INDEX idx_platform_metrics_time_range ON platform_metrics(time_range);
CREATE INDEX idx_configuration_updates_config ON configuration_updates(config_id);
CREATE INDEX idx_platform_alerts_status ON platform_alerts(status);
CREATE INDEX idx_platform_alerts_component ON platform_alerts(component);
CREATE INDEX idx_feature_flags_enabled ON feature_flags(enabled);
