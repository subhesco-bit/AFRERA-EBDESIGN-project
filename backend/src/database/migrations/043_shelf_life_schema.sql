-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

-- Shelf-Life Intelligence Database Schema
-- CAP-255 to CAP-261: Temperature Monitoring, Humidity Monitoring, Packaging Analysis,
-- Transport Analysis, Storage Analysis, Remaining Shelf Life Prediction, Spoilage Risk Prediction

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(100);
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS temperature DECIMAL(10,2);
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'celsius';
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS threshold_violation BOOLEAN DEFAULT false;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS alert_triggered BOOLEAN DEFAULT false;
ALTER TABLE temperature_monitoring ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_temperature_product ON temperature_monitoring(product_id);
CREATE INDEX IF NOT EXISTS idx_temperature_batch ON temperature_monitoring(batch_id);
CREATE INDEX IF NOT EXISTS idx_temperature_location ON temperature_monitoring(location_id);
CREATE INDEX IF NOT EXISTS idx_temperature_timestamp ON temperature_monitoring(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_temperature_violation ON temperature_monitoring(threshold_violation);

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS location_id INTEGER;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS sensor_id VARCHAR(100);
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS humidity DECIMAL(10,2);
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS unit VARCHAR(20) DEFAULT 'percent';
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS threshold_violation BOOLEAN DEFAULT false;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS alert_triggered BOOLEAN DEFAULT false;
ALTER TABLE humidity_monitoring ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_humidity_product ON humidity_monitoring(product_id);
CREATE INDEX IF NOT EXISTS idx_humidity_batch ON humidity_monitoring(batch_id);
CREATE INDEX IF NOT EXISTS idx_humidity_location ON humidity_monitoring(location_id);
CREATE INDEX IF NOT EXISTS idx_humidity_timestamp ON humidity_monitoring(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_humidity_violation ON humidity_monitoring(threshold_violation);

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS packaging_type VARCHAR(100);
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS material_composition JSONB;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS barrier_properties JSONB;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS seal_integrity VARCHAR(50);
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS oxygen_transmission_rate DECIMAL(10,2);
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS moisture_vapor_transmission_rate DECIMAL(10,2);
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS light_transmission DECIMAL(5,2);
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS mechanical_strength JSONB;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS compatibility_with_product TEXT;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS shelf_life_impact TEXT;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS analysis_date DATE;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS analyzed_by INTEGER;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE packaging_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_packaging_product ON packaging_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_packaging_batch ON packaging_analysis(batch_id);
CREATE INDEX IF NOT EXISTS idx_packaging_type ON packaging_analysis(packaging_type);

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS shipment_id INTEGER;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS transport_mode VARCHAR(50);
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS route JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS duration INTEGER;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS temperature_conditions JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS humidity_conditions JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS vibration_levels JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS shock_events JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS handling_incidents JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS deviations JSONB;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS impact_on_shelf_life TEXT;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS analysis_date DATE;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS analyzed_by INTEGER;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE transport_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_transport_shipment ON transport_analysis(shipment_id);
CREATE INDEX IF NOT EXISTS idx_transport_product ON transport_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_transport_batch ON transport_analysis(batch_id);
CREATE INDEX IF NOT EXISTS idx_transport_mode ON transport_analysis(transport_mode);

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS warehouse_id INTEGER;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS storage_location VARCHAR(255);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS storage_conditions JSONB;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS temperature_history JSONB;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS humidity_history JSONB;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS ventilation_status VARCHAR(50);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS light_exposure VARCHAR(50);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS pest_control_status VARCHAR(50);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS cleanliness_score DECIMAL(5,2);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS organization_rating VARCHAR(50);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS stock_rotation_compliance VARCHAR(50);
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS impact_on_shelf_life TEXT;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS analysis_date DATE;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS analyzed_by INTEGER;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE storage_analysis ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_storage_product ON storage_analysis(product_id);
CREATE INDEX IF NOT EXISTS idx_storage_batch ON storage_analysis(batch_id);
CREATE INDEX IF NOT EXISTS idx_storage_warehouse ON storage_analysis(warehouse_id);

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS production_date DATE;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS storage_conditions JSONB;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS transport_history JSONB;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS packaging_analysis JSONB;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS temperature_history JSONB;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS humidity_history JSONB;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS predicted_remaining_days INTEGER;
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS prediction_model VARCHAR(50);
ALTER TABLE shelf_life_predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_shelf_life_product ON shelf_life_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_shelf_life_batch ON shelf_life_predictions(batch_id);
CREATE INDEX IF NOT EXISTS idx_shelf_life_prediction_date ON shelf_life_predictions(prediction_date DESC);

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS product_id INTEGER;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS batch_id INTEGER;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS shelf_life_remaining INTEGER;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS storage_conditions JSONB;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS temperature_violations JSONB;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS humidity_violations JSONB;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS handling_incidents JSONB;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS age_in_days INTEGER;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS risk_level VARCHAR(50);
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS risk_probability DECIMAL(5,2);
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS risk_factors JSONB;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS recommended_actions JSONB;
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,2);
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS prediction_model VARCHAR(50);
ALTER TABLE spoilage_risk_predictions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_spoilage_risk_product ON spoilage_risk_predictions(product_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_risk_batch ON spoilage_risk_predictions(batch_id);
CREATE INDEX IF NOT EXISTS idx_spoilage_risk_level ON spoilage_risk_predictions(risk_level);
CREATE INDEX IF NOT EXISTS idx_spoilage_risk_prediction_date ON spoilage_risk_predictions(prediction_date DESC);

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
DROP TRIGGER IF EXISTS update_packaging_analysis_updated_at ON packaging_analysis;
CREATE TRIGGER update_packaging_analysis_updated_at BEFORE UPDATE ON packaging_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_transport_analysis_updated_at ON transport_analysis;
CREATE TRIGGER update_transport_analysis_updated_at BEFORE UPDATE ON transport_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_storage_analysis_updated_at ON storage_analysis;
CREATE TRIGGER update_storage_analysis_updated_at BEFORE UPDATE ON storage_analysis
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
