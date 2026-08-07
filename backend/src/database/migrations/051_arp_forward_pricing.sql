-- ============================================================================
-- 051_arp_forward_pricing.sql   (2026-08-05)
--
-- ADVANCE RATE PRICING — recovered from afrera_platform_v44.html
--
-- v44 carries an entire forward-pricing and downside-risk engine that exists
-- nowhere in this backend: yieldIndex, priceImpact, forwardCurve, basis,
-- valueFloorParticipation, commitAdvice, arpCompute. Verified absent — zero of
-- the six core functions appear in backend/src, and there is no forward_curve
-- or advance_rate table anywhere in the chain.
--
-- What it does: tells a farmer how much of an unharvested crop it is sensible
-- to pre-commit at a floor price, given weather-driven yield risk, price
-- volatility, shelf life, and how badly they need cash now.
--
-- WHY THE CROP CONSTANTS BECOME A TABLE
--
-- In v44 these live in a `const CROP = {...}` literal. That is fine for a
-- prototype and wrong for a platform, because the whole point of the model is
-- that its coefficients are ASSUMPTIONS that should improve as real district
-- data arrives. Constants in a JS file cannot be calibrated, cannot be audited,
-- and cannot record who changed optRainMm from 1800 to 1750 or why. As rows
-- they can.
--
-- THE PROPERTY THIS SCHEMA MUST NOT LOSE
--
-- v44 refuses to advise when the yield model is uncalibrated:
--
--   "Advising a farmer to commit a quantity on this basis would be guessing
--    with someone else's harvest."
--
-- That refusal is the most valuable line in the file. A forward commitment is
-- a real obligation against a harvest that does not exist yet; being confidently
-- wrong costs a farmer their season. So calibration state is a first-class
-- column here, not a flag bolted on later, and publications carry the
-- confidence that produced them.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. CROP PARAMETERS — the model's assumptions, as auditable data
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS arp_crop_parameters (
    id SERIAL PRIMARY KEY,
    crop_key VARCHAR(60) NOT NULL UNIQUE,
    display_name VARCHAR(120) NOT NULL,

    -- Agronomic optimum and tolerance. rain_tol_mm is the denominator of the
    -- rainfall deviation term, so it must never be zero.
    opt_rain_mm NUMERIC(8,1) NOT NULL CHECK (opt_rain_mm > 0),
    rain_tol_mm NUMERIC(8,1) NOT NULL CHECK (rain_tol_mm > 0),
    opt_temp_c NUMERIC(5,2) NOT NULL,
    heat_thresh_c NUMERIC(5,2) NOT NULL,
    base_yield_t_ha NUMERIC(8,2) NOT NULL CHECK (base_yield_t_ha > 0),

    -- Shelf life in months. 0.5 for Kaji Nemu is not a rounding artefact — it
    -- is a lemon with a two-week window, and it is the reason "hold" has to be
    -- a hard constraint rather than a weighted preference.
    storage_months NUMERIC(6,2) NOT NULL CHECK (storage_months >= 0),
    perishability NUMERIC(5,4) NOT NULL CHECK (perishability >= 0 AND perishability <= 1),
    vol_annual NUMERIC(5,4) NOT NULL CHECK (vol_annual > 0),
    season_peak_months INTEGER[] NOT NULL DEFAULT '{}',

    -- Provenance, using the same vocabulary as core/mcda.js. Every seeded row
    -- below is 'assumed' — these numbers came from a prototype, not from NE
    -- field trials, and labelling them 'real' would be the single most
    -- damaging thing this migration could do.
    parameter_provenance VARCHAR(20) NOT NULL DEFAULT 'assumed'
        CHECK (parameter_provenance IN ('real','estimated','assumed')),
    calibration_source TEXT,
    seasons_of_data INTEGER NOT NULL DEFAULT 0 CHECK (seasons_of_data >= 0),

    updated_by UUID,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- A parameter set cannot claim to be measured without saying what measured
    -- it. This is the constraint that stops an assumption quietly becoming a
    -- fact through an UPDATE.
    CONSTRAINT real_parameters_need_a_source CHECK (
      parameter_provenance <> 'real'
      OR (calibration_source IS NOT NULL AND seasons_of_data >= 3)
    )
);

