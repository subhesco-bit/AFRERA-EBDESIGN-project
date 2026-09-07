-- Folded from backend/src/modules/M083/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Performance Analytics Schema (M083) / -- Business Intelligence & Analytics Module
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS performance_metrics (
    metric_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,2) NOT NULL,
    metric_unit VARCHAR(50),
    baseline_value DECIMAL(15,2),
    variance DECIMAL(15,2),
    variance_percentage DECIMAL(5,2),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    dimensions JSONB,
    metadata JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_benchmarks (
    benchmark_id VARCHAR(50) PRIMARY KEY,
    metric_name VARCHAR(200) NOT NULL,
    benchmark_type VARCHAR(50) NOT NULL,
    benchmark_value DECIMAL(15,2) NOT NULL,
    percentile_25 DECIMAL(15,2),
    percentile_50 DECIMAL(15,2),
    percentile_75 DECIMAL(15,2),
    percentile_90 DECIMAL(15,2),
    sample_size INTEGER,
    industry VARCHAR(50),
    region VARCHAR(50),
    period VARCHAR(20),
    source VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    overall_score DECIMAL(5,2),
    category_scores JSONB,
    metric_details JSONB,
    trend_analysis JSONB,
    insights JSONB,
    recommendations JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_trends (
    trend_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    trend_type VARCHAR(20) NOT NULL,
    trend_direction VARCHAR(20) NOT NULL,
    trend_strength DECIMAL(5,2),
    forecast_value DECIMAL(15,2),
    confidence_level DECIMAL(5,2),
    time_series_data JSONB,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_comparisons (
    comparison_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    comparison_type VARCHAR(50) NOT NULL,
    comparison_entities JSONB NOT NULL,
    metrics_compared JSONB NOT NULL,
    results JSONB NOT NULL,
    ranking JSONB,
    gaps JSONB,
    opportunities JSONB,
    comparison_date DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_targets (
    target_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    target_value DECIMAL(15,2) NOT NULL,
    target_type VARCHAR(20) NOT NULL,
    stretch_target DECIMAL(15,2),
    baseline_value DECIMAL(15,2),
    period_type VARCHAR(20) NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    weight DECIMAL(5,2) DEFAULT 1.0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_drivers (
    driver_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    driver_name VARCHAR(200) NOT NULL,
    driver_category VARCHAR(50) NOT NULL,
    impact_score DECIMAL(5,2),
    correlation_coefficient DECIMAL(5,2),
    influence_weight DECIMAL(5,2),
    driver_data JSONB,
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    identified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS performance_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(200) NOT NULL,
    alert_type VARCHAR(20) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    current_value DECIMAL(15,2),
    threshold_value DECIMAL(15,2),
    message TEXT,
    recommended_actions JSONB,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_entity ON performance_metrics(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_period ON performance_metrics(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(metric_category);

CREATE INDEX IF NOT EXISTS idx_performance_benchmarks_metric ON performance_benchmarks(metric_name);

CREATE INDEX IF NOT EXISTS idx_performance_reports_entity ON performance_reports(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_reports_period ON performance_reports(period_start, period_end);

CREATE INDEX IF NOT EXISTS idx_performance_trends_entity ON performance_trends(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_comparisons_entity ON performance_comparisons(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_targets_entity ON performance_targets(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_drivers_entity ON performance_drivers(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_entity ON performance_alerts(entity_id, entity_type);

CREATE INDEX IF NOT EXISTS idx_performance_alerts_resolved ON performance_alerts(is_resolved);
