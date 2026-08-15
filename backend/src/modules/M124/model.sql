-- Goat Management Schema (M124)
-- Comprehensive goat farming, health monitoring, and production management

CREATE TABLE IF NOT EXISTS goat_registry (
    goat_registry_id VARCHAR(50) PRIMARY KEY,
    goat_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    breed VARCHAR(100) NOT NULL,
    goat_type VARCHAR(50) NOT NULL,
    goat_count INTEGER NOT NULL,
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

CREATE TABLE IF NOT EXISTS goat_health_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES goat_registry(goat_registry_id),
    health_status VARCHAR(50) NOT NULL,
    mortality_rate DECIMAL(5,2),
    feed_consumption JSONB,
    water_consumption JSONB,
    vaccination_records JSONB,
    treatment_history JSONB,
    milk_production JSONB,
    weight_gains JSONB,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goat_breed_characteristics (
    breed_id SERIAL PRIMARY KEY,
    breed_name VARCHAR(100) UNIQUE NOT NULL,
    origin VARCHAR(100),
    purpose VARCHAR(50),
    ideal_temperature DECIMAL(5,2),
    humidity_range VARCHAR(20),
    space_per_goat VARCHAR(20),
    lifespan_months INTEGER,
    nutritional_requirements JSONB,
    common_diseases JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_goat_health_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_requirements JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goat_performance_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES goat_registry(goat_registry_id),
    period VARCHAR(20) NOT NULL,
    milk_production_metrics JSONB,
    feed_efficiency DECIMAL(5,2),
    health_metrics JSONB,
    mortality_analysis JSONB,
    weight_gains JSONB,
    recommendations JSONB,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_goat_registry_farmer ON goat_registry(farmer_id);
CREATE INDEX idx_goat_registry_breed ON goat_registry(breed);
CREATE INDEX idx_goat_registry_location ON goat_registry(state, district);
CREATE INDEX idx_goat_health_records_registry ON goat_health_records(registry_id);
CREATE INDEX idx_goat_performance_registry ON goat_performance_tracking(registry_id);
CREATE INDEX idx_regional_goat_health_location ON regional_goat_health_patterns(state, district);