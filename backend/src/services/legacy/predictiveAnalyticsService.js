/**
 * Predictive Analytics Service
 * Manages predictive models, forecasts, and analytics predictions
 */

const express = require('express');
const { Pool } = require('pg');
const { logger } = require('../../../utils/logger');
const { authMiddleware } = require('../../../middleware/auth');

const router = express.Router();
// Shared pool (2026-08-04): this service previously built its own Pool.
// 42 services doing so meant ~420 potential connections against a
// PostgreSQL default max_connections of 100. See database/pool.js.
const pool = require('../../../database/pool');

// Test-mode stubs
if (process.env.NODE_ENV === 'test') {
  // Deliberately reassigns the async function declarations below (hoisted
  // with their full real bodies before this block runs) so tests get
  // lightweight fakes instead of hitting a real DB - intentional, not a bug.
  /* eslint-disable no-func-assign */
  createPredictiveModel = async (data) => ({ id: `model-${Date.now()}`, ...data });
  getActiveModels = async () => ([]);
  createPrediction = async (data) => ({ id: `pred-${Date.now()}`, ...data });
  createForecast = async (data) => ({ id: `fcast-${Date.now()}`, ...data });
  createPredictionAlert = async (data) => ({ id: `palert-${Date.now()}`, ...data });
  getUnacknowledgedAlerts = async () => ([]);
  recordPredictiveAnalytics = async (metrics) => ({ date: new Date().toISOString(), ...metrics });
  /* eslint-enable no-func-assign */
}

// ============================================================================
// PREDICTIVE MODELS
// ============================================================================

/**
 * Create predictive model
 */
