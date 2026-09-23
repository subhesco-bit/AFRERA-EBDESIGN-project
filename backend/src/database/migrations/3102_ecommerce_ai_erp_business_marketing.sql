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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS segment_type VARCHAR(50);
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS segment_data JSONB DEFAULT '{}';
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3, 2);
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customer_segments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS forecast_data JSONB;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS horizon_days INTEGER;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS forecast_method VARCHAR(50);
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS accuracy_score DECIMAL(3, 2);
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE demand_forecasts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE inventory_optimization ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE inventory_optimization ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE inventory_optimization ADD COLUMN IF NOT EXISTS optimization_data JSONB;
ALTER TABLE inventory_optimization ADD COLUMN IF NOT EXISTS optimization_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE inventory_optimization ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS category_id INTEGER;
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS forecast_data JSONB;
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS period_days INTEGER;
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS forecast_method VARCHAR(50);
ALTER TABLE sales_forecasts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_sales_forecasts_category ON sales_forecasts(category_id);

-- Customer Lifetime Value Table
CREATE TABLE IF NOT EXISTS customer_ltv (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    ltv_data JSONB NOT NULL,
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE customer_ltv ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE customer_ltv ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE customer_ltv ADD COLUMN IF NOT EXISTS ltv_data JSONB;
ALTER TABLE customer_ltv ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE customer_ltv ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS product_a_id VARCHAR(50);
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS product_b_id VARCHAR(50);
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS co_occurrence INTEGER;
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS lift_ratio DECIMAL(5, 2);
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(3, 2);
ALTER TABLE market_basket_analysis ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS journal_entry_id VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS account_code VARCHAR(20);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS entry_type VARCHAR(10) CHECK (entry_type IN ('DEBIT', 'CREDIT'));
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS amount DECIMAL(15, 2);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR';
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reference_id VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50);
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS posted_by UUID;
ALTER TABLE journal_entries ADD COLUMN IF NOT EXISTS posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS invoice_number VARCHAR(50);
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS order_id VARCHAR(50);
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS invoice_data JSONB;
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS invoice_status VARCHAR(20) DEFAULT 'generated';
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE gst_invoices ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS quantity DECIMAL(15, 2);
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(50);
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS bin_location VARCHAR(50);
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS last_counted TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE warehouse_inventory ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS marketplace_quantity DECIMAL(15, 2);
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS erp_quantity DECIMAL(15, 2);
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS discrepancy DECIMAL(15, 2);
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS adjustment_type VARCHAR(50);
ALTER TABLE inventory_adjustments ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS requested_quantity DECIMAL(15, 2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS unit_price DECIMAL(15, 2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS total_value DECIMAL(15, 2);
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS po_status VARCHAR(20) DEFAULT 'created';
ALTER TABLE purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS customer_data JSONB;
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE crm_customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS requested_quantity DECIMAL(15, 2);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS production_quantity DECIMAL(15, 2);
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS target_completion_date DATE;
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS order_status VARCHAR(20) DEFAULT 'planned';
ALTER TABLE production_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS buyer_id UUID;
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS farmer_id UUID;
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS crop_type VARCHAR(100);
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS variety VARCHAR(100);
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS contract_quantity DECIMAL(15, 2);
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS unit VARCHAR(20);
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS agreed_price DECIMAL(15, 2);
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS contract_start_date DATE;
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS contract_end_date DATE;
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS quality_standards JSONB DEFAULT '{}';
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS delivery_schedule JSONB DEFAULT '{}';
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS payment_terms TEXT;
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS milestone_payments JSONB DEFAULT '{}';
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE contract_farming ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS contract_id VARCHAR(50);
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS milestone_name VARCHAR(100);
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS milestone_date DATE;
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS quantity_delivered DECIMAL(15, 2);
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS quality_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS payment_amount DECIMAL(15, 2);
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'pending';
ALTER TABLE contract_milestones ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS id INTEGER;
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15, 2);
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 2);
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(15, 2);
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS seller_payout DECIMAL(15, 2);
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS seller_tier VARCHAR(20);
ALTER TABLE platform_commissions ADD COLUMN IF NOT EXISTS calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS campaign_name VARCHAR(255);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS objective TEXT;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS budget_spent DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS target_audience JSONB DEFAULT '{}';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ad_creatives JSONB DEFAULT '{}';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS platforms JSONB DEFAULT '{}';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS optimization_goal VARCHAR(100);
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS total_impressions INTEGER DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS total_clicks INTEGER DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS total_conversions INTEGER DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS ctr DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS conversion_rate DECIMAL(5, 2) DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS cpa DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS launched_at TIMESTAMP;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE marketing_campaigns ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS campaign_id VARCHAR(50);
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS platform VARCHAR(50);
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS creative_id VARCHAR(50);
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS placement_type VARCHAR(50);
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS spend DECIMAL(15, 2) DEFAULT 0;
ALTER TABLE ad_placements ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS seller_id UUID;
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS sponsor_tier VARCHAR(20);
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS bid_amount DECIMAL(15, 2);
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS targeting JSONB DEFAULT '{}';
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS impressions INTEGER DEFAULT 0;
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS clicks INTEGER DEFAULT 0;
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS conversions INTEGER DEFAULT 0;
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE sponsored_products ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promotion_name VARCHAR(255);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS promotion_type VARCHAR(50);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) CHECK (discount_type IN ('percentage', 'fixed', 'buy_x_get_y'));
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15, 2);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS min_purchase_value DECIMAL(15, 2);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS max_discount_amount DECIMAL(15, 2);
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS usage_limit INTEGER;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS used_count INTEGER DEFAULT 0;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS applicable_products JSONB DEFAULT '[]';
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS applicable_categories JSONB DEFAULT '[]';
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS user_segments JSONB DEFAULT '[]';
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE promotions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS promotion_id VARCHAR(50);
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS order_id UUID;
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15, 2);
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS original_amount DECIMAL(15, 2);
ALTER TABLE discount_records ADD COLUMN IF NOT EXISTS applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


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

