-- ============================================================================
-- 999_zz_tender_bids_collision_repair.sql   (generated 2026-08-10)
--
-- WHY THIS EXISTS
-- 023_engineering_schema.sql and 030_institutional_procurement_schema.sql both
-- declared `CREATE TABLE IF NOT EXISTS tender_bids` with incompatible column
-- sets: 023's dead, unwired "Engineering OS" schema (tender_id UUID FK to
-- tender_documents, bidder_name VARCHAR NOT NULL, no supplier_id/technical_
-- proposal/etc.) vs. 030's real, mounted institutional-procurement schema
-- (tender_id INTEGER, supplier_id NOT NULL, technical_proposal JSONB, ...).
-- Because 023 sorts before 030 and both used CREATE TABLE IF NOT EXISTS,
-- 023's shape won on any database where it had already run, and 030's
-- CREATE TABLE silently no-opped. That left institutionalProcurementService.js's
-- bid-submission INSERT (POST /tenders/:id/bids) pointed at a table with the
-- wrong column set, wrong tender_id type/FK target, and a NOT NULL
-- bidder_name it never supplies — an undefined-column / not-null-violation
-- error on the first real bid submission.
--
-- 023_engineering_schema.sql has since been fixed to create its dead table as
-- `engineering_tender_bids` instead, so this collision cannot occur on a
-- fresh database — on a fresh run this migration finds nothing to repair.
-- This file exists only to repair a database where the OLD 023 migration
-- content already ran (and is therefore permanently recorded in
-- schema_migrations, so re-editing 023's file has no effect there): it
-- renames the wrongly-shaped table out of the way, preserving any rows, and
-- lets the real institutional-procurement table be created fresh in its place.
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tender_bids' AND column_name = 'bidder_name'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_name = 'engineering_tender_bids'
    ) THEN
        ALTER TABLE tender_bids RENAME TO engineering_tender_bids;

        ALTER INDEX IF EXISTS idx_tender_bids_tender RENAME TO idx_engineering_tender_bids_tender;
        ALTER INDEX IF EXISTS idx_tender_bids_bidder RENAME TO idx_engineering_tender_bids_bidder;
        ALTER INDEX IF EXISTS idx_tender_bids_status RENAME TO idx_engineering_tender_bids_status;
        ALTER INDEX IF EXISTS idx_tender_bids_score RENAME TO idx_engineering_tender_bids_score;
        -- idx_tender_bids_evaluated_by may exist from 998_foreign_key_indexes.sql,
        -- which indexed this column back when the wrong table won.
        ALTER INDEX IF EXISTS idx_tender_bids_evaluated_by RENAME TO idx_engineering_tender_bids_evaluated_by;

        DROP TRIGGER IF EXISTS update_tender_bids_updated_at ON engineering_tender_bids;
        CREATE TRIGGER update_engineering_tender_bids_updated_at BEFORE UPDATE ON engineering_tender_bids
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Recreate the real institutional-procurement shape now that the name is
-- free. No-op if a correctly-shaped tender_bids already exists (fresh DBs,
-- or a repair that already ran).
CREATE TABLE IF NOT EXISTS tender_bids (
    id SERIAL PRIMARY KEY,
    tender_id INTEGER NOT NULL,
    supplier_id INTEGER NOT NULL,
    bid_amount DECIMAL(15,2),
    technical_proposal JSONB,
    financial_proposal JSONB,
    documents_submitted JSONB,
    bid_security_provided BOOLEAN,
    proposed_delivery_schedule JSONB,
    proposed_payment_terms JSONB,
    submission_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'submitted',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tender_bids_tender ON tender_bids(tender_id);
CREATE INDEX IF NOT EXISTS idx_tender_bids_supplier ON tender_bids(supplier_id);
CREATE INDEX IF NOT EXISTS idx_tender_bids_status ON tender_bids(status);
