-- Recipe Intelligence Database Schema
-- CAP-281 to CAP-288: Recipe Database, AI Recipe Generator, Nutrition Calculation,
-- Ingredient Substitution, Cost Calculator, Seasonal Recipes, Regional Recipes, Institutional Recipes

-- Enable UUID extension if needed
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.

-- ============================================================================
-- RECIPE DATABASE (CAP-281)
-- ============================================================================

CREATE TABLE IF NOT EXISTS recipe_database (
    id SERIAL PRIMARY KEY,
    recipe_name VARCHAR(255) NOT NULL,
    cuisine_type VARCHAR(100),
    meal_type VARCHAR(50),
    difficulty_level VARCHAR(50),
    preparation_time INTEGER,
    cooking_time INTEGER,
    servings INTEGER,
    ingredients JSONB,
    instructions JSONB,
    nutritional_info JSONB,
    dietary_restrictions JSONB,
    allergens JSONB,
    equipment_needed JSONB,
    source VARCHAR(255),
    author VARCHAR(255),
    tags JSONB,
    media_files JSONB,
    seasonal_availability JSONB,
    region VARCHAR(100),
    state VARCHAR(100),
    city VARCHAR(100),
    popularity INTEGER DEFAULT 0,
    verified_by INTEGER,
    is_verified BOOLEAN DEFAULT false,
    is_ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_recipe_name ON recipe_database(recipe_name);
CREATE INDEX IF NOT EXISTS idx_recipe_cuisine ON recipe_database(cuisine_type);
CREATE INDEX IF NOT EXISTS idx_recipe_meal ON recipe_database(meal_type);
CREATE INDEX IF NOT EXISTS idx_recipe_difficulty ON recipe_database(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_recipe_dietary ON recipe_database USING GIN(dietary_restrictions);
CREATE INDEX IF NOT EXISTS idx_recipe_allergens ON recipe_database USING GIN(allergens);
CREATE INDEX IF NOT EXISTS idx_recipe_seasonal ON recipe_database USING GIN(seasonal_availability);
CREATE INDEX IF NOT EXISTS idx_recipe_region ON recipe_database(region);

-- ============================================================================
-- INGREDIENT SUBSTITUTIONS (CAP-284)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingredient_substitutions (
    id SERIAL PRIMARY KEY,
    ingredient VARCHAR(255) NOT NULL,
    substitute VARCHAR(255) NOT NULL,
    ratio VARCHAR(50),
    notes TEXT,
    dietary_restrictions JSONB,
    availability VARCHAR(50),
    cuisine_type VARCHAR(100),
    effectiveness_rating DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_ingredient ON ingredient_substitutions(ingredient);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_substitute ON ingredient_substitutions(substitute);
CREATE INDEX IF NOT EXISTS idx_ingredient_substitutions_cuisine ON ingredient_substitutions(cuisine_type);

-- ============================================================================
-- INGREDIENT PRICING (CAP-285)
-- ============================================================================

CREATE TABLE IF NOT EXISTS ingredient_pricing (
    id SERIAL PRIMARY KEY,
    ingredient VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    average_price DECIMAL(10,2),
    price_range JSONB,
    unit VARCHAR(50),
    location VARCHAR(100),
    seasonality VARCHAR(50),
    availability VARCHAR(50),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ingredient_pricing_ingredient ON ingredient_pricing(ingredient);
CREATE INDEX IF NOT EXISTS idx_ingredient_pricing_category ON ingredient_pricing(category);
CREATE INDEX IF NOT EXISTS idx_ingredient_pricing_location ON ingredient_pricing(location);

-- ============================================================================
-- SEASONAL INGREDIENTS (CAP-286)
-- ============================================================================

CREATE TABLE IF NOT EXISTS seasonal_ingredients (
    id SERIAL PRIMARY KEY,
    ingredient VARCHAR(255) NOT NULL,
    season VARCHAR(50) NOT NULL,
    region VARCHAR(100),
    availability VARCHAR(50),
    peak_month INTEGER,
    quality_rating DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_seasonal_ingredients_ingredient ON seasonal_ingredients(ingredient);
CREATE INDEX IF NOT EXISTS idx_seasonal_ingredients_season ON seasonal_ingredients(season);
CREATE INDEX IF NOT EXISTS idx_seasonal_ingredients_region ON seasonal_ingredients(region);

-- ============================================================================
-- REGIONAL CUISINE (CAP-287)
-- ============================================================================

CREATE TABLE IF NOT EXISTS regional_cuisine (
    id SERIAL PRIMARY KEY,
    region VARCHAR(100) NOT NULL,
    state VARCHAR(100),
    popular_dishes JSONB,
    common_ingredients JSONB,
    cooking_techniques JSONB,
    cultural_significance TEXT,
    typical_meals JSONB,
    spice_profile JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_regional_cuisine_region ON regional_cuisine(region);
CREATE INDEX IF NOT EXISTS idx_regional_cuisine_state ON regional_cuisine(state);

-- ============================================================================
-- INSTITUTIONAL RECIPES (CAP-288)
-- ============================================================================

CREATE TABLE IF NOT EXISTS institutional_recipes (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    recipe_name VARCHAR(255) NOT NULL,
    meal_type VARCHAR(50),
    target_servings INTEGER,
    dietary_requirements JSONB,
    nutritional_targets JSONB,
    budget_constraints JSONB,
    equipment_available JSONB,
    staff_skill_level VARCHAR(50),
    preparation_time_constraint INTEGER,
    serving_method VARCHAR(100),
    storage_requirements JSONB,
    allergy_considerations JSONB,
    special_diet_needs JSONB,
    approved_by INTEGER,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutional_recipes_institution ON institutional_recipes(institution_id);
CREATE INDEX IF NOT EXISTS idx_institutional_recipes_meal ON institutional_recipes(meal_type);
CREATE INDEX IF NOT EXISTS idx_institutional_recipes_status ON institutional_recipes(status);

-- ============================================================================
-- INSTITUTIONAL INGREDIENT SUBSTITUTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS institutional_ingredient_substitutions (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER,
    original_ingredient VARCHAR(255) NOT NULL,
    substitute_ingredient VARCHAR(255) NOT NULL,
    reason TEXT,
    approved_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutional_substitutions_institution ON institutional_ingredient_substitutions(institution_id);
CREATE INDEX IF NOT EXISTS idx_institutional_substitutions_original ON institutional_ingredient_substitutions(original_ingredient);

-- ============================================================================
-- INSTITUTIONAL NUTRITION REQUIREMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS institutional_nutrition_requirements (
    id SERIAL PRIMARY KEY,
    institution_id INTEGER NOT NULL,
    meal_type VARCHAR(50),
    target_demographics JSONB,
    calorie_target INTEGER,
    protein_target DECIMAL(10,2),
    carbohydrate_target DECIMAL(10,2),
    fat_target DECIMAL(10,2),
    fiber_target DECIMAL(10,2),
    vitamin_requirements JSONB,
    mineral_requirements JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_institutional_nutrition_institution ON institutional_nutrition_requirements(institution_id);
CREATE INDEX IF NOT EXISTS idx_institutional_nutrition_meal ON institutional_nutrition_requirements(meal_type);

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
DROP TRIGGER IF EXISTS update_recipe_database_updated_at ON recipe_database;
CREATE TRIGGER update_recipe_database_updated_at BEFORE UPDATE ON recipe_database
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ingredient_substitutions_updated_at ON ingredient_substitutions;
CREATE TRIGGER update_ingredient_substitutions_updated_at BEFORE UPDATE ON ingredient_substitutions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ingredient_pricing_updated_at ON ingredient_pricing;
CREATE TRIGGER update_ingredient_pricing_updated_at BEFORE UPDATE ON ingredient_pricing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_seasonal_ingredients_updated_at ON seasonal_ingredients;
CREATE TRIGGER update_seasonal_ingredients_updated_at BEFORE UPDATE ON seasonal_ingredients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_regional_cuisine_updated_at ON regional_cuisine;
CREATE TRIGGER update_regional_cuisine_updated_at BEFORE UPDATE ON regional_cuisine
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institutional_recipes_updated_at ON institutional_recipes;
CREATE TRIGGER update_institutional_recipes_updated_at BEFORE UPDATE ON institutional_recipes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_institutional_nutrition_requirements_updated_at ON institutional_nutrition_requirements;
CREATE TRIGGER update_institutional_nutrition_requirements_updated_at BEFORE UPDATE ON institutional_nutrition_requirements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