-- RECONCILIATION (added 2026-09-23): see the note at the top of this file.
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS id VARCHAR(50);
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS user_id UUID;
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS campaign_type VARCHAR(50);
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS product_id VARCHAR(50);
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS cart_items JSONB DEFAULT '{}';
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS cart_value DECIMAL(15, 2);
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS conversion_count INTEGER DEFAULT 0;
ALTER TABLE retargeting_campaigns ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;


CREATE INDEX IF NOT EXISTS idx_retargeting_user ON retargeting_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_retargeting_product ON retargeting_campaigns(product_id);
CREATE INDEX IF NOT EXISTS idx_retargeting_type ON retargeting_campaigns(campaign_type);
CREATE INDEX IF NOT EXISTS idx_retargeting_status ON retargeting_campaigns(status);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on customer_segments.
DROP TRIGGER IF EXISTS update_customer_segments_updated_at ON customer_segments;
CREATE TRIGGER update_customer_segments_updated_at BEFORE UPDATE ON customer_segments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on demand_forecasts.
DROP TRIGGER IF EXISTS update_demand_forecasts_updated_at ON demand_forecasts;
CREATE TRIGGER update_demand_forecasts_updated_at BEFORE UPDATE ON demand_forecasts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on journal_entries.
DROP TRIGGER IF EXISTS update_journal_entries_updated_at ON journal_entries;
CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON journal_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on gst_invoices.
DROP TRIGGER IF EXISTS update_gst_invoices_updated_at ON gst_invoices;
CREATE TRIGGER update_gst_invoices_updated_at BEFORE UPDATE ON gst_invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on crm_customers.
DROP TRIGGER IF EXISTS update_crm_customers_updated_at ON crm_customers;
CREATE TRIGGER update_crm_customers_updated_at BEFORE UPDATE ON crm_customers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on marketing_campaigns.
DROP TRIGGER IF EXISTS update_marketing_campaigns_updated_at ON marketing_campaigns;
CREATE TRIGGER update_marketing_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on promotions.
DROP TRIGGER IF EXISTS update_promotions_updated_at ON promotions;
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PostgreSQL has no CREATE TRIGGER IF NOT EXISTS; the DROP is how this is
-- made re-runnable. The trigger name is already taken on a clean run of the
-- full set, because another migration defines the same trigger on contract_farming.
DROP TRIGGER IF EXISTS update_contract_farming_updated_at ON contract_farming;
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
