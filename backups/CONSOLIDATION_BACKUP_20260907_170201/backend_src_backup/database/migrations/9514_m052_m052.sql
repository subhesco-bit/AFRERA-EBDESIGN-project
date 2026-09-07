-- Folded from backend/src/modules/M052/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Product Catalog Schema (M052) / -- Product catalog management with AI-powered recommendations
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS product_categories (
    category_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    parent_category_id VARCHAR(50),
    description TEXT,
    attributes_schema JSONB,
    image_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_recommendations (
    recommendation_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50),
    user_id VARCHAR(50),
    recommendation_type VARCHAR(50) NOT NULL,
    recommended_products JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory_logs (
    log_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    operation VARCHAR(20) NOT NULL,
    reference_id VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_category_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_product ON product_recommendations(product_id);

CREATE INDEX IF NOT EXISTS idx_product_recommendations_user ON product_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_product ON inventory_logs(product_id);

CREATE INDEX IF NOT EXISTS idx_inventory_logs_date ON inventory_logs(created_at);
