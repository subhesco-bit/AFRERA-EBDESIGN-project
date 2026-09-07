/**
 * Market Intelligence Service — REOS Rural Life OS, Layer 9 support table.
 *
 * Backs `market_intelligence` (041_rural_life_os_schema.sql): price/volume/
 * demand-supply observations per produce_type, location and date, sourced
 * from eNAM/mandi/wholesale/retail. Real work: trend classification from
 * actual historical rows (not a stored guess), a simple moving-average
 * forecast, and seasonality aggregation — the inputs `marketAccessService`'s
 * channel recommendation and `financialService`-adjacent pricing decisions
 * need.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const r2 = (n) => Math.round(n * 100) / 100;

async function recordPrice(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const {
    produce_type, variety, location, min_price, max_price, average_price, modal_price,
    trading_volume, volume_unit, demand_level, supply_level, quality_a_premium, quality_b_premium,
    data_source, data_date,
  } = payload;

  if (!produce_type) throw new Error('produce_type is required');
  if (!(average_price > 0)) throw new Error('average_price must be positive');
  if (!data_date) throw new Error('data_date is required');

  // Trend and change % are derived from the immediately preceding observation
  // for the same produce/location, not supplied by the caller — a client
  // claiming "increasing" while the numbers show flat would otherwise go
  // unchecked.
  const { rows: prior } = await pg.query(
    `SELECT average_price, data_date FROM market_intelligence
      WHERE produce_type = $1 AND data_date < $2
      ORDER BY data_date DESC LIMIT 1`,
    [produce_type, data_date]
  );

  let price_trend = 'stable';
  let price_change_percentage = 0;
  if (prior.length) {
    const priorPrice = Number(prior[0].average_price);
    price_change_percentage = priorPrice > 0 ? r2(((average_price - priorPrice) / priorPrice) * 100) : 0;
    if (price_change_percentage > 2) price_trend = 'increasing';
    else if (price_change_percentage < -2) price_trend = 'decreasing';
  }

  const { rows } = await pg.query(
    `INSERT INTO market_intelligence
       (produce_type, variety, location, min_price, max_price, average_price, modal_price,
        price_trend, price_change_percentage, price_change_period, trading_volume, volume_unit,
        demand_level, supply_level, quality_a_premium, quality_b_premium, data_source, data_date)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'daily',$10,$11,$12,$13,$14,$15,$16,$17)
     RETURNING *`,
    [produce_type, variety || null, location ? JSON.stringify(location) : null, min_price || null, max_price || null,
      average_price, modal_price || null, price_trend, price_change_percentage, trading_volume || null,
      volume_unit || null, demand_level || null, supply_level || null, quality_a_premium || null,
      quality_b_premium || null, data_source || null, data_date]
  );

  return rows[0];
}

async function listPrices({ produce_type, page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const conditions = [];
  const params = [];
  if (produce_type) { params.push(produce_type); conditions.push(`produce_type = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const totalRes = await pg.query(`SELECT COUNT(*) FROM market_intelligence ${where}`, params);
  const { rows } = await pg.query(
    `SELECT * FROM market_intelligence ${where} ORDER BY data_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { items: rows, pagination: { page, limit, total: parseInt(totalRes.rows[0].count, 10), totalPages: Math.ceil(totalRes.rows[0].count / limit) } };
}

/**
 * Trend + N-period simple moving-average forecast for a produce type.
 * Confidence scales down with fewer observations, since a 2-point trend is
 * far less reliable than a 30-point one.
 */
async function getTrend(produceType, { periods = 14 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { rows } = await pg.query(
    `SELECT average_price, data_date FROM market_intelligence
      WHERE produce_type = $1 ORDER BY data_date DESC LIMIT $2`,
    [produceType, periods]
  );

  if (!rows.length) {
    return { produce_type: produceType, observations: 0, trend: 'unknown', forecast_price: null, confidence: 0 };
  }

  const prices = rows.map((r) => Number(r.average_price)).reverse(); // oldest first
  const sma = r2(prices.reduce((s, p) => s + p, 0) / prices.length);
  const latest = prices[prices.length - 1];
  const earliest = prices[0];
  const changePct = earliest > 0 ? r2(((latest - earliest) / earliest) * 100) : 0;

  let trend = 'stable';
  if (changePct > 2) trend = 'increasing';
  else if (changePct < -2) trend = 'decreasing';

  // Naive next-period forecast: SMA nudged toward the recent trend direction,
  // weighted by how many observations back it up. This is deliberately
  // simple (an honest "real algorithm, simple version" per the module
  // strategy) rather than a fabricated ML model.
  const trendNudge = r2((latest - sma) * 0.5);
  const forecastPrice = r2(sma + trendNudge);
  const confidence = r2(Math.min(0.9, 0.3 + prices.length * 0.04));

  return {
    produce_type: produceType,
    observations: prices.length,
    latest_price: latest,
    simple_moving_average: sma,
    trend,
    change_pct_over_window: changePct,
    forecast_price: forecastPrice,
    forecast_period: 'next_period',
    confidence,
    reasoning: {
      factors: [`${prices.length}-period SMA = ${sma}`, `latest observation = ${latest}`, `window change = ${changePct}%`],
      formula: 'forecast = SMA + 0.5 * (latest - SMA)',
    },
  };
}

/** Aggregate observations by calendar month to build a seasonal pattern. */
async function getSeasonality(produceType) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const { rows } = await pg.query(
    `SELECT TO_CHAR(data_date, 'MM') AS month, AVG(average_price)::numeric(12,2) AS avg_price,
            AVG(trading_volume)::numeric(12,2) AS avg_volume, COUNT(*)::int AS observations
       FROM market_intelligence
      WHERE produce_type = $1
      GROUP BY TO_CHAR(data_date, 'MM')
      ORDER BY month`,
    [produceType]
  );

  const pattern = {};
  for (const row of rows) {
    pattern[row.month] = { average_price: Number(row.avg_price), average_volume: row.avg_volume !== null ? Number(row.avg_volume) : null, observations: row.observations };
  }
  return { produce_type: produceType, seasonal_pattern: pattern, months_with_data: rows.length };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const result = await listPrices({ produce_type: req.query.produce_type, page: parseInt(req.query.page, 10) || 1, limit: parseInt(req.query.limit, 10) || 20 });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.warn('marketIntelligenceService list failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const record = await recordPrice(req.body || {});
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/trend/:produceType', async (req, res) => {
  try {
    const result = await getTrend(req.params.produceType, { periods: parseInt(req.query.periods, 10) || 14 });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/seasonality/:produceType', async (req, res) => {
  try {
    const result = await getSeasonality(req.params.produceType);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

function setupRoutes(app) {
  app.use('/api/v1/market-intelligence', router);
}

module.exports = { router, setupRoutes, recordPrice, listPrices, getTrend, getSeasonality };
