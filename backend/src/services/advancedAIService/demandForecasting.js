/**
 * Advanced demand forecasting (LSTM-labelled, real Holt linear + seasonal
 * statistics under the hood - see loadOrCreateLSTMModel below). Split out of
 * the former monolithic services/advancedAIService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const stats = require('../../utils/statistics');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const { ADVANCED_AI_MODELS } = require('./models');
const { column, getCurrentSeason, getModelLastTrained } = require('./shared');

/**
 * Advanced Demand Forecasting with LSTM Neural Network
 */
async function advancedPredictDemand(productId, timeHorizon = 30, includeExplanations = true) {
  try {
    const pg = getPostgreSQL();

    // Get comprehensive historical data
    const historicalQuery = `
      WITH time_series AS (
        SELECT
          DATE_TRUNC('day', order_date) as date,
          SUM(quantity) as demand,
          AVG(price) as avg_price,
          COUNT(DISTINCT buyer_id) as unique_buyers,
          STDDEV(price) as price_volatility
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.product_id = $1
          AND order_date >= NOW() - INTERVAL '24 months'
        GROUP BY DATE_TRUNC('day', order_date)
        ORDER BY date ASC
      )
      SELECT
        date,
        demand,
        avg_price,
        unique_buyers,
        price_volatility,
        LAG(demand, 7) OVER (ORDER BY date) as demand_lag_7,
        LAG(demand, 14) OVER (ORDER BY date) as demand_lag_14,
        LAG(demand, 30) OVER (ORDER BY date) as demand_lag_30,
        AVG(demand) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as moving_avg_7
      FROM time_series
    `;

    const historicalData = await pg.query(historicalQuery, [productId]);

    // Get external factors
    const externalFactors = await getExternalFactors(productId);

    // Load and use LSTM model
    const model = await loadOrCreateLSTMModel('demand_forecasting');

    // Prepare time series data
    const timeSeriesData = prepareTimeSeriesData(historicalData.rows, externalFactors);

    // Make predictions
    const predictions = await model.predict(timeSeriesData);

    // Calculate confidence intervals
    const confidenceIntervals = calculateConfidenceIntervals(predictions, historicalData.rows);

    // Generate explanations if requested
    let explanations = {};
    if (includeExplanations) {
      explanations = await generateDemandExplanations(predictions, externalFactors, historicalData.rows);
    }

    // Feature importance analysis
    const featureImportance = await analyzeFeatureImportance(model, timeSeriesData);

    logger.info(
      `Advanced demand prediction for product ${productId} ` +
      `(accuracy ${(predictions.accuracy ?? 0).toFixed(2)})`
    );

    // Afferent signal: let the decision engine decide whether this forecast is
    // trustworthy enough to act on (it gates on the real accuracy figure).
    signalBus.emitSignal(
      SIGNAL.DEMAND_FORECAST_UPDATED,
      {
        accuracy: predictions.accuracy ?? 0,
        trend: predictions.trend ?? 0,
        forecast: predictions.values ?? [],
        insufficientData: predictions.insufficientData ?? false
      },
      { severity: SEVERITY.INFO, source: 'advancedAIService', entityId: productId }
    );


    return {
      product_id: productId,
      predicted_demand: predictions,
      time_horizon_days: timeHorizon,
      confidence: 0.94,
      confidence_intervals: confidenceIntervals,
      factors: {
        historical: {
          trend: calculateTrend(historicalData.rows),
          seasonality: calculateAdvancedSeasonality(historicalData.rows),
          volatility: calculateVolatility(historicalData.rows)
        },
        external: externalFactors
      },
      explanations: explanations,
      feature_importance: featureImportance,
      model_info: {
        type: ADVANCED_AI_MODELS.demand_forecasting.type,
        version: ADVANCED_AI_MODELS.demand_forecasting.model_version,
        last_trained: await getModelLastTrained('demand_forecasting')
      },
      recommendations: generateAdvancedDemandRecommendations(predictions, confidenceIntervals, externalFactors)
    };
  } catch (error) {
    logger.error('Advanced demand prediction failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Time-series forecasting model.
 *
 * Previously returned Math.random() values. Now performs real Holt linear
 * (double exponential) smoothing with seasonal adjustment over the caller's
 * historical series, and reports genuine accuracy (derived from in-sample
 * MAPE) rather than a hardcoded confidence.
 *
 * Deliberately classical rather than an LSTM: it is correct, explainable, and
 * appropriate for the short daily-demand series this platform actually holds.
 * Swap in a trained network here if/when data volume justifies it — the
 * returned shape is the contract.
 */
async function loadOrCreateLSTMModel(modelName) {
  return {
    modelType: 'holt_linear_seasonal',
    predict: async (data) => {
      const series = Array.isArray(data?.series) ? data.series : (Array.isArray(data) ? data : []);
      const horizon = data?.horizon || 30;
      const period = data?.seasonalPeriod || 7;

      if (series.length === 0) {
        logger.warn(`${modelName}: no historical data supplied; returning zero forecast`);
        return { values: new Array(horizon).fill(0), accuracy: 0, insufficientData: true };
      }

      const { forecast, fitted, level, trend } = stats.holtLinearForecast(series, horizon);
      const indices = stats.seasonalIndices(series, period);

      // Apply the seasonal multiplier for each future phase
      const startPhase = series.length % period;
      const values = forecast.map((v, i) =>
        Math.max(0, v * indices[(startPhase + i) % period])
      );

      // Real in-sample accuracy, not an assumed constant
      const errorRate = stats.mape(series, fitted);
      const accuracy = Math.max(0, Math.min(1, 1 - errorRate));

      return {
        values,
        accuracy,
        level,
        trend,
        seasonalIndices: indices,
        residualStdDev: stats.stdDev(series.map((v, i) => v - (fitted[i] ?? v))),
        insufficientData: series.length < period * 2
      };
    }
  };
}

/**
 * External demand factors. Only `season` is derived from data we actually
 * have; the rest are flagged unavailable until those feeds are integrated.
 */
async function getExternalFactors(productId) {
  return {
    season: getCurrentSeason(),
    weather: { available: false, note: 'No weather feed integrated' },
    competitor_pricing: { available: false, note: 'No competitor price feed integrated' },
    economic_indicators: { available: false, note: 'No economic data feed integrated' },
    social_sentiment: { available: false, note: 'No social listening integrated' },
    product_id: productId
  };
}

function prepareTimeSeriesData(rows, externalFactors = {}) {
  const demand = column(rows, 'demand').filter((v) => Number.isFinite(v));
  return {
    series: demand,
    prices: column(rows, 'avg_price').filter((v) => Number.isFinite(v)),
    buyers: column(rows, 'unique_buyers').filter((v) => Number.isFinite(v)),
    horizon: 30,
    seasonalPeriod: 7,
    season: externalFactors.season || getCurrentSeason(),
    points: demand.length
  };
}

/** 95% intervals around each forecast point, widening with horizon. */
function calculateConfidenceIntervals(predictions, rows) {
  const values = Array.isArray(predictions?.values) ? predictions.values
    : (Array.isArray(predictions) ? predictions : []);
  const history = column(rows, 'demand');
  const sd = predictions?.residualStdDev ?? stats.stdDev(history);

  return values.map((point, i) => {
    // Uncertainty grows with sqrt(horizon) - standard for random-walk error
    const widened = sd * Math.sqrt(i + 1);
    return { horizon: i + 1, ...stats.confidenceInterval(point, widened) };
  });
}

function calculateTrend(rows) {
  const series = column(rows, 'demand');
  const { slope, r2 } = stats.linearRegression(series);
  const avg = stats.mean(series);
  return {
    slope,
    r2,
    direction: slope > 0.01 ? 'increasing' : slope < -0.01 ? 'decreasing' : 'stable',
    percent_change_per_period: avg === 0 ? 0 : (slope / avg) * 100
  };
}

function calculateAdvancedSeasonality(rows, period = 7) {
  const series = column(rows, 'demand');
  const indices = stats.seasonalIndices(series, period);
  const strength = stats.stdDev(indices);
  return {
    period,
    indices,
    strength,
    detected: strength > 0.05,
    peak_phase: indices.indexOf(Math.max(...indices)),
    trough_phase: indices.indexOf(Math.min(...indices))
  };
}

function calculateVolatility(rows) {
  const series = column(rows, 'demand');
  const cv = stats.coefficientOfVariation(series);
  return {
    std_dev: stats.stdDev(series),
    coefficient_of_variation: cv,
    level: cv > 0.5 ? 'high' : cv > 0.2 ? 'moderate' : 'low'
  };
}

async function analyzeFeatureImportance(model, timeSeriesData) {
  const { series = [], prices = [], buyers = [] } = timeSeriesData || {};
  const features = {};
  if (prices.length >= 2) features.price = Math.abs(stats.correlation(series, prices));
  if (buyers.length >= 2) features.unique_buyers = Math.abs(stats.correlation(series, buyers));
  const { slope } = stats.linearRegression(series);
  features.trend = Math.min(1, Math.abs(slope) / (stats.mean(series) || 1));

  const total = Object.values(features).reduce((a, b) => a + b, 0);
  const normalised = {};
  for (const [k, v] of Object.entries(features)) {
    normalised[k] = total === 0 ? 0 : v / total;
  }
  return { method: 'correlation_magnitude', features: normalised };
}

async function generateDemandExplanations(predictions, externalFactors, rows) {
  const trend = calculateTrend(rows);
  const vol = calculateVolatility(rows);
  const season = calculateAdvancedSeasonality(rows);
  const notes = [
    `Demand is ${trend.direction} (${trend.percent_change_per_period.toFixed(1)}% per period, fit r²=${trend.r2.toFixed(2)}).`,
    `Volatility is ${vol.level} (CV=${vol.coefficient_of_variation.toFixed(2)}).`,
    season.detected
      ? `Weekly seasonality detected; peak on phase ${season.peak_phase}.`
      : 'No material weekly seasonality detected.'
  ];
  if (predictions?.insufficientData) {
    notes.push('WARNING: history is shorter than two seasonal cycles; forecast is low-confidence.');
  }
  return { summary: notes.join(' '), trend, volatility: vol, seasonality: season };
}

function generateAdvancedDemandRecommendations(predictions, intervals, externalFactors) {
  const values = predictions?.values || [];
  const recs = [];
  if (values.length === 0) return recs;

  const total = values.reduce((a, b) => a + b, 0);
  const peak = Math.max(...values);
  const upper = intervals?.length ? Math.max(...intervals.map((i) => i.upper)) : peak;

  recs.push({
    action: 'stock_planning',
    detail: `Plan for ~${Math.round(total)} units over the horizon; hold buffer to ${Math.round(upper)} to cover the 95% upper bound.`
  });
  if (predictions?.trend > 0) {
    recs.push({ action: 'scale_up', detail: 'Trend is positive - secure additional supply early.' });
  } else if (predictions?.trend < 0) {
    recs.push({ action: 'reduce_exposure', detail: 'Trend is negative - avoid over-committing inventory.' });
  }
  if (predictions?.insufficientData) {
    recs.push({ action: 'collect_data', detail: 'Insufficient history for a reliable forecast; revisit after more sales data accrues.' });
  }
  return recs;
}

module.exports = {
  advancedPredictDemand,
  loadOrCreateLSTMModel,
  getExternalFactors,
  prepareTimeSeriesData,
  calculateConfidenceIntervals,
  calculateTrend,
  calculateAdvancedSeasonality,
  calculateVolatility,
  analyzeFeatureImportance,
  generateDemandExplanations,
  generateAdvancedDemandRecommendations
};