async function createPredictiveModel(data) {
  const {
    model_name,
    model_type,
    model_version,
    algorithm,
    model_config,
    training_data_source,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score
  } = data;

  try {
    const result = await pool.query(
      `INSERT INTO predictive_models 
       (model_name, model_type, model_version, algorithm, model_config, training_data_source, 
        accuracy_score, precision_score, recall_score, f1_score, trained_at, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP, true)
       RETURNING *`,
      [
        model_name,
        model_type,
        model_version,
        algorithm,
        JSON.stringify(model_config),
        training_data_source,
        accuracy_score,
        precision_score,
        recall_score,
        f1_score
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create predictive model error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create predictive model
 */
router.post('/predictive-models', authMiddleware, async (req, res) => {
  try {
    let result = await createPredictiveModel(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create predictive model API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create predictive model' });
  }
});

/**
 * Get active predictive models
 */
async function getActiveModels(modelType = null) {
  try {
    let query = 'SELECT * FROM predictive_models WHERE is_active = true';
    const params = [];

    if (modelType) {
      query += ' AND model_type = $1';
      params.push(modelType);
    }

    query += ' ORDER BY accuracy_score DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get active models error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get active models
 */
router.get('/predictive-models', async (req, res) => {
  try {
    const { model_type } = req.query;
    let result = await getActiveModels(model_type);
    res.json(result);
  } catch (error) {
    logger.error('Get active models API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get active models' });
  }
});

// ============================================================================
// PREDICTIONS
// ============================================================================

/**
 * Create prediction
 */
async function createPrediction(data) {
  const {
    model_id,
    prediction_type,
    target_entity_id,
    target_entity_type,
    prediction_date,
    prediction_horizon_days,
    predicted_value,
    confidence_interval_lower,
    confidence_interval_upper,
    confidence_score,
    prediction_metadata
  } = data;

  try {
    let result = await pool.query(
      `INSERT INTO predictions 
       (model_id, prediction_type, target_entity_id, target_entity_type, prediction_date, 
        prediction_horizon_days, predicted_value, confidence_interval_lower, confidence_interval_upper, 
        confidence_score, prediction_metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        model_id,
        prediction_type,
        target_entity_id,
        target_entity_type,
        prediction_date,
        prediction_horizon_days,
        predicted_value,
        confidence_interval_lower,
        confidence_interval_upper,
        confidence_score,
        JSON.stringify(prediction_metadata)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create prediction error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create prediction
 */
router.post('/predictions', authMiddleware, async (req, res) => {
  try {
    let result = await createPrediction(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create prediction API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create prediction' });
  }
});

/**
 * Get predictions for entity
 */
async function getPredictions(entityId, entityType, predictionType = null) {
  try {
    let query = `
      SELECT p.*, pm.model_name, pm.model_type
      FROM predictions p
      LEFT JOIN predictive_models pm ON p.model_id = pm.id
      WHERE p.target_entity_id = $1 AND p.target_entity_type = $2
    `;
    let params = [entityId, entityType];

    if (predictionType) {
      query += ' AND p.prediction_type = $3';
      params.push(predictionType);
    }

    query += ' ORDER BY p.prediction_date DESC LIMIT 50';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get predictions error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get predictions
 */
router.get('/predictions/:entityId/:entityType', async (req, res) => {
  try {
    const { prediction_type } = req.query;
    let result = await getPredictions(req.params.entityId, req.params.entityType, prediction_type);
    res.json(result);
  } catch (error) {
    logger.error('Get predictions API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get predictions' });
  }
});

// ============================================================================
// FORECASTS
// ============================================================================

/**
 * Create forecast
 */
async function createForecast(data) {
  const {
    forecast_type,
    entity_id,
    entity_type,
    forecast_date,
    forecast_horizon_days,
    forecast_values,
    forecast_metadata,
    generated_by_model_id
  } = data;

  try {
    let result = await pool.query(
      `INSERT INTO forecasts 
       (forecast_type, entity_id, entity_type, forecast_date, forecast_horizon_days, 
        forecast_values, forecast_metadata, generated_by_model_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        forecast_type,
        entity_id,
        entity_type,
        forecast_date,
        forecast_horizon_days,
        JSON.stringify(forecast_values),
        JSON.stringify(forecast_metadata),
        generated_by_model_id
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create forecast error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create forecast
 */
router.post('/forecasts', authMiddleware, async (req, res) => {
  try {
    let result = await createForecast(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create forecast API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create forecast' });
  }
});

/**
 * Get forecasts
 */
async function getForecasts(entityId = null, entityType = null, forecastType = null) {
  try {
    let query = 'SELECT * FROM forecasts WHERE 1=1';
    let params = [];

    if (entityId && entityType) {
      query += ' AND entity_id = $1 AND entity_type = $2';
      params.push(entityId, entityType);
    }

    if (forecastType) {
      query += ' AND forecast_type = $' + (params.length + 1);
      params.push(forecastType);
    }

    query += ' ORDER BY forecast_date DESC LIMIT 50';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Get forecasts error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get forecasts
 */
router.get('/forecasts', async (req, res) => {
  try {
    const { entity_id, entity_type, forecast_type } = req.query;
    let result = await getForecasts(entity_id, entity_type, forecast_type);
    res.json(result);
  } catch (error) {
    logger.error('Get forecasts API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get forecasts' });
  }
});

// ============================================================================
// PREDICTION ALERTS
// ============================================================================

/**
 * Create prediction alert
 */
async function createPredictionAlert(data) {
  const {
    prediction_id,
    alert_type,
    alert_severity,
    alert_message,
    alert_data
  } = data;

  try {
    let result = await pool.query(
      `INSERT INTO prediction_alerts 
       (prediction_id, alert_type, alert_severity, alert_message, alert_data)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        prediction_id,
        alert_type,
        alert_severity,
        alert_message,
        JSON.stringify(alert_data)
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Create prediction alert error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to create prediction alert
 */
router.post('/prediction-alerts', authMiddleware, async (req, res) => {
  try {
    let result = await createPredictionAlert(req.body);
    res.status(201).json(result);
  } catch (error) {
    logger.error('Create prediction alert API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to create prediction alert' });
  }
});

/**
 * Get unacknowledged alerts
 */
async function getUnacknowledgedAlerts() {
  try {
    let result = await pool.query(
      `SELECT pa.*, p.predicted_value, p.prediction_type
       FROM prediction_alerts pa
       LEFT JOIN predictions p ON pa.prediction_id = p.id
       WHERE pa.is_acknowledged = false
       ORDER BY pa.created_at DESC`
    );

    return result.rows;
  } catch (error) {
    logger.error('Get unacknowledged alerts error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to get unacknowledged alerts
 */
router.get('/prediction-alerts/unacknowledged', authMiddleware, async (req, res) => {
  try {
    let result = await getUnacknowledgedAlerts();
    res.json(result);
  } catch (error) {
    logger.error('Get unacknowledged alerts API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to get alerts' });
  }
});

// ============================================================================
// PREDICTIVE ANALYTICS
// ============================================================================

/**
 * Record predictive analytics
 */
async function recordPredictiveAnalytics(metrics) {
  try {
    let result = await pool.query(
      `INSERT INTO predictive_analytics 
       (date, total_predictions_made, accurate_predictions, average_confidence_score, 
        total_forecasts_generated, model_training_runs, active_models)
       VALUES (CURRENT_DATE, $1, $2, $3, $4, $5, $6)
       ON CONFLICT (date)
       DO UPDATE SET
         total_predictions_made = predictive_analytics.total_predictions_made + EXCLUDED.total_predictions_made,
         accurate_predictions = predictive_analytics.accurate_predictions + EXCLUDED.accurate_predictions,
         total_forecasts_generated = predictive_analytics.total_forecasts_generated + EXCLUDED.total_forecasts_generated,
         model_training_runs = predictive_analytics.model_training_runs + EXCLUDED.model_training_runs
       RETURNING *`,
      [
        metrics.total_predictions || 0,
        metrics.accurate_predictions || 0,
        metrics.avg_confidence || 0,
        metrics.total_forecasts || 0,
        metrics.training_runs || 0,
        metrics.active_models || 0
      ]
    );

    return result.rows[0];
  } catch (error) {
    logger.error('Record predictive analytics error', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * API endpoint to record predictive analytics
 */
router.post('/predictive-analytics', authMiddleware, async (req, res) => {
  try {
    const { metrics } = req.body;
    let result = await recordPredictiveAnalytics(metrics);
    res.json(result);
  } catch (error) {
    logger.error('Record predictive analytics API error', { error: error.message, stack: error.stack });
    res.status(500).json({ error: 'Failed to record predictive analytics' });
  }
});

// ============================================================================
// HEALTH CHECK
// ============================================================================

function isHealthy() {
  return pool.connect().then(() => true).catch(() => false);
}

module.exports = {
  router,
  createPredictiveModel,
  getActiveModels,
  createPrediction,
  getPredictions,
  createForecast,
  getForecasts,
  createPredictionAlert,
  getUnacknowledgedAlerts,
  recordPredictiveAnalytics,
  isHealthy
};

// Merged unique operations from backend/src/modules/M080 (see git history there for
// full context) - complementary functionality this service did not have.
Object.assign(module.exports, require("../../modules/M080/service"));

