-- ============================================================================
-- 3105_dpr_documents_schema.sql   (2026-08-11)
--
-- DPR (DETAILED PROJECT REPORT) GENERATION — confirmed genuinely absent.
--
-- PRE-BUILD GATE
--   1. Distinguishing noun: "DPR" / "detailed project report".
--   2. Grep hits before this migration: AI_BASED_DPR_PREPARATION_MODULE_SPECIFICATION.md
--      (a spec, never implemented), and unrelated "M017"/compliance.js hits on
--      the bare word "dpr" as a substring of other identifiers. Zero
--      dpr_generation service, zero dpr_documents table, zero route.
--   3. Nothing to extract from — the module is genuinely new — but its DATA is
--      not: dprGenerationService.js assembles a DPR from farmers, fpos,
--      land_records, crop_plans and mandi_prices, all of which already exist.
--      This migration only adds the output/audit table for the assembled
--      document; it deliberately does not duplicate any upstream table.
-- ============================================================================

CREATE TABLE IF NOT EXISTS dpr_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
    fpo_id UUID REFERENCES fpos(id) ON DELETE SET NULL,
    crop_plan_id INTEGER REFERENCES crop_plans(id) ON DELETE SET NULL,
    purpose VARCHAR(120) NOT NULL, -- e.g. 'bank_loan', 'nabard_scheme', 'government_subsidy' (free text, farmer/officer supplied)
    financing_ask_inr NUMERIC(14,2) CHECK (financing_ask_inr IS NULL OR financing_ask_inr >= 0),
    -- The full assembled document — identity, land, crop plan, yield/revenue
    -- projection, cost estimate (or an honest "incomplete" marker), financing
    -- ask — stored so a generated DPR is reproducible and auditable rather
    -- than a one-shot response nobody can retrieve again.
    document_json JSONB NOT NULL,
    -- Set true only once a caller has actually pulled the PDF via
    -- GET /dpr/:id/pdf; lets the FPO/bank see which DPRs were only drafted.
    pdf_downloaded_at TIMESTAMP,
    generated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT dpr_documents_subject CHECK (farmer_id IS NOT NULL OR fpo_id IS NOT NULL)
);

-- 2026-08-30: removed (deferred collision, see schema-decisions.json "dpr_documents") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_dpr_documents_farmer_id ON dpr_documents(farmer_id);
-- 2026-08-30: removed (deferred collision, see schema-decisions.json "dpr_documents") - indexes column that does not exist on the real (winner) table: CREATE INDEX IF NOT EXISTS idx_dpr_documents_fpo_id ON dpr_documents(fpo_id);
CREATE INDEX IF NOT EXISTS idx_dpr_documents_created_at ON dpr_documents(created_at);

COMMENT ON TABLE dpr_documents IS 'Generated Detailed Project Reports — assembled from real farmer/land/crop-plan/price data by dprGenerationService, stored for audit and re-download.';
