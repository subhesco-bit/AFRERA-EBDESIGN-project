-- Water Quality Monitoring Schema (M077)
-- Real-time water quality tracking and compliance monitoring

CREATE TABLE IF NOT EXISTS water_quality_measurements (
    measurement_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    sample_date DATE NOT NULL,
    ph_level DECIMAL(4,2),
    turbidity DECIMAL(10,2),
    dissolved_oxygen DECIMAL(10,2),
    conductivity DECIMAL(15,2),
    temperature DECIMAL(5,2),
    total_dissolved_solids DECIMAL(15,2),
    bacterial_count INTEGER,
    chemical_contaminants JSONB,
    location_name VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    compliance_status VARCHAR(20) DEFAULT 'pending',
    health_risk_level VARCHAR(20),
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_sources (
    source_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_name VARCHAR(200) NOT NULL,
    capacity DECIMAL(15,2),
    current_usage DECIMAL(15,2),
    primary_use VARCHAR(50),
    secondary_use VARCHAR(50),
    treatment_facility_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS water_usage_context (
    context_id SERIAL PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    primary_use VARCHAR(50) NOT NULL,
    secondary_use VARCHAR(50),
    user_count INTEGER,
    industrial_facilities INTEGER,
    agricultural_area DECIMAL(15,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS quality_alerts (
    alert_id VARCHAR(50) PRIMARY KEY,
    measurement_id VARCHAR(50) REFERENCES water_quality_measurements(measurement_id),
    location_id VARCHAR(50) NOT NULL,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_notes TEXT,
    status VARCHAR(20) DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS treatment_recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    measurement_id VARCHAR(50),
    issues_identified JSONB,
    treatment_options JSONB,
    implementation_plan JSONB,
    cost_estimate DECIMAL(15,2),
    expected_improvement JSONB,
    priority VARCHAR(20),
    confidence DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_water_quality_location ON water_quality_measurements(location_id);
CREATE INDEX idx_water_quality_date ON water_quality_measurements(sample_date);
CREATE INDEX idx_water_quality_compliance ON water_quality_measurements(compliance_status);
CREATE INDEX idx_water_sources_location ON water_sources(location_id);
CREATE INDEX idx_quality_alerts_location ON quality_alerts(location_id);
CREATE INDEX idx_quality_alerts_status ON quality_alerts(status);
CREATE INDEX idx_treatment_recommendations_location ON treatment_recommendations(location_id);
