-- Consumer Health Platform Database Schema
-- Manages consumer health profiles, dietary recommendations, and health monitoring

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- HEALTH PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_name VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    height_cm DECIMAL(5, 2),
    weight_kg DECIMAL(5, 2),
    blood_type VARCHAR(5),
    activity_level VARCHAR(50), -- 'sedentary', 'light', 'moderate', 'active', 'very_active'
    health_conditions TEXT[],
    allergies TEXT[],
    dietary_restrictions TEXT[],
    medications JSONB DEFAULT '{}',
    health_goals TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_profiles_user ON health_profiles(user_id);

-- ============================================================================
-- DIETARY PROFILES
-- ============================================================================

CREATE TABLE IF NOT EXISTS dietary_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    profile_type VARCHAR(50) NOT NULL, -- 'balanced', 'low_carb', 'high_protein', 'vegetarian', 'vegan', 'keto', 'mediterranean'
    daily_calorie_target INTEGER,
    macronutrient_targets JSONB DEFAULT '{}', -- {protein: g, carbs: g, fats: g}
    micronutrient_targets JSONB DEFAULT '{}',
    meal_frequency INTEGER DEFAULT 3,
    meal_timing JSONB DEFAULT '{}',
    hydration_target_ml INTEGER DEFAULT 2000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_dietary_profiles_user ON dietary_profiles(user_id);

-- ============================================================================
-- HEALTH METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    metric_type VARCHAR(50) NOT NULL, -- 'weight', 'blood_pressure', 'blood_sugar', 'heart_rate', 'sleep', 'steps'
    metric_value DECIMAL(10, 2) NOT NULL,
    unit VARCHAR(20),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    source VARCHAR(50) -- 'manual', 'device', 'app'
);

CREATE INDEX idx_health_metrics_user ON health_metrics(user_id);
CREATE INDEX idx_health_metrics_type ON health_metrics(metric_type);
CREATE INDEX idx_health_metrics_date ON health_metrics(recorded_at);

-- ============================================================================
-- HEALTH GOALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_goals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(50) NOT NULL, -- 'weight_loss', 'weight_gain', 'muscle_gain', 'fitness', 'nutrition', 'sleep'
    target_value DECIMAL(10, 2),
    current_value DECIMAL(10, 2),
    unit VARCHAR(20),
    start_date DATE,
    target_date DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'completed', 'paused', 'cancelled'
    progress_percentage DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_goals_user ON health_goals(user_id);

-- ============================================================================
-- DIETARY RECOMMENDATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS dietary_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_type VARCHAR(50) NOT NULL, -- 'food', 'nutrient', 'meal', 'supplement'
    recommendation_text TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'high', 'medium', 'low'
    category VARCHAR(50),
    reasoning TEXT,
    is_personalized BOOLEAN DEFAULT TRUE,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_dismissed BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_dietary_recommendations_user ON dietary_recommendations(user_id);

-- ============================================================================
-- HEALTH ALERTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'allergy', 'medication_interaction', 'nutrient_deficiency', 'health_condition'
    severity VARCHAR(20) NOT NULL, -- 'critical', 'high', 'medium', 'low'
    alert_message TEXT NOT NULL,
    trigger_data JSONB,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_alerts_user ON health_alerts(user_id);
CREATE INDEX idx_health_alerts_read ON health_alerts(is_read);

-- ============================================================================
-- FOOD CONSUMPTION LOGS
-- ============================================================================

CREATE TABLE IF NOT EXISTS food_consumption_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    food_item_id UUID,
    product_id UUID REFERENCES products(id),
    meal_type VARCHAR(50), -- 'breakfast', 'lunch', 'dinner', 'snack'
    quantity_g DECIMAL(10, 2),
    calories_consumed DECIMAL(10, 2),
    nutritional_intake JSONB DEFAULT '{}',
    consumed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

CREATE INDEX idx_food_consumption_logs_user ON food_consumption_logs(user_id);
CREATE INDEX idx_food_consumption_logs_date ON food_consumption_logs(consumed_at);

-- ============================================================================
-- HEALTH ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS health_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_calories_consumed DECIMAL(10, 2),
    total_protein_g DECIMAL(10, 2),
    total_carbs_g DECIMAL(10, 2),
    total_fats_g DECIMAL(10, 2),
    water_intake_ml DECIMAL(10, 2),
    steps_count INTEGER,
    sleep_hours DECIMAL(5, 2),
    health_score DECIMAL(5, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_health_analytics_user ON health_analytics(user_id);
CREATE INDEX idx_health_analytics_date ON health_analytics(date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate BMI
CREATE OR REPLACE FUNCTION calculate_bmi(weight_kg DECIMAL, height_cm DECIMAL)
RETURNS DECIMAL AS $$
DECLARE
    height_m DECIMAL;
    bmi DECIMAL;
BEGIN
    height_m := height_cm / 100;
    bmi := weight_kg / (height_m * height_m);
    RETURN ROUND(bmi, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to calculate daily health score
CREATE OR REPLACE FUNCTION calculate_daily_health_score(user_id UUID, date DATE)
RETURNS DECIMAL AS $$
DECLARE
    score DECIMAL;
    calorie_diff DECIMAL;
    protein_g DECIMAL;
    water_ml DECIMAL;
    steps INTEGER;
    sleep_hours DECIMAL;
BEGIN
    -- Get daily analytics
    SELECT 
        total_calories_consumed,
        total_protein_g,
        water_intake_ml,
        steps_count,
        sleep_hours
    INTO calorie_diff, protein_g, water_ml, steps, sleep_hours
    FROM health_analytics
    WHERE user_id = user_id AND date = date;
    
    -- Calculate score based on targets (simplified)
    score := 50; -- Base score
    
    IF protein_g >= 50 THEN score := score + 10; END IF;
    IF water_ml >= 2000 THEN score := score + 10; END IF;
    IF steps >= 10000 THEN score := score + 15; END IF;
    IF sleep_hours >= 7 THEN score := score + 15; END IF;
    
    RETURN score;
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

CREATE TRIGGER update_health_profiles_updated_at BEFORE UPDATE ON health_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dietary_profiles_updated_at BEFORE UPDATE ON dietary_profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_health_goals_updated_at BEFORE UPDATE ON health_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
