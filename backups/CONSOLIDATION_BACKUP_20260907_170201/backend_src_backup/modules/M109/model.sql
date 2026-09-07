-- Spare Parts Management Schema (M109)
-- Spare parts inventory, procurement, and consumption tracking

CREATE TABLE IF NOT EXISTS spare_parts_inventory (
    part_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    part_name VARCHAR(200) NOT NULL,
    part_number VARCHAR(50),
    category VARCHAR(50) NOT NULL,
    brand VARCHAR(100),
    compatibility JSONB,
    quantity_in_stock INTEGER DEFAULT 0,
    reorder_level INTEGER DEFAULT 5,
    unit_cost DECIMAL(10,2),
    supplier VARCHAR(100),
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    status VARCHAR(20) DEFAULT 'in_stock',
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spare_parts_consumption (
    consumption_id VARCHAR(50) PRIMARY KEY,
    part_id VARCHAR(50) REFERENCES spare_parts_inventory(part_id),
    equipment_id VARCHAR(50),
    quantity INTEGER NOT NULL,
    used_by VARCHAR(50),
    work_order_id VARCHAR(50),
    consumption_date DATE NOT NULL,
    notes TEXT,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spare_parts_procurement (
    procurement_id VARCHAR(50) PRIMARY KEY,
    part_id VARCHAR(50) REFERENCES spare_parts_inventory(part_id),
    supplier VARCHAR(100) NOT NULL,
    quantity_ordered INTEGER NOT NULL,
    quantity_received INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(12,2),
    order_date DATE NOT NULL,
    expected_delivery_date DATE,
    actual_delivery_date DATE,
    status VARCHAR(20) DEFAULT 'ordered',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parts_suppliers (
    supplier_id VARCHAR(50) PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    location VARCHAR(200),
    state VARCHAR(50),
    rating DECIMAL(3,2),
    on_time_delivery_rate INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_spare_parts_farmer ON spare_parts_inventory(farmer_id);
CREATE INDEX idx_spare_parts_category ON spare_parts_inventory(category);
CREATE INDEX idx_spare_parts_status ON spare_parts_inventory(status);
CREATE INDEX idx_spare_parts_consumption_part ON spare_parts_consumption(part_id);
CREATE INDEX idx_spare_parts_consumption_date ON spare_parts_consumption(consumption_date);
CREATE INDEX idx_spare_parts_procurement_part ON spare_parts_procurement(part_id);
CREATE INDEX idx_spare_parts_procurement_status ON spare_parts_procurement(status);
CREATE INDEX idx_parts_suppliers_state ON parts_suppliers(state);
