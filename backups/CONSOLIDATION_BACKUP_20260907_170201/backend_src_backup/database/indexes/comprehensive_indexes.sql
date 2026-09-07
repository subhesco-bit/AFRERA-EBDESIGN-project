-- ============================================================================
-- COMPREHENSIVE DATABASE INDEXING STRATEGY
-- Production-ready indexing for AFRERA Platform
-- ============================================================================

-- Enable pg_stat_statements for query performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- ============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERY PATTERNS
-- ============================================================================

-- Users & Authentication
CREATE INDEX IF NOT EXISTS idx_users_email_status ON users(email, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC) WHERE last_login_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_kyc_status ON user_profiles(kyc_status) WHERE kyc_status IN ('pending', 'verified');

-- Products & Catalog
CREATE INDEX IF NOT EXISTS idx_products_category_gi ON products(category_id, gi_status) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_state_gi ON products(state_id, gi_status) WHERE gi_status = true;
CREATE INDEX IF NOT EXISTS idx_products_price_range ON products(base_price) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured, created_at DESC) WHERE featured = true AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_organic ON products(organic, created_at DESC) WHERE organic = true AND is_active = true;

-- Orders & Commerce
CREATE INDEX IF NOT EXISTS idx_orders_user_status_date ON orders(user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_status_payment ON orders(status, payment_status) WHERE status IN ('pending', 'confirmed', 'processing');
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status, created_at DESC) WHERE payment_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(expected_delivery_date) WHERE status IN ('confirmed', 'processing', 'shipped');
CREATE INDEX IF NOT EXISTS idx_orders_erp_sync ON orders(erp_synced_at) WHERE erp_synced_at IS NULL;

-- Order Items
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_orders ON order_items(product_id, order_id);

