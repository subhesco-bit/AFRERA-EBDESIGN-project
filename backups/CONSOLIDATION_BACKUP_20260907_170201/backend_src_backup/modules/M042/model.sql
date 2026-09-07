-- Equipment Inventory Schema (M042)
-- Farm equipment inventory management with AI-powered maintenance prediction

CREATE TABLE IF NOT EXISTS equipment_inventory (
    equipment_id VARCHAR(50) PRIMARY KEY,
    equipment_name VARCHAR(200) NOT NULL,
    equipment_code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    manufacturer VARCHAR(100),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    purchase_date DATE,
    purchase_cost DECIMAL(15,2),
    current_value DECIMAL(15,2),
    expected_lifespan_years INTEGER,
    current_age_years INTEGER,
    condition VARCHAR(20),
    location VARCHAR(200),
    owner_id VARCHAR(50),
    owner_type VARCHAR(20),
    specifications JSONB,
    operating_hours INTEGER,
    fuel_type VARCHAR(50),
    power_rating DECIMAL(10,2),
    maintenance_interval_days INTEGER,
    last_maintenance_date DATE,
    next_maintenance_date DATE,
    ai_health_score DECIMAL(5,2),
    ai_maintenance_prediction JSONB,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_usage_log (
    usage_id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) NOT NULL REFERENCES equipment_inventory(equipment_id),
    user_id VARCHAR(50),
    usage_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    hours_used DECIMAL(5,2),
    task_performed VARCHAR(200),
    location VARCHAR(200),
    fuel_consumed DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_inventory_category ON equipment_inventory(category);
CREATE INDEX idx_equipment_inventory_owner ON equipment_inventory(owner_id);
CREATE INDEX idx_equipment_inventory_status ON equipment_inventory(status);
CREATE INDEX idx_equipment_usage_log_equipment ON equipment_usage_log(equipment_id);
CREATE INDEX idx_equipment_usage_log_date ON equipment_usage_log(usage_date);
