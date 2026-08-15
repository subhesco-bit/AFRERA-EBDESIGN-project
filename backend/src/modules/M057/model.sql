-- Shipping Management Schema (M057)
CREATE TABLE IF NOT EXISTS shipments (
    shipment_id VARCHAR(50) PRIMARY KEY,
    order_id VARCHAR(50) NOT NULL,
    shipping_address JSONB NOT NULL,
    delivery_method VARCHAR(50) NOT NULL,
    items JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',
    current_location VARCHAR(200),
    tracking_number VARCHAR(100),
    estimated_delivery DATE,
    actual_delivery DATE,
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipment_tracking (
    tracking_id VARCHAR(50) PRIMARY KEY,
    shipment_id VARCHAR(50) REFERENCES shipments(shipment_id),
    status VARCHAR(50) NOT NULL,
    location VARCHAR(200),
    notes TEXT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_shipments_order ON shipments(order_id);
CREATE INDEX idx_shipments_status ON shipments(status);
CREATE INDEX idx_shipment_tracking_shipment ON shipment_tracking(shipment_id);
