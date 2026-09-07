-- ============================================================================
-- 9995_scheme_verification_map_protection.sql   (2026-08-07, extended 2026-08-08)
--
-- V44-prototype reconciliation (docs/V44_ADDITIONAL_FEATURES_EXTRACTION.md).
-- Four of the seven features extracted from that prototype turned out to be
-- real, unfilled gaps rather than restatements of existing services. Sections
-- 1-2 (scheme registry, MAP-protected offers) were built first; sections 3-5
-- (mill circuit, FPO ledger, registration tracks) were added in the same
-- migration on the 2026-08-08 pass rather than as a second file, since they
-- are all small and all additive.
--
-- 1. SCHEME VERIFICATION SYSTEM
--    governmentSchemeService.js and subsidyService.js both exist and are
--    mounted, but every scheme they return comes from an AI call
--    (aiAPI.generateRecommendation) or a hardcoded in-memory array — neither
--    file contains a single `pool.query`. There is no table anywhere in this
--    schema recording a scheme's verification status, expiry date, or who
--    last checked it against the primary source. The prototype's SCHEMES
--    array (active / conditional / expired, with an expiry-driven exclusion
--    for AHIDF) names a real discipline this repo talks about in
--    AdminDashboardPage.jsx and GovernmentDashboardPage.jsx ("AHIDF lapsed
--    31 Mar 2026 and is excluded from all live financing/insurance
--    workflows") without anywhere actually storing that fact.
--
-- 2. MAP PROTECTION (Minimum Acceptable Price)
--    farmer_contract_readiness (054_v8_v9_commerce_recovery.sql) already
--    stores map_price_inr_per_kg — "the farmer's own floor" — and a
--    v_contract_ready_farmers view already surfaces it. But `grep -r
--    contract_readiness backend/src/services` matches nothing: the table has
--    been live in the schema with zero consumers. The v44 prototype's ask —
--    "buyers never see your MAP; offers below it are auto-rejected before
--    they reach you" — is exactly what a consumer of that table should do
--    and none does. contract_offers below is the persistence for that
--    consumer (institutionalProcurementService.js).
--
--    contract_offers is a new table rather than a reuse of supply_contracts
--    (030_institutional_procurement_schema.sql) because supply_contracts.
--    institution_id/supplier_id are INTEGER NOT NULL, while every farmer
--    identity in this chain (farmer_contract_readiness.farmer_id included)
--    is UUID. Inserting a UUID farmer id into an INTEGER column is not a
--    style mismatch to paper over — it is a type error — so a small,
--    correctly-typed table was added instead of forcing a bad fit.
--
-- This migration is additive only: new tables/columns, IF NOT EXISTS
-- throughout, no ALTER of any existing table's constraints.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. GOVERNMENT SCHEME REGISTRY
--
-- Backs governmentSchemeService.js's new registry endpoints. Deliberately
-- separate from the AI-matching functions already in that file (
-- getApplicableSchemes/getCSROpportunities) — those stay as AI-assisted
-- discovery; this table is the verified-status source of truth they should
-- eventually be checked against, one gap at a time.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS government_schemes (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(40) NOT NULL UNIQUE,
    name VARCHAR(240) NOT NULL,
    ministry VARCHAR(160),
    department VARCHAR(160),
    category VARCHAR(80),
    relevance TEXT,

    -- 'conditional' is the prototype's middle state: active, but with a
    -- caveat (e.g. "verify current-year SLSC allocation") that a farmer
    -- should not read as an unconditional yes.
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'conditional', 'expired')),

    effective_from DATE,
    expiry_date DATE,

    -- Free text naming the primary source this status was checked against
    -- (ministry portal, gazette notification, etc.) — the discipline the v44
    -- prototype's "Primary source verification only" security note asks for.
    verification_source TEXT,
    last_verified_at TIMESTAMP,
    last_verified_by UUID,

    notes TEXT,
    applicable_states TEXT[],

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A scheme cannot be marked expired without recording when it lapsed —
    -- otherwise "expired" is just another unverifiable guess, the exact
    -- failure mode this table exists to fix.
    CONSTRAINT expired_scheme_must_have_expiry_date
        CHECK (status <> 'expired' OR expiry_date IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_government_schemes_status ON government_schemes(status);
CREATE INDEX IF NOT EXISTS idx_government_schemes_expiry ON government_schemes(expiry_date);
CREATE INDEX IF NOT EXISTS idx_government_schemes_category ON government_schemes(category);

CREATE OR REPLACE VIEW v_active_government_schemes AS
SELECT * FROM government_schemes
WHERE status IN ('active', 'conditional');

-- Seed: consolidates the prototype's SCHEMES array (docs/V44_ADDITIONAL_
-- FEATURES_EXTRACTION.md, feature 2) with the scheme codes already hardcoded
-- (and never persisted) inside governmentSchemeService.js/subsidyService.js.
-- ON CONFLICT keeps this idempotent if the migration file is ever re-applied.
INSERT INTO government_schemes
    (code, name, ministry, department, category, relevance, status,
     expiry_date, verification_source, last_verified_at, notes, applicable_states)
