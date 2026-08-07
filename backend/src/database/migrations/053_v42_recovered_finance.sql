-- ============================================================================
-- 053_v42_recovered_finance.sql   (2026-08-05)
--
-- Business logic recovered from afrera_platform_v42/v44.html that had no
-- backend equivalent. Verified absent before writing: none of trialBalance,
-- verifyLedger, buildInvoice, gstFor, matchSchemes, enwrGenerate,
-- eqSubsidyEstimate, riskScoreFor, tmRatePerKg or freightAt appears anywhere
-- in backend/src.
--
-- Table names were checked against the whole chain first. gl_entries,
-- dpr_schemes, enwr_receipts, equipment_subsidy_bands, party_risk_scores,
-- freight_slabs and transport_classes are all new. chart_of_accounts and
-- journal_entries already exist in 996 and are NOT redeclared here — the
-- ledger below references them rather than competing with them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. GST RATE CLASSIFICATION
--
-- v42's gstFor() is a regex cascade over a category string: fresh produce at
-- 0% when unbranded, spices at 5%, and so on. As code it cannot be corrected
-- by anyone who is not a developer, and GST rates change by notification.
-- As rows a tax practitioner can fix a rate the day it moves.
--
-- 047 already has hsn_gst_mapping keyed by HSN. This table is the layer ABOVE
-- it: how to get FROM a product category TO an HSN in the first place.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gst_category_rules (
    id SERIAL PRIMARY KEY,
    match_pattern TEXT NOT NULL,
    requires_unbranded BOOLEAN NOT NULL DEFAULT FALSE,
    hsn_code VARCHAR(10) NOT NULL,
    gst_rate NUMERIC(5,2) NOT NULL CHECK (gst_rate >= 0 AND gst_rate <= 100),
    description VARCHAR(200) NOT NULL,
    -- Lower runs first. Branded/unbranded splits must be evaluated before the
    -- generic fallback or everything collapses into one rate.
    priority INTEGER NOT NULL DEFAULT 100,
    notification_ref TEXT,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT gst_rule_dates_valid CHECK (effective_to IS NULL OR effective_to >= effective_from)
);

INSERT INTO gst_category_rules
 (match_pattern, requires_unbranded, hsn_code, gst_rate, description, priority, notification_ref)
VALUES
 ('fresh|fruit|vegetab',  TRUE,  '0810', 0.00,  'Fresh fruit and vegetables, unbranded', 10,
  'Nil-rated when not put up in unit containers with a registered brand name'),
 ('spice|tea|turmeric|chilli|ginger', FALSE, '0910', 5.00, 'Spices, tea, turmeric, chilli, ginger', 20, NULL),
 ('grain|rice|millet',    FALSE, '1006', 5.00,  'Cereals and millets', 20, NULL),
 ('honey',                FALSE, '0409', 5.00,  'Natural honey', 20, NULL),
 ('process|mix|ready',    FALSE, '2106', 12.00, 'Processed and ready-to-eat preparations', 30, NULL),
 ('beverage|drink',       FALSE, '2202', 18.00, 'Beverages', 30, NULL),
 ('handloom|textile|craft', FALSE, '5208', 5.00, 'Handloom and textile crafts', 30, NULL),
 ('.*',                   FALSE, '0910', 5.00,  'Fallback — agricultural default', 999,
  'v42 fell back to the spice rate. Retained, but a fallback that silently '
  'picks 5% is a place to look when an invoice is disputed.')
ON CONFLICT DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. HASH-CHAINED LEDGER
--
-- v42's verifyLedger() walks a chain checking each entry's `prev` against the
-- previous `hash`. Tamper-evidence: you cannot alter a historical entry
-- without breaking every link after it.
--
-- This is NOT a replacement for journal_entries in 996. That is the accounting
-- record. This is the integrity chain over it.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS gl_ledger_chain (
    id BIGSERIAL PRIMARY KEY,
    entry_ref VARCHAR(80) NOT NULL UNIQUE,
    journal_entry_id UUID,

    debit_account VARCHAR(40) NOT NULL,
    credit_account VARCHAR(40) NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    narration TEXT NOT NULL,

    prev_hash VARCHAR(64) NOT NULL,
    entry_hash VARCHAR(64) NOT NULL UNIQUE,
    sequence_no BIGINT NOT NULL,

    recorded_by UUID,
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Double entry with the same account on both sides moves nothing and
    -- balances perfectly, which is exactly how it hides in a trial balance.
    CONSTRAINT ledger_accounts_differ CHECK (debit_account <> credit_account),
    CONSTRAINT ledger_sequence_positive CHECK (sequence_no > 0)
);

