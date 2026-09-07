-- AI Copilot Framework Database Schema
-- CAP-224 to CAP-230: Finance Copilot, Logistics Copilot, Warehouse Copilot,
-- Insurance Copilot, Nutrition Copilot, Marketplace Copilot, Copilot Framework

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- COPILOT SESSIONS (CAP-230)
-- ============================================================================

CREATE TABLE IF NOT EXISTS copilot_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    copilot_type VARCHAR(50) NOT NULL,
    context JSONB,
    session_metadata JSONB,
    status VARCHAR(50) DEFAULT 'active',
    message_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

CREATE INDEX idx_copilot_sessions_user ON copilot_sessions(user_id);
CREATE INDEX idx_copilot_sessions_type ON copilot_sessions(copilot_type);
CREATE INDEX idx_copilot_sessions_status ON copilot_sessions(status);
CREATE INDEX idx_copilot_sessions_created ON copilot_sessions(created_at DESC);

-- ============================================================================
-- COPILOT MESSAGES (CAP-230)
-- ============================================================================

CREATE TABLE IF NOT EXISTS copilot_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL,
    role VARCHAR(20) NOT NULL, -- 'user', 'assistant', 'system'
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    context JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_copilot_messages_session ON copilot_messages(session_id);
CREATE INDEX idx_copilot_messages_created ON copilot_messages(created_at ASC);

-- ============================================================================
-- FINANCE COPILOT DATA (CAP-224)
-- ============================================================================

CREATE TABLE IF NOT EXISTS finance_copilot_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data_type VARCHAR(50),
    financial_data JSONB,
    analytics JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_finance_copilot_user ON finance_copilot_data(user_id);
CREATE INDEX idx_finance_copilot_type ON finance_copilot_data(data_type);

-- ============================================================================
-- LOGISTICS COPILOT DATA (CAP-225)
-- ============================================================================

CREATE TABLE IF NOT EXISTS logistics_copilot_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data_type VARCHAR(50),
    route_data JSONB,
    fleet_data JSONB,
    optimization_results JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logistics_copilot_user ON logistics_copilot_data(user_id);
CREATE INDEX idx_logistics_copilot_type ON logistics_copilot_data(data_type);

-- ============================================================================
-- WAREHOUSE COPILOT DATA (CAP-226)
-- ============================================================================

CREATE TABLE IF NOT EXISTS warehouse_copilot_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    warehouse_id INTEGER,
    data_type VARCHAR(50),
    inventory_data JSONB,
    layout_data JSONB,
    optimization_suggestions JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_warehouse_copilot_user ON warehouse_copilot_data(user_id);
CREATE INDEX idx_warehouse_copilot_warehouse ON warehouse_copilot_data(warehouse_id);

-- ============================================================================
-- INSURANCE COPILOT DATA (CAP-227)
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_copilot_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data_type VARCHAR(50),
    policy_data JSONB,
    claims_data JSONB,
    risk_assessment JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_insurance_copilot_user ON insurance_copilot_data(user_id);
CREATE INDEX idx_insurance_copilot_type ON insurance_copilot_data(data_type);

-- ============================================================================
-- NUTRITION COPILOT DATA (CAP-228)
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_copilot_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data_type VARCHAR(50),
    dietary_data JSONB,
    meal_plans JSONB,
    nutritional_analysis JSONB,
    recommendations JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_nutrition_copilot_user ON nutrition_copilot_data(user_id);
CREATE INDEX idx_nutrition_copilot_type ON nutrition_copilot_data(data_type);

-- ============================================================================
-- MARKETPLACE COPILOT DATA (CAP-229)
-- ============================================================================

CREATE TABLE IF NOT EXISTS marketplace_copilot_data (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    data_type VARCHAR(50),
    market_data JSONB,
    pricing_data JSONB,
    product_recommendations JSONB,
    trend_analysis JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_marketplace_copilot_user ON marketplace_copilot_data(user_id);
CREATE INDEX idx_marketplace_copilot_type ON marketplace_copilot_data(data_type);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to all relevant tables
CREATE TRIGGER update_copilot_sessions_updated_at BEFORE UPDATE ON copilot_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_finance_copilot_data_updated_at BEFORE UPDATE ON finance_copilot_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_logistics_copilot_data_updated_at BEFORE UPDATE ON logistics_copilot_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_copilot_data_updated_at BEFORE UPDATE ON warehouse_copilot_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_insurance_copilot_data_updated_at BEFORE UPDATE ON insurance_copilot_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nutrition_copilot_data_updated_at BEFORE UPDATE ON nutrition_copilot_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_copilot_data_updated_at BEFORE UPDATE ON marketplace_copilot_data
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
