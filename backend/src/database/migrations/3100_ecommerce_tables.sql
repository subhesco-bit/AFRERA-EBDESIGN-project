-- ---------------------------------------------------------------------------
-- RECONCILIATION NOTE (added 2026-09-23)
--
-- One or more table names in this file are also defined by another migration
-- with a different column set. `CREATE TABLE IF NOT EXISTS` then does NOTHING
-- on a clean run, and this file's later INSERT / CREATE INDEX statements failed
-- on columns that were never added. Verified on a clean PostgreSQL 16 run of
-- the full migration set.
--
-- Per the project rule, a collision is reconciled and not resolved by dropping
-- one side. Each CREATE TABLE below is followed by ADD COLUMN IF NOT EXISTS for
-- its own columns: a no-op where this file really created the table, and the
-- missing columns where it did not.
--
-- NOT NULL, PRIMARY KEY, UNIQUE and REFERENCES are deliberately not carried
-- over -- the table may already hold rows from the other definition that cannot
-- satisfy them, and a referenced column's type often differs from what this
-- file declares. Where that hides a real type mismatch, it is a reconciliation
-- still owed, not a fix.
-- ---------------------------------------------------------------------------

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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS product_name VARCHAR(255);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS category_id INTEGER;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS quantity DECIMAL(15, 2);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS unit_id INTEGER;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS base_price DECIMAL(15, 2);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS ai_recommended_price DECIMAL(15, 2);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS quality_score DECIMAL(3, 2) DEFAULT 0.50;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS demand_prediction VARCHAR(20);
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS harvest_date DATE;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS state_id INTEGER;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]';
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS gi_tagged BOOLEAN DEFAULT FALSE;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS organic BOOLEAN DEFAULT FALSE;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS listing_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS visibility_score DECIMAL(3, 2) DEFAULT 0.50;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS favorite_count INTEGER DEFAULT 0;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS inquiry_count INTEGER DEFAULT 0;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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
    gi_product_id UUID REFERENCES gi_products(id),
    product_id VARCHAR(50) REFERENCES product_listings(id),
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but users.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    seller_id UUID NOT NULL REFERENCES users(id),
    listing_title VARCHAR(255) NOT NULL,
    description TEXT,
    available_quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    price_per_unit DECIMAL(15, 2) NOT NULL,
    is_premium_priced BOOLEAN DEFAULT TRUE,
    premium_percentage DECIMAL(5, 2) DEFAULT 0,
    quality_tier VARCHAR(20),
    harvest_date DATE,
    location_id UUID REFERENCES addresses(id),
    listing_status VARCHAR(20) DEFAULT 'active',
    authenticity_verified BOOLEAN DEFAULT FALSE,
    authenticity_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_gi_quantity_positive CHECK (available_quantity > 0),
    CONSTRAINT chk_gi_price_positive CHECK (price_per_unit > 0),
    CONSTRAINT chk_gi_listing_status CHECK (listing_status IN ('active', 'sold', 'deleted', 'expired'))
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS gi_product_id UUID;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS listing_title VARCHAR(255);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS available_quantity DECIMAL(15, 2);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS price_per_unit DECIMAL(15, 2);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS is_premium_priced BOOLEAN DEFAULT TRUE;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS premium_percentage DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS quality_tier VARCHAR(20);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS harvest_date DATE;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS location_id UUID;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS listing_status VARCHAR(20) DEFAULT 'active';
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS authenticity_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS authenticity_score DECIMAL(3, 2);
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE gi_marketplace_listings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Indexes for gi_marketplace_listings
CREATE INDEX IF NOT EXISTS idx_gi_listings_gi_product ON gi_marketplace_listings(gi_product_id);
CREATE INDEX IF NOT EXISTS idx_gi_listings_seller ON gi_marketplace_listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_gi_listings_status ON gi_marketplace_listings(listing_status);
CREATE INDEX IF NOT EXISTS idx_gi_listings_premium ON gi_marketplace_listings(is_premium_priced);

-- Product Reviews Table
CREATE TABLE IF NOT EXISTS product_reviews (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) NOT NULL REFERENCES product_listings(id),
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but users.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    user_id UUID NOT NULL REFERENCES users(id),
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but orders.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    order_id UUID REFERENCES orders(id),
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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS rating INTEGER CHECK (rating >= 1 AND rating <= 5);
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS comment TEXT;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]';
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS verified_purchase BOOLEAN DEFAULT FALSE;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- RECONCILIATION (added 2026-09-23)
-- `product_reviews` is also defined by an earlier migration, so the CREATE
-- TABLE above does nothing on a clean run and the index below then failed with
-- `column "moderation_status" does not exist`. Verified on a clean PostgreSQL
-- 16 run.
--
-- NOTE FOR A LATER DECISION: the earlier definition already carries a `status`
-- column for the same concept. Both are kept -- nothing is dropped -- but the
-- two must be reconciled into one before either is trusted in a query. They are
-- NOT kept in sync by anything today.
--
-- order_id is added WITHOUT its declared REFERENCES orders(id): this migration
-- types it VARCHAR(50) while orders.id is UUID, so the foreign key cannot be
-- implemented. The type mismatch is preserved and flagged rather than silently
-- changed.
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS order_id VARCHAR(50);
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS moderation_status VARCHAR(20) DEFAULT 'approved';
ALTER TABLE product_reviews ADD COLUMN IF NOT EXISTS reported_count INTEGER DEFAULT 0;


