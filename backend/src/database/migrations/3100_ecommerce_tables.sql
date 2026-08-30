-- ============================================================================
-- AFRERA E-Commerce Database Schema
-- International Launch Standard
-- ============================================================================

-- Product Listings Table
CREATE TABLE IF NOT EXISTS product_listings (
    id VARCHAR(50) PRIMARY KEY,
    seller_id UUID NOT NULL REFERENCES users(id),
    product_name VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id),
    description TEXT,
    quantity DECIMAL(15, 2) NOT NULL,
    unit_id INTEGER REFERENCES units(id),
    unit VARCHAR(20) NOT NULL,
    base_price DECIMAL(15, 2) NOT NULL,
    ai_recommended_price DECIMAL(15, 2),
    quality_score DECIMAL(3, 2) DEFAULT 0.50,
    demand_prediction VARCHAR(20),
    harvest_date DATE,
    location_id UUID REFERENCES addresses(id),
    state_id INTEGER REFERENCES states(id),
    certifications JSONB DEFAULT '[]',
    images JSONB DEFAULT '[]',
    gi_tagged BOOLEAN DEFAULT FALSE,
    organic BOOLEAN DEFAULT FALSE,
    listing_status VARCHAR(20) DEFAULT 'active',
    visibility_score DECIMAL(3, 2) DEFAULT 0.50,
    view_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    inquiry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_quantity_positive CHECK (quantity > 0),
    CONSTRAINT chk_price_positive CHECK (base_price > 0),
    CONSTRAINT chk_quality_score CHECK (quality_score >= 0 AND quality_score <= 1),
    CONSTRAINT chk_visibility_score CHECK (visibility_score >= 0 AND visibility_score <= 1),
    CONSTRAINT chk_listing_status CHECK (listing_status IN ('active', 'sold', 'deleted', 'expired'))
);

-- Indexes for product_listings
CREATE INDEX IF NOT EXISTS idx_product_listings_seller ON product_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_category ON product_listings(category_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_state ON product_listings(state_id);
CREATE INDEX IF NOT EXISTS idx_product_listings_status ON product_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_product_listings_gi ON product_listings(gi_tagged);
CREATE INDEX IF NOT EXISTS idx_product_listings_organic ON product_listings(organic);
CREATE INDEX IF NOT EXISTS idx_product_listings_quality ON product_listings(quality_score);
CREATE INDEX IF NOT EXISTS idx_product_listings_visibility ON product_listings(visibility_score);
CREATE INDEX IF NOT EXISTS idx_product_listings_created ON product_listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_listings_price ON product_listings(base_price);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_product_listings_search ON product_listings USING gin(
    to_tsvector('english', product_name || ' ' || COALESCE(description, ''))
);

-- GI Marketplace Listings Table (enhanced version)
CREATE TABLE IF NOT EXISTS gi_marketplace_listings (
    id VARCHAR(50) PRIMARY KEY,
    gi_product_id INTEGER REFERENCES gi_products(id),
    product_id VARCHAR(50) REFERENCES product_listings(id),
    seller_id VARCHAR(50) NOT NULL REFERENCES users(id),
    listing_title VARCHAR(255) NOT NULL,
    description TEXT,
    available_quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_per_unit DECIMAL(15, 2) NOT NULL,
    is_premium_priced BOOLEAN DEFAULT TRUE,
    premium_percentage DECIMAL(5, 2) DEFAULT 0,
    quality_tier VARCHAR(20),
    harvest_date DATE,
    location_id INTEGER REFERENCES addresses(id),
    listing_status VARCHAR(20) DEFAULT 'active',
    authenticity_verified BOOLEAN DEFAULT FALSE,
    authenticity_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_gi_quantity_positive CHECK (available_quantity > 0),
    CONSTRAINT chk_gi_price_positive CHECK (price_per_unit > 0),
    CONSTRAINT chk_gi_listing_status CHECK (listing_status IN ('active', 'sold', 'deleted', 'expired'))
);

-- Indexes for gi_marketplace_listings
CREATE INDEX IF NOT EXISTS idx_gi_listings_gi_product ON gi_marketplace_listings(gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_listings_seller ON gi_marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_gi_listings_status ON gi_marketplace_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_gi_listings_premium ON gi_marketplace_listings(is_premium_priced);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id),
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    order_id VARCHAR(50) REFERENCES orders(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images JSONB DEFAULT '[]',
    helpful_count INTEGER DEFAULT 0,
    verified_purchase BOOLEAN DEFAULT FALSE,
    moderation_status VARCHAR(20) DEFAULT 'approved',
    reported_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_moderation_status CHECK (moderation_status IN ('approved', 'pending', 'rejected', 'flagged'))
);

-- Indexes for product_reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "product_reviews") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON product_reviews(created_at DESC);

-- Review Helpful Votes Table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id VARCHAR(50) PRIMARY KEY,
    -- 2026-08-30: dropped "REFERENCES product_reviews(id)" - this file's own
    -- product_reviews (line 93) is a deferred collision loser (see
    -- schema-decisions.json), the real table is 009_marketplace_enhancements.sql's,
    -- whose id is SERIAL not VARCHAR(50) - "foreign key constraint cannot be
    -- implemented" against a real database. Column kept, FK dropped.
    review_id VARCHAR(50) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_review_user UNIQUE (review_id, user_id)
);

-- Review Reports Table
CREATE TABLE IF NOT EXISTS review_reports (
    id VARCHAR(50) PRIMARY KEY,
    review_id VARCHAR(50) NOT NULL REFERENCES product_reviews(id),
    reporter_id VARCHAR(50) NOT NULL REFERENCES users(id),
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    reviewed_by VARCHAR(50) REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_report_status CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned'))
);

