-- Schema recovery for M087 (backend/src/modules/M087/service.js), "Alert
-- Management" - a generic BI/ops alerting system (rule -> incident ->
-- escalation/suppression/notification), not domain-specific to any crop or
-- animal. index.js mislabeled the module "Pest Forecasting"; nothing in the
-- service is pest-specific (rule_type/condition_type are generic threshold/
-- anomaly/pattern/composite), so the label was corrected there instead of
-- forcing a pest-specific rebuild the code doesn't describe.
--
-- All 8 tables below are queried by real, working INSERT/SELECT/UPDATE
-- statements in service.js but were never created by any prior migration -
-- same "relation does not exist" class of bug as the M010/M078/M104/M107/
-- M012 recovery migrations. Columns taken directly from those queries.
--
-- alert_incidents.is_false_positive is new here, added alongside a service.js
-- fix: calculateFalsePositiveRate() previously returned a hardcoded 0.05
-- regardless of any real data. It now computes a real rate from incidents
-- resolved with wasFalsePositive set, or null when nothing has been
-- resolved yet - see service.js.

CREATE TABLE IF NOT EXISTS alert_rules (
    rule_id VARCHAR(64) PRIMARY KEY,
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50),
    data_source VARCHAR(100),
    metric_name VARCHAR(100),
    condition_type VARCHAR(50),
    condition_config JSONB DEFAULT '{}',
    severity VARCHAR(20),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alert_rules_type ON alert_rules(rule_type);

CREATE TABLE IF NOT EXISTS alert_notifications (
    notification_id VARCHAR(64) PRIMARY KEY,
    rule_id VARCHAR(64) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    notification_type VARCHAR(50),
    notification_config JSONB DEFAULT '{}',
    recipients TEXT[],
    priority VARCHAR(20) DEFAULT 'normal',
    retry_policy JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alert_notifications_rule ON alert_notifications(rule_id);

CREATE TABLE IF NOT EXISTS alert_incidents (
    incident_id VARCHAR(64) PRIMARY KEY,
    rule_id VARCHAR(64) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    incident_type VARCHAR(50),
    severity VARCHAR(20),
    status VARCHAR(20) DEFAULT 'open',
    triggered_value DOUBLE PRECISION,
    threshold_value DOUBLE PRECISION,
    context_data JSONB DEFAULT '{}',
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by VARCHAR(64),
    acknowledged_at TIMESTAMP,
    resolved_by VARCHAR(64),
    resolved_at TIMESTAMP,
    is_false_positive BOOLEAN
);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_rule ON alert_incidents(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_status ON alert_incidents(status);
CREATE INDEX IF NOT EXISTS idx_alert_incidents_detected ON alert_incidents(detected_at);

CREATE TABLE IF NOT EXISTS alert_escalations (
    escalation_id VARCHAR(64) PRIMARY KEY,
    rule_id VARCHAR(64) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    escalation_level INTEGER,
    escalation_config JSONB DEFAULT '{}',
    wait_time_minutes INTEGER,
    auto_escalate BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alert_escalations_rule ON alert_escalations(rule_id);

CREATE TABLE IF NOT EXISTS alert_suppressions (
    suppression_id VARCHAR(64) PRIMARY KEY,
    rule_id VARCHAR(64) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    suppression_type VARCHAR(50),
    suppression_config JSONB DEFAULT '{}',
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    reason TEXT,
    created_by VARCHAR(64),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alert_suppressions_rule ON alert_suppressions(rule_id);

CREATE TABLE IF NOT EXISTS alert_maintenance_windows (
    window_id VARCHAR(64) PRIMARY KEY,
    window_name VARCHAR(200),
    window_type VARCHAR(50),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    affected_rules TEXT[],
    description TEXT,
    created_by VARCHAR(64),
    status VARCHAR(20) DEFAULT 'scheduled',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS alert_statistics (
    stat_id VARCHAR(64) PRIMARY KEY,
    rule_id VARCHAR(64) REFERENCES alert_rules(rule_id) ON DELETE CASCADE,
    period_type VARCHAR(20),
    period_start TIMESTAMP,
    period_end TIMESTAMP,
    total_incidents INTEGER DEFAULT 0,
    acknowledged_incidents INTEGER DEFAULT 0,
    resolved_incidents INTEGER DEFAULT 0,
    mean_time_to_acknowledge DOUBLE PRECISION,
    mean_time_to_resolve DOUBLE PRECISION,
    false_positive_rate DOUBLE PRECISION,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alert_statistics_rule ON alert_statistics(rule_id);

CREATE TABLE IF NOT EXISTS alert_history (
    history_id VARCHAR(64) PRIMARY KEY,
    incident_id VARCHAR(64) REFERENCES alert_incidents(incident_id) ON DELETE CASCADE,
    action_type VARCHAR(50),
    action_details JSONB DEFAULT '{}',
    performed_by VARCHAR(64),
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_alert_history_incident ON alert_history(incident_id);