-- Farmers & FPOs
CREATE INDEX IF NOT EXISTS idx_farmers_fpo_status ON farmers(fpo_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_farmers_fdi_score ON farmers(fdi_score DESC) WHERE fdi_score > 0;
CREATE INDEX IF NOT EXISTS idx_farmers_credit_score ON farmers(credit_score DESC) WHERE credit_score > 50;
CREATE INDEX IF NOT EXISTS idx_farmers_erp_sync ON farmers(erp_synced_at) WHERE erp_synced_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_fpos_member_count ON fpos(member_count DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_fpos_fdi_score ON fpos(fdi_score DESC) WHERE fdi_score > 0;

-- Financial
CREATE INDEX IF NOT EXISTS idx_loans_farmer_status ON loans(farmer_id, status) WHERE status IN ('pending', 'active', 'disbursed');
CREATE INDEX IF NOT EXISTS idx_loans_status_date ON loans(status, application_date DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_emi_schedule_loan_due ON emi_schedule(loan_id, due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_emi_schedule_due_date ON emi_schedule(due_date) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_advances_farmer_status ON advances(farmer_id, tranche_status) WHERE tranche_status = 'pending';
CREATE INDEX IF NOT EXISTS idx_financial_transactions_user_date ON financial_transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_type_date ON financial_transactions(type, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_erp_sync ON financial_transactions(erp_synced_at) WHERE erp_synced_at IS NULL;

-- Insurance
CREATE INDEX IF NOT EXISTS idx_policies_user_status ON policies(user_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_policies_farmer_status ON policies(farmer_id, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_policies_expiry ON policies(policy_end_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_claims_policy_status ON claims(policy_id, status) WHERE status IN ('submitted', 'under_review');
CREATE INDEX IF NOT EXISTS idx_claims_user_status ON claims(user_id, status) WHERE status IN ('submitted', 'under_review');
CREATE INDEX IF NOT EXISTS idx_claims_date_submitted ON claims(submitted_date DESC) WHERE status = 'submitted';

-- Logistics
CREATE INDEX IF NOT EXISTS idx_shipments_order_status ON shipments(order_id, status) WHERE status IN ('pending', 'picked_up', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_shipments_status_date ON shipments(status, created_at DESC) WHERE status IN ('pending', 'picked_up', 'in_transit');
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_shipment_time ON shipment_tracking(shipment_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_location ON shipment_tracking(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_vehicles_status_type ON vehicles(status, type) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status, verification_status) WHERE status = 'active';

-- Contracts
CREATE INDEX IF NOT EXISTS idx_contracts_farmer_status ON contracts(farmer_id, status) WHERE status IN ('draft', 'active');
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_status ON contracts(buyer_id, status) WHERE status IN ('draft', 'active');
CREATE INDEX IF NOT EXISTS idx_contracts_season_status ON contracts(season, status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contracts_harvest_date ON contracts(expected_harvest_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract_status ON contract_milestones(contract_id, status) WHERE status IN ('pending', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_contract_milestones_target_date ON contract_milestones(target_date) WHERE status = 'pending';

-- Assets
CREATE INDEX IF NOT EXISTS idx_assets_type_status ON assets(type_id, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_assets_location_status ON assets(location_id, status) WHERE status = 'available';
CREATE INDEX IF NOT EXISTS idx_assets_booking_dates ON asset_bookings(asset_id, start_time, end_time) WHERE status = 'confirmed';
CREATE INDEX IF NOT EXISTS idx_maintenance_asset_date ON maintenance_records(asset_id, scheduled_date) WHERE status = 'scheduled';

-- Governance
CREATE INDEX IF NOT EXISTS idx_schemes_status_deadline ON schemes(status, application_deadline) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_subsidy_claims_farmer_status ON subsidy_claims(farmer_id, status) WHERE status IN ('submitted', 'under_review');
CREATE INDEX IF NOT EXISTS idx_subsidy_claims_scheme_status ON subsidy_claims(scheme_id, status) WHERE status = 'submitted';
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_timestamp ON audit_logs(entity_type, entity_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_entity_status ON compliance_records(entity_type, entity_id, status) WHERE status = 'pending';

-- ERP Integration
CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_status_retry ON erp_sync_logs(status, retry_count) WHERE status = 'failed' AND retry_count < 5;
CREATE INDEX IF NOT EXISTS idx_erp_sync_logs_created_at ON erp_sync_logs(created_at DESC) WHERE status = 'pending';

-- AI & Analytics
CREATE INDEX IF NOT EXISTS idx_ai_predictions_entity_type ON ai_predictions(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_predictions_model_type ON ai_predictions(model_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_score ON recommendations(user_id, score DESC) WHERE clicked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_timestamp ON analytics_events(user_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_timestamp ON analytics_events(session_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_timestamp ON analytics_events(event_type, timestamp DESC);

-- ============================================================================
-- PARTIAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Only index active records for frequently filtered tables
CREATE INDEX IF NOT EXISTS idx_products_active_search ON products USING gin(to_tsvector('english', name || ' ' || COALESCE(description, ''))) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_orders_active ON orders(id, status) WHERE status NOT IN ('cancelled', 'returned');
CREATE INDEX IF NOT EXISTS idx_users_active ON users(id, email) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_farmers_active ON farmers(id, user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_fpos_active ON fpos(id) WHERE status = 'active';

-- ============================================================================
-- EXPRESSION INDEXES FOR COMPUTED QUERIES
-- ============================================================================

-- Index for full-text search with weights
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(
  to_tsvector('english', 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(usp, '')), 'C')
  )
) WHERE is_active = true;

-- Index for case-insensitive email search
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users(lower(email));

-- Index for date range queries
CREATE INDEX IF NOT EXISTS idx_policies_active_period ON policies(policy_start_date, policy_end_date) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_contracts_active_period ON contracts(contract_date, expected_harvest_date) WHERE status = 'active';

-- ============================================================================
-- UNIQUE INDEXES FOR DATA INTEGRITY
-- ============================================================================

-- Prevent duplicate active contracts for same farmer-crop-season
CREATE UNIQUE INDEX IF NOT EXISTS idx_contracts_unique_active 
ON contracts(farmer_id, crop_id, season) 
WHERE status = 'active';

-- Prevent duplicate pending claims for same policy
CREATE UNIQUE INDEX IF NOT EXISTS idx_claims_unique_pending 
ON claims(policy_id) 
WHERE status = 'submitted';

-- Prevent duplicate active certifications
CREATE UNIQUE INDEX IF NOT EXISTS idx_certifications_unique_active 
ON certifications(product_id, certification_type) 
WHERE verified = true AND expiry_date > CURRENT_DATE;

-- ============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- ============================================================================

-- Cover frequently accessed columns in order queries
CREATE INDEX IF NOT EXISTS idx_orders_covering ON orders(user_id, status, created_at) 
INCLUDE (total_amount, payment_status, expected_delivery_date);

-- Cover farmer profile queries
CREATE INDEX IF NOT EXISTS idx_farmers_covering ON farmers(user_id, status) 
INCLUDE (fdi_score, credit_score, farm_size_hectares, fpo_id);

-- Cover product listing queries
CREATE INDEX IF NOT EXISTS idx_products_covering ON products(category_id, is_active, created_at DESC) 
INCLUDE (name, base_price, gi_status, organic, images);

-- ============================================================================
-- BRIN INDEXES FOR LARGE TIME-SERIES DATA
-- ============================================================================

-- Efficient for analytics events (large table, time-series data)
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp_brin ON analytics_events USING brin(timestamp);

-- Efficient for audit logs (large table, time-series data)
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp_brin ON audit_logs USING brin(timestamp);

-- Efficient for shipment tracking (time-series location data)
CREATE INDEX IF NOT EXISTS idx_shipment_tracking_timestamp_brin ON shipment_tracking USING brin(timestamp);

-- ============================================================================
-- HASH INDEXES FOR EQUALITY LOOKUPS
-- ============================================================================

-- Hash indexes are smaller and faster for equality comparisons
CREATE INDEX IF NOT EXISTS idx_users_email_hash ON users USING hash(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_hash ON users USING hash(phone);
CREATE INDEX IF NOT EXISTS idx_products_sku_hash ON products USING hash(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_order_number_hash ON orders USING hash(order_number);
CREATE INDEX IF NOT EXISTS idx_policies_policy_number_hash ON policies USING hash(policy_number);
CREATE INDEX IF NOT EXISTS idx_claims_claim_number_hash ON claims USING hash(claim_number);

-- ============================================================================
-- MAINTENANCE NOTES
-- ============================================================================

-- Regular index maintenance should be scheduled:
-- 1. ANALYZE tables weekly to update statistics
-- 2. REINDEX heavily fragmented indexes monthly
-- 3. Monitor index usage with pg_stat_user_indexes
-- 4. Remove unused indexes to reduce write overhead

-- To check index usage:
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- ORDER BY idx_scan ASC;

-- To check index size:
-- SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
-- FROM pg_stat_user_indexes
-- ORDER BY pg_relation_size(indexrelid) DESC;