VALUES
    ('MIDH', 'Mission for Integrated Development of Horticulture',
     'Ministry of Agriculture & Farmers'' Welfare', 'Department of Horticulture',
     'horticulture', 'Horticulture infra, pack-houses', 'conditional', NULL,
     'Ministry of Agriculture & Farmers'' Welfare scheme guidelines', '2026-08-04',
     'Active — verify current-year SLSC allocation before committing a farmer to it.', NULL),

    ('PMFBY', 'Pradhan Mantri Fasal Bima Yojana',
     'Ministry of Agriculture & Farmers'' Welfare', 'Department of Agriculture',
     'insurance', 'Crop, prevented-sowing, post-harvest cover', 'active', NULL,
     'PMFBY official portal', '2026-08-04',
     'Active — powers Suraksha crop & seed cover (see riskPricingService.js).', NULL),

    ('RWBCIS', 'Restructured Weather Based Crop Insurance Scheme',
     'Ministry of Agriculture & Farmers'' Welfare', 'Department of Agriculture',
     'insurance', 'Weather-index crop insurance', 'active', NULL,
     'Ministry of Agriculture & Farmers'' Welfare scheme guidelines', '2026-08-04',
     'Active — powers Suraksha weather cover.', NULL),

    ('AHIDF', 'Animal Husbandry Infrastructure Development Fund',
     'Ministry of Fisheries, Animal Husbandry & Dairying', 'Department of Animal Husbandry',
     'infrastructure', 'Was: infrastructure credit + interest subvention', 'expired',
     '2026-03-31', 'MoFAHD notification', '2026-08-04',
     'EXPIRED 31 Mar 2026 — excluded from live financing/insurance workflows until revival is notified.', NULL),

    ('SATAT', 'Sustainable Alternative Towards Affordable Transportation',
     'Ministry of Petroleum & Natural Gas', NULL,
     'energy', 'CBG offtake (energy workstream)', 'active', NULL,
     'MoPNG official scheme page', '2026-08-04',
     'Active — captive and OMC offtake streams kept separate.', NULL),

    ('NERAMAC-NEC', 'NERAMAC / North Eastern Council marketing & GI facilitation',
     'Ministry of Development of North Eastern Region', NULL,
     'marketing', 'NE marketing & GI facilitation', 'active', NULL,
     'DoNER official scheme page', '2026-08-04',
     'Active — GI facilitation confirmed.',
     ARRAY['arunachal','assam','manipur','meghalaya','mizoram','nagaland','sikkim','tripura']),

    ('PMKISAN', 'PM-Kisan Samman Nidhi',
     'Ministry of Agriculture & Farmers'' Welfare', 'Department of Agriculture',
     'income_support', 'Income support of Rs.6,000 per year to farmers', 'active', NULL,
     'PM-KISAN official portal', '2026-08-04', 'Active — ongoing, no fixed deadline.', NULL),

    ('AIF', 'Agriculture Infrastructure Fund',
     'Ministry of Agriculture & Farmers'' Welfare', 'Department of Agriculture',
     'infrastructure', 'Financing facility for agricultural infrastructure', 'active',
     '2029-03-31', 'AIF official portal', '2026-08-04', 'Active.', NULL),

    ('NESIDS', 'North East Special Infrastructure Development Scheme',
     'Ministry of Development of North Eastern Region', NULL,
     'infrastructure', 'Infrastructure development in North East states', 'active',
     '2027-03-31', 'MDoNER official scheme page', '2026-08-04', 'Active.',
     ARRAY['arunachal','assam','manipur','meghalaya','mizoram','nagaland','sikkim','tripura']),

    ('MOVCDNER', 'Mission on Organic Value Chain Development for North East Region',
     'Ministry of Agriculture & Farmers'' Welfare', NULL,
     'organic', 'Organic value chain development for the NE region', 'active', NULL,
     'MOVCDNER official scheme page', '2026-08-04', 'Active.',
     ARRAY['arunachal','assam','manipur','meghalaya','mizoram','nagaland','sikkim','tripura']),

    ('PMFME', 'PM Formalization of Micro Food Processing Enterprises',
     'Ministry of Food Processing Industries', NULL,
     'processing', 'Formalization and credit-linked subsidy for micro food processors',
     'active', NULL, 'PM-FME official portal', '2026-08-04', 'Active.', NULL)
ON CONFLICT (code) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 2. MAP-PROTECTED CONTRACT OFFERS
--
-- Persistence for institutionalProcurementService.js's new POST
-- /contract-offers endpoint. A row here only exists for offers that already
-- cleared the farmer_contract_readiness.map_price_inr_per_kg floor check —
-- rejected offers are never written, matching "auto-rejected before they
-- reach you" (nothing to show the farmer because nothing reached them).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS contract_offers (
    id BIGSERIAL PRIMARY KEY,
    offer_number VARCHAR(60) NOT NULL UNIQUE,
    farmer_id UUID NOT NULL,
    crop VARCHAR(120) NOT NULL,

    -- Text, not a FK: buyer identities in this chain are a mix of users.id
    -- (UUID) and institutional actors with no single canonical id column yet.
    institution_id VARCHAR(80),

    offered_price_inr_per_kg NUMERIC(12,2) NOT NULL CHECK (offered_price_inr_per_kg > 0),
    quantity_kg NUMERIC(12,2) NOT NULL CHECK (quantity_kg > 0),

    delivery_schedule JSONB,
    payment_terms JSONB,
    special_conditions JSONB,

    status VARCHAR(40) NOT NULL DEFAULT 'pending_farmer_review'
        CHECK (status IN ('pending_farmer_review', 'accepted', 'declined', 'withdrawn')),

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_contract_offers_farmer ON contract_offers(farmer_id, crop);
CREATE INDEX IF NOT EXISTS idx_contract_offers_status ON contract_offers(status);

