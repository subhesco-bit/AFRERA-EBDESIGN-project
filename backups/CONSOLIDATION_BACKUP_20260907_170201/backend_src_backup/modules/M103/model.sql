-- Equipment Inventory Schema (M103)
-- Comprehensive equipment inventory management, tracking, and optimization

CREATE TABLE IF NOT EXISTS equipment_inventory (
    equipment_registry_id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    equipment_category VARCHAR(50) NOT NULL,
    equipment_name VARCHAR(200) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(50),
    specifications JSONB,
    purchase_date DATE,
    purchase_cost DECIMAL(12,2),
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    condition VARCHAR(20) DEFAULT 'good',
    status VARCHAR(20) DEFAULT 'available',
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_status_history (
    history_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES equipment_inventory(equipment_registry_id),
    status VARCHAR(20) NOT NULL,
    condition VARCHAR(20),
    location VARCHAR(200),
    notes TEXT,
    ai_analysis JSONB,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_usage_logs (
    usage_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES equipment_inventory(equipment_registry_id),
    operation_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    operator_id VARCHAR(50),
    field_id VARCHAR(50),
    usage_notes TEXT,
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS equipment_maintenance_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES equipment_inventory(equipment_registry_id),
    maintenance_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    service_center VARCHAR(200),
    cost DECIMAL(10,2),
    parts_replaced JSONB,
    next_service_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_inventory_farmer ON equipment_inventory(farmer_id);
CREATE INDEX idx_equipment_inventory_category ON equipment_inventory(equipment_category);
CREATE INDEX idx_equipment_inventory_status ON equipment_inventory(status);
CREATE INDEX idx_equipment_status_registry ON equipment_status_history(registry_id);
CREATE INDEX idx_equipment_usage_registry ON equipment_usage_logs(registry_id);
CREATE INDEX idx_equipment_usage_dates ON equipment_usage_logs(start_time, end_time);
CREATE INDEX idx_equipment_maintenance_registry ON equipment_maintenance_records(registry_id);
CREATE INDEX idx_equipment_maintenance_date ON equipment_maintenance_records(service_date);
