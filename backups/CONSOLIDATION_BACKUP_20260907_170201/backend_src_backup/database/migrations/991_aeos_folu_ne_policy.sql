-- ============================================================================
-- 991_aeos_folu_ne_policy.sql   (2026-08-04)
--
-- Three things in one migration because they share the same root cause:
-- the platform could measure what a farmer SPENDS and what they GROW, but not
-- what they EARN or what their land DOES.
--
-- 1. AEOS TIER-1 — the revenue side of the farmer ledger
--    Audited 2026-08-04 against 51 migrations. Present: cost ledger
--    (farm_consumables), crop season, input purchases, subsidy eligibility.
--    ABSENT: revenue ledger, yield actuals, cash flow, price realisation.
--
--    The Farmer Value Engine in the AEOS brief cannot exist without these.
--    Half a P&L cannot produce a profit figure, and an FVI computed on cost
--    alone would be a confident number that means nothing — the farmer would
--    act on it.
--
-- 2. FOLU (Forest, Land Use) — 1 service mention, 0 tables, 0 UI.
--    Genuinely absent.
--
-- 3. NE ORGANIC POLICY — 0 everywhere.
--    NOTE: organic TRACKING is NOT missing. 20 organic_* tables already exist
--    (plots, harvests, chain of custody, audits, fraud alerts). What is absent
--    is the POLICY layer above them: which NE scheme a farm is enrolled in,
--    what it entitles them to, and whether they are compliant.
--
-- Plus 5 tables recovered from code embedded in the project chat history
-- (974,060 chars scanned; 26 CREATE TABLE statements found, 21 already existed).
--
-- Numbered 991 so it runs before 992 (v42 recovery) and 993 (enterprise control).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- PART 1 — AEOS TIER 1: the revenue side of the ledger
-- ---------------------------------------------------------------------------

-- What was actually harvested, as opposed to what was planned. Without this
-- there is no yield, and without yield there is no productivity measure.
CREATE TABLE IF NOT EXISTS yield_actuals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
    season VARCHAR(30),
    year SMALLINT CHECK (year BETWEEN 2000 AND 2100),
    area_planted_ha NUMERIC(12,4) CHECK (area_planted_ha > 0),
    quantity_harvested_kg NUMERIC(14,3) NOT NULL CHECK (quantity_harvested_kg >= 0),
    -- Derived so it can never disagree with its inputs.
    yield_kg_per_ha NUMERIC(14,3)
        GENERATED ALWAYS AS (
          CASE WHEN area_planted_ha > 0
               THEN quantity_harvested_kg / area_planted_ha END
        ) STORED,
    -- Post-harvest loss is a first-class figure here, not a rounding error.
    -- It is the single largest recoverable cost in NE horticulture and the
    -- platform's cold-chain case rests on being able to show it fell.
    quantity_lost_kg NUMERIC(14,3) DEFAULT 0 CHECK (quantity_lost_kg >= 0),
    loss_reason VARCHAR(60),
    -- How the figure was obtained. An FVI built on 'farmer_reported' must not
    -- present with the same confidence as one built on 'weighbridge'.
    measurement_basis VARCHAR(20) NOT NULL DEFAULT 'farmer_reported'
        CHECK (measurement_basis IN ('weighbridge','buyer_receipt','farmer_reported','estimated')),
    harvested_on DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Every rupee that actually reached the farmer, and what it was for.
