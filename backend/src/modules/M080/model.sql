-- Water Analytics Schema (M080)
-- Advanced water data analytics, dashboards, and predictive insights

CREATE TABLE IF NOT EXISTS water_analytics (
    analytics_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    period_from DATE NOT NULL,
    period_to DATE NOT NULL,
    usage_type VARCHAR(50),
    analytics_type VARCHAR(50) NOT NULL,
    summary JSONB,
    trends JSONB,
    patterns JSONB,
    benchmarks JSONB,
    predictions JSONB,
    recommendations JSONB,
    ai_insights JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_dashboards (
    dashboard_id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL,
    user_type VARCHAR(50) NOT NULL,
    dashboard_name VARCHAR(200) NOT NULL,
    location_scope JSONB NOT NULL,
    widgets JSONB NOT NULL,
    refresh_interval INTEGER,
    data_sources JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    ai_optimization JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_usage_records (
    record_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    usage_date DATE NOT NULL,
    usage_amount DECIMAL(15,2) NOT NULL,
    usage_type VARCHAR(50) NOT NULL,
    source_id VARCHAR(50),
    efficiency_metric DECIMAL(5,2),
    cost_per_unit DECIMAL(10,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_sources (
    source_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(200) NOT NULL,
    capacity DECIMAL(15,2),
    current_utilization DECIMAL(5,2),
    quality_rating DECIMAL(5,2),
    availability_percentage DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_predictions (
    prediction_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    prediction_horizon VARCHAR(20) NOT NULL,
    prediction_type VARCHAR(50) NOT NULL,
    confidence_threshold DECIMAL(5,2),
    factors_considered JSONB,
    forecast JSONB,
    risk_assessment JSONB,
    scenario_analysis JSONB,
    confidence_intervals JSONB,
    recommendations JSONB,
    ai_predictions JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_performance_comparisons (
    comparison_id VARCHAR(50) PRIMARY KEY,
    location_ids JSONB NOT NULL,
    metrics JSONB NOT NULL,
    period VARCHAR(50) NOT NULL,
    normalization_method VARCHAR(50),
    performance_matrix JSONB,
    rankings JSONB,
    gaps JSONB,
    best_practices JSONB,
    benchmarks JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_anomaly_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    anomaly_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    detected_value DECIMAL(15,2),
    expected_value DECIMAL(15,2),
    deviation_percentage DECIMAL(5,2),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE INDEX idx_water_analytics_location ON water_analytics(location_id);
CREATE INDEX idx_water_analytics_period ON water_analytics(period_from, period_to);
CREATE INDEX idx_water_dashboards_user ON water_dashboards(user_id);
CREATE INDEX idx_water_usage_records_location ON water_usage_records(location_id);
CREATE INDEX idx_water_usage_records_date ON water_usage_records(usage_date);
CREATE INDEX idx_water_sources_location ON water_sources(location_id);
CREATE INDEX idx_water_predictions_location ON water_predictions(location_id);
CREATE INDEX idx_water_anomaly_alerts_location ON water_anomaly_alerts(location_id);
CREATE INDEX idx_water_anomaly_alerts_status ON water_anomaly_alerts(status);
