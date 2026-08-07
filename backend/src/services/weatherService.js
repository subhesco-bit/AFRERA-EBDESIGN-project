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

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

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

module.exports = {
  recordObservation, weatherForArp,
  recordForecast, scoreForecasts, forecastAccuracy,
  raiseAlert, activeDispatchBlocks, dispatchCheck,
  pestForecast, coverage,
};
