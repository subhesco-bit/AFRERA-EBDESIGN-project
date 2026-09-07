-- Folded from backend/src/modules/M085/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Comparative Analytics Schema (M085) / -- Business Intelligence & Analytics Module
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS comparison_groups (
    group_id VARCHAR(50) PRIMARY KEY,
    group_name VARCHAR(200) NOT NULL,
    group_type VARCHAR(50) NOT NULL,
    description TEXT,
    entity_ids TEXT[] NOT NULL,
    entity_types TEXT[] NOT NULL,
    comparison_dimensions JSONB,
    created_by VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_configs (
    config_id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES comparison_groups(group_id) ON DELETE CASCADE,
    config_name VARCHAR(200) NOT NULL,
    metrics_to_compare TEXT[] NOT NULL,
    dimensions_to_compare TEXT[],
    weightings JSONB,
    normalization_method VARCHAR(50),
    aggregation_method VARCHAR(50),
    baseline_entity_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_results (
    result_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) REFERENCES comparison_configs(config_id) ON DELETE CASCADE,
    comparison_date DATE NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    entity_scores JSONB NOT NULL,
    metric_comparisons JSONB NOT NULL,
    rankings JSONB NOT NULL,
    gaps JSONB,
    insights JSONB,
    recommendations JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_benchmarks (
    benchmark_id VARCHAR(50) PRIMARY KEY,
    group_id VARCHAR(50) REFERENCES comparison_groups(group_id) ON DELETE CASCADE,
    benchmark_name VARCHAR(200) NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL,
    benchmark_values JSONB NOT NULL,
    source VARCHAR(100),
    industry VARCHAR(50),
    region VARCHAR(50),
    period VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_trends (
    trend_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) REFERENCES comparison_configs(config_id) ON DELETE CASCADE,
    entity_id VARCHAR(50) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    trend_direction VARCHAR(20) NOT NULL,
    trend_strength DECIMAL(5,2),
    relative_performance DECIMAL(5,2),
    time_series_data JSONB,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) REFERENCES comparison_configs(config_id) ON DELETE CASCADE,
    entity_id VARCHAR(50) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    alert_condition VARCHAR(50) NOT NULL,
    threshold_value DECIMAL(15,2),
    current_value DECIMAL(15,2),
    severity VARCHAR(20) NOT NULL,
    message TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS comparison_snapshots (
    snapshot_id VARCHAR(50) PRIMARY KEY,
    config_id VARCHAR(50) REFERENCES comparison_configs(config_id) ON DELETE CASCADE,
    snapshot_name VARCHAR(200) NOT NULL,
    snapshot_data JSONB NOT NULL,
    comparison_date DATE NOT NULL,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comparison_groups_type ON comparison_groups(group_type);

CREATE INDEX IF NOT EXISTS idx_comparison_configs_group ON comparison_configs(group_id);

CREATE INDEX IF NOT EXISTS idx_comparison_results_config ON comparison_results(config_id);

CREATE INDEX IF NOT EXISTS idx_comparison_results_date ON comparison_results(comparison_date);

CREATE INDEX IF NOT EXISTS idx_comparison_benchmarks_group ON comparison_benchmarks(group_id);

CREATE INDEX IF NOT EXISTS idx_comparison_trends_config ON comparison_trends(config_id);

CREATE INDEX IF NOT EXISTS idx_comparison_trends_entity ON comparison_trends(entity_id);

CREATE INDEX IF NOT EXISTS idx_comparison_alerts_config ON comparison_alerts(config_id);

CREATE INDEX IF NOT EXISTS idx_comparison_alerts_active ON comparison_alerts(is_active);

CREATE INDEX IF NOT EXISTS idx_comparison_snapshots_config ON comparison_snapshots(config_id);
