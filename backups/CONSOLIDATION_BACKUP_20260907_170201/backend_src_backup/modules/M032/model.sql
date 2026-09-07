-- Soil Analysis Schema (M032)
-- Comprehensive soil testing and analysis with AI-powered recommendations

CREATE TABLE IF NOT EXISTS soil_samples (
    sample_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    parcel_id VARCHAR(50),
    sample_date DATE NOT NULL,
    sample_depth DECIMAL(5,2),
    sample_location JSONB,
    soil_type VARCHAR(50),
    ph_level DECIMAL(5,2),
    organic_matter DECIMAL(5,2),
    nitrogen DECIMAL(5,2),
    phosphorus DECIMAL(5,2),
    potassium DECIMAL(5,2),
    calcium DECIMAL(5,2),
    magnesium DECIMAL(5,2),
    sulfur DECIMAL(5,2),
    iron DECIMAL(5,2),
    zinc DECIMAL(5,2),
    copper DECIMAL(5,2),
    manganese DECIMAL(5,2),
    boron DECIMAL(5,2),
    electrical_conductivity DECIMAL(5,2),
    cation_exchange_capacity DECIMAL(5,2),
    texture VARCHAR(50),
    structure VARCHAR(50),
    water_holding_capacity DECIMAL(5,2),
    ai_health_score DECIMAL(5,2),
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS soil_health_reports (
    report_id VARCHAR(50) PRIMARY KEY,
    sample_id VARCHAR(50) NOT NULL REFERENCES soil_samples(sample_id),
    overall_health VARCHAR(20),
    fertility_rating VARCHAR(20),
    suitability_rating JSONB,
    nutrient_deficiencies JSONB,
    recommended_amendments JSONB,
    recommended_crops JSONB,
    irrigation_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_soil_samples_farmer ON soil_samples(farmer_id);
CREATE INDEX idx_soil_samples_parcel ON soil_samples(parcel_id);
CREATE INDEX idx_soil_samples_date ON soil_samples(sample_date);
CREATE INDEX idx_soil_health_reports_sample ON soil_health_reports(sample_id);
