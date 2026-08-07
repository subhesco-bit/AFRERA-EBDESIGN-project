-- Nutrition Intelligence OS Database Schema
-- Enables value-based selling based on verified nutrition rather than weight

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- NUTRIENT DATABASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrient_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS nutrients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    symbol VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'PRO', 'CARB', 'FAT', 'VIT_C'
    category_id INTEGER REFERENCES nutrient_categories(id),
    unit VARCHAR(50) NOT NULL, -- e.g., 'g', 'mg', 'mcg', 'IU'
    daily_value DECIMAL(10, 2), -- Recommended daily value
    description TEXT,
    is_essential BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-populate nutrients
INSERT INTO nutrient_categories (name, description, display_order) VALUES
('Macronutrients', 'Energy-providing nutrients', 1),
('Micronutrients', 'Vitamins and minerals', 2),
('Phytonutrients', 'Plant-based beneficial compounds', 3),
('Other', 'Other nutritional components', 4);

INSERT INTO nutrients (name, symbol, category_id, unit, daily_value, description) VALUES
-- Macronutrients
('Protein', 'PRO', 1, 'g', 50.0, 'Essential for muscle building and repair'),
('Carbohydrates', 'CARB', 1, 'g', 300.0, 'Primary energy source'),
('Dietary Fiber', 'FIB', 1, 'g', 25.0, 'Essential for digestive health'),
('Total Fat', 'FAT', 1, 'g', 65.0, 'Energy storage and nutrient absorption'),
('Saturated Fat', 'SAT_FAT', 1, 'g', 20.0, 'Should be limited'),
('Trans Fat', 'TRANS_FAT', 1, 'g', 0.0, 'Should be avoided'),
('Cholesterol', 'CHOL', 1, 'mg', 300.0, 'Essential in limited amounts'),
-- Micronutrients - Vitamins
('Vitamin A', 'VIT_A', 2, 'mcg', 900.0, 'Vision and immune function'),
('Vitamin C', 'VIT_C', 2, 'mg', 90.0, 'Immune function and antioxidant'),
('Vitamin D', 'VIT_D', 2, 'mcg', 15.0, 'Bone health and immune function'),
('Vitamin E', 'VIT_E', 2, 'mg', 15.0, 'Antioxidant'),
('Vitamin K', 'VIT_K', 2, 'mcg', 120.0, 'Blood clotting'),
('Thiamin (B1)', 'VIT_B1', 2, 'mg', 1.2, 'Energy metabolism'),
('Riboflavin (B2)', 'VIT_B2', 2, 'mg', 1.3, 'Energy metabolism'),
('Niacin (B3)', 'VIT_B3', 2, 'mg', 16.0, 'Energy metabolism'),
('Vitamin B6', 'VIT_B6', 2, 'mg', 1.3, 'Protein metabolism'),
('Vitamin B12', 'VIT_B12', 2, 'mcg', 2.4, 'DNA synthesis'),
('Folate', 'FOL', 2, 'mcg', 400.0, 'DNA synthesis'),
-- Micronutrients - Minerals
('Calcium', 'CAL', 2, 'mg', 1000.0, 'Bone health'),
('Iron', 'IRON', 2, 'mg', 18.0, 'Blood formation'),
('Magnesium', 'MAG', 2, 'mg', 400.0, 'Bone and muscle function'),
('Phosphorus', 'PHOS', 2, 'mg', 1000.0, 'Bone health'),
('Potassium', 'POT', 2, 'mg', 4700.0, 'Blood pressure regulation'),
('Sodium', 'SOD', 2, 'mg', 2300.0, 'Fluid balance'),
('Zinc', 'ZINC', 2, 'mg', 11.0, 'Immune function'),
('Selenium', 'SEL', 2, 'mcg', 55.0, 'Antioxidant'),
-- Phytonutrients
('Antioxidants', 'ANTIOX', 3, 'units', NULL, 'Cell protection'),
('Flavonoids', 'FLAV', 3, 'mg', NULL, 'Anti-inflammatory'),
('Carotenoids', 'CAROT', 3, 'mcg', NULL, 'Vision and immunity'),
('Polyphenols', 'POLYPH', 3, 'mg', NULL, 'Heart health');

-- ============================================================================
-- FOOD NUTRITION DATABASE
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_nutrition_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    food_name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    food_group VARCHAR(100), -- 'grains', 'vegetables', 'fruits', 'proteins', 'dairy', 'fats'
    botanical_family VARCHAR(100),
    variety VARCHAR(100),
    origin_region VARCHAR(100),
    is_organic BOOLEAN DEFAULT FALSE,
    nutrition_data JSONB NOT NULL, -- Key-value pairs of nutrient_symbol: value_per_100g
    serving_size_g DECIMAL(10, 2),
    calories_per_100g DECIMAL(10, 2),
    glycemic_index INTEGER,
    glycemic_load DECIMAL(5, 2),
    anti-inflammatory_score INTEGER,
    antioxidant_capacity INTEGER, -- ORAC value
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_food_nutrition_name ON food_nutrition_profiles USING gin(to_tsvector('english', food_name));
CREATE INDEX idx_food_nutrition_group ON food_nutrition_profiles(food_group);

-- ============================================================================
-- PRODUCT NUTRITION
-- ============================================================================

