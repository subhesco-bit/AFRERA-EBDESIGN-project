-- ============================================================================
-- 057_climate_weather_d14.sql   (2026-08-05)
--
-- DOMAIN D14 — Climate & Weather. Modules M081–M090.
--
-- The master index found this domain completely empty: no weather service, no
-- route, no table, no component anywhere in the repo — only incidental
-- mentions of the word inside other files. Ten catalogued modules, zero
-- implementation.
--
-- It is also the domain the rest of the platform most depends on. The ARP
-- yield model (051) takes rainfall, mean temperature and heat-stress days as
-- its primary inputs and currently receives them from a hard-coded fallback
-- constant. Every forward price the platform publishes rests on weather it
-- has never actually looked up.
--
--   M081 Weather Monitoring        M086 Flood Monitoring
--   M082 Weather Forecasting       M087 Pest Forecasting
--   M083 Climate Advisory          M088 Disease Forecasting
--   M084 Disaster Alerts           M089 Climate Risk Assessment
--   M085 Drought Monitoring        M090 Agro-Meteorology
-- ============================================================================

-- ---------------------------------------------------------------------------
-- M081 · WEATHER STATIONS AND OBSERVATIONS
--
-- Observations are separated from forecasts throughout this migration. They
-- are different epistemic objects: one is what happened, the other is what
-- somebody thinks will happen. Storing them in one table with a flag is how a
-- forecast ends up quoted as a measurement.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS weather_stations (
    id SERIAL PRIMARY KEY,
    station_code VARCHAR(40) NOT NULL UNIQUE,
    station_name VARCHAR(160) NOT NULL,
    state VARCHAR(60),
    district VARCHAR(80),
    block VARCHAR(80),

    latitude NUMERIC(9,6) NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude NUMERIC(9,6) NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    elevation_m NUMERIC(8,2),

    station_type VARCHAR(20) NOT NULL DEFAULT 'imd'
        CHECK (station_type IN ('imd','awse','private','farm_sensor','satellite_derived','manual')),
    operator VARCHAR(120),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    commissioned_on DATE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    -- (0,0) is open ocean off West Africa. It is the default a form leaves
    -- behind when nobody fills the coordinates in, and it has passed for a
    -- real location in this codebase before.
    CONSTRAINT station_not_null_island CHECK (NOT (latitude = 0 AND longitude = 0))
);

