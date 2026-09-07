-- GI Intelligence Platform Database Schema
-- Manages Geographical Indication products, verification, and premium pricing

-- Enable required extensions
-- CREATE EXTENSION "uuid-ossp" removed 2026-08-04: gen_random_uuid()
-- is built into PostgreSQL core (13+), so no extension is required. Many
-- managed Postgres services do not enable uuid-ossp by default, which made
-- this a hard deployment dependency for no benefit.
-- Extension declaration removed 2026-08-04: nothing in this file calls a
-- pgcrypto function. It was declared reflexively and made the file fail on any
-- Postgres where the extension is not installed, for no benefit.

-- ============================================================================
-- GI REGISTRY
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    gi_name VARCHAR(255) NOT NULL,
    gi_registration_number VARCHAR(100) UNIQUE NOT NULL,
    registration_date DATE,
    geographical_region VARCHAR(255) NOT NULL,
    state VARCHAR(100) NOT NULL,
    country VARCHAR(50) DEFAULT 'India',
    gi_authority VARCHAR(255),
    gi_category VARCHAR(100), -- 'agricultural', 'handicraft', 'manufactured', 'foodstuff'
    description TEXT,
    historical_significance TEXT,
    unique_characteristics JSONB DEFAULT '[]',
    production_methods JSONB DEFAULT '[]',
    quality_standards JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'registered', -- 'registered', 'pending', 'suspended', 'revoked'
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_products_product ON gi_products(product_id);
CREATE INDEX IF NOT EXISTS idx_gi_products_region ON gi_products(geographical_region);
CREATE INDEX IF NOT EXISTS idx_gi_products_status ON gi_products(status);

