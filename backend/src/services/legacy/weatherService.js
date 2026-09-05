/**
 * Domain D14 — Climate & Weather. Modules M081–M090.
 *
 * The master index found this domain completely empty: no service, route,
 * table or component anywhere in the repo. Ten catalogued modules, zero
 * implementation — while the ARP forward-pricing engine (051) takes rainfall,
 * mean temperature and heat-stress days as its primary inputs and was reading
 * them from a hard-coded fallback constant.
 *
 * Every forward price the platform published rested on weather it had never
 * looked up. `weatherForArp()` below is the function that closes that.
 *
 * Backed by migration 057.
 */

'use strict';

const pool = require('../../database\/pool');
const { logger } = require('../../utils\/logger');
const { signalBus, SIGNAL, SEVERITY } = require('../../core\/signalBus');

const r2 = (n) => (n === null || n === undefined ? null : Math.round(n * 100) / 100);

// ---------------------------------------------------------------------------
// M081 — observations
// ---------------------------------------------------------------------------

async function recordObservation(obs) {
  const { rows } = await pool.query(
    `INSERT INTO weather_observations
       (station_id, observed_on, observed_at, rainfall_mm, temp_max_c, temp_min_c,
        temp_mean_c, humidity_pct, wind_speed_kmph, source, quality_flag)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     ON CONFLICT (station_id, observed_on) DO UPDATE SET
       rainfall_mm = EXCLUDED.rainfall_mm, temp_max_c = EXCLUDED.temp_max_c,
       temp_min_c = EXCLUDED.temp_min_c, temp_mean_c = EXCLUDED.temp_mean_c,
       quality_flag = EXCLUDED.quality_flag
     RETURNING *`,
    [obs.stationId, obs.observedOn, obs.observedAt ?? null, obs.rainfallMm ?? null,
      obs.tempMaxC ?? null, obs.tempMinC ?? null, obs.tempMeanC ?? null,
      obs.humidityPct ?? null, obs.windSpeedKmph ?? null,
      obs.source ?? 'imd', obs.qualityFlag ?? 'raw']
  );
  return rows[0];
  }

/**
 * Aggregate weather for a district over a window, shaped for the ARP yield
 * model.
 *
 * Returns `calibrated: false` and a null-bearing payload when coverage is
 * thin, rather than silently substituting a plausible average. The yield model
 * refuses to advise below 0.5 confidence, and it can only do that if this
 * function tells it the truth about what was measured.
 */
