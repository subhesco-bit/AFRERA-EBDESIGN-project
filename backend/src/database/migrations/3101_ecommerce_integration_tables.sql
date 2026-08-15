-- ============================================================================
-- AFRERA E-Commerce Integration Database Schema
-- Cross-module integration between E-commerce and:
-- - Nutrition Intelligence
-- - Recipe Intelligence
-- - Consumer Health
-- - Nutrient Calculator
-- - Dietitian Services
-- ============================================================================

-- Add nutrition-related columns to product_listings table
ALTER TABLE product_listings
ADD COLUMN IF NOT EXISTS nutrition_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS nutrition_grade VARCHAR(2),
ADD COLUMN IF NOT EXISTS nutrition_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allergens TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS dietary_compatibility TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS verified_nutrition BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS nutrition_verified_by VARCHAR(50),
ADD COLUMN IF NOT EXISTS nutrition_verified_at TIMESTAMP;

-- Create indexes for nutrition columns
CREATE INDEX IF NOT EXISTS idx_product_listings_nutrition_score ON product_listings(nutrition_score);
CREATE INDEX IF NOT EXISTS idx_product_listings_nutrition_grade ON product_listings(nutrition_grade);
CREATE INDEX IF NOT EXISTS idx_product_listings_dietary_compatibility ON product_listings USING GIN(dietary_compatibility);
CREATE INDEX IF NOT EXISTS idx_product_listings_allergens ON product_listings USING GIN(allergens);

-- Dietitian Collections Table
CREATE TABLE IF NOT EXISTS dietitian_collections (
    id VARCHAR(50) PRIMARY KEY,
    collection_name VARCHAR(255) NOT NULL,
    description TEXT,
    dietitian_id VARCHAR(50) REFERENCES users(id),
    dietary_focus TEXT[] DEFAULT '{}',
    health_goals TEXT[] DEFAULT '{}',
    target_audience VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    rating DECIMAL(3, 2) DEFAULT 0.0,
    review_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for dietitian_collections
CREATE INDEX IF NOT EXISTS idx_dietitian_collections_dietitian ON dietitian_collections(dietitian_id);
CREATE INDEX IF NOT EXISTS idx_dietitian_collections_dietary_focus ON dietitian_collections USING GIN(dietary_focus);
CREATE INDEX IF NOT EXISTS idx_dietitian_collections_health_goals ON dietitian_collections USING GIN(health_goals);
CREATE INDEX IF NOT EXISTS idx_dietitian_collections_active ON dietitian_collections(is_active);
CREATE INDEX IF NOT EXISTS idx_dietitian_collections_rating ON dietitian_collections(rating DESC);

-- Dietitian Collection Products Table (junction table)
CREATE TABLE IF NOT EXISTS dietitian_collection_products (
    id VARCHAR(50) PRIMARY KEY,
    collection_id VARCHAR(50) NOT NULL REFERENCES dietitian_collections(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id) ON DELETE CASCADE,
    added_by VARCHAR(50) REFERENCES users(id),
    notes TEXT,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_collection_product UNIQUE (collection_id, product_id)
);

-- Indexes for dietitian_collection_products
CREATE INDEX IF NOT EXISTS idx_dietitian_collection_products_collection ON dietitian_collection_products(collection_id);
CREATE INDEX IF NOT EXISTS idx_dietitian_collection_products_product ON dietitian_collection_products(product_id);
CREATE INDEX IF NOT EXISTS idx_dietitian_collection_products_position ON dietitian_collection_products(collection_id, position);

-- Recipe Product Recommendations Table
CREATE TABLE IF NOT EXISTS recipe_product_recommendations (
    id VARCHAR(50) PRIMARY KEY,
    recipe_id VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id),
    relevance_score DECIMAL(3, 2) DEFAULT 0.5,
    match_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_recipe_product UNIQUE (recipe_id, product_id)
);

-- Indexes for recipe_product_recommendations
CREATE INDEX IF NOT EXISTS idx_recipe_product_recommendations_recipe ON recipe_product_recommendations(recipe_id);
CREATE INDEX IF NOT EXISTS idx_recipe_product_recommendations_product ON recipe_product_recommendations(product_id);
CREATE INDEX IF NOT EXISTS idx_recipe_product_recommendations_relevance ON recipe_product_recommendations(relevance_score DESC);

-- User Health-Product Interactions Table
CREATE TABLE IF NOT EXISTS user_health_product_interactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id),
    interaction_type VARCHAR(50) NOT NULL,
    health_profile_context JSONB DEFAULT '{}',
    recommendation_accepted BOOLEAN,
    feedback_score INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for user_health_product_interactions
