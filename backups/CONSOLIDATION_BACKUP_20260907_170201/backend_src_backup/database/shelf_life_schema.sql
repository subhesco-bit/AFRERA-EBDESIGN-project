-- Shelf-Life Intelligence Database Schema
-- CAP-255 to CAP-261: Temperature Monitoring, Humidity Monitoring, Packaging Analysis,
-- Transport Analysis, Storage Analysis, Remaining Shelf Life Prediction, Spoilage Risk Prediction

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- TEMPERATURE MONITORING (CAP-255)
-- ============================================================================

CREATE TABLE IF NOT EXISTS temperature_monitoring (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    batch_id INTEGER,
    location_id INTEGER,
    sensor_id VARCHAR(100),
    temperature DECIMAL(10,2),
    unit VARCHAR(20) DEFAULT 'celsius',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threshold_violation BOOLEAN DEFAULT false,
    alert_triggered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_temperature_product ON temperature_monitoring(product_id);
CREATE INDEX idx_temperature_batch ON temperature_monitoring(batch_id);
CREATE INDEX idx_temperature_location ON temperature_monitoring(location_id);
CREATE INDEX idx_temperature_timestamp ON temperature_monitoring(timestamp DESC);
CREATE INDEX idx_temperature_violation ON temperature_monitoring(threshold_violation);

-- ============================================================================
-- HUMIDITY MONITORING (CAP-256)
-- ============================================================================

CREATE TABLE IF NOT EXISTS humidity_monitoring (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    batch_id INTEGER,
    location_id INTEGER,
    sensor_id VARCHAR(100),
    humidity DECIMAL(10,2),
    unit VARCHAR(20) DEFAULT 'percent',
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    threshold_violation BOOLEAN DEFAULT false,
    alert_triggered BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_humidity_product ON humidity_monitoring(product_id);
CREATE INDEX idx_humidity_batch ON humidity_monitoring(batch_id);
CREATE INDEX idx_humidity_location ON humidity_monitoring(location_id);
CREATE INDEX idx_humidity_timestamp ON humidity_monitoring(timestamp DESC);
CREATE INDEX idx_humidity_violation ON humidity_monitoring(threshold_violation);

-- ============================================================================
-- PACKAGING ANALYSIS (CAP-257)
-- ============================================================================

CREATE TABLE IF NOT EXISTS packaging_analysis (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    batch_id INTEGER,
    packaging_type VARCHAR(100),
    material_composition JSONB,
    barrier_properties JSONB,
    seal_integrity VARCHAR(50),
    oxygen_transmission_rate DECIMAL(10,2),
    moisture_vapor_transmission_rate DECIMAL(10,2),
    light_transmission DECIMAL(5,2),
    mechanical_strength JSONB,
    compatibility_with_product TEXT,
    shelf_life_impact TEXT,
    analysis_date DATE,
    analyzed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_packaging_product ON packaging_analysis(product_id);
CREATE INDEX idx_packaging_batch ON packaging_analysis(batch_id);
CREATE INDEX idx_packaging_type ON packaging_analysis(packaging_type);

-- ============================================================================
-- TRANSPORT ANALYSIS (CAP-258)
-- ============================================================================

CREATE TABLE IF NOT EXISTS transport_analysis (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER,
    product_id INTEGER,
    batch_id INTEGER,
    transport_mode VARCHAR(50),
    route JSONB,
    duration INTEGER,
    temperature_conditions JSONB,
    humidity_conditions JSONB,
    vibration_levels JSONB,
    shock_events JSONB,
    handling_incidents JSONB,
    deviations JSONB,
    impact_on_shelf_life TEXT,
    analysis_date DATE,
    analyzed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transport_shipment ON transport_analysis(shipment_id);
CREATE INDEX idx_transport_product ON transport_analysis(product_id);
CREATE INDEX idx_transport_batch ON transport_analysis(batch_id);
CREATE INDEX idx_transport_mode ON transport_analysis(transport_mode);

-- ============================================================================
-- STORAGE ANALYSIS (CAP-259)
-- ============================================================================

CREATE TABLE IF NOT EXISTS storage_analysis (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    batch_id INTEGER,
    warehouse_id INTEGER,
    storage_location VARCHAR(255),
    storage_conditions JSONB,
    temperature_history JSONB,
    humidity_history JSONB,
    ventilation_status VARCHAR(50),
    light_exposure VARCHAR(50),
    pest_control_status VARCHAR(50),
    cleanliness_score DECIMAL(5,2),
    organization_rating VARCHAR(50),
    stock_rotation_compliance VARCHAR(50),
    impact_on_shelf_life TEXT,
    analysis_date DATE,
    analyzed_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_storage_product ON storage_analysis(product_id);
CREATE INDEX idx_storage_batch ON storage_analysis(batch_id);
CREATE INDEX idx_storage_warehouse ON storage_analysis(warehouse_id);

-- ============================================================================
-- SHELF LIFE PREDICTIONS (CAP-260)
-- ============================================================================

CREATE TABLE IF NOT EXISTS shelf_life_predictions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    batch_id INTEGER,
    production_date DATE,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    storage_conditions JSONB,
    transport_history JSONB,
    packaging_analysis JSONB,
    temperature_history JSONB,
    humidity_history JSONB,
    predicted_remaining_days INTEGER,
    confidence_score DECIMAL(5,2),
    prediction_model VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shelf_life_product ON shelf_life_predictions(product_id);
CREATE INDEX idx_shelf_life_batch ON shelf_life_predictions(batch_id);
CREATE INDEX idx_shelf_life_prediction_date ON shelf_life_predictions(prediction_date DESC);

-- ============================================================================
-- SPOILAGE RISK PREDICTIONS (CAP-261)
-- ============================================================================

CREATE TABLE IF NOT EXISTS spoilage_risk_predictions (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    batch_id INTEGER,
    prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    shelf_life_remaining INTEGER,
    storage_conditions JSONB,
    temperature_violations JSONB,
    humidity_violations JSONB,
    handling_incidents JSONB,
    age_in_days INTEGER,
    risk_level VARCHAR(50),
    risk_probability DECIMAL(5,2),
    risk_factors JSONB,
    recommended_actions JSONB,
    confidence_score DECIMAL(5,2),
    prediction_model VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spoilage_risk_product ON spoilage_risk_predictions(product_id);
CREATE INDEX idx_spoilage_risk_batch ON spoilage_risk_predictions(batch_id);
CREATE INDEX idx_spoilage_risk_level ON spoilage_risk_predictions(risk_level);
CREATE INDEX idx_spoilage_risk_prediction_date ON spoilage_risk_predictions(prediction_date DESC);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_packaging_analysis_updated_at BEFORE UPDATE ON packaging_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transport_analysis_updated_at BEFORE UPDATE ON transport_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_storage_analysis_updated_at BEFORE UPDATE ON storage_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