-- Indexes for product_reviews
CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_user ON product_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_rating ON product_reviews(rating);
CREATE INDEX IF NOT EXISTS idx_product_reviews_status ON product_reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_product_reviews_created ON product_reviews(created_at DESC);

-- Review Helpful Votes Table
CREATE TABLE IF NOT EXISTS review_helpful_votes (
    id VARCHAR(50) PRIMARY KEY,
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but product_reviews.id is INTEGER, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    review_id INTEGER NOT NULL REFERENCES product_reviews(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_review_user UNIQUE (review_id, user_id)
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE review_helpful_votes ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE review_helpful_votes ADD COLUMN IF NOT EXISTS review_id INTEGER;
ALTER TABLE review_helpful_votes ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE review_helpful_votes ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Review Reports Table
CREATE TABLE IF NOT EXISTS review_reports (
    id VARCHAR(50) PRIMARY KEY,
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but product_reviews.id is INTEGER, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    review_id INTEGER NOT NULL REFERENCES product_reviews(id),
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but users.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    reporter_id UUID NOT NULL REFERENCES users(id),
    reason VARCHAR(50) NOT NULL,
    description TEXT,
    status VARCHAR(20) DEFAULT 'pending',
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but users.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_report_status CHECK (status IN ('pending', 'reviewed', 'dismissed', 'actioned'))
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS review_id INTEGER;
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS reporter_id UUID;
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS reason VARCHAR(50);
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS reviewed_by UUID;
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP;
ALTER TABLE review_reports ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Bulk Orders Table
CREATE TABLE IF NOT EXISTS bulk_orders (
    id VARCHAR(50) PRIMARY KEY,
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but users.id is UUID, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    buyer_id UUID NOT NULL REFERENCES users(id),
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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS title VARCHAR(255);
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS category_id INTEGER;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS required_quantity DECIMAL(15, 2);
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS target_price DECIMAL(15, 2);
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS delivery_location TEXT;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS required_by DATE;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS specifications JSONB DEFAULT '{}';
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS quotation_count INTEGER DEFAULT 0;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE bulk_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


-- Indexes for bulk_orders
CREATE INDEX IF NOT EXISTS idx_bulk_orders_buyer ON bulk_orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_category ON bulk_orders(category_id);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_status ON bulk_orders(status);
CREATE INDEX IF NOT EXISTS idx_bulk_orders_created ON bulk_orders(created_at DESC);

-- Quotations Table
CREATE TABLE IF NOT EXISTS quotations (
    id VARCHAR(50) PRIMARY KEY,
    -- TYPE ALIGNED (2026-09-23): declared VARCHAR(50), but bulk_orders.id is INTEGER, so the foreign key could not be implemented and this whole file aborted. The referenced table is canonical.
    bulk_order_id INTEGER NOT NULL REFERENCES bulk_orders(id),
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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS bulk_order_id INTEGER;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS quoted_price DECIMAL(15, 2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS available_quantity DECIMAL(15, 2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS delivery_cost DECIMAL(15, 2);
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE quotations ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS total_listings INTEGER DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS active_listings INTEGER DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS sold_listings INTEGER DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS total_revenue DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS avg_order_value DECIMAL(15, 2);
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS total_quantity_sold DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS avg_quality_score DECIMAL(3, 2);
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS total_views INTEGER DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS total_inquiries INTEGER DEFAULT 0;
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS response_rate DECIMAL(5, 2);
ALTER TABLE seller_analytics_summary ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS category_id INTEGER;
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS state_id INTEGER;
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS avg_price DECIMAL(15, 2);
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS min_price DECIMAL(15, 2);
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS max_price DECIMAL(15, 2);
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS listing_count INTEGER;
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS record_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE market_price_history ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS event_type VARCHAR(50);
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS entity_id VARCHAR(50);
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS entity_type VARCHAR(50);
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS event_data JSONB DEFAULT '{}';
ALTER TABLE marketplace_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_product_listings_updated_at'
          AND tgrelid = 'product_listings'::regclass
    ) THEN
        -- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. Another migration already defines a trigger of this
-- name on product_listings.
DROP TRIGGER IF EXISTS update_product_listings_updated_at ON product_listings;
CREATE TRIGGER update_product_listings_updated_at BEFORE UPDATE ON product_listings
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. Another migration already defines a trigger of this
-- name on gi_marketplace_listings.
DROP TRIGGER IF EXISTS update_gi_marketplace_listings_updated_at ON gi_marketplace_listings;
CREATE TRIGGER update_gi_marketplace_listings_updated_at BEFORE UPDATE ON gi_marketplace_listings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. Another migration already defines a trigger of this
-- name on product_reviews.
DROP TRIGGER IF EXISTS update_product_reviews_updated_at ON product_reviews;
CREATE TRIGGER update_product_reviews_updated_at BEFORE UPDATE ON product_reviews
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. Another migration already defines a trigger of this
-- name on bulk_orders.
DROP TRIGGER IF EXISTS update_bulk_orders_updated_at ON bulk_orders;
CREATE TRIGGER update_bulk_orders_updated_at BEFORE UPDATE ON bulk_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'update_quotations_updated_at'
          AND tgrelid = 'quotations'::regclass
    ) THEN
        -- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. Another migration already defines a trigger of this
-- name on quotations.
DROP TRIGGER IF EXISTS update_quotations_updated_at ON quotations;
CREATE TRIGGER update_quotations_updated_at BEFORE UPDATE ON quotations
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

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
