-- Trend Analysis Schema (M084)
-- Business Intelligence & Analytics Module

CREATE TABLE IF NOT EXISTS trend_definitions (
    trend_id VARCHAR(50) PRIMARY KEY,
    trend_name VARCHAR(200) NOT NULL,
    trend_type VARCHAR(50) NOT NULL,
    data_source VARCHAR(100) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    analysis_frequency VARCHAR(20) NOT NULL,
    time_horizon INTEGER NOT NULL,
    confidence_threshold DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_data_points (
    data_point_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    timestamp TIMESTAMP NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    is_forecast BOOLEAN DEFAULT FALSE,
    confidence_level DECIMAL(5,2),
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_analysis (
    analysis_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL,
    trend_direction VARCHAR(20) NOT NULL,
    trend_strength DECIMAL(5,2),
    trend_slope DECIMAL(15,2),
    r_squared DECIMAL(5,2),
    seasonality_pattern VARCHAR(50),
    seasonality_strength DECIMAL(5,2),
    cyclical_pattern VARCHAR(50),
    anomaly_detected BOOLEAN DEFAULT FALSE,
    anomaly_count INTEGER DEFAULT 0,
    analysis_period_start TIMESTAMP NOT NULL,
    analysis_period_end TIMESTAMP NOT NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_forecasts (
    forecast_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    forecast_type VARCHAR(50) NOT NULL,
    forecast_horizon INTEGER NOT NULL,
    forecast_data JSONB NOT NULL,
    confidence_intervals JSONB,
    model_used VARCHAR(50),
    model_accuracy DECIMAL(5,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_seasonality (
    seasonality_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    seasonality_type VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL,
    amplitude DECIMAL(15,2),
    phase DECIMAL(15,2),
    seasonal_indices JSONB,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_correlations (
    correlation_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    correlated_trend_id VARCHAR(50),
    correlated_metric VARCHAR(200),
    correlation_coefficient DECIMAL(5,2),
    p_value DECIMAL(10,6),
    lead_lag_period INTEGER,
    correlation_type VARCHAR(20),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_breakpoints (
    breakpoint_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    breakpoint_timestamp TIMESTAMP NOT NULL,
    breakpoint_type VARCHAR(50) NOT NULL,
    pre_trend_slope DECIMAL(15,2),
    post_trend_slope DECIMAL(15,2),
    significance_level DECIMAL(5,2),
    description TEXT,
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS trend_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    trend_id VARCHAR(50) REFERENCES trend_definitions(trend_id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL,
    alert_condition VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(15,2),
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE INDEX idx_trend_data_points_trend ON trend_data_points(trend_id);
CREATE INDEX idx_trend_data_points_timestamp ON trend_data_points(timestamp);
CREATE INDEX idx_trend_analysis_trend ON trend_analysis(trend_id);
CREATE INDEX idx_trend_forecasts_trend ON trend_forecasts(trend_id);
CREATE INDEX idx_trend_seasonality_trend ON trend_seasonality(trend_id);
CREATE INDEX idx_trend_correlations_trend ON trend_correlations(trend_id);
CREATE INDEX idx_trend_breakpoints_trend ON trend_breakpoints(trend_id);
CREATE INDEX idx_trend_alerts_trend ON trend_alerts(trend_id);
CREATE INDEX idx_trend_alerts_active ON trend_alerts(is_active);
