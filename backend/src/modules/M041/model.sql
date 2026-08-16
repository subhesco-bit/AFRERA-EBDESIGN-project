-- Village Registry Schema (M041)
-- Comprehensive village and community management

CREATE TABLE IF NOT EXISTS villages (
    village_id VARCHAR(50) PRIMARY KEY,
    village_name VARCHAR(200) NOT NULL,
    village_code VARCHAR(50) UNIQUE NOT NULL,
    district VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL,
    block VARCHAR(100),
    tehsil VARCHAR(100),
    gram_panchayat VARCHAR(100),
    population INTEGER,
    households INTEGER,
    area_sq_km DECIMAL(10,2),
    coordinates JSONB,
    elevation DECIMAL(10,2),
    climate_zone VARCHAR(50),
    soil_type VARCHAR(50),
    water_sources JSONB,
    infrastructure JSONB,
    agricultural_land_area DECIMAL(10,2),
    major_crops JSONB,
    livestock_count JSONB,
    ai_development_index DECIMAL(5,2),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS village_resources (
    resource_id VARCHAR(50) PRIMARY KEY,
    village_id VARCHAR(50) NOT NULL REFERENCES villages(village_id),
    resource_type VARCHAR(50),
    resource_name VARCHAR(200),
    capacity DECIMAL(15,2),
    current_utilization DECIMAL(5,2),
    condition VARCHAR(20),
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    responsible_person VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_villages_district ON villages(district);
CREATE INDEX idx_villages_state ON villages(state);
CREATE INDEX idx_villages_block ON villages(block);
CREATE INDEX idx_village_resources_village ON village_resources(village_id);
CREATE INDEX idx_village_resources_type ON village_resources(resource_type);
