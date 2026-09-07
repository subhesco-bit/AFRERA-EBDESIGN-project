-- ============================================================================
-- 9998_foreign_key_indexes_followup.sql   (2026-08-16)
--
-- WHY THIS EXISTS
-- AUDIT_DB.md Finding 1 (H6 in FIXES.md) flagged ~20 core-table FK columns
-- with no supporting index. Re-verifying against the current schema showed
-- 998_foreign_key_indexes.sql already covers all but 3 of those columns, and
-- covers the equivalent gap across almost all 30 feature-specific
-- `*_schema.sql` files too. This migration closes the small number of
-- columns that genuinely remained unindexed after cross-checking every
-- CREATE TABLE in schema.sql plus a spot-check of the largest/most-referenced
-- feature schemas (food_intelligence, nutrition_intelligence, laboratory_erp,
-- organic_traceability, value_commerce), rather than re-declaring anything
-- 998 already handles.
--
-- Deliberately a NEW file rather than an edit to 998_foreign_key_indexes.sql
-- or 999_schema_reconciliation.sql, matching this migrations directory's own
-- convention for post-hoc fixes discovered after the original migration may
-- already have run on some environment (see 999_zz_tender_bids_collision_repair.sql,
-- 9999_zz_copilot_sessions_uuid_fix.sql) — editing an already-applied,
-- already-recorded migration file would not re-run on any DB that already
-- executed it.
--
-- Plain CREATE INDEX (not CONCURRENTLY), same reasoning as 998: CONCURRENTLY
-- cannot run inside the transaction block the migration runner wraps each
-- file in. Build these CONCURRENTLY by hand on an already-populated
-- production database instead.
-- ============================================================================

-- schema.sql core tables (AUDIT_DB.md Finding 1 columns not already covered
-- by 998_foreign_key_indexes.sql):

-- advances.contract_id (schema.sql:434) — not a declared REFERENCES column,
-- but used as an FK to contracts in practice; farmer_id on this table is
-- already indexed by 998, contract_id was missed.
CREATE INDEX IF NOT EXISTS idx_advances_contract_id
    ON advances (contract_id);

-- vehicles.driver_id (schema.sql:603) — the inverse of drivers.assigned_vehicle_id
-- (already indexed by 998); vehicles itself had no index at all.
CREATE INDEX IF NOT EXISTS idx_vehicles_driver_id
    ON vehicles (driver_id);

-- compliance_records.entity_type / entity_id (schema.sql:801-802) — compound
-- polymorphic lookup, same pattern as the already-indexed audit_logs(entity_type,
-- entity_id) and erp_sync_logs(entity_type, entity_id).
CREATE INDEX IF NOT EXISTS idx_compliance_records_entity
    ON compliance_records (entity_type, entity_id);

-- Feature-schema spot-check (AUDIT_DB.md Finding 1's "follow-up pass" note).
-- Line numbers below are from the actually-applied migrations/0NN_*.sql
-- files, not the standalone database/*_schema.sql source copies (which
-- differ slightly in id-generation/extension lines but match on table and
-- column names).

-- product_nutrition.lab_test_id (migrations/036_nutrition_intelligence_schema.sql:120)
CREATE INDEX IF NOT EXISTS idx_product_nutrition_lab_test_id
    ON product_nutrition (lab_test_id);

-- organic_chain_of_custody.current_holder_id / transfer_from_id
-- (migrations/038_organic_traceability_schema.sql:318,321)
CREATE INDEX IF NOT EXISTS idx_organic_chain_of_custody_current_holder_id
    ON organic_chain_of_custody (current_holder_id);
CREATE INDEX IF NOT EXISTS idx_organic_chain_of_custody_transfer_from_id
    ON organic_chain_of_custody (transfer_from_id);

-- organic_fraud_alerts.entity_id (migrations/038_organic_traceability_schema.sql:387)
CREATE INDEX IF NOT EXISTS idx_organic_fraud_alerts_entity_id
    ON organic_fraud_alerts (entity_id);
