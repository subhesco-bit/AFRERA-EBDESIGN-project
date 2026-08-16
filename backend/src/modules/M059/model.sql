-- Discount Management Schema (M059)
CREATE TABLE IF NOT EXISTS discounts (
    discount_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    discount_type VARCHAR(20) NOT NULL,
    value DECIMAL(15,2) NOT NULL,
    min_purchase DECIMAL(15,2),
    max_discount DECIMAL(15,2),
    start_date DATE,
    end_date DATE,
    applicable_products JSONB,
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_discounts_status ON discounts(status);
CREATE INDEX idx_discounts_dates ON discounts(start_date, end_date);
