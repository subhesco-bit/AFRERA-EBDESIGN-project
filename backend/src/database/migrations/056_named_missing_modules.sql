-- ============================================================================
-- 056_named_missing_modules.sql   (2026-08-05)
--
-- The 17 modules the source document names explicitly as MISSING, with the
-- business reason quoted for each. Extracted to docs/registry/
-- SOURCE_CATALOGUE.json from "No project chats (1).docx".
--
-- These are not inferred gaps. Each was written down as absent by whoever
-- reviewed the platform, together with why it matters commercially.
--
-- Grouped here by the reason they exist rather than by table, because several
-- of them only make sense together: RCM, TDS and e-invoicing are one
-- compliance surface, not three features.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- A. RFQ AND DYNAMIC NEGOTIATION            (missing module 1)
--
-- "Allow corporate buyers to post bulk requirements. Farmers/FPOs bid
--  anonymously. The platform takes a small success fee."
--
-- Anonymity is the load-bearing part. If bidders can see each other, the
-- mechanism converges on a cartel or a race to the bottom depending on who
-- has more information, and the farmer is never the one with more.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS rfq_requests (
    id BIGSERIAL PRIMARY KEY,
    rfq_no VARCHAR(40) NOT NULL UNIQUE,
    buyer_id UUID,
    buyer_org VARCHAR(160),

    product VARCHAR(160) NOT NULL,
    grade VARCHAR(40),
    quantity_kg NUMERIC(14,2) NOT NULL CHECK (quantity_kg > 0),
    delivery_by DATE,
    delivery_location VARCHAR(200),
    target_price_inr_per_kg NUMERIC(12,2) CHECK (target_price_inr_per_kg IS NULL OR target_price_inr_per_kg > 0),

    -- Bids stay sealed until close. Visible bids let a later bidder undercut a
    -- number they should never have seen.
    bids_sealed_until TIMESTAMP,
    closes_at TIMESTAMP NOT NULL,
    success_fee_pct NUMERIC(5,2) NOT NULL DEFAULT 2.00
        CHECK (success_fee_pct >= 0 AND success_fee_pct <= 100),

    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('draft','open','closed','awarded','cancelled','expired')),
    awarded_bid_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT rfq_closes_after_seal CHECK (bids_sealed_until IS NULL OR closes_at >= bids_sealed_until),
    CONSTRAINT awarded_rfq_has_bid CHECK (status <> 'awarded' OR awarded_bid_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS rfq_bids (
    id BIGSERIAL PRIMARY KEY,
    rfq_id BIGINT NOT NULL REFERENCES rfq_requests (id) ON DELETE CASCADE,
    bidder_id UUID NOT NULL,
    bidder_type VARCHAR(20) NOT NULL DEFAULT 'farmer'
        CHECK (bidder_type IN ('farmer','fpo','aggregator','vendor')),

    -- Shown to the buyer instead of a name while bidding is open.
    anonymous_handle VARCHAR(40) NOT NULL,

    price_inr_per_kg NUMERIC(12,2) NOT NULL CHECK (price_inr_per_kg > 0),
    quantity_offered_kg NUMERIC(14,2) NOT NULL CHECK (quantity_offered_kg > 0),
    earliest_delivery DATE,
    quality_evidence TEXT,
    notes TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'submitted'
        CHECK (status IN ('submitted','withdrawn','shortlisted','awarded','rejected')),
    rejection_reason TEXT,
    submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (rfq_id, bidder_id),

    -- Rejecting a farmer's bid without a reason teaches them nothing about how
    -- to win the next one, which is the only thing that makes bidding worth
    -- their time.
    CONSTRAINT rejected_bid_has_reason CHECK (
      status <> 'rejected' OR (rejection_reason IS NOT NULL AND length(trim(rejection_reason)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- B. SUBSCRIPTION / SIP FOR STAPLES         (missing module 2)
--
-- "Allow RWAs and HoReCa to set monthly auto-orders. This generates
--  predictable Monthly Recurring Revenue."
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS staple_subscriptions (
    id BIGSERIAL PRIMARY KEY,
    subscriber_id UUID,
    subscriber_type VARCHAR(20) NOT NULL DEFAULT 'rwa'
        CHECK (subscriber_type IN ('rwa','horeca','institution','household','corporate')),
    subscriber_name VARCHAR(200),

    product VARCHAR(160) NOT NULL,
    quantity_kg NUMERIC(12,2) NOT NULL CHECK (quantity_kg > 0),
    frequency_days INTEGER NOT NULL DEFAULT 30 CHECK (frequency_days > 0),
    locked_price_inr_per_kg NUMERIC(12,2) CHECK (locked_price_inr_per_kg IS NULL OR locked_price_inr_per_kg > 0),
    price_lock_months INTEGER CHECK (price_lock_months IS NULL OR price_lock_months >= 0),

    delivery_address TEXT,
    next_delivery_on DATE,
    started_on DATE NOT NULL DEFAULT CURRENT_DATE,
    paused_until DATE,
    cancelled_on DATE,
    cancellation_reason TEXT,

    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','paused','cancelled','completed','payment_failed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A price locked for a long horizon on a volatile staple is a forward
    -- commitment the platform must be able to source. Bounded so it cannot be
    -- set to a year by someone chasing a signup.
    CONSTRAINT price_lock_bounded CHECK (price_lock_months IS NULL OR price_lock_months <= 12),
    CONSTRAINT cancelled_subscription_has_reason CHECK (
      status <> 'cancelled' OR cancellation_reason IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- C. QUOTE-TO-ORDER CONVERSION              (missing module 3)
--
-- "Track WHY quotes are lost (price vs delivery). This gives the sales team
--  data to adjust pricing based on real buyer behaviour, not competitor
--  scrapes."
--
-- The loss reason is the entire value of this table. A conversion rate with no
-- reason attached tells you that you are losing and nothing about what to change.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS quote_outcomes (
    id BIGSERIAL PRIMARY KEY,
    quote_ref VARCHAR(60) NOT NULL UNIQUE,
    buyer_id UUID,
    product VARCHAR(160),
    quantity_kg NUMERIC(14,2),
    quoted_price_inr_per_kg NUMERIC(12,2) CHECK (quoted_price_inr_per_kg IS NULL OR quoted_price_inr_per_kg > 0),
    quoted_delivery_days INTEGER,

    outcome VARCHAR(20) NOT NULL
        CHECK (outcome IN ('pending','won','lost','expired','withdrawn')),
    loss_reason VARCHAR(40)
        CHECK (loss_reason IS NULL OR loss_reason IN
               ('price','delivery_time','quality_doubt','payment_terms','competitor',
                'no_response','quantity_mismatch','certification_missing','other')),
    competitor_price_inr_per_kg NUMERIC(12,2),
    loss_detail TEXT,

    quoted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP,

    -- The whole point of the module.
    CONSTRAINT lost_quote_states_why CHECK (outcome <> 'lost' OR loss_reason IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- D. AD INVENTORY: SPONSORED LISTINGS, AFFILIATES, PIXELS   (modules 4-6)
--
-- "Allow high-margin brands to bid for the Top Slot. This creates a new
--  revenue stream without charging farmers directly."
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS sponsored_listings (
    id BIGSERIAL PRIMARY KEY,
    product_id VARCHAR(80) NOT NULL,
    sponsor_id UUID,
    sponsor_name VARCHAR(160),
    category VARCHAR(80) NOT NULL,

    bid_inr_per_click NUMERIC(10,2) CHECK (bid_inr_per_click IS NULL OR bid_inr_per_click >= 0),
    daily_budget_inr NUMERIC(12,2) CHECK (daily_budget_inr IS NULL OR daily_budget_inr >= 0),
    slot_position INTEGER CHECK (slot_position IS NULL OR slot_position > 0),

    starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
    ends_on DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('draft','active','paused','exhausted','ended')),

    impressions BIGINT NOT NULL DEFAULT 0 CHECK (impressions >= 0),
    clicks BIGINT NOT NULL DEFAULT 0 CHECK (clicks >= 0),
    spend_inr NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (spend_inr >= 0),

    -- Paid placement must be labelled. An unmarked sponsored result presented
    -- as an organic recommendation is the thing that destroys trust in a
    -- marketplace whose whole pitch is transparency about where value goes.
    disclosure_label VARCHAR(40) NOT NULL DEFAULT 'Sponsored',

    CONSTRAINT sponsored_dates_valid CHECK (ends_on IS NULL OR ends_on >= starts_on),
    CONSTRAINT clicks_not_exceeding_impressions CHECK (clicks <= impressions),
    CONSTRAINT disclosure_not_blank CHECK (length(trim(disclosure_label)) > 0)
);

CREATE TABLE IF NOT EXISTS affiliate_partners (
    id BIGSERIAL PRIMARY KEY,
    partner_code VARCHAR(40) NOT NULL UNIQUE,
    partner_name VARCHAR(160) NOT NULL,
    partner_type VARCHAR(30) NOT NULL DEFAULT 'influencer'
        CHECK (partner_type IN ('influencer','blogger','rwa_champion','reseller','media')),
    commission_pct NUMERIC(5,2) NOT NULL DEFAULT 10.00
        CHECK (commission_pct >= 0 AND commission_pct <= 100),

    referral_link TEXT,
    total_referred_orders INTEGER NOT NULL DEFAULT 0 CHECK (total_referred_orders >= 0),
    total_referred_value_inr NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (total_referred_value_inr >= 0),
    total_commission_inr NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (total_commission_inr >= 0),

    -- Commission on food sales is advertising and is regulated. Recording the
    -- disclosure obligation next to the payout keeps the two from drifting apart.
    disclosure_required BOOLEAN NOT NULL DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','paused','terminated')),
    joined_on DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE IF NOT EXISTS marketing_pixels (
    id SERIAL PRIMARY KEY,
    platform VARCHAR(40) NOT NULL CHECK (platform IN ('meta','google','linkedin','x','pinterest','other')),
    pixel_id VARCHAR(120) NOT NULL,
    events_tracked TEXT[] NOT NULL DEFAULT '{}',
    enabled BOOLEAN NOT NULL DEFAULT FALSE,

    -- A tracking pixel processes personal data. Firing one without a lawful
    -- basis recorded is a DPDP Act problem, not a marketing setting.
    consent_basis VARCHAR(40) NOT NULL DEFAULT 'consent'
        CHECK (consent_basis IN ('consent','legitimate_interest','not_established')),
    consent_banner_live BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (platform, pixel_id),

    -- Cannot enable tracking before consent capture exists.
    CONSTRAINT pixel_enabled_needs_consent CHECK (
      enabled = FALSE OR (consent_basis <> 'not_established' AND consent_banner_live = TRUE)
    )
);

-- ---------------------------------------------------------------------------
-- E. TAX COMPLIANCE: TDS, E-INVOICE IRN, GSTR, RCM         (modules 7,10,11,12)
--
-- One compliance surface, four tables. Splitting them across features is how
-- a filing ends up assembled by hand at midnight on the 20th.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tds_deductions (
    id BIGSERIAL PRIMARY KEY,
    deductee_id UUID,
    deductee_name VARCHAR(200) NOT NULL,
    deductee_pan VARCHAR(10),
    deductee_type VARCHAR(30) NOT NULL
        CHECK (deductee_type IN ('transporter','fpo','vendor','contractor','professional','commission_agent')),

    section VARCHAR(20) NOT NULL,
    payment_amount_inr NUMERIC(16,2) NOT NULL CHECK (payment_amount_inr > 0),
    tds_rate_pct NUMERIC(5,2) NOT NULL CHECK (tds_rate_pct >= 0 AND tds_rate_pct <= 100),
    tds_amount_inr NUMERIC(16,2)
        GENERATED ALWAYS AS (ROUND(payment_amount_inr * tds_rate_pct / 100, 2)) STORED,

    -- No PAN means a higher statutory rate (20% under s.206AA). Recording the
    -- reason keeps it from looking like an arbitrary rate to an auditor.
    higher_rate_no_pan BOOLEAN NOT NULL DEFAULT FALSE,
    quarter VARCHAR(7) NOT NULL,
    financial_year VARCHAR(9) NOT NULL,
    challan_no VARCHAR(40),
    deposited_on DATE,
    form_26q_filed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT no_pan_means_higher_rate CHECK (
      deductee_pan IS NOT NULL OR higher_rate_no_pan = TRUE
    ),
    CONSTRAINT filed_return_has_challan CHECK (
      form_26q_filed = FALSE OR challan_no IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS einvoice_irn (
    id BIGSERIAL PRIMARY KEY,
    invoice_ref VARCHAR(60) NOT NULL UNIQUE,
    irn VARCHAR(64) UNIQUE,
    ack_no VARCHAR(40),
    ack_date TIMESTAMP,
    signed_qr_code TEXT,
    signed_invoice TEXT,

    -- 'sandbox' must never be mistaken for a live IRN. A sandbox IRN on a real
    -- invoice is not a valid document and the buyer cannot claim credit on it.
    environment VARCHAR(10) NOT NULL DEFAULT 'sandbox'
        CHECK (environment IN ('sandbox','production')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','generated','failed','cancelled')),
    error_code VARCHAR(20),
    error_message TEXT,
    cancelled_on TIMESTAMP,
    cancellation_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT generated_irn_has_value CHECK (status <> 'generated' OR irn IS NOT NULL),
    CONSTRAINT failed_irn_has_error CHECK (status <> 'failed' OR error_message IS NOT NULL),
    -- IRN cancellation is only permitted within 24 hours of generation.
    CONSTRAINT cancellation_has_reason CHECK (status <> 'cancelled' OR cancellation_reason IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS gstr_filings (
    id BIGSERIAL PRIMARY KEY,
    return_type VARCHAR(12) NOT NULL CHECK (return_type IN ('GSTR-1','GSTR-3B','GSTR-9','CMP-08')),
    period VARCHAR(7) NOT NULL,
    gstin VARCHAR(15) NOT NULL,

    b2b_taxable_inr NUMERIC(16,2) NOT NULL DEFAULT 0,
    b2c_taxable_inr NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_cgst_inr NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_sgst_inr NUMERIC(16,2) NOT NULL DEFAULT 0,
    total_igst_inr NUMERIC(16,2) NOT NULL DEFAULT 0,
    itc_claimed_inr NUMERIC(16,2) NOT NULL DEFAULT 0,

    generated_json JSONB,
    status VARCHAR(20) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft','generated','filed','revised','error')),
    filed_on DATE,
    arn VARCHAR(40),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (return_type, period, gstin),
    CONSTRAINT filed_return_has_arn CHECK (status <> 'filed' OR arn IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS rcm_liabilities (
    id BIGSERIAL PRIMARY KEY,
    invoice_ref VARCHAR(60),
    supplier_name VARCHAR(200) NOT NULL,
    supplier_unregistered BOOLEAN NOT NULL DEFAULT TRUE,

    -- Buying raw agricultural produce from an unregistered farmer shifts the
    -- GST liability to the buyer. Missing it means the buyer under-declares
    -- and the platform's invoice is the evidence.
    supply_description TEXT NOT NULL,
    taxable_value_inr NUMERIC(16,2) NOT NULL CHECK (taxable_value_inr > 0),
    gst_rate_pct NUMERIC(5,2) NOT NULL CHECK (gst_rate_pct >= 0 AND gst_rate_pct <= 100),
    rcm_liability_inr NUMERIC(16,2)
        GENERATED ALWAYS AS (ROUND(taxable_value_inr * gst_rate_pct / 100, 2)) STORED,

    period VARCHAR(7) NOT NULL,
    discharged BOOLEAN NOT NULL DEFAULT FALSE,
    discharged_on DATE,
    itc_eligible BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT discharged_rcm_has_date CHECK (discharged = FALSE OR discharged_on IS NOT NULL)
);

-- ---------------------------------------------------------------------------
-- F. BANK RECONCILIATION + ASSET DEPRECIATION       (modules 8, 9)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS bank_reconciliation (
    id BIGSERIAL PRIMARY KEY,
    statement_date DATE NOT NULL,
    bank_account VARCHAR(60) NOT NULL,
    bank_ref VARCHAR(120),

    bank_amount_inr NUMERIC(16,2) NOT NULL,
    ledger_amount_inr NUMERIC(16,2),
    variance_inr NUMERIC(16,2)
        GENERATED ALWAYS AS (bank_amount_inr - COALESCE(ledger_amount_inr, 0)) STORED,

    match_status VARCHAR(20) NOT NULL DEFAULT 'unmatched'
        CHECK (match_status IN ('matched','unmatched','partial','disputed','written_off')),
    matched_txn_ref VARCHAR(120),
    -- 'auto' vs 'manual' matters at audit: an auto-match nobody looked at is
    -- weaker evidence than one a person confirmed.
    matched_by VARCHAR(10) CHECK (matched_by IS NULL OR matched_by IN ('auto','manual')),
    matched_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT matched_row_names_txn CHECK (
      match_status <> 'matched' OR (matched_txn_ref IS NOT NULL AND matched_by IS NOT NULL)
    ),
    CONSTRAINT written_off_needs_note CHECK (match_status <> 'written_off' OR notes IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS asset_depreciation_schedule (
    id BIGSERIAL PRIMARY KEY,
    asset_code VARCHAR(60) NOT NULL,
    asset_name VARCHAR(200) NOT NULL,
    project_ref VARCHAR(60),

    capitalised_on DATE NOT NULL,
    gross_block_inr NUMERIC(16,2) NOT NULL CHECK (gross_block_inr > 0),
    salvage_value_inr NUMERIC(16,2) NOT NULL DEFAULT 0 CHECK (salvage_value_inr >= 0),
    useful_life_years NUMERIC(5,2) NOT NULL CHECK (useful_life_years > 0),
    method VARCHAR(10) NOT NULL DEFAULT 'SLM' CHECK (method IN ('SLM','WDV')),

    annual_depreciation_inr NUMERIC(16,2)
        GENERATED ALWAYS AS (
          CASE WHEN method = 'SLM'
               THEN ROUND((gross_block_inr - salvage_value_inr) / useful_life_years, 2) END
        ) STORED,

    -- Co-owned infrastructure: a corporate buying a share of a cold store needs
    -- its own depreciation certificate for its own books.
    co_owner_id UUID,
    co_owner_share_pct NUMERIC(5,2) CHECK (co_owner_share_pct IS NULL OR (co_owner_share_pct > 0 AND co_owner_share_pct <= 100)),

    disposed_on DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (asset_code),
    CONSTRAINT salvage_below_cost CHECK (salvage_value_inr < gross_block_inr),
    CONSTRAINT co_owner_has_share CHECK ((co_owner_id IS NULL) = (co_owner_share_pct IS NULL))
);

-- ---------------------------------------------------------------------------
-- G. FARM PLOTS, AGRI-INPUTS, MANDI PRICES, QC HOLD, FPO CENTRES  (13-17)
-- ---------------------------------------------------------------------------

-- "Move beyond Farmer Name to Plot ID. True farm-to-fork traceability starts
--  at the soil, not the warehouse gate."
CREATE TABLE IF NOT EXISTS farm_plots (
    id BIGSERIAL PRIMARY KEY,
    plot_code VARCHAR(60) NOT NULL UNIQUE,
    farmer_id UUID,
    village VARCHAR(120),
    district VARCHAR(80),
    state VARCHAR(60),

    area_hectares NUMERIC(10,4) CHECK (area_hectares IS NULL OR area_hectares > 0),
    centroid_lat NUMERIC(9,6) CHECK (centroid_lat IS NULL OR (centroid_lat BETWEEN -90 AND 90)),
    centroid_lng NUMERIC(9,6) CHECK (centroid_lng IS NULL OR (centroid_lng BETWEEN -180 AND 180)),
    boundary_geojson JSONB,
    survey_no VARCHAR(60),

    soil_type VARCHAR(60),
    irrigation_source VARCHAR(60),
    organic_since DATE,
    certification_status VARCHAR(30),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- (0,0) is in the Gulf of Guinea. A plot recorded there is a default that
    -- was never filled in, and it has silently passed as a location before.
    CONSTRAINT plot_not_null_island CHECK (
      centroid_lat IS NULL OR centroid_lng IS NULL
      OR NOT (centroid_lat = 0 AND centroid_lng = 0)
    )
);

CREATE TABLE IF NOT EXISTS lot_plot_links (
    id BIGSERIAL PRIMARY KEY,
    lot_code VARCHAR(60) NOT NULL,
    plot_id BIGINT NOT NULL REFERENCES farm_plots (id),
    harvest_date DATE,
    quantity_kg NUMERIC(14,2) CHECK (quantity_kg IS NULL OR quantity_kg > 0),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (lot_code, plot_id)
);

-- "Track inputs issued to farmers. If a farmer uses banned pesticides, the lot
--  is automatically flagged for export rejection."
CREATE TABLE IF NOT EXISTS agri_input_issues (
    id BIGSERIAL PRIMARY KEY,
    farmer_id UUID,
    plot_id BIGINT REFERENCES farm_plots (id),
    input_type VARCHAR(30) NOT NULL
        CHECK (input_type IN ('seed','fertilizer','pesticide','biopesticide','micronutrient','ppe','tool')),
    product_name VARCHAR(200) NOT NULL,
    quantity NUMERIC(12,3) NOT NULL CHECK (quantity > 0),
    unit VARCHAR(20) NOT NULL DEFAULT 'kg',

    issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
    against_advance BOOLEAN NOT NULL DEFAULT FALSE,
    cost_inr NUMERIC(12,2) CHECK (cost_inr IS NULL OR cost_inr >= 0),

    -- The export-rejection trigger.
    is_banned_substance BOOLEAN NOT NULL DEFAULT FALSE,
    banned_in_markets TEXT[],
    organic_compliant BOOLEAN,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT banned_input_names_markets CHECK (
      is_banned_substance = FALSE OR banned_in_markets IS NOT NULL
    )
);

-- "Pull live prices from e-NAM and local APMCs directly into the Sell-Timing
--  Advisor. Don't guess the market; read it in real-time."
CREATE TABLE IF NOT EXISTS mandi_prices (
    id BIGSERIAL PRIMARY KEY,
    market_name VARCHAR(160) NOT NULL,
    state VARCHAR(60),
    district VARCHAR(80),
    commodity VARCHAR(120) NOT NULL,
    variety VARCHAR(120),
    grade VARCHAR(40),

    min_price_inr_per_qtl NUMERIC(12,2) CHECK (min_price_inr_per_qtl IS NULL OR min_price_inr_per_qtl >= 0),
    modal_price_inr_per_qtl NUMERIC(12,2) CHECK (modal_price_inr_per_qtl IS NULL OR modal_price_inr_per_qtl >= 0),
    max_price_inr_per_qtl NUMERIC(12,2) CHECK (max_price_inr_per_qtl IS NULL OR max_price_inr_per_qtl >= 0),
    arrivals_tonnes NUMERIC(12,2),

    price_date DATE NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'agmarknet'
        CHECK (source IN ('agmarknet','enam','apmc_manual','trader_report','estimated')),
    fetched_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (market_name, commodity, variety, price_date),

    CONSTRAINT mandi_price_band_ordered CHECK (
      min_price_inr_per_qtl IS NULL OR max_price_inr_per_qtl IS NULL
      OR min_price_inr_per_qtl <= max_price_inr_per_qtl
    ),
    CONSTRAINT modal_inside_band CHECK (
      modal_price_inr_per_qtl IS NULL OR min_price_inr_per_qtl IS NULL OR max_price_inr_per_qtl IS NULL
      OR (modal_price_inr_per_qtl BETWEEN min_price_inr_per_qtl AND max_price_inr_per_qtl)
    )
);

-- "If a lab report fails, the system automatically blocks that lot from Ready
--  for Dispatch. Only the QC manager can Override/Hold-Release with a digital
--  signature."
CREATE TABLE IF NOT EXISTS qc_holds (
    id BIGSERIAL PRIMARY KEY,
    lot_code VARCHAR(60) NOT NULL,
    hold_reason VARCHAR(60) NOT NULL,
    lab_report_ref VARCHAR(80),
    failed_parameter VARCHAR(120),
    observed_value VARCHAR(60),
    permitted_limit VARCHAR(60),

    status VARCHAR(20) NOT NULL DEFAULT 'held'
        CHECK (status IN ('held','released','rejected','reworked','destroyed')),
    held_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Release requires a named person and a signature. An auto-release, or a
    -- release with no signer, defeats the entire control: the hold exists
    -- precisely because somebody must take responsibility for overriding it.
    released_by UUID,
    release_signature VARCHAR(200),
    release_justification TEXT,
    released_at TIMESTAMP,

    CONSTRAINT release_is_signed CHECK (
      status <> 'released'
      OR (released_by IS NOT NULL AND release_signature IS NOT NULL
          AND release_justification IS NOT NULL AND length(trim(release_justification)) > 0)
    ),
    CONSTRAINT destroyed_lot_has_justification CHECK (
      status <> 'destroyed' OR release_justification IS NOT NULL
    )
);

-- "Allow a single large FPO to manage multiple collection centres. Each centre
--  has its own P&L. CAs can audit centre-wise performance, preventing internal
--  fraud."
CREATE TABLE IF NOT EXISTS fpo_cost_centres (
    id BIGSERIAL PRIMARY KEY,
    fpo_id UUID,
    centre_code VARCHAR(40) NOT NULL UNIQUE,
    centre_name VARCHAR(160) NOT NULL,
    village VARCHAR(120),
    district VARCHAR(80),
    incharge_name VARCHAR(120),

    opened_on DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','suspended','closed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fpo_centre_transactions (
    id BIGSERIAL PRIMARY KEY,
    centre_id BIGINT NOT NULL REFERENCES fpo_cost_centres (id),
    txn_date DATE NOT NULL DEFAULT CURRENT_DATE,
    txn_type VARCHAR(20) NOT NULL
        CHECK (txn_type IN ('procurement','sale','expense','wastage','transfer_in','transfer_out')),
    quantity_kg NUMERIC(14,2),
    amount_inr NUMERIC(16,2) NOT NULL,
    reference VARCHAR(120),
    notes TEXT,
    recorded_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Centre-wise P&L. The point is comparability: a centre whose wastage runs far
-- above its peers is either badly run or being robbed, and neither shows up in
-- an FPO-level total.
CREATE OR REPLACE VIEW v_fpo_centre_pnl AS
SELECT
    c.id AS centre_id, c.centre_code, c.centre_name, c.district,
    SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'sale')        AS revenue_inr,
    SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'procurement') AS procurement_inr,
    SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'expense')     AS expense_inr,
    SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'wastage')     AS wastage_inr,
    COALESCE(SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'sale'), 0)
      - COALESCE(SUM(t.amount_inr) FILTER (WHERE t.txn_type IN ('procurement','expense','wastage')), 0)
                                                                AS net_inr,
    ROUND(
      COALESCE(SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'wastage'), 0)
      / NULLIF(SUM(t.amount_inr) FILTER (WHERE t.txn_type = 'procurement'), 0) * 100, 2
    )                                                           AS wastage_pct_of_procurement
FROM fpo_cost_centres c
LEFT JOIN fpo_centre_transactions t ON t.centre_id = c.id
GROUP BY c.id, c.centre_code, c.centre_name, c.district;

CREATE INDEX IF NOT EXISTS idx_rfq_open ON rfq_requests (closes_at) WHERE status = 'open';
CREATE INDEX IF NOT EXISTS idx_rfq_bids_rfq ON rfq_bids (rfq_id, price_inr_per_kg);
CREATE INDEX IF NOT EXISTS idx_subs_due ON staple_subscriptions (next_delivery_on) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_quote_loss ON quote_outcomes (loss_reason) WHERE outcome = 'lost';
CREATE INDEX IF NOT EXISTS idx_tds_quarter ON tds_deductions (financial_year, quarter);
CREATE INDEX IF NOT EXISTS idx_irn_status ON einvoice_irn (status);
CREATE INDEX IF NOT EXISTS idx_rcm_period ON rcm_liabilities (period) WHERE discharged = FALSE;
CREATE INDEX IF NOT EXISTS idx_bankrec_unmatched ON bank_reconciliation (statement_date) WHERE match_status = 'unmatched';
CREATE INDEX IF NOT EXISTS idx_plots_farmer ON farm_plots (farmer_id);
CREATE INDEX IF NOT EXISTS idx_inputs_banned ON agri_input_issues (farmer_id) WHERE is_banned_substance = TRUE;
CREATE INDEX IF NOT EXISTS idx_mandi_lookup ON mandi_prices (commodity, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_qc_active_holds ON qc_holds (lot_code) WHERE status = 'held';
CREATE INDEX IF NOT EXISTS idx_centre_txn ON fpo_centre_transactions (centre_id, txn_date DESC);