CREATE TABLE IF NOT EXISTS weather_observations (
    id BIGSERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES weather_stations (id),
    observed_on DATE NOT NULL,
    observed_at TIMESTAMP,

    rainfall_mm NUMERIC(8,2) CHECK (rainfall_mm IS NULL OR rainfall_mm >= 0),
    temp_max_c NUMERIC(5,2),
    temp_min_c NUMERIC(5,2),
    temp_mean_c NUMERIC(5,2),
    humidity_pct NUMERIC(5,2) CHECK (humidity_pct IS NULL OR (humidity_pct BETWEEN 0 AND 100)),
    wind_speed_kmph NUMERIC(6,2) CHECK (wind_speed_kmph IS NULL OR wind_speed_kmph >= 0),
    wind_direction_deg NUMERIC(5,1) CHECK (wind_direction_deg IS NULL OR (wind_direction_deg BETWEEN 0 AND 360)),
    solar_radiation_mj NUMERIC(8,2),

    source VARCHAR(20) NOT NULL DEFAULT 'imd'
        CHECK (source IN ('imd','isro','openweather','farm_sensor','manual','interpolated')),
    quality_flag VARCHAR(20) NOT NULL DEFAULT 'raw'
        CHECK (quality_flag IN ('raw','validated','suspect','interpolated','rejected')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (station_id, observed_on),

    -- A minimum above the maximum is a transposed pair, and it silently
    -- corrupts every heat-stress and growing-degree-day calculation downstream.
    CONSTRAINT temp_min_below_max CHECK (
      temp_min_c IS NULL OR temp_max_c IS NULL OR temp_min_c <= temp_max_c
    ),
    CONSTRAINT mean_inside_range CHECK (
      temp_mean_c IS NULL OR temp_min_c IS NULL OR temp_max_c IS NULL
      OR (temp_mean_c BETWEEN temp_min_c AND temp_max_c)
    ),
    -- Interpolated data must say so. Filling a gap is legitimate; presenting
    -- the fill as an observation is not.
    CONSTRAINT interpolated_is_flagged CHECK (
      source <> 'interpolated' OR quality_flag = 'interpolated'
    )
);

-- ---------------------------------------------------------------------------
-- M082 · FORECASTS, scored after the fact
--
-- Every forecast carries the horizon it was issued at, because a 1-day and a
-- 10-day forecast being wrong by the same margin are not the same failure.
-- `actual_*` columns are filled in later so the learning loop (990) can score
-- the provider rather than trusting its own confidence claim.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS weather_forecasts (
    id BIGSERIAL PRIMARY KEY,
    station_id INTEGER REFERENCES weather_stations (id),
    district VARCHAR(80),
    state VARCHAR(60),

    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    valid_for DATE NOT NULL,
    horizon_days INTEGER NOT NULL CHECK (horizon_days >= 0 AND horizon_days <= 30),

    rainfall_mm NUMERIC(8,2) CHECK (rainfall_mm IS NULL OR rainfall_mm >= 0),
    rainfall_probability_pct NUMERIC(5,2)
        CHECK (rainfall_probability_pct IS NULL OR (rainfall_probability_pct BETWEEN 0 AND 100)),
    temp_max_c NUMERIC(5,2),
    temp_min_c NUMERIC(5,2),
    conditions VARCHAR(80),

    provider VARCHAR(30) NOT NULL DEFAULT 'imd'
        CHECK (provider IN ('imd','openweather','ecmwf','gfs','ensemble','local_model')),
    stated_confidence_pct NUMERIC(5,2)
        CHECK (stated_confidence_pct IS NULL OR (stated_confidence_pct BETWEEN 0 AND 100)),

    actual_rainfall_mm NUMERIC(8,2),
    actual_temp_max_c NUMERIC(5,2),
    scored_at TIMESTAMP,

    UNIQUE (station_id, valid_for, horizon_days, provider),

    -- A forecast valid for a date before it was issued is a hindcast, and
    -- scoring it as a forecast flatters the provider enormously.
    CONSTRAINT forecast_is_not_hindcast CHECK (valid_for >= issued_at::date)
);

-- Provider accuracy, derived from scored forecasts only. A provider with
-- nothing scored gets NULL, not a good grade.
CREATE OR REPLACE VIEW v_forecast_accuracy AS
SELECT
    provider,
    horizon_days,
    COUNT(*) FILTER (WHERE scored_at IS NOT NULL)                    AS scored,
    ROUND(AVG(ABS(rainfall_mm - actual_rainfall_mm))::numeric, 2)    AS mean_rainfall_error_mm,
    ROUND(AVG(ABS(temp_max_c - actual_temp_max_c))::numeric, 2)      AS mean_temp_error_c,
    ROUND(AVG(stated_confidence_pct)::numeric, 2)                    AS mean_stated_confidence
FROM weather_forecasts
WHERE scored_at IS NOT NULL
GROUP BY provider, horizon_days;

-- ---------------------------------------------------------------------------
-- M084 · DISASTER ALERTS
--
-- NE India is seismically active, landslide-prone and floods annually. An
-- alert here can move a truck off a road or hold a consignment, so it needs a
-- severity vocabulary that maps to an action rather than a colour.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS climate_alerts (
    id BIGSERIAL PRIMARY KEY,
    alert_code VARCHAR(40) NOT NULL UNIQUE,
    alert_type VARCHAR(30) NOT NULL
        CHECK (alert_type IN ('heavy_rain','flood','landslide','drought','hailstorm',
                              'cold_wave','heat_wave','cyclone','earthquake','frost','pest_outbreak')),
    severity VARCHAR(20) NOT NULL
        CHECK (severity IN ('advisory','watch','warning','severe','extreme')),

    state VARCHAR(60),
    districts TEXT[] NOT NULL DEFAULT '{}',
    headline VARCHAR(200) NOT NULL,
    detail TEXT,
    recommended_action TEXT NOT NULL,

    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    effective_from TIMESTAMP NOT NULL,
    effective_until TIMESTAMP NOT NULL,
    source VARCHAR(40) NOT NULL DEFAULT 'imd',
    source_ref TEXT,

    -- Does this alert stop goods moving? The logistics layer reads this, so it
    -- must be an explicit decision rather than inferred from severity text.
    blocks_dispatch BOOLEAN NOT NULL DEFAULT FALSE,
    affects_routes TEXT[],

    cancelled_at TIMESTAMP,
    cancellation_reason TEXT,

    CONSTRAINT alert_window_valid CHECK (effective_until >= effective_from),
    -- An alert with no action attached is noise that trains people to ignore
    -- the next one.
    CONSTRAINT alert_states_an_action CHECK (length(trim(recommended_action)) > 0),
    CONSTRAINT severe_alerts_block_or_explain CHECK (
      severity NOT IN ('severe','extreme') OR blocks_dispatch = TRUE OR detail IS NOT NULL
    ),
    CONSTRAINT cancelled_alert_has_reason CHECK (
      cancelled_at IS NULL OR cancellation_reason IS NOT NULL
    )
);

-- ---------------------------------------------------------------------------
-- M085/M086 · DROUGHT AND FLOOD INDICES
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS climate_indices (
    id BIGSERIAL PRIMARY KEY,
    district VARCHAR(80) NOT NULL,
    state VARCHAR(60) NOT NULL,
    index_type VARCHAR(20) NOT NULL
        CHECK (index_type IN ('spi','spei','ndvi','ndwi','flood_risk','aridity','gdd')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,

    index_value NUMERIC(10,4) NOT NULL,
    -- Standardised Precipitation Index convention: below -1.5 is severe
    -- drought, above +1.5 is severe wet. Stored as a label so downstream code
    -- does not each re-implement the thresholds slightly differently.
    classification VARCHAR(30),

    rainfall_actual_mm NUMERIC(9,2),
    rainfall_normal_mm NUMERIC(9,2),
    departure_pct NUMERIC(7,2)
        GENERATED ALWAYS AS (
          CASE WHEN rainfall_normal_mm IS NOT NULL AND rainfall_normal_mm <> 0
               THEN ROUND((rainfall_actual_mm - rainfall_normal_mm) / rainfall_normal_mm * 100, 2) END
        ) STORED,

    source VARCHAR(30) NOT NULL DEFAULT 'computed',
    computed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (district, index_type, period_start, period_end),
    CONSTRAINT index_period_valid CHECK (period_end >= period_start)
);

-- ---------------------------------------------------------------------------
-- M087/M088 · PEST AND DISEASE FORECASTING
--
-- Pest pressure is driven by weather with a lag, which is why this belongs in
-- D14 and not in crop management. The advisory MUST name a non-chemical
-- option first: an organic-certified plot that sprays a banned compound on
-- platform advice loses its certification and its export market, and the
-- platform caused it.
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS pest_disease_forecasts (
    id BIGSERIAL PRIMARY KEY,
    crop VARCHAR(120) NOT NULL,
    pest_or_disease VARCHAR(160) NOT NULL,
    kind VARCHAR(10) NOT NULL CHECK (kind IN ('pest','disease')),

    district VARCHAR(80),
    state VARCHAR(60),
    forecast_for DATE NOT NULL,
    issued_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    risk_level VARCHAR(20) NOT NULL
        CHECK (risk_level IN ('low','moderate','high','severe')),
    driver_conditions TEXT,
    -- Confidence is required, because acting on a pest forecast costs money
    -- and an unqualified "high risk" invites spraying that was never needed.
    confidence_pct NUMERIC(5,2) NOT NULL CHECK (confidence_pct BETWEEN 0 AND 100),

    non_chemical_action TEXT NOT NULL,
    chemical_action TEXT,
    organic_safe BOOLEAN NOT NULL DEFAULT TRUE,
    banned_for_export_markets TEXT[],

    CONSTRAINT non_chemical_option_given CHECK (length(trim(non_chemical_action)) > 0),
    -- A chemical recommendation flagged organic-safe must not carry an export
    -- ban; those two claims contradict each other and one of them is wrong.
    CONSTRAINT organic_safe_has_no_export_ban CHECK (
      organic_safe = FALSE OR banned_for_export_markets IS NULL
    )
);

-- ---------------------------------------------------------------------------
-- M089 · CLIMATE RISK ASSESSMENT
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS climate_risk_assessments (
    id BIGSERIAL PRIMARY KEY,
    subject_type VARCHAR(20) NOT NULL
        CHECK (subject_type IN ('plot','village','district','fpo','lane','facility')),
    subject_ref VARCHAR(80) NOT NULL,

    horizon VARCHAR(20) NOT NULL DEFAULT 'season'
        CHECK (horizon IN ('season','year','5_year','10_year')),
    drought_risk NUMERIC(4,3) CHECK (drought_risk IS NULL OR (drought_risk BETWEEN 0 AND 1)),
    flood_risk NUMERIC(4,3) CHECK (flood_risk IS NULL OR (flood_risk BETWEEN 0 AND 1)),
    landslide_risk NUMERIC(4,3) CHECK (landslide_risk IS NULL OR (landslide_risk BETWEEN 0 AND 1)),
    heat_stress_risk NUMERIC(4,3) CHECK (heat_stress_risk IS NULL OR (heat_stress_risk BETWEEN 0 AND 1)),
    composite_risk NUMERIC(4,3) CHECK (composite_risk IS NULL OR (composite_risk BETWEEN 0 AND 1)),

    -- Same vocabulary as core/mcda.js. A risk score built on assumptions is
    -- weighted at 0.4 there, and it must carry that label to get there.
    data_provenance VARCHAR(20) NOT NULL DEFAULT 'assumed'
        CHECK (data_provenance IN ('real','estimated','assumed')),
    years_of_data INTEGER NOT NULL DEFAULT 0 CHECK (years_of_data >= 0),
    method TEXT,
    assessed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE (subject_type, subject_ref, horizon),

    -- Calling a risk figure 'real' with under three years behind it overstates
    -- what the data can support for anything seasonal.
    CONSTRAINT real_risk_needs_history CHECK (
      data_provenance <> 'real' OR years_of_data >= 3
    )
);

-- ---------------------------------------------------------------------------
-- M090 · AGRO-MET ADVISORIES  (the farmer-facing output)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS agromet_advisories (
    id BIGSERIAL PRIMARY KEY,
    district VARCHAR(80) NOT NULL,
    state VARCHAR(60),
    crop VARCHAR(120),
    crop_stage VARCHAR(60),

    issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
    valid_until DATE,
    weather_summary TEXT NOT NULL,
    advisory TEXT NOT NULL,
    -- Advisories are useless in a language the farmer does not read.
    language VARCHAR(10) NOT NULL DEFAULT 'en',

    -- Farm operations this advisory says to do or postpone.
    recommended_operations TEXT[],
    postpone_operations TEXT[],

    source VARCHAR(40) NOT NULL DEFAULT 'imd_agromet',
    delivered_via TEXT[],
    farmers_reached INTEGER NOT NULL DEFAULT 0 CHECK (farmers_reached >= 0),

    CONSTRAINT advisory_validity_ordered CHECK (valid_until IS NULL OR valid_until >= issued_on),
    CONSTRAINT advisory_not_blank CHECK (length(trim(advisory)) > 0)
);

-- Live alerts that currently block dispatch — read by the logistics layer.
CREATE OR REPLACE VIEW v_active_dispatch_blocks AS
SELECT
    alert_code, alert_type, severity, state, districts,
    headline, recommended_action, affects_routes,
    effective_from, effective_until
FROM climate_alerts
WHERE cancelled_at IS NULL
  AND blocks_dispatch = TRUE
  AND CURRENT_TIMESTAMP BETWEEN effective_from AND effective_until;

-- Districts where the ARP yield model has real weather to work from, rather
-- than the hard-coded fallback it uses today.
CREATE OR REPLACE VIEW v_weather_coverage AS
SELECT
    s.state, s.district,
    COUNT(DISTINCT s.id)                                   AS stations,
    COUNT(o.id)                                            AS observations,
    MIN(o.observed_on)                                     AS earliest,
    MAX(o.observed_on)                                     AS latest,
    (MAX(o.observed_on) >= CURRENT_DATE - 7)               AS current_within_a_week,
    COUNT(o.id) FILTER (WHERE o.quality_flag = 'validated') AS validated_observations
FROM weather_stations s
LEFT JOIN weather_observations o ON o.station_id = s.id
WHERE s.active
GROUP BY s.state, s.district;

CREATE INDEX IF NOT EXISTS idx_obs_station_date ON weather_observations (station_id, observed_on DESC);
CREATE INDEX IF NOT EXISTS idx_forecast_pending ON weather_forecasts (valid_for) WHERE scored_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_live ON climate_alerts (effective_until) WHERE cancelled_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_indices_district ON climate_indices (district, index_type, period_end DESC);
CREATE INDEX IF NOT EXISTS idx_pest_risk ON pest_disease_forecasts (district, forecast_for DESC);
CREATE INDEX IF NOT EXISTS idx_agromet_district ON agromet_advisories (district, issued_on DESC);