-- ---------------------------------------------------------------------------
-- 3. MILL CIRCUIT (mobile rice-mill scheduling)
--
-- Backs the new millCircuitService.js. Nothing in this schema tracked mobile
-- equipment circuits before this — grep -r "mill_circuit" backend/src/
-- database backend/src/services matched nothing prior to this migration.
-- The v44 prototype's Mill Circuit panel (docs/V44_ADDITIONAL_FEATURES_
-- EXTRACTION.md, feature 3) describes a real, unfilled gap: a trailer-mounted
-- mill that rotates through village clusters on a fixed weekly schedule
-- (explicitly "not a fixed hub"), which farmers book a slot against.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS mill_circuit_slots (
    id BIGSERIAL PRIMARY KEY,
    week_label VARCHAR(20) NOT NULL,
    cluster VARCHAR(120) NOT NULL,
    days VARCHAR(40) NOT NULL,
    capacity_kg NUMERIC(12,2),
    booked_kg NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (booked_kg >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open', 'waitlist', 'closed')),
    slot_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mill_slots_status ON mill_circuit_slots(status);

CREATE TABLE IF NOT EXISTS mill_circuit_bookings (
    id BIGSERIAL PRIMARY KEY,
    slot_id BIGINT NOT NULL REFERENCES mill_circuit_slots(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL,
    quantity_kg NUMERIC(12,2) NOT NULL CHECK (quantity_kg > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed'
        CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mill_bookings_farmer ON mill_circuit_bookings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_mill_bookings_slot ON mill_circuit_bookings(slot_id);

-- Seed: the prototype's example rotation (Ukhrul A / Senapati B / Mon A),
-- carried over the same way the schemes seed above mirrors the prototype's
-- SCHEMES array. Only seeds on a genuinely empty table so re-running this
-- file is idempotent and does not fight real bookings created later.
INSERT INTO mill_circuit_slots (week_label, cluster, days, status)
SELECT * FROM (VALUES
    ('Wk 28', 'Ukhrul A', 'Mon-Wed', 'open'),
    ('Wk 28', 'Senapati B', 'Thu-Sat', 'open'),
    ('Wk 29', 'Mon A', 'Mon-Wed', 'waitlist')
) AS seed(week_label, cluster, days, status)
WHERE NOT EXISTS (SELECT 1 FROM mill_circuit_slots);

-- ---------------------------------------------------------------------------
-- 4. FPO LEDGER
--
-- Backs the new fpo-ledger endpoints in millCircuitService.js. Per the
-- prototype's framing: "This ledger belongs to your FPO. It is not a bank
-- NPA file — banks see only what your FPO shares for a specific
-- application." farmer_id is the owning farmer; fpo_id identifies the FPO
-- that maintains the entry. No existing table covers this (grep -r
-- fpo_ledger backend/src/database matched nothing).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS fpo_ledger_entries (
    id BIGSERIAL PRIMARY KEY,
    fpo_id VARCHAR(80) NOT NULL,
    farmer_id UUID NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    description VARCHAR(240) NOT NULL,
    quantity_kg NUMERIC(12,2),
    amount_inr NUMERIC(12,2),
    entry_type VARCHAR(20) NOT NULL DEFAULT 'credit'
        CHECK (entry_type IN ('credit', 'debit')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fpo_ledger_farmer ON fpo_ledger_entries(farmer_id);
CREATE INDEX IF NOT EXISTS idx_fpo_ledger_fpo ON fpo_ledger_entries(fpo_id);

-- ---------------------------------------------------------------------------
-- 5. ENHANCED REGISTRATION — 3 missing stakeholder tracks
--
-- users.role is the `user_role` enum (000_base_schema.sql): admin, farmer,
-- fpo, corporate, consumer, logistics, horeca. The v44 prototype's 7 tracks
-- (docs/V44_ADDITIONAL_FEATURES_EXTRACTION.md, feature 6) name three with no
-- equivalent here: Food Processor, Retailer, Research Institution — the
-- other four (farmer, fpo, corporate, logistics) already exist as roles.
-- ADD VALUE IF NOT EXISTS is additive and safe to re-run. Per Postgres rules,
-- a value added by ALTER TYPE ... ADD VALUE cannot be used in the same
-- transaction that added it — irrelevant here since RegisterPage.jsx and
-- authService.js run as separate later requests, not inside this migration.
-- ---------------------------------------------------------------------------

ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'processor';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'retailer';
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'research';