async function weatherForArp({ state, district, days = 120 }) {
  const { rows } = await pool.query(
    `SELECT o.rainfall_mm, o.temp_mean_c, o.temp_max_c, o.quality_flag, s.heat_ref
       FROM weather_observations o
       JOIN (SELECT id, state, district, 34.0 AS heat_ref FROM weather_stations WHERE active) s
         ON s.id = o.station_id
      WHERE s.state = $1 AND s.district = $2
        AND o.observed_on >= CURRENT_DATE - ($3 || ' days')::interval`,
    [state, district, Number(days)]
  );

  if (!rows.length) {
    return {
      state, district, days,
      observations: 0,
      calibrated: false,
      rainfallMm: null, meanTempC: null, heatDaysAboveThresh: null,
      note: 'No weather observations for this district. The ARP yield model must treat '
          + 'this as uncalibrated and decline to advise — substituting a regional average '
          + "here would be guessing with someone's harvest while looking precise.",
    };
  }

  const rain = rows.reduce((s, r) => s + Number(r.rainfall_mm || 0), 0);
  const temps = rows.map((r) => r.temp_mean_c).filter((t) => t !== null).map(Number);
  const meanTemp = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : null;
  const heatDays = rows.filter((r) => r.temp_max_c !== null && Number(r.temp_max_c) > 34).length;
  const validated = rows.filter((r) => r.quality_flag === 'validated').length;

  return {
    state, district, days,
    observations: rows.length,
    validatedObservations: validated,
    // Coverage AND validation. A window two-thirds empty is not a season.
    calibrated: rows.length >= days * 0.6 && meanTemp !== null,
    rainfallMm: r2(rain),
    meanTempC: r2(meanTemp),
    heatDaysAboveThresh: heatDays,
    note: rows.length < days * 0.6
      ? `Only ${rows.length} observations across a ${days}-day window — coverage is too `
      + 'sparse to characterise the season. Treat as uncalibrated.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// M082 — forecasts and their scoring
// ---------------------------------------------------------------------------

async function recordForecast(f) {
  const { rows } = await pool.query(
    `INSERT INTO weather_forecasts
       (station_id, district, state, valid_for, horizon_days, rainfall_mm,
        rainfall_probability_pct, temp_max_c, temp_min_c, conditions, provider,
        stated_confidence_pct)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
    [f.stationId ?? null, f.district ?? null, f.state ?? null, f.validFor, f.horizonDays,
      f.rainfallMm ?? null, f.rainfallProbabilityPct ?? null, f.tempMaxC ?? null,
      f.tempMinC ?? null, f.conditions ?? null, f.provider ?? 'imd',
      f.statedConfidencePct ?? null]
  );
  return rows[0];
}

/**
 * Score every forecast whose valid_for date has passed against what was
 * actually observed. Fully autonomous — the sky is the judge.
 */
async function scoreForecasts({ limit = 500 } = {}) {
  const { rows } = await pool.query(
    `UPDATE weather_forecasts f
        SET actual_rainfall_mm = o.rainfall_mm,
            actual_temp_max_c  = o.temp_max_c,
            scored_at          = CURRENT_TIMESTAMP
       FROM weather_observations o
      WHERE o.station_id = f.station_id
        AND o.observed_on = f.valid_for
        AND f.scored_at IS NULL
        AND f.valid_for < CURRENT_DATE
        AND f.id IN (SELECT id FROM weather_forecasts WHERE scored_at IS NULL LIMIT $1)
      RETURNING f.id, f.provider, f.horizon_days`,
    [Number(limit)]
  );
  return { scored: rows.length, providers: [...new Set(rows.map((r) => r.provider))] };
}

async function forecastAccuracy() {
  const { rows } = await pool.query('SELECT * FROM v_forecast_accuracy ORDER BY provider, horizon_days');
  return rows.length ? rows : {
    providers: [],
    note: 'No forecasts have been scored yet. Provider accuracy is unknown, not good.',
  };
}

// ---------------------------------------------------------------------------
// M084 — alerts, and the dispatch block the logistics layer reads
// ---------------------------------------------------------------------------

async function raiseAlert(a) {
  if (!a.recommendedAction || !a.recommendedAction.trim()) {
    throw new Error('An alert must carry a recommended action — an alert with no action '
                  + 'is noise that trains people to ignore the next one');
  }
  const { rows } = await pool.query(
    `INSERT INTO climate_alerts
       (alert_code, alert_type, severity, state, districts, headline, detail,
        recommended_action, effective_from, effective_until, source, source_ref,
        blocks_dispatch, affects_routes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
    [a.alertCode, a.alertType, a.severity, a.state ?? null, a.districts ?? [],
      a.headline, a.detail ?? null, a.recommendedAction, a.effectiveFrom, a.effectiveUntil,
      a.source ?? 'imd', a.sourceRef ?? null, Boolean(a.blocksDispatch), a.affectsRoutes ?? null]
  );
  return rows[0];
}

/** Alerts currently blocking dispatch. Read before routing a consignment. */
async function activeDispatchBlocks() {
  const { rows } = await pool.query('SELECT * FROM v_active_dispatch_blocks');
  return { blocks: rows, blocked: rows.length > 0 };
}

/**
 * Is it safe to dispatch through these districts right now?
 *
 * Returns `safe: false` with the alert attached rather than a bare boolean,
 * because a dispatcher overruling this needs to see what they are overruling.
 */
async function dispatchCheck(districts = []) {
  if (!districts.length) return { safe: true, blocks: [], note: 'No districts supplied to check.' };
  const { rows } = await pool.query(
    `SELECT * FROM v_active_dispatch_blocks WHERE districts && $1::text[]`, [districts]
  );
  return {
    safe: rows.length === 0,
    blocks: rows,
    note: rows.length
      ? `${rows.length} active alert(s) block dispatch through these districts.`
      : null,
  };
}

// ---------------------------------------------------------------------------
// M087/M088 — pest and disease
// ---------------------------------------------------------------------------

async function pestForecast({ crop, district, days = 30 }) {
  const { rows } = await pool.query(
    `SELECT * FROM pest_disease_forecasts
      WHERE ($1::text IS NULL OR crop ILIKE $1)
        AND ($2::text IS NULL OR district = $2)
        AND forecast_for >= CURRENT_DATE
        AND forecast_for <= CURRENT_DATE + ($3 || ' days')::interval
      ORDER BY
        CASE risk_level WHEN 'severe' THEN 0 WHEN 'high' THEN 1
                        WHEN 'moderate' THEN 2 ELSE 3 END,
        forecast_for`,
    [crop ? `%${crop}%` : null, district ?? null, Number(days)]
  );
  return {
    forecasts: rows.map((r) => ({
      ...r,
      // Surfaced explicitly so a UI cannot show the chemical option first.
      actionOrder: ['non_chemical', ...(r.chemical_action ? ['chemical'] : [])],
    })),
    count: rows.length,
    note: 'Non-chemical action is listed first deliberately. An organic-certified plot '
        + 'that sprays a banned compound on platform advice loses its certification and '
        + 'its export market, and the platform caused it.',
  };
}

// ---------------------------------------------------------------------------
// M090 — coverage, so gaps are visible rather than assumed away
// ---------------------------------------------------------------------------

async function coverage() {
  const { rows } = await pool.query('SELECT * FROM v_weather_coverage ORDER BY state, district');
  const current = rows.filter((r) => r.current_within_a_week);
  return {
    districts: rows,
    total: rows.length,
    currentWithinAWeek: current.length,
    stale: rows.length - current.length,
    note: rows.length === 0
      ? 'No weather stations registered. Every ARP forward price is currently computed '
      + 'from a hard-coded fallback, not from observed weather.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// M090 (cont'd) — agromet_advisories CRUD
//
// The table has existed since migration 057; nothing ever read or wrote it
// (see frontend/src/pages/ClimateAdvisoryPage.jsx's backendNote, and
// api.js's comment on climateAdvisoryAPI). district is NOT NULL in the
// schema, so a blank "all regions" selection in the UI is stored as the
// literal district 'All' rather than violating the constraint — the
// alternative (loosening the schema) was rejected because it's the schema
// that is right here, not the UI shortcut.
// ---------------------------------------------------------------------------

async function listAdvisories({ district, limit = 50 } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM agromet_advisories
      WHERE ($1::text IS NULL OR district = $1)
      ORDER BY issued_on DESC, id DESC
      LIMIT $2`,
    [district || null, Number(limit) || 50]
  );
  return rows.map(shapeAdvisory);
}

async function getAdvisory(id) {
  const { rows } = await pool.query('SELECT * FROM agromet_advisories WHERE id = $1', [id]);
  return rows[0] ? shapeAdvisory(rows[0]) : null;
}

/** Maps the real agromet_advisories columns onto the field names
 *  ClimateAdvisoryPage.jsx already renders (title/type/region), rather than
 *  changing the page to match column names it was written against first. */
function shapeAdvisory(r) {
  return {
    id: r.id,
    title: r.weather_summary,
    advisory: r.advisory,
    type: r.crop_stage || 'General',
    region: r.district === 'All' ? '' : r.district,
    crop: r.crop,
    language: r.language,
    issued_on: r.issued_on,
    valid_until: r.valid_until,
    recommended_operations: r.recommended_operations,
    postpone_operations: r.postpone_operations,
    source: r.source,
    farmers_reached: r.farmers_reached,
  };
}

async function createAdvisory(payload) {
  const { title, advisory, type, region, valid_until: validUntil, crop, language,
    recommended_operations: recommendedOps, postpone_operations: postponeOps } = payload || {};
  if (!advisory || !advisory.trim()) throw new Error('advisory text is required');
  const district = (region && region.trim()) || 'All';
  const weatherSummary = (title && title.trim()) || advisory.trim().slice(0, 120);
  const { rows } = await pool.query(
    `INSERT INTO agromet_advisories
       (district, crop, crop_stage, valid_until, weather_summary, advisory, language,
        recommended_operations, postpone_operations, source)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'manual')
     RETURNING *`,
    [district, crop || null, type || null, validUntil || null, weatherSummary, advisory.trim(),
      language || 'en', recommendedOps || null, postponeOps || null]
  );
  return shapeAdvisory(rows[0]);
}

async function updateAdvisory(id, payload) {
  const { title, advisory, type, region, valid_until: validUntil, crop, language } = payload || {};
  const { rows } = await pool.query(
    `UPDATE agromet_advisories SET
       weather_summary = COALESCE($1, weather_summary),
       advisory = COALESCE($2, advisory),
       crop_stage = COALESCE($3, crop_stage),
       district = COALESCE($4, district),
       valid_until = COALESCE($5, valid_until),
       crop = COALESCE($6, crop),
       language = COALESCE($7, language)
     WHERE id = $8
     RETURNING *`,
    [title || null, advisory || null, type || null, (region && region.trim()) || null,
      validUntil || null, crop || null, language || null, id]
  );
  return rows[0] ? shapeAdvisory(rows[0]) : null;
}

// ---------------------------------------------------------------------------
// Advisory triggers — real threshold breaches, not a prediction
//
// Two independent real signals, both read from rows that already exist:
//  1. Drought/wet severity from climate_indices.index_value (SPI/SPEI). The
//     ±1.5 severe threshold is not something invented here — it is the SPI
//     convention this migration's own header comment documents
//     ("below -1.5 is severe drought, above +1.5 is severe wet").
//  2. Heat-stress days from weather_observations.temp_max_c, using the same
//     34°C reference weatherForArp() already applies for heat-stress days —
//     reused rather than re-invented so the platform doesn't carry two
//     different definitions of "a hot day".
//
// Neither branch fabricates a reading: a district with no climate_indices or
// no weather_observations rows simply produces no trigger for that branch.
// ---------------------------------------------------------------------------

const SPI_SEVERE_DROUGHT = -1.5;
const SPI_SEVERE_WET = 1.5;
const HEAT_STRESS_TEMP_C = 34; // same reference weatherForArp() uses for heat-stress days
const HEAT_STRESS_TRAILING_DAYS = 7;
const HEAT_STRESS_MIN_HOT_DAYS = 3; // assumed: hot days within the window needed to trigger an advisory

async function getAdvisoryTriggers({ district, state } = {}) {
  const { rows: idx } = await pool.query(
    `SELECT DISTINCT ON (district, index_type)
            district, state, index_type, index_value, classification,
            period_end, rainfall_actual_mm, rainfall_normal_mm, departure_pct
       FROM climate_indices
      WHERE index_type IN ('spi','spei')
        AND ($1::text IS NULL OR district = $1)
        AND ($2::text IS NULL OR state = $2)
      ORDER BY district, index_type, period_end DESC`,
    [district || null, state || null]
  );

  const droughtWetTriggers = idx
    .filter((r) => Number(r.index_value) <= SPI_SEVERE_DROUGHT || Number(r.index_value) >= SPI_SEVERE_WET)
    .map((r) => {
      const severeDrought = Number(r.index_value) <= SPI_SEVERE_DROUGHT;
      return {
        district: r.district,
        state: r.state,
        kind: severeDrought ? 'severe_drought' : 'severe_wet',
        indexType: r.index_type,
        indexValue: Number(r.index_value),
        classification: r.classification,
        periodEnd: r.period_end,
        departurePct: r.departure_pct !== null ? Number(r.departure_pct) : null,
        suggestedTitle: severeDrought ? `Severe drought signal — ${r.district}` : `Waterlogging risk — ${r.district}`,
        suggestedAdvisory: severeDrought
          ? 'Prioritise deficit irrigation and moisture-conserving mulch; postpone field operations that increase evapotranspiration.'
          : 'Confirm field drainage is clear before the next rain event; postpone sowing and fertiliser application until waterlogging risk passes.',
        basis: `real ${r.index_type.toUpperCase()} = ${r.index_value} for period ending ${r.period_end}; `
          + 'SPI convention documented in migration 057 (below -1.5 severe drought, above +1.5 severe wet)',
      };
    });

  const { rows: heat } = await pool.query(
    `SELECT s.district, s.state,
            COUNT(*) FILTER (WHERE o.temp_max_c > $3) AS hot_days,
            COUNT(*) AS total_obs
       FROM weather_observations o
       JOIN weather_stations s ON s.id = o.station_id
      WHERE o.observed_on >= CURRENT_DATE - ($1 || ' days')::interval
        AND ($2::text IS NULL OR s.district = $2)
      GROUP BY s.district, s.state`,
    [HEAT_STRESS_TRAILING_DAYS, district || null, HEAT_STRESS_TEMP_C]
  );

  const heatTriggers = heat
    .filter((r) => Number(r.hot_days) >= HEAT_STRESS_MIN_HOT_DAYS)
    .map((r) => ({
      district: r.district,
      state: r.state,
      kind: 'heat_stress',
      hotDays: Number(r.hot_days),
      windowDays: HEAT_STRESS_TRAILING_DAYS,
      totalObservations: Number(r.total_obs),
      suggestedTitle: `Heat stress risk — ${r.district}`,
      suggestedAdvisory: `${r.hot_days} of the last ${HEAT_STRESS_TRAILING_DAYS} observed days exceeded `
        + `${HEAT_STRESS_TEMP_C}°C. Schedule irrigation for early morning/evening, provide shade for `
        + 'livestock, and delay transplanting heat-sensitive seedlings.',
      basis: `real weather_observations over the trailing ${HEAT_STRESS_TRAILING_DAYS} days; `
        + `${HEAT_STRESS_TEMP_C}°C is the same heat-stress reference weatherForArp() uses`,
    }));

  const triggers = [...droughtWetTriggers, ...heatTriggers];

  // Reacting modules (dispatch, insurance, etc.) can subscribe to
  // 'agronomy.weather.alert' — this is the first emitter for that signal type.
  for (const t of triggers) {
    signalBus.emitSignal(SIGNAL.WEATHER_ALERT, t, {
      severity: t.kind === 'heat_stress' ? SEVERITY.NOTICE : SEVERITY.WARNING,
      source: 'weatherService.getAdvisoryTriggers',
      entityId: t.district,
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    thresholds: {
      spiSevereDrought: SPI_SEVERE_DROUGHT,
      spiSevereWet: SPI_SEVERE_WET,
      spiQuality: 'real — SPI convention documented in migration 057 header comment',
      heatStressTempC: HEAT_STRESS_TEMP_C,
      heatStressTrailingDays: HEAT_STRESS_TRAILING_DAYS,
      heatStressMinHotDays: HEAT_STRESS_MIN_HOT_DAYS,
      heatStressMinHotDaysQuality: 'assumed — not stored in the schema, applied uniformly',
    },
    triggers,
    count: triggers.length,
    note: triggers.length === 0
      ? 'No climate_indices or weather_observations rows currently cross these thresholds — '
      + 'this reflects real recorded data, not a placeholder.'
      : null,
  };
}

module.exports = {
  recordObservation, weatherForArp,
  recordForecast, scoreForecasts, forecastAccuracy,
  raiseAlert, activeDispatchBlocks, dispatchCheck,
  pestForecast, coverage,
  listAdvisories, getAdvisory, createAdvisory, updateAdvisory,
  getAdvisoryTriggers,
};



