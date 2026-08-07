-- ============================================================================
-- 995_erp_process_layer.sql   (2026-08-04)
--
-- ERP PROCESS LAYER — the professional forms, processes and operations that
-- sit ABOVE the accounting spine in 996_enterprise_foundation.sql.
--
-- PROVENANCE
-- Recovered from AFRERA_Complete_Project_Report_v44 (Google Drive), which
-- documents the platform's evolution from first design to v44: 137 registered
-- routes, 114 module-status entries (103 complete, 5 partial, 9 declined by
-- design). Phase Two of that history was "The Full ERP Build-Out" — eight
-- SAP-equivalent modules that exist in the v43/v44 single-file prototype but
-- have NO schema in the current backend.
--
-- Module register recovered from the report (AF- prefix = AFRERA module code):
--   AF-MM   Materials Management      AF-SD   Sales & Distribution
--   AF-WM   Warehouse Management      AF-LE   Logistics Execution
--   AF-QM   Quality Management        AF-PP   Production Planning
--   AF-PM   Plant Maintenance         AF-AA   Asset Accounting  (in 996)
--   AF-CO   Controlling               AF-PS   Project Systems
--   AF-TR   Treasury                  AF-CS   Claims / Service
--   AF-HCM  Field Operations          AF-MDM  Master Data Governance
--   AF-SEC  Security / GRC            AF-TM   Transport Management
--   AF-ORG  Organisation              AF-FI   Financial Accounting (in 996)
--
-- THREE GOVERNING RULES CARRIED FORWARD FROM THE PROTOTYPE
-- These are business rules with real consequences, not stylistic preferences,
-- and they are enforced structurally here rather than left to convention:
--
--  1. MAP-A PRIVACY. A farmer's private floor price is never visible to a
--     buyer. In the prototype it was held in a separate FLOOR_PRIVATE map,
--     "structurally unreachable from any buyer-facing render path" — not
--     merely hidden with CSS. Here it lives in its own table with its own
--     access path (listing_floor_private), so a buyer-facing join cannot
--     accidentally surface it. A leaked floor price destroys the farmer's
--     negotiating position permanently.
--
--  2. AI PROPOSES, A HUMAN APPROVES. "the waterfall computes; a human
--     releases." Every AI-generated proposal lands in a table with an explicit
--     human approval column that starts NULL. Nothing auto-executes.
--
--  3. DISPATCH REQUIRES TWO INDEPENDENT DOCUMENTS (gate pass + dispatch pass),
--     enforced by a trigger, because a single-document dispatch is how stock
--     walks out of a warehouse.
--
-- Numbered 995 so it runs before the enterprise foundation (996) that it does
-- not depend on, and well before the index/reconciliation files. Safe to re-run.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- AF-MDM — Master Data Governance
-- One approval path for changes to master records, because uncontrolled master
-- data is the most common root cause of ERP data quality failure.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mdm_change_requests (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,     -- 'product' | 'vendor' | 'customer' | 'farmer'
    entity_id VARCHAR(100) NOT NULL,
    change_type VARCHAR(20) NOT NULL CHECK (change_type IN ('create','update','deactivate','merge')),
    proposed_payload JSONB NOT NULL,
    current_payload JSONB,
    -- AI may PROPOSE a master-data correction; it may never apply one.
    proposed_by_ai BOOLEAN NOT NULL DEFAULT FALSE,
    ai_rationale TEXT,
    requested_by UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected','applied')),
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- A rejection must always carry a reason (prototype rule).
    CONSTRAINT mdm_rejection_needs_reason CHECK (
        status <> 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- AF-MM — Materials Management: requisition -> RFQ -> PO -> GRN -> invoice match
-- This is the "professional forms and processes" chain.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    requisition_number VARCHAR(40) UNIQUE NOT NULL,
    requested_by UUID,
    cost_center_id INTEGER,
    required_by_date DATE,
    justification TEXT,
    total_estimated_value NUMERIC(20,4) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','submitted','approved','rejected','converted','cancelled')),
    approved_by UUID,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pr_rejection_needs_reason CHECK (
        status <> 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
    )
);

CREATE TABLE IF NOT EXISTS purchase_requisition_lines (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER NOT NULL REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    line_number SMALLINT NOT NULL,
    material_code VARCHAR(60),
    description TEXT NOT NULL,
    quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL DEFAULT 'unit',
    estimated_unit_price NUMERIC(20,4) DEFAULT 0,
    UNIQUE (requisition_id, line_number)
);

CREATE TABLE IF NOT EXISTS rfq_headers (
    id SERIAL PRIMARY KEY,
    rfq_number VARCHAR(40) UNIQUE NOT NULL,
    requisition_id INTEGER REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    response_due_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('draft','open','closed','awarded','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS rfq_responses (
    id SERIAL PRIMARY KEY,
    rfq_id INTEGER NOT NULL REFERENCES rfq_headers(id) ON DELETE CASCADE,
    vendor_id VARCHAR(100) NOT NULL,
    quoted_total NUMERIC(20,4) NOT NULL CHECK (quoted_total >= 0),
    delivery_days INTEGER,
    payment_terms VARCHAR(100),
    -- MCDA evaluation of this bid (see src/core/mcda.js). Score AND the
    -- reasoning are stored so an award can be justified later.
    evaluation_score NUMERIC(6,2),
    evaluation_breakdown JSONB,
    is_awarded BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (rfq_id, vendor_id)
);

CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    company_id INTEGER,
    po_number VARCHAR(40) UNIQUE NOT NULL,
    vendor_id VARCHAR(100) NOT NULL,
    requisition_id INTEGER REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    rfq_id INTEGER REFERENCES rfq_headers(id) ON DELETE SET NULL,
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    currency CHAR(3) NOT NULL DEFAULT 'INR',
    subtotal NUMERIC(20,4) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    total_amount NUMERIC(20,4) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','issued','partially_received','received','invoiced','closed','cancelled')),
    approved_by UUID,
    approved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS purchase_order_lines (
    id SERIAL PRIMARY KEY,
    po_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
    line_number SMALLINT NOT NULL,
    material_code VARCHAR(60),
    description TEXT NOT NULL,
    quantity NUMERIC(18,4) NOT NULL CHECK (quantity > 0),
    uom VARCHAR(20) NOT NULL DEFAULT 'unit',
    unit_price NUMERIC(20,4) NOT NULL DEFAULT 0,
    quantity_received NUMERIC(18,4) NOT NULL DEFAULT 0,
    line_total NUMERIC(20,4) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    UNIQUE (po_id, line_number),
    CHECK (quantity_received <= quantity)
);

CREATE TABLE IF NOT EXISTS goods_receipts (
    id SERIAL PRIMARY KEY,
    grn_number VARCHAR(40) UNIQUE NOT NULL,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    received_date DATE NOT NULL DEFAULT CURRENT_DATE,
    received_by UUID,
    warehouse_id VARCHAR(100),
    -- Goods can arrive and still fail QC; receipt and acceptance are separate.
    inspection_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (inspection_status IN ('pending','passed','failed','partial')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS goods_receipt_lines (
    id SERIAL PRIMARY KEY,
    grn_id INTEGER NOT NULL REFERENCES goods_receipts(id) ON DELETE CASCADE,
    po_line_id INTEGER REFERENCES purchase_order_lines(id) ON DELETE SET NULL,
    quantity_received NUMERIC(18,4) NOT NULL CHECK (quantity_received >= 0),
    quantity_accepted NUMERIC(18,4) NOT NULL DEFAULT 0,
    quantity_rejected NUMERIC(18,4) GENERATED ALWAYS AS (quantity_received - quantity_accepted) STORED,
    batch_number VARCHAR(60),
    rejection_reason TEXT,
    CHECK (quantity_accepted <= quantity_received)
);

-- Three-way match: PO vs GRN vs vendor invoice. Variance is recorded, never
-- silently absorbed — unexplained variance is how overbilling survives.
CREATE TABLE IF NOT EXISTS invoice_match_results (
    id SERIAL PRIMARY KEY,
    ap_invoice_reference VARCHAR(100) NOT NULL,
    po_id INTEGER REFERENCES purchase_orders(id) ON DELETE SET NULL,
    grn_id INTEGER REFERENCES goods_receipts(id) ON DELETE SET NULL,
    po_amount NUMERIC(20,4),
    grn_amount NUMERIC(20,4),
    invoice_amount NUMERIC(20,4),
    quantity_variance NUMERIC(18,4) DEFAULT 0,
    price_variance NUMERIC(20,4) DEFAULT 0,
    match_status VARCHAR(20) NOT NULL DEFAULT 'unmatched'
        CHECK (match_status IN ('matched','within_tolerance','variance','unmatched','blocked')),
    tolerance_pct NUMERIC(5,2) DEFAULT 2.00,
    resolved_by UUID,
    resolution_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- AF-SD — Sales & Distribution, and the MAP-A privacy boundary
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sales_listings (
    id SERIAL PRIMARY KEY,
    listing_code VARCHAR(60) UNIQUE NOT NULL,
    product_id VARCHAR(100),
    farmer_id VARCHAR(100),
    -- PUBLIC fields only. Anything a buyer may see lives here.
    asking_price NUMERIC(20,4) NOT NULL CHECK (asking_price >= 0),
    mrp NUMERIC(20,4),
    quantity_available NUMERIC(18,4) NOT NULL DEFAULT 0,
    uom VARCHAR(20) DEFAULT 'kg',
    gi_status VARCHAR(50),
    state_of_origin VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MAP-A. Deliberately a SEPARATE TABLE, not a column on sales_listings.
--
-- The prototype held this in a separate FLOOR_PRIVATE map so that no
-- buyer-facing render path could reach it. The same reasoning applies to SQL:
-- a column on sales_listings would be exposed by any `SELECT *`, any ORM
-- serialisation, any careless join. A separate table means surfacing it takes
-- a deliberate, reviewable JOIN that a code reviewer can see.
--
-- Grant buyer-facing DB roles SELECT on sales_listings and NOT on this table.
CREATE TABLE IF NOT EXISTS listing_floor_private (
    listing_id INTEGER PRIMARY KEY REFERENCES sales_listings(id) ON DELETE CASCADE,
    map_a_floor_price NUMERIC(20,4) NOT NULL CHECK (map_a_floor_price >= 0),
    set_by_farmer_id VARCHAR(100),
    rationale TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE listing_floor_private IS
  'MAP-A private floor price. NEVER expose to buyer-facing queries, APIs or views. Separate table by design so exposure requires a deliberate JOIN.';

-- ---------------------------------------------------------------------------
-- AF-LE / AF-WM — Logistics Execution: pick -> pack -> gate pass -> dispatch
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pick_lists (
    id SERIAL PRIMARY KEY,
    pick_number VARCHAR(40) UNIQUE NOT NULL,
    order_reference VARCHAR(100),
    warehouse_id VARCHAR(100),
    picked_by UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','picking','picked','cancelled')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS packing_units (
    id SERIAL PRIMARY KEY,
    pack_number VARCHAR(40) UNIQUE NOT NULL,
    pick_list_id INTEGER REFERENCES pick_lists(id) ON DELETE SET NULL,
    gross_weight_kg NUMERIC(12,3),
    packed_by UUID,
    sealed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Two independent documents required before dispatch (prototype rule).
CREATE TABLE IF NOT EXISTS gate_passes (
    id SERIAL PRIMARY KEY,
    gate_pass_number VARCHAR(40) UNIQUE NOT NULL,
    shipment_reference VARCHAR(100) NOT NULL,
    issued_by UUID NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    vehicle_number VARCHAR(30),
    driver_name VARCHAR(120),
    is_valid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dispatch_passes (
    id SERIAL PRIMARY KEY,
    dispatch_pass_number VARCHAR(40) UNIQUE NOT NULL,
    shipment_reference VARCHAR(100) NOT NULL,
    -- Must be a DIFFERENT person from the gate pass issuer: segregation of
    -- duties is the control, and one person holding both defeats it.
    issued_by UUID NOT NULL,
    issued_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_valid BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS dispatch_events (
    id SERIAL PRIMARY KEY,
    shipment_reference VARCHAR(100) NOT NULL,
    gate_pass_id INTEGER REFERENCES gate_passes(id) ON DELETE RESTRICT,
    dispatch_pass_id INTEGER REFERENCES dispatch_passes(id) ON DELETE RESTRICT,
    dispatched_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dispatched_by UUID,
    proof_of_delivery JSONB
);

-- Enforce the two-document rule and segregation of duties in the database.
CREATE OR REPLACE FUNCTION assert_dispatch_authorised()
RETURNS TRIGGER AS $$
DECLARE
    v_gate_issuer UUID;
    v_dispatch_issuer UUID;
BEGIN
    IF NEW.gate_pass_id IS NULL OR NEW.dispatch_pass_id IS NULL THEN
        RAISE EXCEPTION
          'Dispatch of % requires BOTH a gate pass and a dispatch pass.',
          NEW.shipment_reference;
    END IF;

    SELECT issued_by INTO v_gate_issuer FROM gate_passes WHERE id = NEW.gate_pass_id;
    SELECT issued_by INTO v_dispatch_issuer FROM dispatch_passes WHERE id = NEW.dispatch_pass_id;

    IF v_gate_issuer = v_dispatch_issuer THEN
        RAISE EXCEPTION
          'Segregation of duties: the gate pass and dispatch pass for % were issued by the same user.',
          NEW.shipment_reference;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_dispatch_two_document ON dispatch_events;
DROP TRIGGER IF EXISTS trg_dispatch_two_document ON dispatch_events;
CREATE TRIGGER trg_dispatch_two_document BEFORE INSERT OR UPDATE ON dispatch_events
    FOR EACH ROW EXECUTE FUNCTION assert_dispatch_authorised();

-- ---------------------------------------------------------------------------
-- AF-QM / AF-PP / AF-PM — Quality, Production, Maintenance
-- ---------------------------------------------------------------------------

-- Named qm_inspections, not quality_inspections: 030_institutional_procurement_schema
-- already defines quality_inspections for contract inspections (contract_id NOT
-- NULL). Because every definition uses IF NOT EXISTS and 030 runs first, reusing
-- that name would silently discard this table. Different concern, different name.
CREATE TABLE IF NOT EXISTS qm_inspections (
    id SERIAL PRIMARY KEY,
    inspection_number VARCHAR(40) UNIQUE NOT NULL,
    inspection_type VARCHAR(30) NOT NULL
        CHECK (inspection_type IN ('incoming','in_process','final','audit')),
    reference_type VARCHAR(50),
    reference_id VARCHAR(100),
    batch_number VARCHAR(60),
    inspected_by UUID,
    result VARCHAR(20) CHECK (result IN ('pass','fail','conditional')),
    defect_count INTEGER DEFAULT 0,
    notes TEXT,
    inspected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS non_conformances (
    id SERIAL PRIMARY KEY,
    ncr_number VARCHAR(40) UNIQUE NOT NULL,
    inspection_id INTEGER REFERENCES qm_inspections(id) ON DELETE SET NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('minor','major','critical')),
    description TEXT NOT NULL,
    root_cause TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','investigating','action_taken','verified','closed')),
    closed_by UUID,
    closed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS production_orders (
    id SERIAL PRIMARY KEY,
    production_order_number VARCHAR(40) UNIQUE NOT NULL,
    product_code VARCHAR(60) NOT NULL,
    planned_quantity NUMERIC(18,4) NOT NULL CHECK (planned_quantity > 0),
    produced_quantity NUMERIC(18,4) NOT NULL DEFAULT 0,
    -- Yield is derived, so it can never disagree with the quantities.
    yield_pct NUMERIC(6,2) GENERATED ALWAYS AS (
        CASE WHEN planned_quantity > 0
             THEN ROUND((produced_quantity / planned_quantity) * 100, 2)
             ELSE 0 END
    ) STORED,
    input_batch_numbers TEXT[],      -- batch genealogy: what went in
    output_batch_number VARCHAR(60), -- ... and what came out
    status VARCHAR(20) NOT NULL DEFAULT 'planned'
        CHECK (status IN ('planned','released','in_progress','completed','cancelled')),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS maintenance_tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(40) UNIQUE NOT NULL,
    asset_reference VARCHAR(100) NOT NULL,
    maintenance_type VARCHAR(20) NOT NULL
        CHECK (maintenance_type IN ('preventive','breakdown','calibration','predictive')),
    -- Calibration status gates cold-chain dispatch eligibility (prototype rule):
    -- an uncalibrated cold sensor cannot certify a cold-chain consignment.
    blocks_cold_dispatch BOOLEAN DEFAULT FALSE,
    scheduled_date DATE,
    completed_date DATE,
    next_due_date DATE,
    performed_by UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','scheduled','in_progress','completed','overdue')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- AI PROPOSAL LEDGER — "AI proposes, a human approves"
-- Every AI recommendation across every module lands here first.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ai_proposals (
    id SERIAL PRIMARY KEY,
    domain VARCHAR(50) NOT NULL,          -- 'pricing' | 'procurement' | 'claims' | ...
    proposal_type VARCHAR(60) NOT NULL,   -- 'price_change' | 'vendor_award' | 'payout' | ...
    subject_type VARCHAR(50),
    subject_id VARCHAR(100),
    proposed_value JSONB NOT NULL,
    current_value JSONB,
    -- Explainability is mandatory: a proposal a human cannot evaluate is a
    -- proposal a human cannot responsibly approve.
    rationale TEXT NOT NULL,
    confidence NUMERIC(5,2),
    mcda_breakdown JSONB,
    model_reference VARCHAR(100),
    -- Starts NULL. Nothing executes until a named human sets it.
    approved_by UUID,
    approved_at TIMESTAMP,
    rejected_by UUID,
    rejected_at TIMESTAMP,
    rejection_reason TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'proposed'
        CHECK (status IN ('proposed','approved','rejected','expired','executed')),
    executed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_rejection_needs_reason CHECK (
        status <> 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
    ),
    CONSTRAINT ai_approval_needs_human CHECK (
        status NOT IN ('approved','executed') OR approved_by IS NOT NULL
    )
);

COMMENT ON TABLE ai_proposals IS
  'AI proposes, a human approves. approved_by must be a real user before status can become approved or executed - enforced by CHECK constraint, not convention.';

-- ---------------------------------------------------------------------------
-- AF-SEC — Segregation of duties register
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sod_rules (
    id SERIAL PRIMARY KEY,
    rule_code VARCHAR(40) UNIQUE NOT NULL,
    description TEXT NOT NULL,
    conflicting_action_a VARCHAR(80) NOT NULL,
    conflicting_action_b VARCHAR(80) NOT NULL,
    severity VARCHAR(20) DEFAULT 'high' CHECK (severity IN ('low','medium','high','critical')),
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sod_violations (
    id SERIAL PRIMARY KEY,
    rule_id INTEGER NOT NULL REFERENCES sod_rules(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    context_type VARCHAR(50),
    context_id VARCHAR(100),
    detected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    acknowledged_by UUID,
    acknowledged_at TIMESTAMP,
    notes TEXT
);

-- ---------------------------------------------------------------------------
-- REPORTING VIEWS
-- ---------------------------------------------------------------------------

-- Buyer-safe listing view. Contains NO reference to listing_floor_private,
-- so it is safe to expose to any buyer-facing API or role.
CREATE OR REPLACE VIEW v_public_listings AS
SELECT
    id, listing_code, product_id, farmer_id,
    asking_price, mrp, quantity_available, uom,
    gi_status, state_of_origin, created_at
FROM sales_listings
WHERE is_active = TRUE;

COMMENT ON VIEW v_public_listings IS
  'Buyer-safe projection. Deliberately excludes MAP-A floor price. Use this for all buyer-facing reads.';

CREATE OR REPLACE VIEW v_procurement_pipeline AS
SELECT
    pr.requisition_number,
    pr.status              AS requisition_status,
    rfq.rfq_number,
    rfq.status             AS rfq_status,
    po.po_number,
    po.status              AS po_status,
    po.total_amount,
    grn.grn_number,
    grn.inspection_status,
    imr.match_status
FROM purchase_requisitions pr
LEFT JOIN rfq_headers rfq ON rfq.requisition_id = pr.id
LEFT JOIN purchase_orders po ON po.requisition_id = pr.id
LEFT JOIN goods_receipts grn ON grn.po_id = po.id
LEFT JOIN invoice_match_results imr ON imr.po_id = po.id;

CREATE OR REPLACE VIEW v_ai_approval_queue AS
SELECT
    id, domain, proposal_type, subject_type, subject_id,
    proposed_value, rationale, confidence, created_at,
    EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at))/3600 AS hours_waiting
FROM ai_proposals
WHERE status = 'proposed'
ORDER BY created_at ASC;

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pr_status ON purchase_requisitions (status);
CREATE INDEX IF NOT EXISTS idx_pr_lines_req ON purchase_requisition_lines (requisition_id);
CREATE INDEX IF NOT EXISTS idx_rfq_responses_rfq ON rfq_responses (rfq_id);
CREATE INDEX IF NOT EXISTS idx_po_vendor_status ON purchase_orders (vendor_id, status);
CREATE INDEX IF NOT EXISTS idx_po_lines_po ON purchase_order_lines (po_id);
CREATE INDEX IF NOT EXISTS idx_grn_po ON goods_receipts (po_id);
CREATE INDEX IF NOT EXISTS idx_grn_lines_grn ON goods_receipt_lines (grn_id);
CREATE INDEX IF NOT EXISTS idx_match_po ON invoice_match_results (po_id);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON sales_listings (farmer_id);
CREATE INDEX IF NOT EXISTS idx_listings_product ON sales_listings (product_id);
CREATE INDEX IF NOT EXISTS idx_dispatch_shipment ON dispatch_events (shipment_reference);
CREATE INDEX IF NOT EXISTS idx_qi_reference ON qm_inspections (reference_type, reference_id);
CREATE INDEX IF NOT EXISTS idx_ncr_status ON non_conformances (status);
CREATE INDEX IF NOT EXISTS idx_prod_orders_status ON production_orders (status);
CREATE INDEX IF NOT EXISTS idx_maint_asset ON maintenance_tickets (asset_reference);
CREATE INDEX IF NOT EXISTS idx_maint_cold_gate ON maintenance_tickets (blocks_cold_dispatch, status);
CREATE INDEX IF NOT EXISTS idx_ai_proposals_status ON ai_proposals (status, domain);
CREATE INDEX IF NOT EXISTS idx_mdm_status ON mdm_change_requests (status, entity_type);
CREATE INDEX IF NOT EXISTS idx_sod_violations_user ON sod_violations (user_id);