-- Trial balance over the CHAINED ledger.
--
-- Named v_ledger_trial_balance, not v_trial_balance: 996_enterprise_foundation
-- already owns that name with a different column list, and CREATE OR REPLACE
-- VIEW cannot rename an existing column — 996 aborted with "cannot change name
-- of view column \"account\" to \"company_id\"". A view collision fails loudly
-- rather than silently, unlike the table version, but it still takes the rest
-- of that migration down with it.
CREATE OR REPLACE VIEW v_ledger_trial_balance AS
WITH movements AS (
    SELECT debit_account AS account, amount AS dr, 0::numeric AS cr FROM gl_ledger_chain
    UNION ALL
    SELECT credit_account, 0::numeric, amount FROM gl_ledger_chain
)
SELECT
    account,
    SUM(dr)               AS total_debit,
    SUM(cr)               AS total_credit,
    SUM(dr) - SUM(cr)     AS balance
FROM movements
GROUP BY account
ORDER BY account;

-- Is the whole book balanced? Debits must equal credits in aggregate.
CREATE OR REPLACE VIEW v_ledger_trial_balance_check AS
SELECT
    SUM(total_debit)  AS total_debit,
    SUM(total_credit) AS total_credit,
    SUM(total_debit) - SUM(total_credit) AS difference,
    (SUM(total_debit) = SUM(total_credit)) AS balanced
FROM v_ledger_trial_balance;

-- Broken links in the hash chain. An empty result is the only acceptable one.
CREATE OR REPLACE VIEW v_ledger_integrity AS
SELECT
    c.id, c.entry_ref, c.sequence_no, c.prev_hash,
    p.entry_hash AS expected_prev_hash,
    'chain broken — this entry does not follow the one before it' AS finding
FROM gl_ledger_chain c
LEFT JOIN gl_ledger_chain p ON p.sequence_no = c.sequence_no - 1
WHERE c.sequence_no > 1
  AND (p.entry_hash IS NULL OR c.prev_hash <> p.entry_hash);

-- ---------------------------------------------------------------------------
-- 3. GOVERNMENT SCHEME MATCHING
--
-- v42's matchSchemes() scores schemes against a project type and state, and
-- carries the reason for every point awarded. The MOVCDNER rule is the
-- important one: it is NE-only, and applying from outside the NE is not a
-- weak match, it is disqualifying (-100).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS dpr_schemes (
    id SERIAL PRIMARY KEY,
    scheme_code VARCHAR(40) NOT NULL UNIQUE,
    scheme_name VARCHAR(200) NOT NULL,
    ministry TEXT,
    project_types TEXT[] NOT NULL DEFAULT '{}',

    ne_states_only BOOLEAN NOT NULL DEFAULT FALSE,
    eligible_states TEXT[],
    subsidy_pct NUMERIC(5,2) CHECK (subsidy_pct IS NULL OR (subsidy_pct >= 0 AND subsidy_pct <= 100)),
    subsidy_ceiling_inr NUMERIC(14,2),

    -- 'verify' means the window is unconfirmed. v42 penalised it -15 rather
    -- than hiding it: an unverified scheme is still worth knowing about, it
    -- just should not outrank a confirmed one.
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','verify','lapsed','suspended')),
    window_opens DATE,
    window_closes DATE,
    source_url TEXT,
    last_verified_on DATE,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A scheme claiming 'active' with no verification date is how stale
    -- government data quietly becomes advice someone acts on.
    CONSTRAINT active_scheme_needs_verification CHECK (
      status <> 'active' OR last_verified_on IS NOT NULL
    )
);

INSERT INTO dpr_schemes
 (scheme_code, scheme_name, ministry, project_types, ne_states_only, subsidy_pct, status, last_verified_on, source_url)
VALUES
 ('MOVCDNER','Mission Organic Value Chain Development for North Eastern Region',
  'Ministry of Agriculture & Farmers Welfare', '{organic,fpo,processing,certification}', TRUE, 50.00,
  'verify', NULL, 'https://www.mizoram.gov.in/'),
 ('OPGREENS','Operation Greens', 'Ministry of Food Processing Industries',
  '{coldchain,processing,logistics}', FALSE, 50.00, 'verify', NULL, NULL),
 ('PKVY','Paramparagat Krishi Vikas Yojana', 'Ministry of Agriculture & Farmers Welfare',
  '{organic,certification}', FALSE, 50.00, 'verify', NULL, NULL),
 ('AIF','Agriculture Infrastructure Fund', 'Ministry of Agriculture & Farmers Welfare',
  '{coldchain,warehouse,processing,logistics}', FALSE, NULL, 'verify', NULL, NULL)
