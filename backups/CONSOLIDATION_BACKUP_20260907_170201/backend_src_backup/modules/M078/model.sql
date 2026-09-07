-- Rainwater Harvesting Schema (M078)
-- Rainwater collection, storage management, and distribution systems

CREATE TABLE IF NOT EXISTS rainwater_harvesting_systems (
    system_id VARCHAR(50) PRIMARY KEY,
    location_id VARCHAR(50) NOT NULL,
    location_name VARCHAR(200) NOT NULL,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    catchment_area DECIMAL(15,2) NOT NULL,
    roof_area DECIMAL(15,2),
    land_area DECIMAL(15,2),
    storage_capacity DECIMAL(15,2) NOT NULL,
    intended_use VARCHAR(50) NOT NULL,
    budget DECIMAL(15,2) NOT NULL,
    design_specifications JSONB,
    status VARCHAR(20) DEFAULT 'designed',
    ai_design JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rainfall_records (
    record_id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES rainwater_harvesting_systems(system_id),
    location_id VARCHAR(50) NOT NULL,
    record_date DATE NOT NULL,
    rainfall_mm DECIMAL(10,2) NOT NULL,
    duration_hours DECIMAL(5,2),
    intensity VARCHAR(20),
    source VARCHAR(50),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_records (
    collection_id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES rainwater_harvesting_systems(system_id),
    collection_date DATE NOT NULL,
    collected_liters DECIMAL(15,2) NOT NULL,
    efficiency_percentage DECIMAL(5,2),
    collection_method VARCHAR(50),
    quality_score DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS storage_tanks (
    tank_id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES rainwater_harvesting_systems(system_id),
    tank_type VARCHAR(50) NOT NULL,
    total_capacity DECIMAL(15,2) NOT NULL,
    current_level DECIMAL(15,2) NOT NULL,
    installation_date DATE,
    location_coordinates VARCHAR(100),
    material VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS distribution_points (
    point_id VARCHAR(50) PRIMARY KEY,
    system_id VARCHAR(50) REFERENCES rainwater_harvesting_systems(system_id),
    point_type VARCHAR(50) NOT NULL,
    location VARCHAR(200) NOT NULL,
    connection_type VARCHAR(50),
    capacity DECIMAL(15,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rainfall_patterns (
    pattern_id SERIAL PRIMARY KEY,
    state VARCHAR(50) NOT NULL,
    district VARCHAR(50) NOT NULL,
    month INTEGER NOT NULL,
    average_rainfall_mm DECIMAL(10,2),
    min_rainfall_mm DECIMAL(10,2),
    max_rainfall_mm DECIMAL(10,2),
    rainy_days INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_harvesting_systems_location ON rainwater_harvesting_systems(location_id);
CREATE INDEX idx_rainfall_records_system ON rainfall_records(system_id);
CREATE INDEX idx_rainfall_records_date ON rainfall_records(record_date);
CREATE INDEX idx_collection_records_system ON collection_records(system_id);
CREATE INDEX idx_storage_tanks_system ON storage_tanks(system_id);
CREATE INDEX idx_distribution_points_system ON distribution_points(system_id);
CREATE INDEX idx_rainfall_patterns_location ON rainfall_patterns(state, district);