-- ---------------------------------------------------------------------------
-- 2. DISTRICT CALIBRATION — is the model entitled to speak here?
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS arp_district_calibration (
    id SERIAL PRIMARY KEY,
    state VARCHAR(60) NOT NULL,
    district VARCHAR(80) NOT NULL,
    crop_key VARCHAR(60) NOT NULL REFERENCES arp_crop_parameters (crop_key) ON DELETE CASCADE,

    seasons_observed INTEGER NOT NULL DEFAULT 0 CHECK (seasons_observed >= 0),
    has_rainfall_history BOOLEAN NOT NULL DEFAULT FALSE,
    has_yield_history BOOLEAN NOT NULL DEFAULT FALSE,
    has_mandi_price_history BOOLEAN NOT NULL DEFAULT FALSE,
    observed_shrinkage_pct NUMERIC(5,2),

    -- Derived, never typed. v44 gates advice at confidence < 0.5; making this a
    -- generated column means nobody can grant a district confidence it has not
    -- earned by editing a number.
    confidence NUMERIC(4,3)
        GENERATED ALWAYS AS (
          LEAST(1.0,
            0.25 * LEAST(seasons_observed, 3) / 3.0
          + CASE WHEN has_rainfall_history    THEN 0.25 ELSE 0 END
          + CASE WHEN has_yield_history       THEN 0.30 ELSE 0 END
          + CASE WHEN has_mandi_price_history THEN 0.20 ELSE 0 END)
        ) STORED,

    last_calibrated_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (state, district, crop_key)
);

