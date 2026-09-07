-- Breakdown Maintenance Schema (M107)
-- Equipment breakdown management, emergency repairs, and downtime tracking

CREATE TABLE IF NOT EXISTS equipment_breakdowns (
    breakdown_id VARCHAR(50) PRIMARY KEY,
    equipment_id VARCHAR(50) NOT NULL,
    equipment_type VARCHAR(50) NOT NULL,
    farmer_id VARCHAR(50) NOT NULL,
    breakdown_date DATE NOT NULL,
    breakdown_time TIME,
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    symptoms JSONB,
    severity VARCHAR(20) DEFAULT 'medium',
    reported_by VARCHAR(50),
    operator_notes TEXT,
    status VARCHAR(20) DEFAULT 'reported',
    ai_diagnosis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS emergency_repairs (
    repair_id VARCHAR(50) PRIMARY KEY,
    breakdown_id VARCHAR(50) REFERENCES equipment_breakdowns(breakdown_id),
    technician_id VARCHAR(50),
    estimated_arrival TIMESTAMP,
    actual_arrival TIMESTAMP,
    priority VARCHAR(20) DEFAULT 'high',
    required_parts JSONB,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    repair_notes TEXT,
    status VARCHAR(20) DEFAULT 'scheduled',
    ai_optimization JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS downtime_logs (
    downtime_id VARCHAR(50) PRIMARY KEY,
    breakdown_id VARCHAR(50) REFERENCES equipment_breakdowns(breakdown_id),
    equipment_id VARCHAR(50) NOT NULL,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    total_hours DECIMAL(10,2),
    cost_impact DECIMAL(12,2),
    affected_operations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS repair_parts_inventory (
    part_id VARCHAR(50) PRIMARY KEY,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(50),
    category VARCHAR(50),
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    location VARCHAR(200),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_equipment_breakdowns_equipment ON equipment_breakdowns(equipment_id);
CREATE INDEX idx_equipment_breakdowns_farmer ON equipment_breakdowns(farmer_id);
CREATE INDEX idx_equipment_breakdowns_date ON equipment_breakdowns(breakdown_date);
CREATE INDEX idx_equipment_breakdowns_status ON equipment_breakdowns(status);
CREATE INDEX idx_emergency_repairs_breakdown ON emergency_repairs(breakdown_id);
CREATE INDEX idx_emergency_repairs_technician ON emergency_repairs(technician_id);
CREATE INDEX idx_emergency_repairs_status ON emergency_repairs(status);
CREATE INDEX idx_downtime_logs_equipment ON downtime_logs(equipment_id);
CREATE INDEX idx_downtime_logs_dates ON downtime_logs(start_time, end_time);
CREATE INDEX idx_repair_parts_category ON repair_parts_inventory(category);
