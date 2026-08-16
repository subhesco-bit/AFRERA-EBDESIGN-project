-- Cattle Registry Schema (M122)
-- Comprehensive livestock management and cattle registry system

CREATE TABLE IF NOT EXISTS cattle_registry (
    registry_id VARCHAR(50) PRIMARY KEY,
    cattle_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    age INTEGER NOT NULL,
    gender VARCHAR(20) NOT NULL,
    weight DECIMAL(10,2) NOT NULL,
    health_status VARCHAR(50) NOT NULL,
    vaccination_status VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    tag_number VARCHAR(50) UNIQUE,
    status VARCHAR(20) DEFAULT 'registered',
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cattle_health_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES cattle_registry(registry_id),
    health_status VARCHAR(50) NOT NULL,
    weight DECIMAL(10,2),
    body_condition_score DECIMAL(3,1),
    vaccination_records JSONB,
    treatment_history JSONB,
    reproductive_status VARCHAR(50),
    milk_production JSONB,
    feed_intake JSONB,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cattle_breed_characteristics (
    breed_id SERIAL PRIMARY KEY,
    breed_name VARCHAR(100) UNIQUE NOT NULL,
    origin VARCHAR(100),
    purpose VARCHAR(50),
    ideal_weight_range JSONB,
    ideal_body_condition DECIMAL(3,1),
    common_health_issues JSONB,
    nutritional_requirements JSONB,
    temperament VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_cattle_health_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_schedule JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS cattle_performance_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES cattle_registry(registry_id),
    period VARCHAR(20) NOT NULL,
    weight_gain DECIMAL(10,2),
    feed_efficiency DECIMAL(5,2),
    health_metrics JSONB,
    reproductive_performance JSONB,
    milk_production_metrics JSONB,
    recommendations JSONB,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_cattle_registry_farmer ON cattle_registry(farmer_id);
CREATE INDEX idx_cattle_registry_breed ON cattle_registry(breed);
CREATE INDEX idx_cattle_registry_location ON cattle_registry(state, district);
CREATE INDEX idx_cattle_health_records_registry ON cattle_health_records(registry_id);
CREATE INDEX idx_cattle_performance_registry ON cattle_performance_tracking(registry_id);
CREATE INDEX idx_regional_health_location ON regional_cattle_health_patterns(state, district);
