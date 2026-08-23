-- Schema for the 8 Input Supply-domain CRUD resources backing
-- backend/src/services/inputSupplyManagementService.js. Columns match the
-- ResourceManager `fields` already shipped on
-- frontend/src/pages/InputSupplyManagementPage.jsx - taken directly from
-- that UI, not invented.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS biofertilizer_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    biofert_type VARCHAR(50) NOT NULL DEFAULT 'Rhizobium',
    supplier VARCHAR(200),
    quantity_kg NUMERIC(12,2),
    batch_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS pesticide_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'Insecticide',
    supplier VARCHAR(200),
    quantity_liters NUMERIC(12,2),
    registration_number VARCHAR(100),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_pesticide_inventory_expiry ON pesticide_inventory(expiry_date);

CREATE TABLE IF NOT EXISTS bio_pesticide_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    biopesticide_type VARCHAR(50) NOT NULL DEFAULT 'Neem-based',
    supplier VARCHAR(200),
    quantity_liters NUMERIC(12,2),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS micronutrient_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    nutrient VARCHAR(50) NOT NULL DEFAULT 'Zinc',
    supplier VARCHAR(200),
    quantity_kg NUMERIC(12,2),
    expiry_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS organic_input_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_name VARCHAR(200) NOT NULL,
    input_type VARCHAR(50) NOT NULL DEFAULT 'Vermicompost',
    supplier VARCHAR(200),
    quantity_kg NUMERIC(12,2),
    certified_organic VARCHAR(5) DEFAULT 'No',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS input_procurement_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(200) NOT NULL,
    vendor_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,2),
    unit_cost NUMERIC(12,2),
    order_date DATE,
    status VARCHAR(20) DEFAULT 'Requested',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_input_procurement_orders_status ON input_procurement_orders(status);

CREATE TABLE IF NOT EXISTS input_distribution_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(200) NOT NULL,
    channel VARCHAR(30) DEFAULT 'Dealer',
    recipient_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,2),
    distributed_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS input_traceability_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(200) NOT NULL,
    batch_number VARCHAR(100) NOT NULL,
    stage VARCHAR(30) DEFAULT 'Manufactured',
    location VARCHAR(200),
    recorded_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_input_traceability_records_batch ON input_traceability_records(batch_number);
