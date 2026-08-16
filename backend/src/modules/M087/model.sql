-- Alert Management Schema (M087)
-- Business Intelligence & Analytics Module

CREATE TABLE IF NOT EXISTS alert_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    condition_type VARCHAR(50) NOT NULL,
    condition_config JSONB NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_notifications (
    notification_id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(50) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    notification_config JSONB NOT NULL,
    recipients TEXT[] NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    retry_policy JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_incidents (
    incident_id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(50) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    incident_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'open',
    triggered_value DECIMAL(15,2),
    threshold_value DECIMAL(15,2),
    context_data JSONB,
    description TEXT,
    detected_at TIMESTAMP NOT NULL,
    acknowledged_by VARCHAR(50),
    acknowledged_at TIMESTAMP,
    resolved_by VARCHAR(50),
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_history (
    history_id VARCHAR(50) PRIMARY KEY,
    incident_id VARCHAR(50) REFERENCES alert_incidents(incident_id) ON DELETE CASCADE,
    notification_id VARCHAR(50),
    action_type VARCHAR(50) NOT NULL,
    action_details JSONB,
    performed_by VARCHAR(50),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_escalations (
    escalation_id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(50) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    escalation_level INTEGER NOT NULL,
    escalation_config JSONB NOT NULL,
    wait_time_minutes INTEGER NOT NULL,
    auto_escalate BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_suppressions (
    suppression_id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(50) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    suppression_type VARCHAR(50) NOT NULL,
    suppression_config JSONB NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    reason TEXT,
    created_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_maintenance_windows (
    window_id VARCHAR(50) PRIMARY KEY,
    window_name VARCHAR(200) NOT NULL,
    window_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    affected_rules TEXT[] NOT NULL,
    description TEXT,
    created_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_statistics (
    stat_id VARCHAR(50) PRIMARY KEY,
    rule_id VARCHAR(50) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL,
    period_start TIMESTAMP NOT NULL,
    period_end TIMESTAMP NOT NULL,
    total_incidents INTEGER DEFAULT 0,
    acknowledged_incidents INTEGER DEFAULT 0,
    resolved_incidents INTEGER DEFAULT 0,
    mean_time_to_acknowledge DECIMAL(10,2),
    mean_time_to_resolve DECIMAL(10,2),
    false_positive_rate DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alert_rules_type ON alert_rules(rule_type);
CREATE INDEX idx_alert_rules_active ON alert_rules(is_active);
CREATE INDEX idx_alert_notifications_rule ON alert_notifications(rule_id);
CREATE INDEX idx_alert_incidents_rule ON alert_incidents(rule_id);
CREATE INDEX idx_alert_incidents_status ON alert_incidents(status);
CREATE INDEX idx_alert_incidents_detected ON alert_incidents(detected_at);
CREATE INDEX idx_alert_history_incident ON alert_history(incident_id);
CREATE INDEX idx_alert_escalations_rule ON alert_escalations(rule_id);
CREATE INDEX idx_alert_suppressions_rule ON alert_suppressions(rule_id);
CREATE INDEX idx_alert_suppressions_active ON alert_suppressions(status);
CREATE INDEX idx_alert_maintenance_windows_status ON alert_maintenance_windows(status);
CREATE INDEX idx_alert_statistics_rule ON alert_statistics(rule_id);
