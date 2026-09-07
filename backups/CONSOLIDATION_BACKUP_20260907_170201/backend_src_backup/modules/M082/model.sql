-- Business Metrics & KPIs Tracking Schema (M082)
-- Business Intelligence & Analytics Module

CREATE TABLE IF NOT EXISTS kpi_definitions (
    kpi_id VARCHAR(50) PRIMARY KEY,
    kpi_name VARCHAR(200) NOT NULL,
    kpi_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT,
    calculation_formula TEXT,
    data_source VARCHAR(100),
    unit_of_measure VARCHAR(50),
    target_value DECIMAL(15,2),
    threshold_min DECIMAL(15,2),
    threshold_max DECIMAL(15,2),
    aggregation_type VARCHAR(20),
    time_granularity VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_measurements (
    measurement_id VARCHAR(50) PRIMARY KEY,
    kpi_id VARCHAR(50) REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    entity_id VARCHAR(50),
    entity_type VARCHAR(50),
    measurement_value DECIMAL(15,2) NOT NULL,
    measurement_date DATE NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    dimensions JSONB,
    metadata JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_targets (
    target_id VARCHAR(50) PRIMARY KEY,
    kpi_id VARCHAR(50) REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    entity_id VARCHAR(50),
    entity_type VARCHAR(50),
    target_value DECIMAL(15,2) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    is_stretch BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    kpi_id VARCHAR(50) REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    alert_type VARCHAR(20) NOT NULL,
    condition_type VARCHAR(20) NOT NULL,
    threshold_value DECIMAL(15,2) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    notification_channels TEXT[],
    recipients TEXT[],
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_scores (
    score_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_score DECIMAL(5,2),
    category_scores JSONB,
    kpi_scores JSONB,
    trend VARCHAR(20),
    rank INTEGER,
    percentile DECIMAL(5,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS metric_benchmarks (
    benchmark_id VARCHAR(50) PRIMARY KEY,
    kpi_id VARCHAR(50) REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    benchmark_name VARCHAR(200) NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL,
    benchmark_value DECIMAL(15,2) NOT NULL,
    source VARCHAR(100),
    industry VARCHAR(50),
    region VARCHAR(50),
    period VARCHAR(20),
    is_percentile BOOLEAN DEFAULT FALSE,
    percentile_value DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_dimensions (
    dimension_id VARCHAR(50) PRIMARY KEY,
    kpi_id VARCHAR(50) REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    dimension_name VARCHAR(100) NOT NULL,
    dimension_type VARCHAR(50) NOT NULL,
    dimension_values JSONB,
    is_drillable BOOLEAN DEFAULT TRUE,
    hierarchy_config JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kpi_aggregations (
    aggregation_id VARCHAR(50) PRIMARY KEY,
    kpi_id VARCHAR(50) REFERENCES kpi_definitions(kpi_id) ON DELETE CASCADE,
    aggregation_type VARCHAR(20) NOT NULL,
    level VARCHAR(50) NOT NULL,
    dimension_config JSONB,
    time_window VARCHAR(20),
    formula TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_kpi_definitions_category ON kpi_definitions(category);
CREATE INDEX idx_kpi_definitions_code ON kpi_definitions(kpi_code);
CREATE INDEX idx_kpi_measurements_kpi ON kpi_measurements(kpi_id);
CREATE INDEX idx_kpi_measurements_date ON kpi_measurements(measurement_date);
CREATE INDEX idx_kpi_measurements_entity ON kpi_measurements(entity_id, entity_type);
CREATE INDEX idx_kpi_targets_kpi ON kpi_targets(kpi_id);
CREATE INDEX idx_kpi_targets_period ON kpi_targets(period_start, period_end);
CREATE INDEX idx_kpi_alerts_kpi ON kpi_alerts(kpi_id);
CREATE INDEX idx_kpi_scores_entity ON kpi_scores(entity_id, entity_type);
CREATE INDEX idx_kpi_scores_period ON kpi_scores(period_start, period_end);
CREATE INDEX idx_metric_benchmarks_kpi ON metric_benchmarks(kpi_id);
CREATE INDEX idx_kpi_dimensions_kpi ON kpi_dimensions(kpi_id);
CREATE INDEX idx_kpi_aggregations_kpi ON kpi_aggregations(kpi_id);