CREATE INDEX IF NOT EXISTS idx_user_health_product_user ON user_health_product_interactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_health_product_product ON user_health_product_interactions(product_id);
CREATE INDEX IF NOT EXISTS idx_user_health_product_type ON user_health_product_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_health_product_created ON user_health_product_interactions(created_at DESC);

-- Shopping Cart Nutrition History Table
CREATE TABLE IF NOT EXISTS cart_nutrition_history (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    cart_id VARCHAR(50),
    total_nutrition JSONB NOT NULL,
    item_count INTEGER NOT NULL,
    rda_percentages JSONB DEFAULT '{}',
    health_goals_met TEXT[] DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for cart_nutrition_history
CREATE INDEX IF NOT EXISTS idx_cart_nutrition_history_user ON cart_nutrition_history(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_nutrition_history_cart ON cart_nutrition_history(cart_id);
CREATE INDEX IF NOT EXISTS idx_cart_nutrition_history_created ON cart_nutrition_history(created_at DESC);

-- Nutrition-Based Pricing History Table
CREATE TABLE IF NOT EXISTS nutrition_pricing_history (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id),
    base_price DECIMAL(15, 2) NOT NULL,
    nutrition_score DECIMAL(3, 2),
    nutrition_grade VARCHAR(2),
    premium_percentage DECIMAL(5, 2),
    final_price DECIMAL(15, 2) NOT NULL,
    pricing_rule_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for nutrition_pricing_history
CREATE INDEX IF NOT EXISTS idx_nutrition_pricing_history_product ON nutrition_pricing_history(product_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_pricing_history_created ON nutrition_pricing_history(created_at DESC);

-- Product-Recipe Compatibility Table
CREATE TABLE IF NOT EXISTS product_recipe_compatibility (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id),
    recipe_id VARCHAR(50),
    compatibility_score DECIMAL(3, 2) DEFAULT 0.5,
    serves_as VARCHAR(50),
    quantity_per_serving DECIMAL(10, 2),
    unit VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for product_recipe_compatibility
CREATE INDEX IF NOT EXISTS idx_product_recipe_compatibility_product ON product_recipe_compatibility(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recipe_compatibility_recipe ON product_recipe_compatibility(recipe_id);
CREATE INDEX IF NOT EXISTS idx_product_recipe_compatibility_score ON product_recipe_compatibility(compatibility_score DESC);

-- Allergen Alert Configuration Table
CREATE TABLE IF NOT EXISTS allergen_alert_config (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    allergen VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'high',
    alert_method VARCHAR(20) DEFAULT 'banner',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_user_allergen UNIQUE (user_id, allergen)
);

-- Indexes for allergen_alert_config
CREATE INDEX IF NOT EXISTS idx_allergen_alert_config_user ON allergen_alert_config(user_id);
CREATE INDEX IF NOT EXISTS idx_allergen_alert_config_allergen ON allergen_alert_config(allergen);
CREATE INDEX IF NOT EXISTS idx_allergen_alert_config_active ON allergen_alert_config(is_active);

-- Dietary Preference Config Table
CREATE TABLE IF NOT EXISTS dietary_preference_config (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    dietary_preference VARCHAR(50) NOT NULL,
    strictness_level VARCHAR(20) DEFAULT 'moderate',
    allow_substitutions BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_user_dietary UNIQUE (user_id, dietary_preference)
);

-- Indexes for dietary_preference_config
CREATE INDEX IF NOT EXISTS idx_dietary_preference_config_user ON dietary_preference_config(user_id);
CREATE INDEX IF NOT EXISTS idx_dietary_preference_config_preference ON dietary_preference_config(dietary_preference);

-- Triggers for updated_at
CREATE TRIGGER update_dietitian_collections_updated_at BEFORE UPDATE ON dietitian_collections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_recipe_compatibility_updated_at BEFORE UPDATE ON product_recipe_compatibility
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE dietitian_collections IS 'Dietitian-curated product collections for health-focused shopping';
COMMENT ON TABLE dietitian_collection_products IS 'Junction table linking dietitian collections to products';
COMMENT ON TABLE recipe_product_recommendations IS 'AI-generated recipe-product recommendations';
COMMENT ON TABLE user_health_product_interactions IS 'User interactions with health-recommended products';
COMMENT ON TABLE cart_nutrition_history IS 'Historical nutrition calculations for shopping carts';
COMMENT ON TABLE nutrition_pricing_history IS 'History of nutrition-based pricing calculations';
COMMENT ON TABLE product_recipe_compatibility IS 'Product-recipe compatibility and usage data';
COMMENT ON TABLE allergen_alert_config IS 'User-specific allergen alert configurations';
COMMENT ON TABLE dietary_preference_config IS 'User dietary preference configurations';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