-- ============================================================================
-- GI PRODUCERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_producers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gi_product_id UUID REFERENCES gi_products(id) ON DELETE CASCADE,
    producer_id UUID REFERENCES users(id),
    farmer_id UUID REFERENCES farmers(id),
    fpo_id UUID REFERENCES fpos(id),
    registration_number VARCHAR(100),
    registration_date DATE,
    production_location_id UUID REFERENCES addresses(id),
    certified_area_hectares DECIMAL(10, 2),
    annual_production_tonnes DECIMAL(10, 2),
    certification_status VARCHAR(20) DEFAULT 'active', -- 'active', 'suspended', 'revoked'
    last_inspection_date DATE,
    next_inspection_date DATE,
    inspector_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_producers_gi_product ON gi_producers(gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_producers_producer ON gi_producers(producer_id);

-- ============================================================================
-- GI VERIFICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producer_id UUID REFERENCES gi_producers(id),
    verification_type VARCHAR(50) NOT NULL, -- 'initial', 'annual', 'complaint', 'random'
    verification_date DATE NOT NULL,
    verifier_name VARCHAR(255),
    verifier_organization VARCHAR(255),
    verification_findings JSONB,
    compliance_status VARCHAR(50), -- 'compliant', 'non_compliant', 'conditional'
    non_conformities JSONB DEFAULT '[]',
    corrective_actions JSONB DEFAULT '[]',
    follow_up_date DATE,
    verification_result VARCHAR(50), -- 'pass', 'pass_with_conditions', 'fail'
    report_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_verifications_producer ON gi_verifications(producer_id);

-- ============================================================================
-- GI PREMIUM PRICING
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_pricing_rules (
    id SERIAL PRIMARY KEY,
    gi_product_id UUID REFERENCES gi_products(id),
    base_premium_percentage DECIMAL(5, 2) NOT NULL,
    quality_tier_premiums JSONB DEFAULT '{}', -- Premiums based on quality tiers
    seasonal_adjustments JSONB DEFAULT '{}',
    market_demand_factor DECIMAL(5, 2) DEFAULT 1.0,
    scarcity_factor DECIMAL(5, 2) DEFAULT 1.0,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gi_product_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    gi_product_id UUID REFERENCES gi_products(id),
    base_price DECIMAL(10, 2) NOT NULL,
    gi_premium DECIMAL(10, 2),
    quality_premium DECIMAL(10, 2),
    seasonal_adjustment DECIMAL(10, 2),
    final_price DECIMAL(10, 2) NOT NULL,
    premium_percentage DECIMAL(5, 2),
    pricing_factors JSONB DEFAULT '{}',
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_product_pricing_product ON gi_product_pricing(product_id);

-- ============================================================================
-- GI QUALITY TIERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_quality_tiers (
    id SERIAL PRIMARY KEY,
    gi_product_id UUID REFERENCES gi_products(id),
    tier_name VARCHAR(50) NOT NULL,
    tier_description TEXT,
    quality_parameters JSONB NOT NULL,
    premium_percentage DECIMAL(5, 2),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS gi_product_quality_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    gi_product_id UUID REFERENCES gi_products(id),
    quality_tier_id INTEGER REFERENCES gi_quality_tiers(id),
    rating_date DATE,
    quality_score DECIMAL(5, 2),
    parameter_scores JSONB,
    rated_by VARCHAR(255),
    certification_number VARCHAR(100),
    valid_until DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GI AUTHENTICATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_authentication (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id),
    batch_number VARCHAR(100) NOT NULL,
    authentication_code VARCHAR(100) UNIQUE NOT NULL,
    qr_code_url TEXT,
    producer_id UUID REFERENCES gi_producers(id),
    production_date DATE,
    authentication_date DATE,
    authenticated_by VARCHAR(255),
    authentication_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
    verification_method VARCHAR(50), -- 'blockchain', 'digital_signature', 'physical_tag'
    blockchain_tx_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_authentication_code ON gi_authentication(authentication_code);
CREATE INDEX IF NOT EXISTS idx_gi_authentication_batch ON gi_authentication(batch_number);

-- ============================================================================
-- GI MARKETPLACE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_marketplace_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gi_product_id UUID REFERENCES gi_products(id),
    product_id UUID REFERENCES products(id),
    seller_id UUID REFERENCES users(id),
    listing_title VARCHAR(255) NOT NULL,
    description TEXT,
    available_quantity DECIMAL(10, 2),
    unit VARCHAR(50),
    price_per_unit DECIMAL(10, 2),
    is_premium_priced BOOLEAN DEFAULT TRUE,
    premium_percentage DECIMAL(5, 2),
    quality_tier VARCHAR(50),
    harvest_date DATE,
    location_id UUID REFERENCES addresses(id),
    listing_status VARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'expired', 'withdrawn'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_marketplace_gi_product ON gi_marketplace_listings(gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_marketplace_seller ON gi_marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_gi_marketplace_status ON gi_marketplace_listings(listing_status);

-- ============================================================================
-- GI CONSUMER EDUCATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_educational_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gi_product_id UUID REFERENCES gi_products(id),
    content_type VARCHAR(50) NOT NULL, -- 'article', 'video', 'infographic', 'recipe'
    title VARCHAR(255) NOT NULL,
    content TEXT,
    media_url TEXT,
    language VARCHAR(10) DEFAULT 'en',
    tags TEXT[],
    is_published BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- GI ANALYTICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS gi_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gi_product_id UUID REFERENCES gi_products(id),
    date DATE NOT NULL,
    total_views INTEGER DEFAULT 0,
    total_searches INTEGER DEFAULT 0,
    total_authentications INTEGER DEFAULT 0,
    total_sales DECIMAL(12, 2) DEFAULT 0,
    total_quantity_sold DECIMAL(10, 2) DEFAULT 0,
    average_premium_percentage DECIMAL(5, 2),
    unique_consumers INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gi_analytics_gi_product ON gi_analytics(gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_analytics_date ON gi_analytics(date);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to calculate GI premium price
CREATE OR REPLACE FUNCTION calculate_gi_pricing(
    product_id UUID,
    base_price DECIMAL,
    gi_product_id UUID
)
RETURNS JSONB AS $$
DECLARE
    pricing_rule RECORD;
    quality_tier RECORD;
    final_premium DECIMAL;
    final_price DECIMAL;
    premium_pct DECIMAL;
    pricing_factors JSONB;
BEGIN
    -- Get active pricing rule
    SELECT * INTO pricing_rule 
    FROM gi_pricing_rules 
    WHERE gi_product_id = gi_product_id 
    AND is_active = true 
    AND (effective_date IS NULL OR effective_date <= CURRENT_DATE)
    AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
    LIMIT 1;
    
    IF NOT FOUND THEN
        -- Default premium if no rule found
        final_premium := base_price * 0.15;
    ELSE
        final_premium := base_price * (pricing_rule.base_premium_percentage / 100);
    END IF;
    
    final_price := base_price + final_premium;
    premium_pct := (final_premium / base_price) * 100;
    
    pricing_factors := jsonb_build_object(
        'base_price', base_price,
        'gi_premium', final_premium,
        'quality_premium', 0,
        'seasonal_adjustment', 0,
        'final_price', final_price,
        'premium_percentage', premium_pct
    );
    
    RETURN jsonb_build_object(
        'base_price', base_price,
        'gi_premium', final_premium,
        'final_price', final_price,
        'premium_percentage', premium_pct,
        'pricing_factors', pricing_factors
    );
END;
$$ LANGUAGE plpgsql;

-- Function to generate GI authentication code
CREATE OR REPLACE FUNCTION generate_gi_auth_code()
RETURNS VARCHAR(100) AS $$
DECLARE
    auth_code VARCHAR(100);
BEGIN
    auth_code := 'GI-' || upper(md5(random()::TEXT)) || '-' || TO_CHAR(CURRENT_TIMESTAMP, 'YYYYMMDD');
    RETURN auth_code;
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

DROP TRIGGER IF EXISTS update_gi_products_updated_at ON gi_products;
CREATE TRIGGER update_gi_products_updated_at BEFORE UPDATE ON gi_products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gi_producers_updated_at ON gi_producers;
CREATE TRIGGER update_gi_producers_updated_at BEFORE UPDATE ON gi_producers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_gi_marketplace_listings_updated_at ON gi_marketplace_listings;
CREATE TRIGGER update_gi_marketplace_listings_updated_at BEFORE UPDATE ON gi_marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
