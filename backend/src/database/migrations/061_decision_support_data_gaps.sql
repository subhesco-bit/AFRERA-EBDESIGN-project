-- ============================================================================
-- 061_decision_support_data_gaps.sql (2026-08-08)
--
-- Additive columns/table needed to back two of the 8 business-logic
-- functions ported from the v42 prototype
-- (docs/MISSING_BUSINESS_LOGIC_EXTRACTION.md) with real Postgres queries
-- instead of caller-supplied data:
--
--  1. corpCreditEligible (financialService.js) needs a B2B buyer's annual
--     turnover and business vintage to gate NET0/NET30/NET60 terms. `buyers`
--     (041_rural_life_os_schema.sql) records buyer_type, gst_number, payment
--     terms etc. but nothing about turnover or how long the business has
--     operated. Two nullable columns added here; vintage is derived at query
--     time from business_established_year rather than stored redundantly.
--
--  2. complianceGaps/complianceReady (governanceService.js) need the
--     platform's OWN intermediary-compliance record (FSSAI licence,
--     Grievance Officer + contact details, Nodal Officer under IT Rules
--     2021, GSTIN) — a single row describing AFRERA itself, not any
--     farmer/buyer entity. `compliance_reports` (000_base_schema.sql,
--     already used by governanceService.js) tracks per-village/CSR
--     compliance reports — a different concept — so a small singleton table
--     is added rather than overloading that one.
--
-- Additive only: IF NOT EXISTS / ADD COLUMN IF NOT EXISTS throughout. No
-- ALTER of any existing table's constraints, and this does not collide with
-- 9995_scheme_verification_map_protection.sql (checked first).
-- ============================================================================

ALTER TABLE buyers ADD COLUMN IF NOT EXISTS annual_turnover_cr NUMERIC(14,2);
ALTER TABLE buyers ADD COLUMN IF NOT EXISTS business_established_year INTEGER
  CHECK (business_established_year IS NULL OR business_established_year BETWEEN 1900 AND 2100);

COMMENT ON COLUMN buyers.annual_turnover_cr IS
  'Annual turnover in INR crore, used by corpCreditEligible (financialService.js) for NET30/NET60 gating.';
COMMENT ON COLUMN buyers.business_established_year IS
  'Year the buyer business was established. vintage_years = EXTRACT(YEAR FROM CURRENT_DATE) - this, used by corpCreditEligible.';

-- ---------------------------------------------------------------------------
-- Singleton table: exactly one row (id = 1), same pattern as any other
-- platform-wide settings record. Missing fields are the compliance gaps.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS platform_compliance_record (
  id SMALLINT PRIMARY KEY DEFAULT 1,
  fssai_licence VARCHAR(60),
  grievance_officer VARCHAR(160),
  grievance_email VARCHAR(160),
  grievance_phone VARCHAR(30),
  nodal_officer VARCHAR(160),
  gstin VARCHAR(20),
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT platform_compliance_record_singleton CHECK (id = 1)
);

INSERT INTO platform_compliance_record (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
