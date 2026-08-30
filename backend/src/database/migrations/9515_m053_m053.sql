-- Folded from backend/src/modules/M053/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Order Management Schema (M053) / -- Order processing, fulfillment, and tracking
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS order_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_fulfillment (
    fulfillment_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50),
    fulfillment_status VARCHAR(20) DEFAULT 'pending',
    warehouse_id VARCHAR(50),
    carrier_id VARCHAR(50),
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    actual_delivery DATE,
    fulfillment_details JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_tracking_order ON order_tracking(order_id);

CREATE INDEX IF NOT EXISTS idx_order_tracking_timestamp ON order_tracking(timestamp);

CREATE INDEX IF NOT EXISTS idx_order_fulfillment_order ON order_fulfillment(order_id);

CREATE INDEX IF NOT EXISTS idx_order_fulfillment_status ON order_fulfillment(fulfillment_status);