-- Bulk Orders Table
CREATE TABLE IF NOT EXISTS bulk_orders (
    id VARCHAR(50) PRIMARY KEY,
    buyer_id VARCHAR(50) NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category_id INTEGER REFERENCES categories(id),
    required_quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    target_price DECIMAL(15, 2),
    delivery_location TEXT,
    required_by DATE,
    specifications JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending',
    quotation_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_bulk_quantity_positive CHECK (required_quantity > 0),
    CONSTRAINT chk_bulk_status CHECK (status IN ('pending', 'quoted', 'accepted', 'rejected', 'completed', 'cancelled'))
);

-- Indexes for bulk_orders
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "bulk_orders") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_bulk_orders_buyer ON bulk_orders(buyer_id);
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "bulk_orders") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_bulk_orders_category ON bulk_orders(category_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_orders(status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_created ON bulk_orders(created_at DESC);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id VARCHAR(50) PRIMARY KEY,
    -- 2026-08-30: dropped "REFERENCES bulk_orders(id)" - this file's own
    -- bulk_orders (line 145) is a deferred collision loser (see
    -- schema-decisions.json), the real table is 009_marketplace_enhancements.sql's,
    -- whose id is SERIAL not VARCHAR(50). Column kept, FK dropped.
    bulk_order_id VARCHAR(50) NOT NULL,
    seller_id UUID NOT NULL REFERENCES users(id),
    quoted_price DECIMAL(15, 2) NOT NULL,
    available_quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    delivery_date DATE,
    delivery_cost DECIMAL(15, 2),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    expires_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_quotation_price_positive CHECK (quoted_price > 0),
    CONSTRAINT chk_quotation_quantity_positive CHECK (available_quantity > 0),
    CONSTRAINT chk_quotation_status CHECK (status IN ('pending', 'accepted', 'rejected', 'expired'))
);

-- Indexes for quotations
CREATE INDEX IF NOT EXISTS idx_quotations_bulk_order ON quotations(bulk_order_id);
CREATE INDEX IF NOT EXISTS idx_quotations_seller ON quotations(seller_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);

-- Seller Analytics Summary Table (materialized view refresh strategy)
CREATE TABLE IF NOT EXISTS seller_analytics_summary (
    seller_id UUID PRIMARY KEY REFERENCES users(id),
    total_listings INTEGER DEFAULT 0,
    active_listings INTEGER DEFAULT 0,
    sold_listings INTEGER DEFAULT 0,
    total_revenue DECIMAL(15, 2) DEFAULT 0,
    avg_order_value DECIMAL(15, 2),
    total_quantity_sold DECIMAL(15, 2) DEFAULT 0,
    avg_quality_score DECIMAL(3, 2),
    total_views INTEGER DEFAULT 0,
    total_inquiries INTEGER DEFAULT 0,
    response_rate DECIMAL(5, 2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Market Price History Table
CREATE TABLE IF NOT EXISTS market_price_history (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    state_id INTEGER REFERENCES states(id),
    avg_price DECIMAL(15, 2),
    min_price DECIMAL(15, 2),
    max_price DECIMAL(15, 2),
    listing_count INTEGER,
    record_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for market_price_history
CREATE INDEX IF NOT EXISTS idx_market_price_category ON market_price_history(category_id);
CREATE INDEX IF NOT EXISTS idx_market_price_state ON market_price_history(state_id);
CREATE INDEX IF NOT EXISTS idx_market_price_date ON market_price_history(record_date DESC);

-- Unique constraint to prevent duplicate daily records
CREATE UNIQUE INDEX IF NOT EXISTS uk_market_price_daily 
    ON market_price_history(category_id, state_id, record_date);

-- Marketplace Events Table (for signal bus audit)
CREATE TABLE IF NOT EXISTS marketplace_events (
    id SERIAL PRIMARY KEY,
    event_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    seller_id UUID REFERENCES users(id),
    buyer_id UUID REFERENCES users(id),
    event_data JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for marketplace_events
CREATE INDEX IF NOT EXISTS idx_marketplace_events_type ON marketplace_events(event_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_events_entity ON marketplace_events(entity_id, entity_type);
CREATE INDEX IF NOT EXISTS idx_marketplace_events_seller ON marketplace_events(seller_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_events_buyer ON marketplace_events(buyer_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_events_created ON marketplace_events(created_at DESC);

-- Functions and Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all relevant tables
CREATE TRIGGER update_product_listings_updated_at BEFORE UPDATE ON product_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2026-08-30: removed 3 CREATE TRIGGER statements for gi_marketplace_listings/
-- product_reviews/bulk_orders - all three tables are deferred collision losers
-- in this file (see schema-decisions.json), and the real (winner) tables
-- already have an identically-named trigger from their own migration
-- (update_gi_marketplace_listings_updated_at in 027_gi_intelligence_schema.sql,
-- update_product_reviews_updated_at and update_bulk_orders_updated_at in
-- 009_marketplace_enhancements.sql) - "trigger ... already exists" against a
-- real database, since CREATE TRIGGER has no IF NOT EXISTS.

CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE product_listings IS 'Main product listings table with AI-powered features';
COMMENT ON TABLE gi_marketplace_listings IS 'GI-specific marketplace with premium pricing';
COMMENT ON TABLE product_reviews IS 'Product reviews and ratings';
COMMENT ON TABLE bulk_orders IS 'Bulk purchase requests from buyers';
COMMENT ON TABLE quotations IS 'Seller quotations for bulk orders';
COMMENT ON TABLE seller_analytics_summary IS 'Aggregated seller performance metrics';
COMMENT ON TABLE market_price_history IS 'Historical market price data for analytics';
COMMENT ON TABLE marketplace_events IS 'Audit log for marketplace events';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
