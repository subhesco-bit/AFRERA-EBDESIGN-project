-- Real-time Monitoring Schema (M086)
-- Business Intelligence & Analytics Module

CREATE TABLE IF NOT EXISTS monitoring_sources (
    source_id VARCHAR(50) PRIMARY KEY,
    source_name VARCHAR(200) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    connection_config JSONB NOT NULL,
    refresh_interval INTEGER NOT NULL,
    data_format VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    last_connected TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    source_id VARCHAR(50) REFERENCES monitoring_sources(source_id) ON DELETE CASCADE,
    metric_name VARCHAR(200) NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    data_path VARCHAR(200),
    aggregation_method VARCHAR(50),
    unit VARCHAR(50),
    thresholds JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS real_time_data (
    data_id VARCHAR(50) PRIMARY KEY,
    metric_id VARCHAR(50) REFERENCES monitoring_metrics(metric_id) ON DELETE CASCADE,
    value DECIMAL(15,2) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    quality_score DECIMAL(5,2),
    metadata JSONB,
    ingested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_dashboards (
    dashboard_id VARCHAR(50) PRIMARY KEY,
    dashboard_name VARCHAR(200) NOT NULL,
    dashboard_type VARCHAR(50) NOT NULL,
    layout_config JSONB,
    refresh_interval INTEGER DEFAULT 30,
    is_public BOOLEAN DEFAULT FALSE,
    created_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dashboard_widgets (
    widget_id VARCHAR(50) PRIMARY KEY,
    dashboard_id VARCHAR(50) REFERENCES monitoring_dashboards(dashboard_id) ON DELETE CASCADE,
    metric_id VARCHAR(50) REFERENCES monitoring_metrics(metric_id) ON DELETE CASCADE,
    widget_type VARCHAR(50) NOT NULL,
    widget_config JSONB,
    position_x INTEGER NOT NULL,
    position_y INTEGER NOT NULL,
    width INTEGER NOT NULL,
    height INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    metric_id VARCHAR(50) REFERENCES monitoring_metrics(metric_id) ON DELETE CASCADE,
    alert_name VARCHAR(200) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(15,2) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    notification_channels TEXT[],
    recipients TEXT[],
    cooldown_period INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMP,
    trigger_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_history (
    history_id VARCHAR(50) PRIMARY KEY,
    alert_id VARCHAR(50) REFERENCES monitoring_alerts(alert_id) ON DELETE CASCADE,
    metric_id VARCHAR(50),
    triggered_value DECIMAL(15,2),
    threshold_value DECIMAL(15,2),
    message TEXT,
    status VARCHAR(20) DEFAULT 'triggered',
    acknowledged_by VARCHAR(50),
    acknowledged_at TIMESTAMP,
    resolved_at TIMESTAMP,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS monitoring_events (
    event_id VARCHAR(50) PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50),
    entity_type VARCHAR(50),
    event_data JSONB,
    severity VARCHAR(20),
    source VARCHAR(50),
    timestamp TIMESTAMP NOT NULL,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_monitoring_metrics_source ON monitoring_metrics(source_id);
CREATE INDEX idx_real_time_data_metric ON real_time_data(metric_id);
CREATE INDEX idx_real_time_data_timestamp ON real_time_data(timestamp);
CREATE INDEX idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX idx_dashboard_widgets_metric ON dashboard_widgets(metric_id);
CREATE INDEX idx_monitoring_alerts_metric ON monitoring_alerts(metric_id);
CREATE INDEX idx_monitoring_alerts_active ON monitoring_alerts(is_active);
CREATE INDEX idx_alert_history_alert ON alert_history(alert_id);
CREATE INDEX idx_alert_history_timestamp ON alert_history(triggered_at);
CREATE INDEX idx_monitoring_events_entity ON monitoring_events(entity_id, entity_type);
CREATE INDEX idx_monitoring_events_timestamp ON monitoring_events(timestamp);
