-- Fish Farming Schema (M128)
-- Comprehensive fish farming, water quality, and production management

CREATE TABLE IF NOT EXISTS fish_farm_registry (
    farm_registry_id VARCHAR(50) PRIMARY KEY,
    farm_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    fish_species VARCHAR(100) NOT NULL,
    fish_type VARCHAR(50) NOT NULL,
    fish_count INTEGER NOT NULL,
    age_months INTEGER NOT NULL,
    pond_type VARCHAR(50),
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

CREATE TABLE IF NOT EXISTS fish_health_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES fish_farm_registry(farm_registry_id),
    health_status VARCHAR(50) NOT NULL,
    mortality_rate DECIMAL(5,2),
    feed_consumption JSONB,
    water_quality_metrics JSONB,
    vaccination_records JSONB,
    treatment_history JSONB,
    growth_metrics JSONB,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_species_characteristics (
    species_id SERIAL PRIMARY KEY,
    species_name VARCHAR(100) UNIQUE NOT NULL,
    origin VARCHAR(100),
    purpose VARCHAR(50),
    ideal_temperature DECIMAL(5,2),
    ph_range VARCHAR(20),
    dissolved_oxygen_range VARCHAR(20),
    lifespan_months INTEGER,
    nutritional_requirements JSONB,
    common_diseases JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS regional_fish_health_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    common_diseases JSONB,
    vaccination_requirements JSONB,
    environmental_factors JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fish_performance_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES fish_farm_registry(farm_registry_id),
    period VARCHAR(20) NOT NULL,
    growth_metrics JSONB,
    feed_efficiency DECIMAL(5,2),
    health_metrics JSONB,
    mortality_analysis JSONB,
    water_quality_analysis JSONB,
    recommendations JSONB,
    tracked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fish_farm_registry_farmer ON fish_farm_registry(farmer_id);
CREATE INDEX idx_fish_farm_registry_species ON fish_farm_registry(fish_species);
CREATE INDEX idx_fish_farm_registry_location ON fish_farm_registry(state, district);
CREATE INDEX idx_fish_health_records_registry ON fish_health_records(registry_id);
CREATE INDEX idx_fish_performance_registry ON fish_performance_tracking(registry_id);
CREATE INDEX idx_regional_fish_health_location ON regional_fish_health_patterns(state, district);