-- Folded from backend/src/modules/M108/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Fuel Management Schema (M108) / -- Fuel inventory tracking, consumption monitoring, and cost optimization
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

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

CREATE INDEX IF NOT EXISTS idx_fuel_inventory_farmer ON fuel_inventory(farmer_id);

CREATE INDEX IF NOT EXISTS idx_fuel_inventory_type ON fuel_inventory(fuel_type);

CREATE INDEX IF NOT EXISTS idx_fuel_suppliers_state ON fuel_suppliers(state);