CREATE TABLE IF NOT EXISTS farmer_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    -- The AEOS brief lists 12 revenue sources. Recording the source is what
    -- lets the Revenue Engine tell a farmer which of them actually pays.
    revenue_source VARCHAR(30) NOT NULL
        CHECK (revenue_source IN ('crop','dairy','livestock','fisheries','processing',
               'compost','custom_hiring','equipment_rental','solar','carbon_credit',
               'export','contract_farming','subsidy','other')),
    crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
    yield_actual_id UUID REFERENCES yield_actuals(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES buyers(id) ON DELETE SET NULL,
    quantity_kg NUMERIC(14,3) CHECK (quantity_kg IS NULL OR quantity_kg > 0),
    gross_amount NUMERIC(20,4) NOT NULL CHECK (gross_amount >= 0),
    -- Deductions are itemised because "why did I get less than the rate"
    -- is the question that destroys trust in an agri platform.
    deduction_commission NUMERIC(20,4) DEFAULT 0 CHECK (deduction_commission >= 0),
    deduction_transport NUMERIC(20,4) DEFAULT 0 CHECK (deduction_transport >= 0),
    deduction_grading NUMERIC(20,4) DEFAULT 0 CHECK (deduction_grading >= 0),
    deduction_other NUMERIC(20,4) DEFAULT 0 CHECK (deduction_other >= 0),
    net_amount NUMERIC(20,4)
        GENERATED ALWAYS AS (
          gross_amount - COALESCE(deduction_commission,0) - COALESCE(deduction_transport,0)
          - COALESCE(deduction_grading,0) - COALESCE(deduction_other,0)
        ) STORED,
    -- Realised price per kg. This is what gets compared to the mandi
    -- reference price to substantiate "fair price" with evidence.
    price_per_kg NUMERIC(14,4)
        GENERATED ALWAYS AS (
          CASE WHEN quantity_kg > 0 THEN gross_amount / quantity_kg END
        ) STORED,
    season VARCHAR(30),
    year SMALLINT,
    received_on DATE NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'received'
        CHECK (payment_status IN ('pending','partial','received','disputed','written_off')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cash flow is the AEOS objective most farmers feel first. A profitable
-- season with money arriving after the next sowing is still a crisis.
CREATE TABLE IF NOT EXISTS farmer_cash_flow (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    flow_date DATE NOT NULL,
    direction VARCHAR(10) NOT NULL CHECK (direction IN ('inflow','outflow')),
    category VARCHAR(40) NOT NULL,
    amount NUMERIC(20,4) NOT NULL CHECK (amount > 0),
    -- Distinguishes what happened from what is expected. Mixing the two is
    -- how a forecast quietly becomes a claim about the present.
    is_actual BOOLEAN NOT NULL DEFAULT TRUE,
    confidence VARCHAR(20) CHECK (confidence IN ('real','estimated','assumed')),
    reference_type VARCHAR(40),
    reference_id UUID,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- A projected row must state how confident the projection is.
    CONSTRAINT projection_needs_confidence
        CHECK (is_actual = TRUE OR confidence IS NOT NULL)
);

-- The Farmer Value Index itself. Stored WITH its inputs and provenance so a
-- farmer (or an auditor) can see how the number was reached.
CREATE TABLE IF NOT EXISTS farmer_value_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    season VARCHAR(30) NOT NULL,
    year SMALLINT NOT NULL,

    total_cost NUMERIC(20,4) DEFAULT 0,
    total_revenue NUMERIC(20,4) DEFAULT 0,
    net_margin NUMERIC(20,4)
        GENERATED ALWAYS AS (COALESCE(total_revenue,0) - COALESCE(total_cost,0)) STORED,
    margin_pct NUMERIC(8,4)
        GENERATED ALWAYS AS (
          CASE WHEN total_revenue > 0
               THEN ((total_revenue - COALESCE(total_cost,0)) / total_revenue) * 100 END
        ) STORED,

    -- The opportunity side of the brief: what the farmer could still capture.
    potential_savings NUMERIC(20,4) DEFAULT 0,
    unclaimed_subsidy NUMERIC(20,4) DEFAULT 0,
    foregone_revenue NUMERIC(20,4) DEFAULT 0,

    fvi_score NUMERIC(6,2) CHECK (fvi_score IS NULL OR fvi_score BETWEEN 0 AND 100),

    -- NON-NEGOTIABLE. The MCDA layer already derives confidence from data
    -- provenance rather than asserting it; the FVI inherits that discipline.
    -- An index computed from assumed inputs must never present as measured —
    -- a farmer will plant, borrow or delay a sale on this number.
    data_confidence NUMERIC(5,2) NOT NULL CHECK (data_confidence BETWEEN 0 AND 100),
    inputs_breakdown JSONB NOT NULL,
    computed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (farmer_id, season, year)
);

-- ---------------------------------------------------------------------------
-- PART 2 — FOLU (Forest & Land Use) reporting
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS folu_land_parcels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_code VARCHAR(50) UNIQUE NOT NULL,
    farmer_id UUID REFERENCES farmers(id) ON DELETE SET NULL,
    area_ha NUMERIC(12,4) NOT NULL CHECK (area_ha > 0),
    land_use_class VARCHAR(40) NOT NULL
        CHECK (land_use_class IN ('cropland','forest','agroforestry','grassland',
               'wetland','settlement','fallow','plantation','shifting_cultivation')),
    previous_land_use VARCHAR(40),
    -- Jhum / shifting cultivation is central to NE land use and cannot be
    -- modelled as simple cropland without misrepresenting the practice.
    is_jhum BOOLEAN DEFAULT FALSE,
    jhum_cycle_years SMALLINT CHECK (jhum_cycle_years IS NULL OR jhum_cycle_years > 0),
    state VARCHAR(60),
    district VARCHAR(60),
    village VARCHAR(120),
    latitude NUMERIC(10,7) CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude NUMERIC(11,7) CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    surveyed_on DATE,
    survey_method VARCHAR(30)
        CHECK (survey_method IS NULL OR survey_method IN ('gps','satellite','drone','declared','revenue_record')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- A land-use CHANGE event. This is the unit FOLU reporting actually needs —
-- not the current state, but the transition and when it happened.
CREATE TABLE IF NOT EXISTS folu_land_use_change (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES folu_land_parcels(id) ON DELETE CASCADE,
    from_class VARCHAR(40) NOT NULL,
    to_class VARCHAR(40) NOT NULL,
    area_changed_ha NUMERIC(12,4) NOT NULL CHECK (area_changed_ha > 0),
    change_date DATE NOT NULL,
    -- Deforestation is the transition that carries market and legal
    -- consequence (EUDR, buyer due diligence). Derived, not typed by hand.
    is_deforestation BOOLEAN
        GENERATED ALWAYS AS (from_class = 'forest' AND to_class <> 'forest') STORED,
    driver VARCHAR(60),
    evidence_source VARCHAR(30)
        CHECK (evidence_source IS NULL OR evidence_source IN ('satellite','drone','field_survey','declared')),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT change_is_a_change CHECK (from_class <> to_class)
);

CREATE TABLE IF NOT EXISTS folu_carbon_estimates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parcel_id UUID NOT NULL REFERENCES folu_land_parcels(id) ON DELETE CASCADE,
    assessment_year SMALLINT NOT NULL,
    above_ground_biomass_tc NUMERIC(14,4),
    soil_organic_carbon_tc NUMERIC(14,4),
    total_stock_tco2e NUMERIC(14,4),
    net_change_tco2e NUMERIC(14,4),
    -- IPCC tier states how good the estimate is. Tier 1 is a default value;
    -- Tier 3 is measured. Reporting a Tier 1 number as if measured is how
    -- carbon claims get challenged.
    ipcc_tier SMALLINT CHECK (ipcc_tier IN (1,2,3)),
    methodology VARCHAR(120),
    UNIQUE (parcel_id, assessment_year)
);

-- ---------------------------------------------------------------------------
-- PART 3 — NORTHEAST ORGANIC POLICY LAYER
--
-- Organic TRACKING already exists (20 organic_* tables). What was missing is
-- the policy layer: which scheme a farm is enrolled in, what that entitles
-- them to, and whether they still qualify.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS ne_organic_schemes (
    id SERIAL PRIMARY KEY,
    scheme_code VARCHAR(40) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    authority VARCHAR(160),
    applies_to_states TEXT[] NOT NULL,
    certification_standard VARCHAR(60)
        CHECK (certification_standard IS NULL OR certification_standard IN ('NPOP','PGS-India','NOP','EU-Organic','JAS')),
    conversion_period_months SMALLINT CHECK (conversion_period_months IS NULL OR conversion_period_months >= 0),
    -- Money the farmer can actually receive. Without these the scheme is a
    -- policy document rather than an entitlement anyone can claim.
    support_per_ha NUMERIC(14,2) CHECK (support_per_ha IS NULL OR support_per_ha >= 0),
    max_area_ha NUMERIC(10,2),
    min_group_size SMALLINT,
    valid_from DATE,
    valid_to DATE,
    guidelines_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ne_organic_enrolment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id INTEGER NOT NULL REFERENCES ne_organic_schemes(id) ON DELETE RESTRICT,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    parcel_id UUID REFERENCES folu_land_parcels(id) ON DELETE SET NULL,
    enrolled_on DATE NOT NULL,
    conversion_started_on DATE,
    -- Conversion status decides whether produce may be sold as organic, as
    -- "in-conversion", or as conventional. Selling in-conversion produce as
    -- fully organic is the most common organic fraud, and it is the buyer
    -- who bears the certification loss.
    conversion_status VARCHAR(20) NOT NULL DEFAULT 'in_conversion'
        CHECK (conversion_status IN ('applied','in_conversion','certified','suspended','withdrawn','expired')),
    certificate_number VARCHAR(80),
    certified_on DATE,
    certificate_valid_to DATE,
    area_ha NUMERIC(12,4) CHECK (area_ha > 0),
    support_claimed NUMERIC(14,2) DEFAULT 0 CHECK (support_claimed >= 0),
    last_inspection_on DATE,
    next_inspection_due DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT certified_needs_certificate
        CHECK (conversion_status <> 'certified'
               OR (certificate_number IS NOT NULL AND certified_on IS NOT NULL))
);

-- ---------------------------------------------------------------------------
-- PART 4 — recovered from code embedded in the project chat history
--
-- 26 CREATE TABLE statements were found across 974,060 chars of chat. 21 of
-- them already exist in this schema. These 5 did not.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS farmer_listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
    title VARCHAR(200) NOT NULL,
    quantity_kg NUMERIC(14,3) NOT NULL CHECK (quantity_kg > 0),
    asking_price_per_kg NUMERIC(14,4) CHECK (asking_price_per_kg IS NULL OR asking_price_per_kg > 0),
    -- The MAP floor already exists as a business rule elsewhere; recording it
    -- on the listing makes a below-floor sale visible rather than silent.
    floor_price_per_kg NUMERIC(14,4),
    available_from DATE,
    available_to DATE,
    is_organic BOOLEAN DEFAULT FALSE,
    organic_enrolment_id UUID REFERENCES ne_organic_enrolment(id) ON DELETE SET NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('draft','open','reserved','sold','expired','withdrawn')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Claiming organic on a listing must point at a real enrolment.
    CONSTRAINT organic_claim_needs_enrolment
        CHECK (is_organic = FALSE OR organic_enrolment_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS driver_location (
    id BIGSERIAL PRIMARY KEY,
    driver_id UUID,
    vehicle_number VARCHAR(30),
    shipment_id UUID,
    latitude NUMERIC(10,7) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(11,7) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    speed_kmph NUMERIC(6,2) CHECK (speed_kmph IS NULL OR speed_kmph >= 0),
    heading_deg NUMERIC(5,2) CHECK (heading_deg IS NULL OR heading_deg BETWEEN 0 AND 360),
    recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facility_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_code VARCHAR(40) UNIQUE NOT NULL,
    facility_type VARCHAR(40) NOT NULL
        CHECK (facility_type IN ('cold_storage','warehouse','processing','dryer','grading','packhouse','equipment')),
    facility_id UUID,
    booked_by UUID REFERENCES farmers(id) ON DELETE SET NULL,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    quantity_kg NUMERIC(14,3) CHECK (quantity_kg IS NULL OR quantity_kg > 0),
    rate_amount NUMERIC(14,4) CHECK (rate_amount IS NULL OR rate_amount >= 0),
    status VARCHAR(20) NOT NULL DEFAULT 'requested'
        CHECK (status IN ('requested','confirmed','in_use','completed','cancelled','no_show')),
    cancellation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT booking_window_valid CHECK (ends_at > starts_at),
    CONSTRAINT cancel_needs_reason
        CHECK (status <> 'cancelled' OR (cancellation_reason IS NOT NULL AND length(trim(cancellation_reason)) > 0))
);

CREATE TABLE IF NOT EXISTS media_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_type VARCHAR(40) NOT NULL,
    owner_id UUID,
    media_type VARCHAR(20) NOT NULL
        CHECK (media_type IN ('image','video','audio','document','geotagged_photo')),
    url TEXT NOT NULL,
    mime_type VARCHAR(80),
    size_bytes BIGINT CHECK (size_bytes IS NULL OR size_bytes >= 0),
    -- Geotag + capture time is what makes a photo usable as evidence for a
    -- claim, an inspection or a land-use change. Without them it is decoration.
    latitude NUMERIC(10,7),
    longitude NUMERIC(11,7),
    captured_at TIMESTAMP,
    checksum VARCHAR(128),
    uploaded_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_code VARCHAR(40) UNIQUE NOT NULL,
    raised_by UUID,
    raised_by_role VARCHAR(40),
    category VARCHAR(40) NOT NULL,
    subject VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'medium'
        CHECK (severity IN ('low','medium','high','critical')),
    status VARCHAR(20) NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','acknowledged','investigating','resolved','closed','rejected')),
    assigned_to UUID,
    resolution TEXT,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Same discipline as everywhere else: an outcome must carry its reason.
    CONSTRAINT resolution_needs_text
        CHECK (status NOT IN ('resolved','rejected')
               OR (resolution IS NOT NULL AND length(trim(resolution)) > 0))
);

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------

-- The farmer P&L that could not previously be produced.
CREATE OR REPLACE VIEW v_farmer_season_pl AS
SELECT
    f.id AS farmer_id,
    r.season,
    r.year,
    SUM(r.net_amount)                            AS revenue,
    COUNT(DISTINCT r.id)                         AS sale_count,
    AVG(r.price_per_kg)                          AS avg_price_per_kg,
    SUM(r.quantity_kg)                           AS quantity_sold_kg,
    -- Revenue only. Cost lives in farm_consumables and is joined by the
    -- Farmer Value Engine, which also attaches the provenance weighting.
    MIN(r.received_on)                           AS first_receipt,
    MAX(r.received_on)                           AS last_receipt
FROM farmers f
JOIN farmer_revenue r ON r.farmer_id = f.id
WHERE r.payment_status IN ('received','partial')
GROUP BY f.id, r.season, r.year;

-- Deforestation exposure, for buyer due diligence and EUDR-style questions.
CREATE OR REPLACE VIEW v_folu_deforestation_risk AS
SELECT
    p.state,
    p.district,
    COUNT(*) FILTER (WHERE c.is_deforestation)            AS deforestation_events,
    SUM(c.area_changed_ha) FILTER (WHERE c.is_deforestation) AS area_deforested_ha,
    COUNT(*) FILTER (WHERE c.is_deforestation AND NOT c.verified) AS unverified_events,
    MAX(c.change_date) FILTER (WHERE c.is_deforestation)  AS latest_event
FROM folu_land_parcels p
JOIN folu_land_use_change c ON c.parcel_id = p.id
GROUP BY p.state, p.district;

-- Organic enrolments needing attention: expiring certificates, overdue
-- inspections, and produce still in conversion.
CREATE OR REPLACE VIEW v_ne_organic_status AS
SELECT
    e.id,
    e.farmer_id,
    s.scheme_code,
    s.name AS scheme_name,
    e.conversion_status,
    e.area_ha,
    e.certificate_valid_to,
    e.next_inspection_due,
    (e.certificate_valid_to IS NOT NULL AND e.certificate_valid_to < CURRENT_DATE + 90) AS certificate_expiring,
    (e.next_inspection_due IS NOT NULL AND e.next_inspection_due < CURRENT_DATE)        AS inspection_overdue,
    -- Entitlement the farmer has not yet drawn.
    GREATEST(COALESCE(s.support_per_ha,0) * COALESCE(e.area_ha,0) - COALESCE(e.support_claimed,0), 0)
        AS unclaimed_support
FROM ne_organic_enrolment e
JOIN ne_organic_schemes s ON s.id = e.scheme_id
WHERE e.conversion_status NOT IN ('withdrawn','expired');

-- ---------------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_yield_actuals_farmer ON yield_actuals (farmer_id, year, season);
CREATE INDEX IF NOT EXISTS idx_yield_actuals_crop ON yield_actuals (crop_id);
CREATE INDEX IF NOT EXISTS idx_farmer_revenue_farmer ON farmer_revenue (farmer_id, year, season);
CREATE INDEX IF NOT EXISTS idx_farmer_revenue_source ON farmer_revenue (revenue_source);
CREATE INDEX IF NOT EXISTS idx_farmer_revenue_buyer ON farmer_revenue (buyer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_revenue_date ON farmer_revenue (received_on);
CREATE INDEX IF NOT EXISTS idx_cash_flow_farmer ON farmer_cash_flow (farmer_id, flow_date);
CREATE INDEX IF NOT EXISTS idx_cash_flow_actual ON farmer_cash_flow (is_actual);
CREATE INDEX IF NOT EXISTS idx_fvi_farmer ON farmer_value_index (farmer_id, year);
CREATE INDEX IF NOT EXISTS idx_folu_parcel_farmer ON folu_land_parcels (farmer_id);
CREATE INDEX IF NOT EXISTS idx_folu_parcel_geo ON folu_land_parcels (state, district);
CREATE INDEX IF NOT EXISTS idx_folu_change_parcel ON folu_land_use_change (parcel_id);
CREATE INDEX IF NOT EXISTS idx_folu_change_defor ON folu_land_use_change (is_deforestation, change_date);
CREATE INDEX IF NOT EXISTS idx_folu_carbon_parcel ON folu_carbon_estimates (parcel_id);
CREATE INDEX IF NOT EXISTS idx_ne_organic_farmer ON ne_organic_enrolment (farmer_id);
CREATE INDEX IF NOT EXISTS idx_ne_organic_status ON ne_organic_enrolment (conversion_status);
CREATE INDEX IF NOT EXISTS idx_ne_organic_inspection ON ne_organic_enrolment (next_inspection_due);
CREATE INDEX IF NOT EXISTS idx_listings_farmer ON farmer_listings (farmer_id, status);
CREATE INDEX IF NOT EXISTS idx_listings_organic ON farmer_listings (is_organic);
CREATE INDEX IF NOT EXISTS idx_driver_location_shipment ON driver_location (shipment_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_driver_location_time ON driver_location (recorded_at);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_window ON facility_bookings (facility_type, starts_at, ends_at);
CREATE INDEX IF NOT EXISTS idx_facility_bookings_status ON facility_bookings (status);
CREATE INDEX IF NOT EXISTS idx_media_owner ON media_assets (owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints (status, severity);

-- ---------------------------------------------------------------------------
-- SEED — NE organic schemes (real programmes; figures to be confirmed against
-- current guidelines before any entitlement is shown to a farmer)
-- ---------------------------------------------------------------------------

INSERT INTO ne_organic_schemes
  (scheme_code, name, authority, applies_to_states, certification_standard,
   conversion_period_months, min_group_size, is_active)
VALUES
  ('MOVCDNER', 'Mission Organic Value Chain Development for North Eastern Region',
   'Ministry of Agriculture & Farmers Welfare',
   ARRAY['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura'],
   'NPOP', 36, 50, TRUE),
  ('PKVY', 'Paramparagat Krishi Vikas Yojana',
   'Ministry of Agriculture & Farmers Welfare',
   ARRAY['Arunachal Pradesh','Assam','Manipur','Meghalaya','Mizoram','Nagaland','Sikkim','Tripura'],
   'PGS-India', 36, 20, TRUE),
  ('SIKKIM-ORGANIC', 'Sikkim Organic Mission',
   'Government of Sikkim', ARRAY['Sikkim'], 'NPOP', 36, NULL, TRUE)
ON CONFLICT (scheme_code) DO NOTHING;
