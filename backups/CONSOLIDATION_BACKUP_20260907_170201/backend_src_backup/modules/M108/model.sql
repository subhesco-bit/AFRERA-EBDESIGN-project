-- Fuel Management Schema (M108)
-- Fuel inventory tracking, consumption monitoring, and cost optimization

CREATE TABLE IF NOT EXISTS fuel_purchases (
    purchase_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    quantity_liters DECIMAL(10,2) NOT NULL,
    cost_per_liter DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(12,2) NOT NULL,
    supplier VARCHAR(100),
    purchase_date DATE NOT NULL,
    location VARCHAR(200),
    state VARCHAR(50),
    district VARCHAR(50),
    vehicle_id VARCHAR(50),
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_consumption (
    consumption_id VARCHAR(50) PRIMARY KEY,
    vehicle_id VARCHAR(50),
    equipment_id VARCHAR(50),
    fuel_type VARCHAR(20) NOT NULL,
    quantity_liters DECIMAL(10,2) NOT NULL,
    odometer_reading INTEGER,
    work_hours DECIMAL(5,2),
    operation_type VARCHAR(50),
    operator_id VARCHAR(50),
    consumption_date DATE NOT NULL,
    ai_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_inventory (
    inventory_id VARCHAR(50) PRIMARY KEY,
    farmer_id VARCHAR(50) NOT NULL,
    fuel_type VARCHAR(20) NOT NULL,
    storage_location VARCHAR(200),
    current_quantity DECIMAL(10,2) DEFAULT 0,
    capacity DECIMAL(10,2),
    reorder_level DECIMAL(10,2),
    last_refill_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fuel_suppliers (
    supplier_id VARCHAR(50) PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL,
    fuel_types JSONB,
    contact_person VARCHAR(100),
    phone VARCHAR(20),
    email VARCHAR(100),
    location VARCHAR(200),
    state VARCHAR(50),
    rating DECIMAL(3,2),
    reliability_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fuel_purchases_farmer ON fuel_purchases(farmer_id);
CREATE INDEX idx_fuel_purchases_date ON fuel_purchases(purchase_date);
CREATE INDEX idx_fuel_purchases_type ON fuel_purchases(fuel_type);
CREATE INDEX idx_fuel_consumption_vehicle ON fuel_consumption(vehicle_id);
CREATE INDEX idx_fuel_consumption_date ON fuel_consumption(consumption_date);
CREATE INDEX idx_fuel_consumption_type ON fuel_consumption(fuel_type);
CREATE INDEX idx_fuel_inventory_farmer ON fuel_inventory(farmer_id);
CREATE INDEX idx_fuel_inventory_type ON fuel_inventory(fuel_type);
CREATE INDEX idx_fuel_suppliers_state ON fuel_suppliers(state);
