/**
 * Regional demand forecasting.
 *
 * Replaces a 25-line stub that returned `{ forecasts: [], note: 'stub' }` on a
 * live, unauthenticated route. A stub behind a mounted endpoint is worse than
 * a missing endpoint: the caller gets a 200 and an empty array, and reads that
 * as "no demand" rather than "not built".
 *
 * Reads `demand_forecasts` (015 owns the table; 052 added the scalar regional
 * columns) and `mandi_prices` (056).
 *
 * NOTE ON THE TWO CONFIDENCE COLUMNS
 * 015 carries `accuracy` — measured AFTER the fact against what happened.
 * 052 carries `confidence` — CLAIMED at forecast time. They are different
 * quantities and averaging them produces a number that means nothing, so this
 * service reports them separately.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

/**
 * Forecasts for a product and/or region.
 *
 * Returns `basis: 'none'` with an explicit note when there is no data, rather
 * than an empty array that reads as zero demand.
 */
async function getForecast({ productId, regionId, from, to, limit = 200 } = {}) {
  const where = [];
  const params = [];
  if (productId) { params.push(productId); where.push(`product_id::text = $${params.length}`); }
  if (regionId) { params.push(Number(regionId)); where.push(`region_id = $${params.length}`); }
  if (from) { params.push(from); where.push(`forecast_date >= $${params.length}`); }
  if (to) { params.push(to); where.push(`forecast_date <= $${params.length}`); }
  params.push(Math.min(Number(limit) || 200, 1000));

  const sql = `
    SELECT id, product_id, region_id, forecast_date, forecast_qty,
           confidence AS claimed_confidence, accuracy AS measured_accuracy,
           timeframe, model_version, created_at
      FROM demand_forecasts
     ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
     ORDER BY forecast_date DESC NULLS LAST, created_at DESC
     LIMIT $${params.length}`;

  const { rows } = await pool.query(sql, params);
  const scalar = rows.filter((r) => r.forecast_qty !== null);

  return {
    forecasts: rows,
    count: rows.length,
    basis: rows.length ? 'stored_forecasts' : 'none',
    totalForecastQty: scalar.reduce((s, r) => s + Number(r.forecast_qty), 0) || null,
    note: rows.length
      ? 'claimed_confidence is stated at forecast time; measured_accuracy is scored '
      + 'afterwards. They are different quantities — do not average them.'
      : 'No forecasts stored for this filter. This is an absence of data, not a '
      + 'forecast of zero demand.',
  };
}

/**
 * Demand aggregated by region, for a map.
 *
 * Cells with no data are returned with `qty: null`, never 0. A zero renders as
 * a cold cell on a heatmap and reads as "no demand here", which is a different
 * claim from "we have not measured here".
 */
async function getHeatmap({ date, productId } = {}) {
  let params = [];
  let where = ['region_id IS NOT NULL'];
  if (date) { params.push(date); where.push(`forecast_date = $${params.length}`); }
  if (productId) { params.push(productId); where.push(`product_id::text = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT region_id,
            SUM(forecast_qty)                      AS qty,
            AVG(confidence)                        AS mean_claimed_confidence,
            COUNT(*)                               AS forecast_count,
            MAX(forecast_date)                     AS latest_forecast_date
       FROM demand_forecasts
      WHERE ${where.join(' AND ')}
      GROUP BY region_id
      ORDER BY qty DESC NULLS LAST`,
    params
  );

  return {
    date: date || null,
    cells: rows.map((r) => ({
      regionId: r.region_id,
      qty: r.qty === null ? null : Number(r.qty),
      meanClaimedConfidence: r.mean_claimed_confidence === null ? null : Number(r.mean_claimed_confidence),
      forecastCount: Number(r.forecast_count),
      latestForecastDate: r.latest_forecast_date,
    })),
    cellsWithData: rows.length,
    note: 'Regions absent from this list have no stored forecast. They are unmeasured, '
        + 'not zero — do not render them as cold cells.',
  };
}

/**
 * Demand signal from mandi arrivals, where a live feed exists.
 *
 * Arrivals are a supply signal that prices a demand response: heavy arrivals
 * with falling modal price means a glut, which is exactly when a farmer most
 * needs to know not to bring more.
 */
async function getMandiSignal({ commodity, days = 30 } = {}) {
  if (!commodity) throw new Error('commodity is required');
  const { rows } = await pool.query(
    `SELECT price_date, market_name, district,
            modal_price_inr_per_qtl, arrivals_tonnes, source
       FROM mandi_prices
      WHERE commodity ILIKE $1
        AND price_date >= CURRENT_DATE - ($2 || ' days')::interval
      ORDER BY price_date DESC`,
    [`%${commodity}%`, Number(days)]
  );
  if (!rows.length) {
    return {
      commodity, observations: 0, signal: 'unknown',
      note: 'No mandi price data. The Agmarknet/e-NAM feed has not been connected, so '
          + 'there is no market read available for this commodity.',
    };
  }

  const withPrice = rows.filter((r) => r.modal_price_inr_per_qtl !== null);
  const recent = withPrice.slice(0, Math.ceil(withPrice.length / 2));
  const older = withPrice.slice(Math.ceil(withPrice.length / 2));
  const mean = (a) => (a.length ? a.reduce((s, r) => s + Number(r.modal_price_inr_per_qtl), 0) / a.length : null);
  const rNow = mean(recent);
  const rThen = mean(older);
  const changePct = (rNow !== null && rThen) ? ((rNow - rThen) / rThen) * 100 : null;

  return {
    commodity,
    observations: rows.length,
    meanModalRecent: rNow === null ? null : Math.round(rNow * 100) / 100,
    meanModalEarlier: rThen === null ? null : Math.round(rThen * 100) / 100,
    changePct: changePct === null ? null : Math.round(changePct * 100) / 100,
    signal: changePct === null ? 'unknown'
      : changePct < -10 ? 'falling — possible glut, holding may cost more than selling'
        : changePct > 10 ? 'rising — but check whether you have volume left to sell into it'
          : 'stable',
    sources: [...new Set(rows.map((r) => r.source))],
    caveat: 'A mandi read is a regional signal, not a quote. NE hill markets are thin '
          + 'and a single large arrival can move the modal price without reflecting demand.',
  };
}

module.exports = { getForecast, getHeatmap, getMandiSignal };
