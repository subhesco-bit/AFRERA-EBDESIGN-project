-- Food Intelligence OS Database Schema
-- Comprehensive food data, safety, quality, and intelligence

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- FOOD CATEGORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parent_id INTEGER REFERENCES food_categories(id),
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOD ITEMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    category_id INTEGER REFERENCES food_categories(id),
    food_group VARCHAR(100), -- 'grains', 'vegetables', 'fruits', 'proteins', 'dairy', 'fats', 'sweets'
    origin VARCHAR(100),
    variety VARCHAR(100),
    botanical_family VARCHAR(100),
    common_names TEXT[],
    description TEXT,
    is_organic BOOLEAN DEFAULT FALSE,
    is_gi BOOLEAN DEFAULT FALSE,
    gi_id UUID REFERENCES gi_products(id),
    shelf_life_days INTEGER,
    storage_conditions JSONB,
    allergens TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_items_name ON food_items USING gin(to_tsvector('english', name));
CREATE INDEX idx_food_items_category ON food_items(category_id);

-- ============================================================================
-- FOOD SAFETY
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_safety_standards (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    standard_code VARCHAR(100),
    issuing_authority VARCHAR(255), -- 'FSSAI', 'USDA', 'EFSA', 'ISO'
    description TEXT,
    applicable_categories TEXT[],
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_safety_certifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID REFERENCES food_items(id),
    safety_standard_id INTEGER REFERENCES food_safety_standards(id),
    certification_number VARCHAR(100),
    certification_date DATE,
    expiry_date DATE,
    certifying_body VARCHAR(255),
    test_results JSONB,
    compliance_status VARCHAR(20) DEFAULT 'compliant', -- 'compliant', 'non_compliant', 'conditional'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOD QUALITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_quality_parameters (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    parameter_code VARCHAR(50),
    unit VARCHAR(50),
    description TEXT,
    measurement_method VARCHAR(100),
    acceptable_range JSONB,
    is_critical BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_quality_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID REFERENCES food_items(id),
    assessment_date DATE NOT NULL,
    assessor_id VARCHAR(255),
    assessment_type VARCHAR(50), -- 'routine', 'complaint', 'audit'
    quality_scores JSONB NOT NULL, -- Key-value pairs of parameter_id: score
    overall_quality_score DECIMAL(5, 2),
    quality_grade VARCHAR(10), -- 'A+', 'A', 'B+', 'B', 'C', 'D'
    compliance_status VARCHAR(20),
    recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOD CONTAMINANTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS contaminant_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50), -- 'pesticide', 'heavy_metal', 'microbial', 'mycotoxin', 'additive'
    description TEXT,
    legal_limit DECIMAL(15, 6),
    legal_limit_unit VARCHAR(50),
    detection_method VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_contaminant_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID REFERENCES food_items(id),
    contaminant_id INTEGER REFERENCES contaminant_types(id),
    test_date DATE,
    testing_laboratory VARCHAR(255),
    contaminant_level DECIMAL(15, 6),
    unit VARCHAR(50),
    detection_limit DECIMAL(15, 6),
    result_status VARCHAR(20), -- 'not_detected', 'below_limit', 'above_limit', 'compliant', 'non_compliant'
    test_method VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOD FRESHNESS
-- ============================================================================

CREATE TABLE IF NOT EXISTS freshness_indicators (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    indicator_type VARCHAR(50), -- 'visual', 'sensory', 'chemical', 'microbial'
    description TEXT,
    measurement_method VARCHAR(100),
    scale_range JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS food_freshness_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID REFERENCES food_items(id),
    assessment_date DATE,
    freshness_scores JSONB NOT NULL,
    overall_freshness_score DECIMAL(5, 2),
    freshness_status VARCHAR(20), -- 'fresh', 'good', 'acceptable', 'poor', 'spoiled'
    estimated_remaining_days INTEGER,
    storage_recommendations TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOD RECALLS
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_recalls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID REFERENCES food_items(id),
    recall_number VARCHAR(100) UNIQUE NOT NULL,
    recall_date DATE NOT NULL,
    recall_type VARCHAR(50), -- 'voluntary', 'mandatory', 'market_withdrawal'
    recall_reason TEXT NOT NULL,
    hazard_level VARCHAR(20), -- 'low', 'medium', 'high', 'critical'
    affected_batches TEXT[],
    affected_regions TEXT[],
 recalling_firm VARCHAR(255),
    recall_status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'terminated'
    public_notification_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FOOD INTELLIGENCE
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_intelligence_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_item_id UUID REFERENCES food_items(id),
    date DATE NOT NULL,
    total_inspections INTEGER DEFAULT 0,
    quality_pass_rate DECIMAL(5, 2),
    safety_incidents INTEGER DEFAULT 0,
    consumer_complaints INTEGER DEFAULT 0,
    average_freshness_score DECIMAL(5, 2),
    market_price DECIMAL(10, 2),
    demand_index DECIMAL(5, 2),
    supply_index DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_intelligence_food ON food_intelligence_analytics(food_item_id);
CREATE INDEX idx_food_intelligence_date ON food_intelligence_analytics(date);

-- ============================================================================
-- FOOD RECIPES
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_recipes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cuisine VARCHAR(100),
    meal_type VARCHAR(50), -- 'breakfast', 'lunch', 'dinner', 'snack'
    preparation_time_minutes INTEGER,
    cooking_time_minutes INTEGER,
    servings INTEGER,
    difficulty_level VARCHAR(20), -- 'easy', 'medium', 'hard'
    ingredients JSONB NOT NULL, -- Array of {food_item_id, quantity, unit}
    instructions TEXT[],
    nutritional_info JSONB,
    allergen_warnings TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate overall quality score
CREATE OR REPLACE FUNCTION calculate_overall_quality_score(quality_scores JSONB)
RETURNS DECIMAL AS $$
DECLARE
    total_score DECIMAL;
    count INTEGER;
BEGIN
    SELECT SUM(score), COUNT(*) INTO total_score, count
    FROM jsonb_each_text(quality_scores) AS t(key, score);
    
    IF count = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN total_score / count;
END;
$$ LANGUAGE plpgsql;

-- Function to assign quality grade
CREATE OR REPLACE FUNCTION assign_quality_grade(score DECIMAL)
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

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_food_items_updated_at BEFORE UPDATE ON food_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_food_recipes_updated_at BEFORE UPDATE ON food_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
