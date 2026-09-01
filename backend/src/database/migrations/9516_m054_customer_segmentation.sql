-- Folded from backend/src/modules/M054/model.sql (AUDIT_DB.md Finding 11/13 remediation)
-- Customer Management Schema (M054) / -- Customer profile management with AI-powered insights
-- Generated 2026-08-30 — DB linkage fix, see .ai/tasks/ACTIVE.md

CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(100) UNIQUE,
    phone VARCHAR(20),
    address JSONB,
    customer_type VARCHAR(50) NOT NULL,
    business_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_preferences (
    preference_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
    preferred_categories JSONB,
    preferred_products JSONB,
    communication_preferences JSONB,
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(10) DEFAULT 'INR',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customer_segment_assignments (
    assignment_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
    segment_id VARCHAR(50),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    confidence_score DECIMAL(3,2)
);

CREATE TABLE IF NOT EXISTS customer_insights (
    insight_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES customers(customer_id) ON DELETE CASCADE,
    insight_type VARCHAR(50) NOT NULL,
    insights JSONB NOT NULL,
    recommendations JSONB,
    churn_risk JSONB,
    lifetime_value DECIMAL(15,2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(customer_type);

CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

CREATE INDEX IF NOT EXISTS idx_customer_preferences_customer ON customer_preferences(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_segment_assignments_customer ON customer_segment_assignments(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_segment_assignments_segment ON customer_segment_assignments(segment_id);

CREATE INDEX IF NOT EXISTS idx_customer_insights_customer ON customer_insights(customer_id);

CREATE INDEX IF NOT EXISTS idx_customer_insights_type ON customer_insights(insight_type);
