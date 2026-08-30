-- ============================================================================
-- AFRERA E-Commerce AI, ERP, Business Sales & Marketing Database Schema
-- Extension to e-commerce marketplace with advanced features
-- ============================================================================

-- Add AI-related columns to existing tables
ALTER TABLE product_listings
ADD COLUMN IF NOT EXISTS ai_demand_prediction_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS ai_visibility_score DECIMAL(3, 2),
ADD COLUMN IF NOT EXISTS ai_optimization_flags JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_ai_analysis TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_product_listings_ai_demand ON product_listings(ai_demand_prediction_score);
CREATE INDEX IF NOT EXISTS idx_product_listings_ai_visibility ON product_listings(ai_visibility_score);

-- ============================================================================
-- AI SERVICE TABLES
-- ============================================================================

-- Customer Segmentation Table
CREATE TABLE IF NOT EXISTS customer_segments (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    segment_type VARCHAR(50) NOT NULL,
    segment_data JSONB DEFAULT '{}',
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uk_user_segment_type UNIQUE (user_id, segment_type)
);

CREATE INDEX IF NOT EXISTS idx_customer_segments_user ON customer_segments(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_segments_type ON customer_segments(segment_type);
CREATE INDEX IF NOT EXISTS idx_customer_segments_confidence ON customer_segments(confidence_score DESC);

-- Demand Forecasts Table
CREATE TABLE IF NOT EXISTS demand_forecasts (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    forecast_data JSONB NOT NULL,
    horizon_days INTEGER NOT NULL,
    forecast_method VARCHAR(50),
    accuracy_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_product ON demand_forecasts(product_id);
CREATE INDEX IF NOT EXISTS idx_demand_forecasts_created ON demand_forecasts(created_at DESC);

-- Inventory Optimization Table
CREATE TABLE IF NOT EXISTS inventory_optimization (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    optimization_data JSONB NOT NULL,
    optimization_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_optimization_product ON inventory_optimization(product_id);

-- Sales Forecasts Table
CREATE TABLE IF NOT EXISTS sales_forecasts (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id),
    forecast_data JSONB NOT NULL,
    period_days INTEGER NOT NULL,
    forecast_method VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sales_forecasts_category ON sales_forecasts(category_id);

-- Customer Lifetime Value Table
CREATE TABLE IF NOT EXISTS customer_ltv (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    ltv_data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_customer_ltv_user ON customer_ltv(user_id);

-- Market Basket Analysis Table
CREATE TABLE IF NOT EXISTS market_basket_analysis (
    id SERIAL PRIMARY KEY,
    product_a_id VARCHAR(50) REFERENCES product_listings(id),
    product_b_id VARCHAR(50) REFERENCES product_listings(id),
    co_occurrence INTEGER NOT NULL,
    lift_ratio DECIMAL(5, 2),
    confidence_score DECIMAL(3, 2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_basket_product_a ON market_basket_analysis(product_a_id);
CREATE INDEX IF NOT EXISTS idx_market_basket_product_b ON market_basket_analysis(product_b_id);
CREATE INDEX IF NOT EXISTS idx_market_basket_lift ON market_basket_analysis(lift_ratio DESC);

-- ============================================================================
-- ERP INTEGRATION TABLES
-- ============================================================================

-- Journal Entries Table (Financial ERP)
CREATE TABLE IF NOT EXISTS journal_entries (
    id SERIAL PRIMARY KEY,
    journal_entry_id VARCHAR(50) UNIQUE NOT NULL,
    account_code VARCHAR(20) NOT NULL,
    entry_type VARCHAR(10) NOT NULL CHECK (entry_type IN ('DEBIT', 'CREDIT')),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'INR',
    description TEXT,
    reference_id VARCHAR(50),
    reference_type VARCHAR(50),
    posted_by UUID REFERENCES users(id),
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_journal_id ON journal_entries(journal_entry_id);
CREATE INDEX IF NOT EXISTS idx_journal_entries_account ON journal_entries(account_code);
CREATE INDEX IF NOT EXISTS idx_journal_entries_reference ON journal_entries(reference_id, reference_type);
CREATE INDEX IF NOT EXISTS idx_journal_entries_posted_at ON journal_entries(posted_at DESC);

-- GST Invoices Table
CREATE TABLE IF NOT EXISTS gst_invoices (
    id SERIAL PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id VARCHAR(50) REFERENCES orders(id),
    invoice_data JSONB NOT NULL,
    invoice_status VARCHAR(20) DEFAULT 'generated',
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_gst_invoices_number ON gst_invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_order ON gst_invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_gst_invoices_status ON gst_invoices(invoice_status);

-- Warehouse Inventory Table (Supply Chain ERP)
CREATE TABLE IF NOT EXISTS warehouse_inventory (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    quantity DECIMAL(15, 2) NOT NULL,
    warehouse_id VARCHAR(50),
    bin_location VARCHAR(50),
    last_counted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_product ON warehouse_inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_warehouse_inventory_warehouse ON warehouse_inventory(warehouse_id);

-- Inventory Adjustments Table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
    id SERIAL PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    marketplace_quantity DECIMAL(15, 2),
    erp_quantity DECIMAL(15, 2),
    discrepancy DECIMAL(15, 2),
    adjustment_type VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product ON inventory_adjustments(product_id);

-- Purchase Orders Table (Supply Chain ERP)
CREATE TABLE IF NOT EXISTS purchase_orders (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    seller_id UUID REFERENCES users(id),
    requested_quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    unit_price DECIMAL(15, 2) NOT NULL,
    total_value DECIMAL(15, 2) NOT NULL,
    delivery_date DATE,
    po_status VARCHAR(20) DEFAULT 'created',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchase_orders_product ON purchase_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_seller ON purchase_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(po_status);

-- CRM Customers Table (Customer ERP)
CREATE TABLE IF NOT EXISTS crm_customers (
    id SERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL REFERENCES users(id),
    customer_data JSONB NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crm_customers_user ON crm_customers(user_id);

-- Production Orders Table (Production ERP)
CREATE TABLE IF NOT EXISTS production_orders (
    id VARCHAR(50) PRIMARY KEY,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    seller_id UUID REFERENCES users(id),
    requested_quantity DECIMAL(15, 2) NOT NULL,
    production_quantity DECIMAL(15, 2) NOT NULL,
    start_date DATE,
    target_completion_date DATE,
    order_status VARCHAR(20) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_production_orders_product ON production_orders(product_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_seller ON production_orders(seller_id);
CREATE INDEX IF NOT EXISTS idx_production_orders_status ON production_orders(order_status);

-- ============================================================================
-- BUSINESS SALES TABLES
-- ============================================================================

-- Contract Farming Table
CREATE TABLE IF NOT EXISTS contract_farming (
    id VARCHAR(50) PRIMARY KEY,
    buyer_id UUID REFERENCES users(id),
    farmer_id UUID REFERENCES users(id),
    crop_type VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    contract_quantity DECIMAL(15, 2) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    agreed_price DECIMAL(15, 2) NOT NULL,
    contract_start_date DATE,
    contract_end_date DATE,
    quality_standards JSONB DEFAULT '{}',
    delivery_schedule JSONB DEFAULT '{}',
    payment_terms TEXT,
    milestone_payments JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_farming_buyer ON contract_farming(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contract_farming_farmer ON contract_farming(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contract_farming_status ON contract_farming(status);

-- Contract Milestones Table
CREATE TABLE IF NOT EXISTS contract_milestones (
    id VARCHAR(50) PRIMARY KEY,
    contract_id VARCHAR(50) REFERENCES contract_farming(id),
    milestone_name VARCHAR(100) NOT NULL,
    milestone_date DATE,
    quantity_delivered DECIMAL(15, 2),
    quality_verified BOOLEAN DEFAULT FALSE,
    payment_amount DECIMAL(15, 2),
    payment_status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract ON contract_milestones(contract_id);

-- Platform Commissions Table
CREATE TABLE IF NOT EXISTS platform_commissions (
    id SERIAL PRIMARY KEY,
    order_id UUID REFERENCES orders(id),
    total_amount DECIMAL(15, 2) NOT NULL,
    commission_rate DECIMAL(5, 2) NOT NULL,
    commission_amount DECIMAL(15, 2) NOT NULL,
    seller_payout DECIMAL(15, 2) NOT NULL,
    seller_tier VARCHAR(20),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_platform_commissions_order ON platform_commissions(order_id);
CREATE INDEX IF NOT EXISTS idx_platform_commissions_calculated ON platform_commissions(calculated_at DESC);

-- ============================================================================
-- MARKETING & ADVERTISING TABLES
-- ============================================================================

-- Marketing Campaigns Table
CREATE TABLE IF NOT EXISTS marketing_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    created_by UUID REFERENCES users(id),
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL,
    objective TEXT,
    start_date DATE,
    end_date DATE,
    budget DECIMAL(15, 2) NOT NULL,
    budget_spent DECIMAL(15, 2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}',
    ad_creatives JSONB DEFAULT '{}',
    platforms JSONB DEFAULT '{}',
    optimization_goal VARCHAR(100),
    total_impressions INTEGER DEFAULT 0,
    total_clicks INTEGER DEFAULT 0,
    total_conversions INTEGER DEFAULT 0,
    ctr DECIMAL(5, 2) DEFAULT 0,
    conversion_rate DECIMAL(5, 2) DEFAULT 0,
    cpa DECIMAL(15, 2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'draft',
    launched_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_created_by ON marketing_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_marketing_campaigns_type ON marketing_campaigns(campaign_type);

-- Ad Placements Table
CREATE TABLE IF NOT EXISTS ad_placements (
    id VARCHAR(50) PRIMARY KEY,
    campaign_id VARCHAR(50) REFERENCES marketing_campaigns(id),
    platform VARCHAR(50) NOT NULL,
    creative_id VARCHAR(50),
    placement_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    spend DECIMAL(15, 2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ad_placements_campaign ON ad_placements(campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_placements_platform ON ad_placements(platform);
CREATE INDEX IF NOT EXISTS idx_ad_placements_status ON ad_placements(status);

-- Sponsored Products Table
CREATE TABLE IF NOT EXISTS sponsored_products (
    id VARCHAR(50) PRIMARY KEY,
    seller_id UUID REFERENCES users(id),
    product_id VARCHAR(50) REFERENCES product_listings(id),
    sponsor_tier VARCHAR(20) NOT NULL,
    bid_amount DECIMAL(15, 2) NOT NULL,
    start_date DATE,
    end_date DATE,
    targeting JSONB DEFAULT '{}',
    impressions INTEGER DEFAULT 0,
    clicks INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sponsored_products_seller ON sponsored_products(seller_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_products_product ON sponsored_products(product_id);
CREATE INDEX IF NOT EXISTS idx_sponsored_products_tier ON sponsored_products(sponsor_tier);
CREATE INDEX IF NOT EXISTS idx_sponsored_products_status ON sponsored_products(status);

-- Promotions Table
CREATE TABLE IF NOT EXISTS promotions (
    id VARCHAR(50) PRIMARY KEY,
    created_by UUID REFERENCES users(id),
    promotion_name VARCHAR(255) NOT NULL,
    promotion_type VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y')),
    discount_value DECIMAL(15, 2) NOT NULL,
    min_purchase_value DECIMAL(15, 2),
    max_discount_amount DECIMAL(15, 2),
    usage_limit INTEGER NOT NULL,
    used_count INTEGER DEFAULT 0,
    start_date DATE,
    end_date DATE,
    applicable_products JSONB DEFAULT '[]',
    applicable_categories JSONB DEFAULT '[]',
    user_segments JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promotions_id ON promotions(id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON promotions(status);
CREATE INDEX IF NOT EXISTS idx_promotions_dates ON promotions(start_date, end_date);

-- Discount Records Table
CREATE TABLE IF NOT EXISTS discount_records (
    id VARCHAR(50) PRIMARY KEY,
    promotion_id VARCHAR(50) REFERENCES promotions(id),
    order_id UUID REFERENCES orders(id),
    user_id UUID REFERENCES users(id),
    discount_amount DECIMAL(15, 2) NOT NULL,
    original_amount DECIMAL(15, 2) NOT NULL,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_discount_records_promotion ON discount_records(promotion_id);
CREATE INDEX IF NOT EXISTS idx_discount_records_order ON discount_records(order_id);
CREATE INDEX IF NOT EXISTS idx_discount_records_user ON discount_records(user_id);

-- Retargeting Campaigns Table
CREATE TABLE IF NOT EXISTS retargeting_campaigns (
    id VARCHAR(50) PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    campaign_type VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) REFERENCES product_listings(id),
    cart_items JSONB DEFAULT '{}',
    cart_value DECIMAL(15, 2),
    status VARCHAR(20) DEFAULT 'active',
    conversion_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_retargeting_user ON retargeting_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_retargeting_product ON retargeting_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_retargeting_type ON retargeting_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_retargeting_status ON retargeting_campaigns(status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2026-08-30: guarded with DROP TRIGGER IF EXISTS - demand_forecasts is a
-- pre-existing (pre-dates this session) documented collision (see
-- schema-decisions.json), and 030_institutional_procurement_schema.sql
-- already creates a trigger of this exact name on the same real table,
-- using the same self-healing DROP-then-CREATE pattern this fix now matches.
DROP TRIGGER IF EXISTS update_demand_forecasts_updated_at ON demand_forecasts;
CREATE TRIGGER update_demand_forecasts_updated_at BEFORE UPDATE ON demand_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2026-08-30: guarded with DROP TRIGGER IF EXISTS - gst_invoices is a
-- pre-existing documented collision (schema-decisions.json), and
-- 028_gst_schema.sql already creates a trigger of this exact name.
DROP TRIGGER IF EXISTS update_gst_invoices_updated_at ON gst_invoices;
CREATE TRIGGER update_gst_invoices_updated_at BEFORE UPDATE ON gst_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crm_customers_updated_at BEFORE UPDATE ON crm_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contract_farming_updated_at BEFORE UPDATE ON contract_farming
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE customer_segments IS 'AI-powered customer segmentation (RFM, behavioral)';
COMMENT ON TABLE demand_forecasts IS 'AI demand forecasting for products';
COMMENT ON TABLE inventory_optimization IS 'AI inventory optimization and reorder points';
COMMENT ON TABLE sales_forecasts IS 'AI sales prediction by category';
COMMENT ON TABLE customer_ltv IS 'Customer lifetime value calculation';
COMMENT ON TABLE market_basket_analysis IS 'Market basket analysis for cross-sell';

COMMENT ON TABLE journal_entries IS 'Financial ERP - General ledger journal entries';
COMMENT ON TABLE gst_invoices IS 'Financial ERP - GST invoicing for marketplace orders';
COMMENT ON TABLE warehouse_inventory IS 'Supply Chain ERP - Warehouse inventory management';
COMMENT ON TABLE purchase_orders IS 'Supply Chain ERP - Purchase order management';
COMMENT ON TABLE crm_customers IS 'Customer ERP - CRM customer synchronization';
COMMENT ON TABLE production_orders IS 'Production ERP - Production order management';

COMMENT ON TABLE contract_farming IS 'Business Sales - Contract farming agreements';
COMMENT ON TABLE contract_milestones IS 'Business Sales - Contract farming milestones';
COMMENT ON TABLE platform_commissions IS 'Business Sales - Platform commission management';

COMMENT ON TABLE marketing_campaigns IS 'Marketing - Campaign management';
COMMENT ON TABLE ad_placements IS 'Marketing - Ad placement tracking';
COMMENT ON TABLE sponsored_products IS 'Marketing - Sponsored product listings';
COMMENT ON TABLE promotions IS 'Marketing - Promotion and discount management';
COMMENT ON TABLE retargeting_campaigns IS 'Marketing - Retargeting campaigns';

-- ============================================================================
-- GRANT PERMISSIONS (adjust as needed for your setup)
-- ============================================================================
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
