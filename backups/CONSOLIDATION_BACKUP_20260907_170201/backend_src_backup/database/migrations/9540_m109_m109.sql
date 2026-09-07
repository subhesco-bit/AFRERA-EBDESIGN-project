-- Folded from backend/src/modules/M109/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- ﻿-- Spare Parts Management Schema (M109) / -- Spare parts inventory, procurement, and consumption tracking
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS spare_parts_procurement (
    procurement_id VARCHAR(50) PRIMARY KEY,
    part_id VARCHAR(50),
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

CREATE INDEX IF NOT EXISTS idx_spare_parts_procurement_part ON spare_parts_procurement(part_id);

CREATE INDEX IF NOT EXISTS idx_spare_parts_procurement_status ON spare_parts_procurement(status);

CREATE INDEX IF NOT EXISTS idx_parts_suppliers_state ON parts_suppliers(state);
