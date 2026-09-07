-- Pricing Management Schema (M055)
-- Dynamic pricing with AI-powered optimization

CREATE TABLE IF NOT EXISTS pricing_rules (
    rule_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50),
    rule_name VARCHAR(200) NOT NULL,
    rule_type VARCHAR(50) NOT NULL,
    base_price DECIMAL(15,2) NOT NULL,
    conditions JSONB,
    adjustments JSONB,
    status VARCHAR(20) DEFAULT 'active',
    ai_recommendations JSONB,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS price_history (
    history_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    rule_id VARCHAR(50),
    context JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS demand_forecasts (
    forecast_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    forecast_period VARCHAR(20) NOT NULL,
    predicted_demand INTEGER NOT NULL,
    confidence_score DECIMAL(3,2),
    factors JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS competitor_pricing (
    competitor_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    competitor_name VARCHAR(100) NOT NULL,
    price DECIMAL(15,2) NOT NULL,
    last_observed TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    url VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS price_elasticity (
    elasticity_id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL,
    elasticity_coefficient DECIMAL(10,4),
    sensitivity_level VARCHAR(20),
    optimal_price_point DECIMAL(15,2),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pricing_rules_product ON pricing_rules(product_id);
CREATE INDEX idx_pricing_rules_status ON pricing_rules(status);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_price_history_product ON price_history(product_id);
CREATE INDEX idx_price_history_date ON price_history(created_at);
CREATE INDEX idx_demand_forecasts_product ON demand_forecasts(product_id);
CREATE INDEX idx_demand_forecasts_period ON demand_forecasts(forecast_period);
CREATE INDEX idx_competitor_pricing_product ON competitor_pricing(product_id);
CREATE INDEX idx_price_elasticity_product ON price_elasticity(product_id);
