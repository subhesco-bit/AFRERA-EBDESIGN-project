-- Schema recovery for M102 (Implement Management), M103 (Equipment
-- Inventory), M108 (Fuel Management), M109 (Spare Parts Management) -
-- real, substantial (400-500 line) service.js files in backend/src/modules
-- whose tables were never created by any migration - same "relation does
-- not exist" class of bug as the M010/M078/M104/M107/M012/M087/M110
-- recovery migrations. Columns taken directly from each service's own real
-- INSERT statements. M104 (equipment_rental_listings/bookings) and M107
-- (equipment_breakdowns/emergency_repairs) already have their tables from
-- an earlier recovery migration and are not repeated here.

CREATE TABLE IF NOT EXISTS implement_registry (
    implement_registry_id VARCHAR(64) PRIMARY KEY,
    implement_id VARCHAR(64),
    farmer_id UUID REFERENCES farmers(id),
    implement_type VARCHAR(100),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(100),
    width NUMERIC(8,2),
    working_width NUMERIC(8,2),
    compatible_tractor_hp NUMERIC(8,2),
    purchase_date DATE,
    location VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    condition VARCHAR(20) DEFAULT 'good',
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_implement_registry_farmer ON implement_registry(farmer_id);

CREATE TABLE IF NOT EXISTS equipment_inventory (
    equipment_registry_id VARCHAR(64) PRIMARY KEY,
    equipment_id VARCHAR(64),
    farmer_id UUID REFERENCES farmers(id),
    equipment_category VARCHAR(100),
    equipment_name VARCHAR(200),
    brand VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    serial_number VARCHAR(100),
    specifications JSONB DEFAULT '{}',
    purchase_date DATE,
    purchase_cost NUMERIC(14,2),
    location VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    condition VARCHAR(20) DEFAULT 'good',
    status VARCHAR(20) DEFAULT 'available',
    ai_recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_equipment_inventory_farmer ON equipment_inventory(farmer_id);

CREATE TABLE IF NOT EXISTS fuel_purchases (
    purchase_id VARCHAR(64) PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id),
    fuel_type VARCHAR(30),
    quantity_liters NUMERIC(10,2),
    cost_per_liter NUMERIC(10,2),
    total_cost NUMERIC(14,2),
    supplier VARCHAR(200),
    purchase_date DATE,
    location VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    vehicle_id VARCHAR(64),
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_fuel_purchases_farmer ON fuel_purchases(farmer_id);

CREATE TABLE IF NOT EXISTS fuel_consumption (
    consumption_id VARCHAR(64) PRIMARY KEY,
    vehicle_id VARCHAR(64),
    equipment_id VARCHAR(64),
    fuel_type VARCHAR(30),
    quantity_liters NUMERIC(10,2),
    odometer_reading NUMERIC(12,2),
    work_hours NUMERIC(8,2),
    operation_type VARCHAR(100),
    operator_id VARCHAR(64),
    consumption_date DATE,
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS spare_parts_inventory (
    part_id VARCHAR(64) PRIMARY KEY,
    farmer_id UUID REFERENCES farmers(id),
    part_name VARCHAR(200),
    part_number VARCHAR(100),
    category VARCHAR(100),
    brand VARCHAR(100),
    compatibility JSONB DEFAULT '[]',
    quantity_in_stock NUMERIC(10,2),
    reorder_level NUMERIC(10,2),
    unit_cost NUMERIC(12,2),
    supplier VARCHAR(200),
    location VARCHAR(255),
    state VARCHAR(100),
    district VARCHAR(100),
    status VARCHAR(20) DEFAULT 'in_stock',
    ai_recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_spare_parts_inventory_farmer ON spare_parts_inventory(farmer_id);

CREATE TABLE IF NOT EXISTS spare_parts_consumption (
    consumption_id VARCHAR(64) PRIMARY KEY,
    part_id VARCHAR(64) REFERENCES spare_parts_inventory(part_id) ON DELETE CASCADE,
    equipment_id VARCHAR(64),
    quantity NUMERIC(10,2),
    used_by VARCHAR(200),
    work_order_id VARCHAR(64),
    consumption_date DATE,
    notes TEXT,
    ai_analysis JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
