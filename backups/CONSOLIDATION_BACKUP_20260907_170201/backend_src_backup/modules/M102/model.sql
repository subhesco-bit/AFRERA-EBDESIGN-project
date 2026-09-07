-- Implement Management Schema (M102)
-- Agricultural implement inventory, maintenance, and usage tracking

CREATE TABLE IF NOT EXISTS implement_registry (
    implement_registry_id VARCHAR(50) PRIMARY KEY,
    implement_id VARCHAR(50) UNIQUE NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    implement_type VARCHAR(50) NOT NULL,
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(50),
    width DECIMAL(5,2),
    working_width DECIMAL(5,2),
    compatible_tractor_hp INTEGER,
    purchase_date DATE,
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    condition VARCHAR(20) DEFAULT 'good',
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS implement_maintenance_records (
    record_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES implement_registry(implement_registry_id),
    maintenance_type VARCHAR(50) NOT NULL,
    service_date DATE NOT NULL,
    parts_replaced JSONB,
    labor_cost DECIMAL(10,2),
    parts_cost DECIMAL(10,2),
    service_center VARCHAR(200),
    condition_after VARCHAR(20),
    next_service_date DATE,
    notes TEXT,
    ai_analysis JSONB,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS implement_usage_logs (
    usage_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES implement_registry(implement_registry_id),
    field_id VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    area_covered DECIMAL(10,2),
    depth_applied DECIMAL(5,2),
    tractor_id VARCHAR(50),
    operator_id VARCHAR(50),
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS implement_condition_assessments (
    assessment_id VARCHAR(50) PRIMARY KEY,
    registry_id VARCHAR(50) REFERENCES implement_registry(implement_registry_id),
    assessment_date DATE NOT NULL,
    overall_condition VARCHAR(20),
    blade_condition VARCHAR(20),
    bearing_condition VARCHAR(20),
    structural_condition VARCHAR(20),
    wear_percentage INTEGER,
    replacement_needed BOOLEAN,
    next_assessment_date DATE,
    assessed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_implement_registry_farmer ON implement_registry(farmer_id);
CREATE INDEX idx_implement_registry_type ON implement_registry(implement_type);
CREATE INDEX idx_implement_registry_status ON implement_registry(status);
CREATE INDEX idx_implement_maintenance_registry ON implement_maintenance_records(registry_id);
CREATE INDEX idx_implement_maintenance_date ON implement_maintenance_records(service_date);
CREATE INDEX idx_implement_usage_registry ON implement_usage_logs(registry_id);
CREATE INDEX idx_implement_usage_dates ON implement_usage_logs(start_time, end_time);
CREATE INDEX idx_implement_condition_registry ON implement_condition_assessments(registry_id);
CREATE INDEX idx_implement_condition_date ON implement_condition_assessments(assessment_date);
