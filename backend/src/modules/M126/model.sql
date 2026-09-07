-- Pig Management Schema (M126)
-- Comprehensive pig farming, health monitoring, and production management

CREATE TABLE IF NOT EXISTS pig_registry (
    pig_registry_id VARCHAR(50) PRIMARY KEY,
    pig_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    pig_type VARCHAR(50) NOT NULL,
    pig_count INTEGER NOT NULL,
    age_months INTEGER NOT NULL,
    housing_type VARCHAR(50),
    location VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    registration_date DATE NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    feed_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'registered',
    ai_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pig_health_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES pig_registry(pig_registry_id),
    health_status VARCHAR(50) NOT NULL,
    mortality_rate DECIMAL(5,2),
    feed_consumption JSONB,
    water_consumption JSONB,
    vaccination_records JSONB,
    treatment_history JSONB,
    weight_gains JSONB,
    reproduction_metrics JSONB,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pig_breed_characteristics (
    breed_id SERIAL PRIMARY KEY,
    breed_name VARCHAR(100) UNIQUE NOT NULL,
    origin VARCHAR(100),
    purpose VARCHAR(50),
    ideal_temperature DECIMAL(5,2),
    humidity_range VARCHAR(20),
    space_per_pig VARCHAR(20),
    lifespan_months INTEGER,
    nutritional_requirements JSONB,
    common_diseases JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_pig_health_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_requirements JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pig_performance_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES pig_registry(pig_registry_id),
    period VARCHAR(20) NOT NULL,
    weight_gains JSONB,
    feed_efficiency DECIMAL(5,2),
    health_metrics JSONB,
    mortality_analysis JSONB,
    reproduction_metrics JSONB,
    recommendations JSONB,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pig_registry_farmer ON pig_registry(farmer_id);
CREATE INDEX idx_pig_registry_breed ON pig_registry(breed);
CREATE INDEX idx_pig_registry_location ON pig_registry(state, district);
CREATE INDEX idx_pig_health_records_registry ON pig_health_records(registry_id);
CREATE INDEX idx_pig_performance_registry ON pig_performance_tracking(registry_id);
CREATE INDEX idx_regional_pig_health_location ON regional_pig_health_patterns(state, district);