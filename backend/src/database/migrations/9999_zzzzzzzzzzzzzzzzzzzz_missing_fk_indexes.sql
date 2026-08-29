-- ============================================================================
-- 9999_zzzzzzzzzzzzzzzzzzzz_missing_fk_indexes.sql
--
-- FIXES.md H7 (AUDIT_DB #1, 2026-08-28): 000_base_schema.sql declares 58 FK
-- columns but only 28 have a covering index - confirmed by parsing the file
-- directly (table-scoped FK column extraction cross-referenced against every
-- CREATE INDEX statement), not by trusting the audit's own count. The other
-- 30 force a sequential scan on every JOIN/FK-lookup/cascade-delete check
-- against them. 000-071 are protected core migrations (see CLAUDE.md) - not
-- edited here. Purely additive and idempotent.
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_assigned_by ON user_roles(assigned_by);
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_products_unit_id ON products(unit_id);
CREATE INDEX IF NOT EXISTS idx_products_created_by ON products(created_by);
CREATE INDEX IF NOT EXISTS idx_policies_user_id ON policies(user_id);
CREATE INDEX IF NOT EXISTS idx_policies_farmer_id ON policies(farmer_id);
CREATE INDEX IF NOT EXISTS idx_policies_product_id ON policies(product_id);
CREATE INDEX IF NOT EXISTS idx_claims_policy_id ON claims(policy_id);
CREATE INDEX IF NOT EXISTS idx_claims_user_id ON claims(user_id);
CREATE INDEX IF NOT EXISTS idx_shipments_order_id ON shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_shipments_mode_id ON shipments(mode_id);
CREATE INDEX IF NOT EXISTS idx_drivers_assigned_vehicle_id ON drivers(assigned_vehicle_id);
CREATE INDEX IF NOT EXISTS idx_contracts_farmer_id ON contracts(farmer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_buyer_id ON contracts(buyer_id);
CREATE INDEX IF NOT EXISTS idx_contracts_crop_id ON contracts(crop_id);
CREATE INDEX IF NOT EXISTS idx_contract_milestones_contract_id ON contract_milestones(contract_id);
CREATE INDEX IF NOT EXISTS idx_escrow_accounts_contract_id ON escrow_accounts(contract_id);
CREATE INDEX IF NOT EXISTS idx_assets_type_id ON assets(type_id);
CREATE INDEX IF NOT EXISTS idx_assets_location_id ON assets(location_id);
CREATE INDEX IF NOT EXISTS idx_assets_responsible_user_id ON assets(responsible_user_id);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_asset_id ON asset_bookings(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_bookings_user_id ON asset_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_asset_id ON maintenance_records(asset_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_claims_farmer_id ON subsidy_claims(farmer_id);
CREATE INDEX IF NOT EXISTS idx_subsidy_claims_scheme_id ON subsidy_claims(scheme_id);
CREATE INDEX IF NOT EXISTS idx_compliance_records_verified_by ON compliance_records(verified_by);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