-- ---------------------------------------------------------------------------
-- 3. PUBLISHED ADVANCE RATES — what the platform actually told a farmer
--
-- Immutable by intent. A published advance rate is a commercial statement
-- someone may act on; if it can be edited afterwards there is no way to
-- reconstruct what they were shown. Supersede with a new row instead.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS arp_publications (
    id BIGSERIAL PRIMARY KEY,
    crop_key VARCHAR(60) NOT NULL REFERENCES arp_crop_parameters (crop_key),
    state VARCHAR(60),
    district VARCHAR(80),

    months_ahead NUMERIC(5,2) NOT NULL CHECK (months_ahead > 0),
    delivery_month DATE NOT NULL,
    method VARCHAR(20) NOT NULL DEFAULT 'ARP-v1',

    spot_per_kg NUMERIC(12,2) NOT NULL CHECK (spot_per_kg > 0),
    central_per_kg NUMERIC(12,2) NOT NULL,
    low_per_kg NUMERIC(12,2) NOT NULL,
    high_per_kg NUMERIC(12,2) NOT NULL,
    band_pct INTEGER NOT NULL DEFAULT 68,

    -- An advance is only safe against the LOW end of the band, discounted
    -- again. v44 uses low * 0.80. Generated so the discipline cannot be
    -- overridden by a caller in a hurry.
    advance_ceiling_per_kg NUMERIC(12,2)
        GENERATED ALWAYS AS (ROUND(low_per_kg * 0.80, 2)) STORED,

    yield_index NUMERIC(6,3) NOT NULL,
    confidence NUMERIC(4,3) NOT NULL CHECK (confidence BETWEEN 0 AND 1),
    calibrated BOOLEAN NOT NULL DEFAULT FALSE,
    warning TEXT,
    components JSONB,

    published_by UUID,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    superseded_by BIGINT REFERENCES arp_publications (id),

    -- The band must be ordered. A "low" above "high" would silently invert
    -- every downside calculation that reads it.
    CONSTRAINT band_is_ordered CHECK (low_per_kg <= central_per_kg AND central_per_kg <= high_per_kg),

    -- v44 refuses to advise below 0.5 confidence. Publishing an uncalibrated
    -- rate without the warning attached would strip the caveat off the number
    -- while keeping the number.
    CONSTRAINT uncalibrated_publication_must_warn CHECK (
      confidence >= 0.5 OR warning IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- 4. COMMITMENT ADVICE ISSUED — the decision, recorded for scoring
--
-- Written so the learning loop (990) can grade it later: the advice, and then
-- what the price actually did.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS arp_commit_advice (
    id BIGSERIAL PRIMARY KEY,
    publication_id BIGINT REFERENCES arp_publications (id),
    farmer_id UUID,
    crop_key VARCHAR(60) NOT NULL REFERENCES arp_crop_parameters (crop_key),

    qty_kg NUMERIC(14,2) NOT NULL CHECK (qty_kg > 0),
    floor_per_kg NUMERIC(12,2) NOT NULL CHECK (floor_per_kg > 0),
    participation_share NUMERIC(4,3) NOT NULL
        CHECK (participation_share >= 0 AND participation_share <= 1),
    cash_urgency NUMERIC(4,3) NOT NULL DEFAULT 0.5
        CHECK (cash_urgency >= 0 AND cash_urgency <= 1),
    months_ahead NUMERIC(5,2) NOT NULL CHECK (months_ahead > 0),

    -- NULL when the model declined to advise. That is a legitimate, recorded
    -- outcome, not a missing value.
    commit_pct INTEGER CHECK (commit_pct IS NULL OR (commit_pct BETWEEN 0 AND 100)),
    advice VARCHAR(80) NOT NULL,
    declined_reason TEXT,
    reasoning JSONB,
    max_hold_pct INTEGER,
    option_value_per_kg NUMERIC(12,4),
    farmer_expected_per_kg NUMERIC(12,2),

    confidence NUMERIC(4,3) NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- Filled in later by the resolver, so the advice can be scored.
    realised_price_per_kg NUMERIC(12,2),
    resolved_at TIMESTAMP,

    -- Declining must say why. "NO RECOMMENDATION" with no reason is worse than
    -- useless: the farmer learns nothing and cannot tell whether to wait for
    -- calibration or seek advice elsewhere.
    CONSTRAINT declining_needs_a_reason CHECK (
      commit_pct IS NOT NULL
      OR (declined_reason IS NOT NULL AND length(trim(declined_reason)) > 0)
    )
);

-- ---------------------------------------------------------------------------
-- 5. BASIS OBSERVATIONS — where the money goes between farmgate and NCR
--
-- v44's basis() decomposes the farmgate-to-delivered spread into freight,
-- expected loss, and an unexplained residual. The residual is the interesting
-- number: it is either a quality premium or, in its own words, "value being
-- captured somewhere the farmer cannot see."
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS arp_basis_observations (
    id BIGSERIAL PRIMARY KEY,
    crop_key VARCHAR(60) NOT NULL REFERENCES arp_crop_parameters (crop_key),
    lane VARCHAR(120),
    observed_on DATE NOT NULL DEFAULT CURRENT_DATE,

    farmgate_per_kg NUMERIC(12,2) NOT NULL CHECK (farmgate_per_kg > 0),
    ncr_delivered_per_kg NUMERIC(12,2) NOT NULL CHECK (ncr_delivered_per_kg > 0),
    freight_per_kg NUMERIC(12,2) NOT NULL CHECK (freight_per_kg >= 0),
    expected_loss_pct NUMERIC(5,2) NOT NULL CHECK (expected_loss_pct >= 0 AND expected_loss_pct <= 100),

    gross_basis NUMERIC(12,2)
        GENERATED ALWAYS AS (ncr_delivered_per_kg - farmgate_per_kg) STORED,
    explained_by_freight_and_loss NUMERIC(12,2)
        GENERATED ALWAYS AS (freight_per_kg + ncr_delivered_per_kg * (expected_loss_pct / 100.0)) STORED,
    unexplained_residual NUMERIC(12,2)
        GENERATED ALWAYS AS (
          (ncr_delivered_per_kg - farmgate_per_kg)
          - (freight_per_kg + ncr_delivered_per_kg * (expected_loss_pct / 100.0))
        ) STORED,

    data_provenance VARCHAR(20) NOT NULL DEFAULT 'estimated'
        CHECK (data_provenance IN ('real','estimated','assumed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------------------------------
-- SEED — v44's four NE crops, every one flagged 'assumed'
--
-- These coefficients came from a prototype HTML file. They are plausible and
-- they are not measured. Marking them 'assumed' means the MCDA layer weights
-- them at 0.4 and the confidence that reaches a farmer reflects that.
-- ---------------------------------------------------------------------------

INSERT INTO arp_crop_parameters
 (crop_key, display_name, opt_rain_mm, rain_tol_mm, opt_temp_c, heat_thresh_c,
  base_yield_t_ha, storage_months, perishability, vol_annual, season_peak_months,
  parameter_provenance, calibration_source)
VALUES
 ('lakadong_turmeric','Lakadong Turmeric',1800,450,26,34,22,12,0.02,0.28,'{1,2,3}',
  'assumed','Prototype coefficients from afrera_platform_v44.html. Not field-calibrated.'),
 ('chakhao_rice','Chak-Hao Black Rice',1500,400,28,36,2.6,6,0.04,0.22,'{11,12,1}',
  'assumed','Prototype coefficients from afrera_platform_v44.html. Not field-calibrated.'),
 ('naga_mircha','Naga Mircha',2000,500,27,35,1.4,8,0.06,0.41,'{8,9,10}',
  'assumed','Prototype coefficients from afrera_platform_v44.html. Not field-calibrated.'),
 ('kaji_nemu','Kaji Nemu',2200,600,25,33,14,0.5,0.22,0.55,'{6,7,8}',
  'assumed','Prototype coefficients from afrera_platform_v44.html. Not field-calibrated. '
          || 'storage_months 0.5 is deliberate — this is a two-week lemon.')
ON CONFLICT (crop_key) DO NOTHING;

-- ---------------------------------------------------------------------------
-- VIEWS
-- ---------------------------------------------------------------------------

-- Where is the model entitled to speak? Anything below 0.5 must not produce a
-- commitment recommendation.
CREATE OR REPLACE VIEW v_arp_advisable AS
SELECT
    c.state, c.district, c.crop_key, p.display_name,
    c.seasons_observed, c.confidence,
    (c.confidence >= 0.5) AS may_advise,
    CASE
      WHEN c.confidence >= 0.8 THEN 'calibrated'
      WHEN c.confidence >= 0.5 THEN 'usable with caveats'
      ELSE 'must decline — advising here would be guessing with someone else''s harvest'
    END AS standing
FROM arp_district_calibration c
JOIN arp_crop_parameters p ON p.crop_key = c.crop_key;

-- Lanes where the spread is not explained by freight and loss.
CREATE OR REPLACE VIEW v_arp_unexplained_basis AS
SELECT
    crop_key, lane, observed_on,
    farmgate_per_kg, ncr_delivered_per_kg, gross_basis,
    explained_by_freight_and_loss, unexplained_residual,
    ROUND(unexplained_residual / NULLIF(ncr_delivered_per_kg,0) * 100, 2) AS residual_pct_of_delivered,
    CASE
      WHEN ABS(unexplained_residual) < 0.1 * ncr_delivered_per_kg
        THEN 'basis fully explained by freight and loss'
      WHEN unexplained_residual > 0
        THEN 'margin beyond freight and loss — quality premium, or value the farmer cannot see'
      ELSE 'lane running below cost'
    END AS verdict,
    data_provenance
FROM arp_basis_observations
ORDER BY ABS(unexplained_residual) DESC;

CREATE INDEX IF NOT EXISTS idx_arp_pub_crop ON arp_publications (crop_key, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_arp_pub_live ON arp_publications (crop_key) WHERE superseded_by IS NULL;
CREATE INDEX IF NOT EXISTS idx_arp_advice_farmer ON arp_commit_advice (farmer_id, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_arp_advice_unresolved ON arp_commit_advice (issued_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_arp_calib_lookup ON arp_district_calibration (state, district, crop_key);
CREATE INDEX IF NOT EXISTS idx_arp_basis_crop ON arp_basis_observations (crop_key, observed_on DESC);
