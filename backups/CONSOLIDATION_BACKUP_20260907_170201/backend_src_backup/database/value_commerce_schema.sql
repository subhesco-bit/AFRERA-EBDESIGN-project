-- Value-Based Commerce OS Database Schema
-- Commerce platform based on value (nutrition, quality, sustainability) rather than weight

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- VALUE FACTORS
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_factors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL, -- 'nutrition', 'quality', 'sustainability', 'organic', 'gi', 'freshness'
    description TEXT,
    weight DECIMAL(5, 2) DEFAULT 1.0, -- Weight in overall value calculation
    measurement_method VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate value factors
INSERT INTO value_factors (name, code, category, description, weight) VALUES
('Nutrition Score', 'NUTRITION', 'nutrition', 'Overall nutritional quality score', 0.30),
('Organic Certification', 'ORGANIC', 'sustainability', 'Organic farming certification status', 0.20),
('GI Status', 'GI', 'quality', 'Geographical Indication status', 0.15),
('Freshness Score', 'FRESHNESS', 'quality', 'Product freshness assessment', 0.15),
('Sustainability Score', 'SUSTAINABILITY', 'sustainability', 'Environmental sustainability rating', 0.10),
('Quality Grade', 'QUALITY', 'quality', 'Overall quality grade', 0.10);

-- ============================================================================
-- VALUE CALCULATION MODELS
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_calculation_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    calculation_algorithm JSONB NOT NULL, -- Weights and formulas for value calculation
    base_value_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- PRODUCT VALUE SCORES
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_value_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    calculation_model_id INTEGER REFERENCES value_calculation_models(id),
    nutrition_score DECIMAL(5, 2),
    organic_score DECIMAL(5, 2),
    gi_score DECIMAL(5, 2),
    freshness_score DECIMAL(5, 2),
    sustainability_score DECIMAL(5, 2),
    quality_score DECIMAL(5, 2),
    overall_value_score DECIMAL(5, 2),
    value_grade VARCHAR(10), -- 'A+', 'A', 'B+', 'B', 'C', 'D'
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP
);

CREATE INDEX idx_product_value_scores_product ON product_value_scores(product_id);

-- ============================================================================
-- VALUE-BASED PRICING
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_pricing_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    pricing_algorithm JSONB NOT NULL,
    base_price_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    value_tier_premiums JSONB DEFAULT '{}', -- Premiums based on value grades
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_value_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    value_score_id UUID REFERENCES product_value_scores(id),
    pricing_rule_id INTEGER REFERENCES value_pricing_rules(id),
    base_price DECIMAL(10, 2) NOT NULL,
    value_premium DECIMAL(10, 2),
    final_price DECIMAL(10, 2) NOT NULL,
    premium_percentage DECIMAL(5, 2),
    value_factors_breakdown JSONB DEFAULT '{}',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_value_pricing_product ON product_value_pricing(product_id);

-- ============================================================================
-- VALUE TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_tiers (
    id SERIAL PRIMARY KEY,
    tier_name VARCHAR(50) UNIQUE NOT NULL,
    tier_description TEXT,
    min_score DECIMAL(5, 2),
    max_score DECIMAL(5, 2),
    premium_percentage DECIMAL(5, 2),
    badge_color VARCHAR(20),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- CONSUMER VALUE PREFERENCES
-- ============================================================================

CREATE TABLE IF NOT EXISTS consumer_value_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nutrition_importance DECIMAL(5, 2) DEFAULT 1.0,
    organic_importance DECIMAL(5, 2) DEFAULT 1.0,
    gi_importance DECIMAL(5, 2) DEFAULT 1.0,
    freshness_importance DECIMAL(5, 2) DEFAULT 1.0,
    sustainability_importance DECIMAL(5, 2) DEFAULT 1.0,
    quality_importance DECIMAL(5, 2) DEFAULT 1.0,
    min_value_score DECIMAL(5, 2),
    preferred_tiers TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consumer_value_preferences_user ON consumer_value_preferences(user_id);

-- ============================================================================
-- VALUE-BASED RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    recommendation_score DECIMAL(5, 2),
    recommendation_reasons TEXT[],
    value_match_score DECIMAL(5, 2),
    price_value_ratio DECIMAL(5, 2),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_value_recommendations_user ON value_recommendations(user_id);
CREATE INDEX idx_value_recommendations_product ON value_recommendations(product_id);

-- ============================================================================
-- VALUE ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS value_commerce_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL,
    total_products_scored INTEGER DEFAULT 0,
    average_value_score DECIMAL(5, 2),
    value_grade_distribution JSONB,
    total_value_premium DECIMAL(12, 2),
    value_based_sales_percentage DECIMAL(5, 2),
    consumer_satisfaction_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_value_commerce_analytics_date ON value_commerce_analytics(date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate overall value score
CREATE OR REPLACE FUNCTION calculate_value_score(
    nutrition_score DECIMAL,
    organic_score DECIMAL,
    gi_score DECIMAL,
    freshness_score DECIMAL,
    sustainability_score DECIMAL,
    quality_score DECIMAL
)
RETURNS DECIMAL AS $$
DECLARE
    overall_score DECIMAL;
BEGIN
    -- Weighted average based on value factor weights
    overall_score := 
        (nutrition_score * 0.30) +
        (organic_score * 0.20) +
        (gi_score * 0.15) +
        (freshness_score * 0.15) +
        (sustainability_score * 0.10) +
        (quality_score * 0.10);
    
    RETURN overall_score;
END;
$$ LANGUAGE plpgsql;

-- Function to assign value grade
CREATE OR REPLACE FUNCTION assign_value_grade(score DECIMAL)
RETURNS VARCHAR(10) AS $$
BEGIN
    IF score >= 95 THEN RETURN 'A+';
    ELSIF score >= 90 THEN RETURN 'A';
    ELSIF score >= 85 THEN RETURN 'B+';
    ELSIF score >= 80 THEN RETURN 'B';
    ELSIF score >= 70 THEN RETURN 'C';
    ELSIF score >= 60 THEN RETURN 'D';
    ELSE RETURN 'F';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate value-based price
CREATE OR REPLACE FUNCTION calculate_value_price(
    base_price DECIMAL,
    value_score DECIMAL,
    value_grade VARCHAR
)
RETURNS JSONB AS $$
DECLARE
    premium_percentage DECIMAL;
    value_premium DECIMAL;
    final_price DECIMAL;
BEGIN
    -- Calculate premium based on value grade
    IF value_grade = 'A+' THEN
        premium_percentage := 25.0;
    ELSIF value_grade = 'A' THEN
        premium_percentage := 20.0;
    ELSIF value_grade = 'B+' THEN
        premium_percentage := 15.0;
    ELSIF value_grade = 'B' THEN
        premium_percentage := 10.0;
    ELSIF value_grade = 'C' THEN
        premium_percentage := 5.0;
    ELSE
        premium_percentage := 0.0;
    END IF;
    
    value_premium := base_price * (premium_percentage / 100);
    final_price := base_price + value_premium;
    
    RETURN jsonb_build_object(
        'base_price', base_price,
        'value_premium', value_premium,
        'final_price', final_price,
        'premium_percentage', premium_percentage,
        'value_grade', value_grade,
        'value_score', value_score
    );
END;
$$ LANGUAGE plpgsql;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_consumer_value_preferences_updated_at BEFORE UPDATE ON consumer_value_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