CREATE TABLE IF NOT EXISTS product_nutrition (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    nutrition_profile_id UUID REFERENCES food_nutrition_profiles(id),
    lab_test_id UUID,
    test_date DATE,
    testing_laboratory VARCHAR(255),
    sample_batch_number VARCHAR(100),
    nutrition_data JSONB NOT NULL,
    calories_per_serving DECIMAL(10, 2),
    serving_size_g DECIMAL(10, 2),
    servings_per_container INTEGER,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_method VARCHAR(100), -- 'lab_test', 'calculation', 'database'
    confidence_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_nutrition_product ON product_nutrition(product_id);

-- ============================================================================
-- NUTRITION SCORING
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_scoring_models (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    scoring_algorithm JSONB NOT NULL, -- Weights for different nutrients
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_nutrition_scores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    scoring_model_id INTEGER REFERENCES nutrition_scoring_models(id),
    overall_score DECIMAL(5, 2),
    protein_score DECIMAL(5, 2),
    vitamin_score DECIMAL(5, 2),
    mineral_score DECIMAL(5, 2),
    fiber_score DECIMAL(5, 2),
    antioxidant_score DECIMAL(5, 2),
    anti_inflammatory_score DECIMAL(5, 2),
    grade VARCHAR(10), -- 'A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'F'
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_product_nutrition_scores_product ON product_nutrition_scores(product_id);

-- ============================================================================
-- VALUE-BASED PRICING
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_pricing_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    pricing_algorithm JSONB NOT NULL, -- Rules for pricing based on nutrition
    base_price_multiplier DECIMAL(5, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS product_nutrition_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    nutrition_score_id UUID REFERENCES product_nutrition_scores(id),
    pricing_rule_id INTEGER REFERENCES nutrition_pricing_rules(id),
    base_price DECIMAL(10, 2),
    nutrition_adjustment DECIMAL(10, 2),
    final_price DECIMAL(10, 2),
    price_premium_percentage DECIMAL(5, 2),
    value_factors JSONB, -- Breakdown of factors affecting price
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- NUTRITION RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dietary_profiles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    target_audience VARCHAR(100), -- 'general', 'diabetic', 'heart_disease', 'pregnant', 'elderly', 'children'
    nutrient_requirements JSONB NOT NULL, -- Required nutrients with min/max values
    avoid_nutrients TEXT[], -- Nutrients to avoid or limit
    preferred_foods TEXT[], -- Food groups to prefer
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS nutrition_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    dietary_profile_id INTEGER REFERENCES dietary_profiles(id),
    recommended_products JSONB, -- Array of product IDs with reasons
    daily_nutrition_targets JSONB,
    meal_plan_suggestions JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP
);

-- ============================================================================
-- NUTRITION LABELING
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_labels (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    label_type VARCHAR(50) NOT NULL, -- 'standard', 'simplified', 'detailed'
    label_data JSONB NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT TRUE
);

-- ============================================================================
-- NUTRITION COMPARISON
-- ============================================================================

CREATE TABLE IF NOT EXISTS nutrition_comparisons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_a_id UUID REFERENCES products(id),
    product_b_id UUID REFERENCES products(id),
    comparison_metrics JSONB NOT NULL, -- Side-by-side comparison data
    winner_product_id UUID REFERENCES products(id),
    comparison_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate nutrition score
CREATE OR REPLACE FUNCTION calculate_nutrition_score(
    nutrition_data JSONB,
    scoring_model_id INTEGER
)
RETURNS DECIMAL AS $$
DECLARE
    model_record RECORD;
    overall_score DECIMAL;
BEGIN
    SELECT * INTO model_record FROM nutrition_scoring_models WHERE id = scoring_model_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- Simple scoring algorithm (can be enhanced)
    -- This is a placeholder - actual implementation would use the scoring_algorithm JSON
    overall_score := 50.0; -- Base score
    
    -- Add points for high protein
    IF (nutrition_data->>'PRO')::DECIMAL > 10 THEN
        overall_score := overall_score + 10;
    END IF;
    
    -- Add points for high fiber
    IF (nutrition_data->>'FIB')::DECIMAL > 5 THEN
        overall_score := overall_score + 10;
    END IF;
    
    -- Deduct points for high saturated fat
    IF (nutrition_data->>'SAT_FAT')::DECIMAL > 5 THEN
        overall_score := overall_score - 10;
    END IF;
    
    -- Ensure score is within bounds
    overall_score := GREATEST(0, LEAST(overall_score, 100));
    
    RETURN overall_score;
END;
$$ LANGUAGE plpgsql;

-- Function to assign grade based on score
CREATE OR REPLACE FUNCTION assign_nutrition_grade(score DECIMAL)
RETURNS VARCHAR(10) AS $$
BEGIN
    IF score >= 95 THEN RETURN 'A+';
    ELSIF score >= 90 THEN RETURN 'A';
    ELSIF score >= 85 THEN RETURN 'B+';
    ELSIF score >= 80 THEN RETURN 'B';
    ELSIF score >= 75 THEN RETURN 'C+';
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

CREATE TRIGGER update_food_nutrition_profiles_updated_at BEFORE UPDATE ON food_nutrition_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_nutrition_updated_at BEFORE UPDATE ON product_nutrition
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