ON CONFLICT (scheme_code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. eNWR — electronic Negotiable Warehouse Receipts
--
-- v42's enwrGenerate() issues a receipt against stored produce and computes a
-- pledgeable ceiling at 70% of estimated value. That haircut is the standard
-- agri-collateral discount and it is the whole safety margin: lend against
-- 100% and a price fall wipes out the lender and the farmer together.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS enwr_receipts (
    id BIGSERIAL PRIMARY KEY,
    receipt_no VARCHAR(40) NOT NULL UNIQUE,
    booking_id VARCHAR(60),
    facility_id VARCHAR(60),
    farmer_id UUID,

    commodity VARCHAR(120),
    quantity_qtl NUMERIC(14,3) NOT NULL CHECK (quantity_qtl > 0),
    estimated_value_inr NUMERIC(16,2) NOT NULL CHECK (estimated_value_inr > 0),
    haircut_pct NUMERIC(5,2) NOT NULL DEFAULT 30.00
        CHECK (haircut_pct >= 0 AND haircut_pct < 100),

    -- Derived so no caller can pledge more than the haircut allows.
    max_collateral_inr NUMERIC(16,2)
        GENERATED ALWAYS AS (ROUND(estimated_value_inr * (100 - haircut_pct) / 100, 2)) STORED,

    valuation_basis VARCHAR(20) NOT NULL DEFAULT 'estimated'
        CHECK (valuation_basis IN ('real','estimated','assumed')),
    status VARCHAR(20) NOT NULL DEFAULT 'issued'
        CHECK (status IN ('issued','pledged','partially_released','released','cancelled','expired')),
    pledged_to VARCHAR(150),
    pledged_amount_inr NUMERIC(16,2) CHECK (pledged_amount_inr IS NULL OR pledged_amount_inr >= 0),

    issued_by UUID,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_until DATE,

    -- The haircut is the point. Allowing a pledge above the ceiling would make
    -- the column decorative.
    CONSTRAINT pledge_within_ceiling CHECK (
      pledged_amount_inr IS NULL
      OR pledged_amount_inr <= ROUND(estimated_value_inr * (100 - haircut_pct) / 100, 2)
    ),
    CONSTRAINT pledged_receipt_names_lender CHECK (
      status NOT IN ('pledged','partially_released') OR pledged_to IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- 5. FREIGHT RATE CARD
-- v42: tmRatePerKg() = lane.km * 0.0055 * class multiplier; freightAt() picks
-- a rate from utilisation slabs.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS transport_classes (
    id SERIAL PRIMARY KEY,
    class_key VARCHAR(20) NOT NULL UNIQUE,
    display_name VARCHAR(80) NOT NULL,
    rate_multiplier NUMERIC(6,3) NOT NULL CHECK (rate_multiplier > 0),
    temperature_controlled BOOLEAN NOT NULL DEFAULT FALSE,
    max_transit_days INTEGER CHECK (max_transit_days IS NULL OR max_transit_days > 0),
    notes TEXT
);

INSERT INTO transport_classes (class_key, display_name, rate_multiplier, temperature_controlled, max_transit_days, notes)
VALUES
 ('eco','Economy surface',1.000,FALSE,7,'Baseline. Unsuitable for anything perishable.'),
 ('std','Standard',1.350,FALSE,5,NULL),
 ('cold','Cold chain',2.100,TRUE,4,
  'Costs more and is not optional for perishables — the cheapest class would '
  'deliver spoiled goods, so a like-for-like price comparison against it is misleading.'),
 ('exp','Express',2.800,FALSE,2,NULL)
ON CONFLICT (class_key) DO NOTHING;

CREATE TABLE IF NOT EXISTS freight_utilisation_slabs (
    id SERIAL PRIMARY KEY,
    min_utilisation_pct NUMERIC(5,2) NOT NULL UNIQUE
        CHECK (min_utilisation_pct >= 0 AND min_utilisation_pct <= 100),
    rate_per_kg NUMERIC(10,3) NOT NULL CHECK (rate_per_kg > 0),
    notes TEXT
);

INSERT INTO freight_utilisation_slabs (min_utilisation_pct, rate_per_kg, notes) VALUES
 (0,   14.000, 'Near-empty truck. Fixed cost spread over very little weight.'),
 (25,  10.500, NULL),
 (50,   8.200, NULL),
 (75,   6.800, NULL),
 (90,   6.000, 'Full load. The reason pooling FPO consignments lowers cost per kg.')
ON CONFLICT (min_utilisation_pct) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. EQUIPMENT SUBSIDY BANDS
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS equipment_subsidy_bands (
    id SERIAL PRIMARY KEY,
    tier VARCHAR(40) NOT NULL UNIQUE,
    subsidy_pct NUMERIC(5,2) NOT NULL CHECK (subsidy_pct >= 0 AND subsidy_pct <= 100),
    ceiling_inr NUMERIC(14,2),
    applies_to TEXT,
    note TEXT NOT NULL,
    verified_on DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO equipment_subsidy_bands (tier, subsidy_pct, applies_to, note) VALUES
 ('smallholder_ne', 50.00, 'Small and marginal farmers in NE states',
  'Indicative. SMAM rates vary by state and implementing agency — confirm before quoting to a farmer.'),
 ('general',        40.00, 'General category farmers',
  'Indicative only. Not a commitment of subsidy.'),
 ('fpo_group',      60.00, 'FPO / SHG custom hiring centres',
  'Group ownership usually attracts a higher band. Confirm with the state agency.')
ON CONFLICT (tier) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. COUNTERPARTY RISK
--
-- v42's riskScoreFor() counts disputes, grade mismatches and rejected media,
-- and returns a level with the reasons attached. Kept as a derived view over
-- events rather than a stored score, because a stored risk score drifts from
-- the behaviour it claims to describe and nobody notices.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS party_risk_events (
    id BIGSERIAL PRIMARY KEY,
    party_id UUID NOT NULL,
    party_type VARCHAR(30) NOT NULL DEFAULT 'user'
        CHECK (party_type IN ('user','farmer','buyer','vendor','transporter','fpo')),
    event_type VARCHAR(40) NOT NULL
        CHECK (event_type IN ('dispute','grade_mismatch','media_rejected','late_delivery',
                              'payment_default','quality_failure','resolved_favourably')),
    weight INTEGER NOT NULL DEFAULT 10,
    reference VARCHAR(120),
    detail TEXT,
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A positive event must not carry a positive penalty and vice versa.
    CONSTRAINT resolved_events_reduce_risk CHECK (
      (event_type = 'resolved_favourably' AND weight <= 0)
      OR (event_type <> 'resolved_favourably' AND weight >= 0)
    )
);

CREATE OR REPLACE VIEW v_party_risk AS
SELECT
    party_id,
    party_type,
    COUNT(*)                                                   AS events,
    COUNT(*) FILTER (WHERE event_type = 'dispute')             AS disputes,
    COUNT(*) FILTER (WHERE event_type = 'grade_mismatch')      AS grade_mismatches,
    COUNT(*) FILTER (WHERE event_type = 'payment_default')     AS payment_defaults,
    GREATEST(0, LEAST(100, SUM(weight)))                       AS risk_score,
    CASE
      WHEN GREATEST(0, LEAST(100, SUM(weight))) >= 50 THEN 'high'
      WHEN GREATEST(0, LEAST(100, SUM(weight))) >= 20 THEN 'medium'
      ELSE 'low'
    END                                                        AS risk_level,
    MAX(occurred_at)                                           AS last_event_at
FROM party_risk_events
GROUP BY party_id, party_type;

CREATE INDEX IF NOT EXISTS idx_gst_rules_priority ON gst_category_rules (priority)
  WHERE effective_to IS NULL;
CREATE INDEX IF NOT EXISTS idx_ledger_sequence ON gl_ledger_chain (sequence_no);
CREATE INDEX IF NOT EXISTS idx_ledger_accounts ON gl_ledger_chain (debit_account, credit_account);
CREATE INDEX IF NOT EXISTS idx_enwr_farmer ON enwr_receipts (farmer_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_enwr_pledged ON enwr_receipts (status) WHERE status = 'pledged';
CREATE INDEX IF NOT EXISTS idx_risk_events_party ON party_risk_events (party_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_schemes_active ON dpr_schemes (status) WHERE status IN ('active','verify');
