-- Predictive Analytics Database Schema
-- CAP-XXX: Predictive Models, Predictions, Forecasts, Model Performance

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

-- ============================================================================
-- PREDICTIVE MODELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS predictive_models (
    id SERIAL PRIMARY KEY,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100) NOT NULL,
    model_version VARCHAR(50),
    algorithm VARCHAR(100),
    model_config JSONB,
    training_data_source VARCHAR(255),
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    trained_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictive_models_name ON predictive_models(model_name);
CREATE INDEX IF NOT EXISTS idx_predictive_models_type ON predictive_models(model_type);
CREATE INDEX IF NOT EXISTS idx_predictive_models_active ON predictive_models(is_active);

-- ============================================================================
-- PREDICTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES predictive_models(id) ON DELETE SET NULL,
    prediction_type VARCHAR(100) NOT NULL,
    target_entity_id INTEGER NOT NULL,
    target_entity_type VARCHAR(100) NOT NULL,
    prediction_date DATE NOT NULL,
    prediction_horizon_days INTEGER,
    predicted_value DECIMAL(15,2),
    confidence_interval_lower DECIMAL(15,2),
    confidence_interval_upper DECIMAL(15,2),
    confidence_score DECIMAL(5,4),
    prediction_metadata JSONB,
    actual_value DECIMAL(15,2),
    prediction_accuracy DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_model ON predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_predictions_entity ON predictions(target_entity_id, target_entity_type);
CREATE INDEX IF NOT EXISTS idx_predictions_type ON predictions(prediction_type);
CREATE INDEX IF NOT EXISTS idx_predictions_date ON predictions(prediction_date);

-- ============================================================================
-- FORECASTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    forecast_type VARCHAR(100) NOT NULL,
    entity_id INTEGER NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    forecast_date DATE NOT NULL,
    forecast_horizon_days INTEGER,
    forecast_values JSONB,
    forecast_metadata JSONB,
    generated_by_model_id INTEGER REFERENCES predictive_models(id) ON DELETE SET NULL,
    forecast_accuracy DECIMAL(5,4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_forecasts_type ON forecasts(forecast_type);
CREATE INDEX IF NOT EXISTS idx_forecasts_entity ON forecasts(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_forecasts_date ON forecasts(forecast_date);
CREATE INDEX IF NOT EXISTS idx_forecasts_model ON forecasts(generated_by_model_id);

-- ============================================================================
-- MODEL PERFORMANCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_performance (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES predictive_models(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL,
    test_dataset_size INTEGER,
    accuracy_score DECIMAL(5,4),
    precision_score DECIMAL(5,4),
    recall_score DECIMAL(5,4),
    f1_score DECIMAL(5,4),
    roc_auc_score DECIMAL(5,4),
    confusion_matrix JSONB,
    classification_report JSONB,
    performance_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_model_performance_model ON model_performance(model_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_date ON model_performance(evaluation_date);

-- ============================================================================
-- MODEL TRAINING HISTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS model_training_history (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES predictive_models(id) ON DELETE CASCADE,
    training_start TIMESTAMP,
    training_end TIMESTAMP,
    training_data_source VARCHAR(255),
    training_data_size INTEGER,
    feature_count INTEGER,
    hyperparameters JSONB,
    training_metrics JSONB,
    training_status VARCHAR(50),
    error_message TEXT,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_training_history_model ON model_training_history(model_id);
CREATE INDEX IF NOT EXISTS idx_training_history_status ON model_training_history(training_status);

-- ============================================================================
-- ANOMALY DETECTION
-- ============================================================================

CREATE TABLE IF NOT EXISTS anomaly_detection (
    id SERIAL PRIMARY KEY,
    model_id INTEGER REFERENCES predictive_models(id) ON DELETE SET NULL,
    entity_id INTEGER NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    anomaly_type VARCHAR(100),
    anomaly_score DECIMAL(10,6),
    severity VARCHAR(50),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    anomaly_description TEXT,
    affected_metrics JSONB,
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_anomaly_detection_entity ON anomaly_detection(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_severity ON anomaly_detection(severity);
CREATE INDEX IF NOT EXISTS idx_anomaly_detection_resolved ON anomaly_detection(resolved);

-- ============================================================================
-- TREND ANALYSIS
-- ============================================================================

CREATE TABLE IF NOT EXISTS trend_analysis (
    id SERIAL PRIMARY KEY,
    trend_type VARCHAR(100) NOT NULL,
    entity_id INTEGER,
    entity_type VARCHAR(100),
    analysis_period_start DATE NOT NULL,
    analysis_period_end DATE NOT NULL,
    trend_direction VARCHAR(50),
    trend_strength DECIMAL(5,4),
    trend_value DECIMAL(15,2),
    baseline_value DECIMAL(15,2),
    confidence_level DECIMAL(5,4),
    factors JSONB,
    generated_by_model_id INTEGER REFERENCES predictive_models(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trend_analysis_type ON trend_analysis(trend_type);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_entity ON trend_analysis(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_trend_analysis_period ON trend_analysis(analysis_period_start, analysis_period_end);

-- ============================================================================
-- WHAT-IF SCENARIOS
-- ============================================================================

CREATE TABLE IF NOT EXISTS what_if_scenarios (
    id SERIAL PRIMARY KEY,
    scenario_name VARCHAR(255) NOT NULL,
    scenario_type VARCHAR(100),
    entity_id INTEGER,
    entity_type VARCHAR(100),
    baseline_parameters JSONB,
    scenario_parameters JSONB,
    predicted_outcomes JSONB,
    model_id INTEGER REFERENCES predictive_models(id) ON DELETE SET NULL,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_name ON what_if_scenarios(scenario_name);
CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_type ON what_if_scenarios(scenario_type);
CREATE INDEX IF NOT EXISTS idx_what_if_scenarios_entity ON what_if_scenarios(entity_id, entity_type);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to all relevant tables
DROP TRIGGER IF EXISTS update_predictive_models_updated_at ON predictive_models;
CREATE TRIGGER update_predictive_models_updated_at BEFORE UPDATE ON predictive_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_predictions_updated_at ON predictions;
CREATE TRIGGER update_predictions_updated_at BEFORE UPDATE ON predictions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_forecasts_updated_at ON forecasts;
CREATE TRIGGER update_forecasts_updated_at BEFORE UPDATE ON forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for active models with latest performance
CREATE OR REPLACE VIEW active_models_performance AS
SELECT 
    pm.*,
    mp.accuracy_score as latest_accuracy,
    mp.precision_score as latest_precision,
    mp.recall_score as latest_recall,
    mp.f1_score as latest_f1,
    mp.evaluation_date as last_evaluation
FROM predictive_models pm
LEFT JOIN LATERAL (
    SELECT * FROM model_performance 
    WHERE model_id = pm.id 
    ORDER BY evaluation_date DESC 
    LIMIT 1
) mp ON true
WHERE pm.is_active = true;

-- View for prediction accuracy summary
CREATE OR REPLACE VIEW prediction_accuracy_summary AS
SELECT 
    pm.model_name,
    pm.model_type,
    p.prediction_type,
    COUNT(*) as total_predictions,
    AVG(p.prediction_accuracy) as avg_accuracy,
    STDDEV(p.prediction_accuracy) as accuracy_stddev,
    MIN(p.prediction_accuracy) as min_accuracy,
    MAX(p.prediction_accuracy) as max_accuracy
FROM predictions p
JOIN predictive_models pm ON p.model_id = pm.id
WHERE p.actual_value IS NOT NULL
GROUP BY pm.model_name, pm.model_type, p.prediction_type;
