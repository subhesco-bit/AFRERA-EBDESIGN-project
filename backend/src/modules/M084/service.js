/**
 * Trend Analysis Service (M084)
 * Business Intelligence & Analytics - Trend detection and analysis
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');
const { signalBus } = require('../../core/signalBus');

const ALERT_TYPES = new Set(['heavy_rain', 'flood', 'landslide', 'drought', 'hailstorm', 'cold_wave', 'heat_wave', 'cyclone', 'earthquake', 'frost', 'pest_outbreak']);
const SEVERITIES = new Set(['advisory', 'watch', 'warning', 'severe', 'extreme']);
function alertError(message) { const error = new Error(message); error.code = 'VALIDATION_ERROR'; error.statusCode = 400; return error; }
function alertId(id) { if (!/^[1-9][0-9]*$/.test(String(id))) throw alertError('alert id must be a positive integer'); return Number(id); }
function requiredText(value, name, max) { if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) throw alertError(`${name} is required and must be at most ${max} characters`); return value.trim(); }

async function createDisasterAlert(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw alertError('alert payload is required');
  const { alert_code, alert_type, severity, state, districts = [], headline, detail, recommended_action, effective_from, effective_until, source = 'operator', source_ref, blocks_dispatch = false, affects_routes = [], ai_advisory_metadata } = data;
  requiredText(alert_code, 'alert_code', 40); requiredText(headline, 'headline', 200); requiredText(recommended_action, 'recommended_action', 10000);
  if (!ALERT_TYPES.has(alert_type) || !SEVERITIES.has(severity)) throw alertError('alert_type or severity is invalid');
  if (!Array.isArray(districts) || districts.some(item => typeof item !== 'string')) throw alertError('districts must be an array of strings');
  if (!Array.isArray(affects_routes) || affects_routes.some(item => typeof item !== 'string')) throw alertError('affects_routes must be an array of strings');
  if (typeof blocks_dispatch !== 'boolean' || (ai_advisory_metadata !== undefined && (!ai_advisory_metadata || typeof ai_advisory_metadata !== 'object' || Array.isArray(ai_advisory_metadata)))) throw alertError('alert flags or advisory metadata are invalid');
  const from = new Date(effective_from); const until = new Date(effective_until);
  if (!effective_from || Number.isNaN(from.valueOf()) || !effective_until || Number.isNaN(until.valueOf()) || until < from) throw alertError('effective alert window is invalid');
  if ((severity === 'severe' || severity === 'extreme') && !blocks_dispatch && !detail) throw alertError('severe alerts require detail or blocks_dispatch');
  const result = await pool.query(`INSERT INTO climate_alerts (alert_code, alert_type, severity, state, districts, headline, detail, recommended_action, effective_from, effective_until, source, source_ref, blocks_dispatch, affects_routes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [alert_code, alert_type, severity, state || null, districts, headline, detail || null, recommended_action, from.toISOString(), until.toISOString(), source, source_ref || null, blocks_dispatch, affects_routes]);
  signalBus.emitSignal('climate.disaster_alert.created', { alertId: result.rows[0].id, alertCode: alert_code, severity }, { source: 'M084', entityId: String(result.rows[0].id) });
  return { ...result.rows[0], ai_advisory_metadata: ai_advisory_metadata || { status: 'not_generated', source: 'operator_authored' } };
}

async function listDisasterAlerts(filters = {}) {
  if (!filters || typeof filters !== 'object' || Array.isArray(filters)) throw alertError('alert filters are invalid');
  const params = []; const clauses = [];
  for (const field of ['state', 'alert_type', 'severity']) { if (filters[field] !== undefined) { requiredText(filters[field], field, 60); params.push(filters[field]); clauses.push(`${field} = $${params.length}`); } }
  const query = `SELECT * FROM climate_alerts${clauses.length ? ` WHERE ${clauses.join(' AND ')}` : ''} ORDER BY issued_at DESC LIMIT 100`;
  return (await pool.query(query, params)).rows;
}

async function getDisasterAlert(id) { return (await pool.query('SELECT * FROM climate_alerts WHERE id = $1', [alertId(id)])).rows[0] || null; }
async function cancelDisasterAlert(id, data) { const reason = requiredText(data?.cancellation_reason, 'cancellation_reason', 1000); return (await pool.query('UPDATE climate_alerts SET cancelled_at = CURRENT_TIMESTAMP, cancellation_reason = $1 WHERE id = $2 AND cancelled_at IS NULL RETURNING *', [reason, alertId(id)])).rows[0] || null; }
async function getDisasterAlertAdvisory(id) { const alert = await getDisasterAlert(id); return alert ? { alert_id: alert.id, alert_code: alert.alert_code, advisory: { status: 'metadata_only', source: alert.source, source_ref: alert.source_ref, generated: false, message: 'No external alert was generated; review the operator-authored alert and recommended action.' } } : null; }

/**
 * Create trend definition
 */
async function createTrendDefinition(trendData) {
  try {
    const {
      trend_name,
      trend_type,
      data_source,
      metric_name,
      analysis_frequency,
      time_horizon,
      confidence_threshold
    } = trendData;

    const trend = {
      trend_id: generateId(),
      trend_name,
      trend_type,
      data_source,
      metric_name,
      analysis_frequency,
      time_horizon,
      confidence_threshold,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered trend configuration
    const aiRequest = {
      task: 'trend_configuration_optimization',
      parameters: {
        trend_type: trend_type,
        metric_name: metric_name,
        data_characteristics: await analyzeDataCharacteristics(data_source),
        best_practices: await getTrendBestPractices(trend_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    trend.ai_recommendations = aiResponse;

    let result = await pool.query(
      `INSERT INTO trend_definitions 
       (trend_id, trend_name, trend_type, data_source, metric_name, 
        analysis_frequency, time_horizon, confidence_threshold, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        trend.trend_id,
        trend.trend_name,
        trend.trend_type,
        trend.data_source,
        trend.metric_name,
        trend.analysis_frequency,
        trend.time_horizon,
        trend.confidence_threshold,
        trend.status,
        trend.created_at
      ]
    );

    logger.info(`Trend definition created: ${trend.trend_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating trend definition', { error: error.message, stack: error.stack });
    throw new Error('Failed to create trend definition');
  }
}

/**
 * Add data point to trend
 */
async function addDataPoint(trendId, dataPointData) {
  try {
    const { timestamp, value, is_forecast, confidence_level, metadata } = dataPointData;

    let result = await pool.query(
      `INSERT INTO trend_data_points 
       (data_point_id, trend_id, timestamp, value, is_forecast, confidence_level, metadata, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        generateId(),
        trendId,
        timestamp,
        value,
        is_forecast || false,
        confidence_level,
        JSON.stringify(metadata || {}),
        new Date().toISOString()
      ]
    );

    logger.info(`Data point added: ${result.rows[0].data_point_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding data point', { error: error.message });
    throw new Error('Failed to add data point');
  }
}

/**
 * Get trend data points
 */
async function getTrendDataPoints(trendId, filters = {}) {
  try {
    const { start_time, end_time, is_forecast } = filters;
    let query = 'SELECT * FROM trend_data_points WHERE trend_id = $1';
    let params = [trendId];
    let paramCount = 1;

    if (start_time) {
      paramCount++;
      query += ` AND timestamp >= $${paramCount}`;
      params.push(start_time);
    }

    if (end_time) {
      paramCount++;
      query += ` AND timestamp <= $${paramCount}`;
      params.push(end_time);
    }

    if (is_forecast !== undefined) {
      paramCount++;
      query += ` AND is_forecast = $${paramCount}`;
      params.push(is_forecast);
    }

    query += ' ORDER BY timestamp ASC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting trend data points', { error: error.message });
    throw new Error('Failed to get trend data points');
  }
}

/**
 * Analyze trend
 */
async function analyzeTrend(trendId, analysisType, periodStart, periodEnd) {
  try {
    const dataPoints = await getTrendDataPoints(trendId, {
      start_time: periodStart,
      end_time: periodEnd,
      is_forecast: false
    });

    if (dataPoints.length < 2) {
      throw new Error('Insufficient data points for trend analysis');
    }

    // AI-powered trend analysis
    let aiRequest = {
      task: 'trend_analysis',
      parameters: {
        data_points: dataPoints,
        analysis_type: analysisType,
        historical_context: await getHistoricalContext(trendId),
        external_factors: await getExternalFactors(trendId)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const analysis = {
      analysis_id: generateId(),
      trend_id: trendId,
      analysis_type: analysisType,
      trend_direction: aiResponse.trend_direction,
      trend_strength: aiResponse.trend_strength,
      trend_slope: aiResponse.trend_slope,
      r_squared: aiResponse.r_squared,
      seasonality_pattern: aiResponse.seasonality_pattern,
      seasonality_strength: aiResponse.seasonality_strength,
      cyclical_pattern: aiResponse.cyclical_pattern,
      anomaly_detected: aiResponse.anomaly_detected,
      anomaly_count: aiResponse.anomaly_count || 0,
      analysis_period_start: periodStart,
      analysis_period_end: periodEnd,
      analyzed_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO trend_analysis 
       (analysis_id, trend_id, analysis_type, trend_direction, trend_strength, 
        trend_slope, r_squared, seasonality_pattern, seasonality_strength, 
        cyclical_pattern, anomaly_detected, anomaly_count, analysis_period_start, 
        analysis_period_end, analyzed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        analysis.analysis_id,
        analysis.trend_id,
        analysis.analysis_type,
        analysis.trend_direction,
        analysis.trend_strength,
        analysis.trend_slope,
        analysis.r_squared,
        analysis.seasonality_pattern,
        analysis.seasonality_strength,
        analysis.cyclical_pattern,
        analysis.anomaly_detected,
        analysis.anomaly_count,
        analysis.analysis_period_start,
        analysis.analysis_period_end,
        analysis.analyzed_at
      ]
    );

    logger.info(`Trend analysis completed: ${analysis.analysis_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error analyzing trend', { error: error.message });
    throw new Error('Failed to analyze trend');
  }
}

/**
 * Generate trend forecast
 */
async function generateTrendForecast(trendId, forecastType, forecastHorizon) {
  try {
    let dataPoints = await getTrendDataPoints(trendId, { is_forecast: false });

    // AI-powered forecasting
    let aiRequest = {
      task: 'trend_forecasting',
      parameters: {
        historical_data: dataPoints,
        forecast_type: forecastType,
        forecast_horizon: forecastHorizon,
        seasonality: await detectSeasonality(trendId),
        model_options: await getModelOptions(forecastType)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const forecast = {
      forecast_id: generateId(),
      trend_id: trendId,
      forecast_type: forecastType,
      forecast_horizon: forecastHorizon,
      forecast_data: aiResponse.forecast_data,
      confidence_intervals: aiResponse.confidence_intervals,
      model_used: aiResponse.model_used,
      model_accuracy: aiResponse.model_accuracy,
      generated_at: new Date().toISOString(),
      valid_until: new Date(Date.now() + forecastHorizon * 24 * 60 * 60 * 1000).toISOString()
    };

    let result = await pool.query(
      `INSERT INTO trend_forecasts 
       (forecast_id, trend_id, forecast_type, forecast_horizon, forecast_data, 
        confidence_intervals, model_used, model_accuracy, generated_at, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        forecast.forecast_id,
        forecast.trend_id,
        forecast.forecast_type,
        forecast.forecast_horizon,
        JSON.stringify(forecast.forecast_data),
        JSON.stringify(forecast.confidence_intervals),
        forecast.model_used,
        forecast.model_accuracy,
        forecast.generated_at,
        forecast.valid_until
      ]
    );

    // Add forecast data points
    for (const point of forecast.forecast_data) {
      await addDataPoint(trendId, {
        timestamp: point.timestamp,
        value: point.value,
        is_forecast: true,
        confidence_level: point.confidence_level
      });
    }

    logger.info(`Trend forecast generated: ${forecast.forecast_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error generating trend forecast', { error: error.message });
    throw new Error('Failed to generate trend forecast');
  }
}

/**
 * Detect seasonality
 */
async function detectSeasonality(trendId) {
  try {
    let dataPoints = await getTrendDataPoints(trendId, { is_forecast: false });

    // AI-powered seasonality detection
    let aiRequest = {
      task: 'seasonality_detection',
      parameters: {
        data_points: dataPoints,
        potential_periods: ['daily', 'weekly', 'monthly', 'quarterly', 'yearly']
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const seasonality = {
      seasonality_id: generateId(),
      trend_id: trendId,
      seasonality_type: aiResponse.seasonality_type,
      period: aiResponse.period,
      amplitude: aiResponse.amplitude,
      phase: aiResponse.phase,
      seasonal_indices: aiResponse.seasonal_indices,
      detected_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO trend_seasonality 
       (seasonality_id, trend_id, seasonality_type, period, amplitude, phase, 
        seasonal_indices, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        seasonality.seasonality_id,
        seasonality.trend_id,
        seasonality.seasonality_type,
        seasonality.period,
        seasonality.amplitude,
        seasonality.phase,
        JSON.stringify(seasonality.seasonal_indices),
        seasonality.detected_at
      ]
    );

    logger.info(`Seasonality detected: ${seasonality.seasonality_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error detecting seasonality', { error: error.message });
    throw new Error('Failed to detect seasonality');
  }
}

/**
 * Calculate correlation
 */
async function calculateCorrelation(trendId, correlatedMetric) {
  try {
    const trendData = await getTrendDataPoints(trendId, { is_forecast: false });
    const correlatedData = await getCorrelatedData(correlatedMetric);

    // AI-powered correlation analysis
    let aiRequest = {
      task: 'correlation_analysis',
      parameters: {
        trend_data: trendData,
        correlated_data: correlatedData,
        correlation_methods: ['pearson', 'spearman', 'kendall']
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const correlation = {
      correlation_id: generateId(),
      trend_id: trendId,
      correlated_metric: correlatedMetric,
      correlation_coefficient: aiResponse.correlation_coefficient,
      p_value: aiResponse.p_value,
      lead_lag_period: aiResponse.lead_lag_period,
      correlation_type: aiResponse.correlation_type,
      calculated_at: new Date().toISOString()
    };

    let result = await pool.query(
      `INSERT INTO trend_correlations 
       (correlation_id, trend_id, correlated_metric, correlation_coefficient, 
        p_value, lead_lag_period, correlation_type, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        correlation.correlation_id,
        correlation.trend_id,
        correlation.correlated_metric,
        correlation.correlation_coefficient,
        correlation.p_value,
        correlation.lead_lag_period,
        correlation.correlation_type,
        correlation.calculated_at
      ]
    );

    logger.info(`Correlation calculated: ${correlation.correlation_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error calculating correlation', { error: error.message });
    throw new Error('Failed to calculate correlation');
  }
}

/**
 * Detect breakpoints
 */
async function detectBreakpoints(trendId) {
  try {
    let dataPoints = await getTrendDataPoints(trendId, { is_forecast: false });

    // AI-powered breakpoint detection
    let aiRequest = {
      task: 'breakpoint_detection',
      parameters: {
        data_points: dataPoints,
        detection_methods: ['chow_test', 'cusum', 'bayan']
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const breakpoints = [];
    for (const bp of aiResponse.breakpoints) {
      const breakpoint = {
        breakpoint_id: generateId(),
        trend_id: trendId,
        breakpoint_timestamp: bp.timestamp,
        breakpoint_type: bp.type,
        pre_trend_slope: bp.pre_slope,
        post_trend_slope: bp.post_slope,
        significance_level: bp.significance,
        description: bp.description,
        detected_at: new Date().toISOString()
      };

      let result = await pool.query(
        `INSERT INTO trend_breakpoints 
         (breakpoint_id, trend_id, breakpoint_timestamp, breakpoint_type, 
          pre_trend_slope, post_trend_slope, significance_level, description, detected_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          breakpoint.breakpoint_id,
          breakpoint.trend_id,
          breakpoint.breakpoint_timestamp,
          breakpoint.breakpoint_type,
          breakpoint.pre_trend_slope,
          breakpoint.post_trend_slope,
          breakpoint.significance_level,
          breakpoint.description,
          breakpoint.detected_at
        ]
      );

      breakpoints.push(result.rows[0]);
    }

    logger.info(`Breakpoints detected: ${breakpoints.length}`);
    return breakpoints;
  } catch (error) {
    logger.error('Error detecting breakpoints', { error: error.message });
    throw new Error('Failed to detect breakpoints');
  }
}

/**
 * Create trend alert
 */
async function createTrendAlert(alertData) {
  try {
    const {
      trend_id,
      alert_type,
      alert_condition,
      threshold_value,
      severity,
      message
    } = alertData;

    let result = await pool.query(
      `INSERT INTO trend_alerts 
       (alert_id, trend_id, alert_type, alert_condition, threshold_value, severity, message, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        generateId(),
        trend_id,
        alert_type,
        alert_condition,
        threshold_value,
        severity,
        message,
        new Date().toISOString()
      ]
    );

    logger.info(`Trend alert created: ${result.rows[0].alert_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating trend alert', { error: error.message });
    throw new Error('Failed to create trend alert');
  }
}

/**
 * Get trend alerts
 */
async function getTrendAlerts(trendId, filters = {}) {
  try {
    const { is_active } = filters;
    let query = 'SELECT * FROM trend_alerts WHERE trend_id = $1';
    let params = [trendId];
    let paramCount = 1;

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active);
    }

    query += ' ORDER BY triggered_at DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting trend alerts', { error: error.message });
    throw new Error('Failed to get trend alerts');
  }
}

// Helper functions
function generateId() {
  return `TREND-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function analyzeDataCharacteristics(dataSource) {
  return {
    data_type: 'time_series',
    frequency: 'daily',
    completeness: 0.95,
    noise_level: 'low'
  };
}

async function getTrendBestPractices(trendType) {
  return {
    minimum_data_points: 30,
    recommended_methods: ['linear_regression', 'moving_average', 'exponential_smoothing'],
    confidence_interval: 0.95
  };
}

async function getHistoricalContext(trendId) {
  return {
    similar_trends: [],
    historical_patterns: [],
    event_history: []
  };
}

async function getExternalFactors(trendId) {
  return {
    market_conditions: 'stable',
    seasonality: 'moderate',
    external_events: []
  };
}

async function getModelOptions(forecastType) {
  return {
    models: ['arima', 'prophet', 'lstm', 'ensemble'],
    parameters: {
      lookback_window: 30,
      forecast_steps: 10
    }
  };
}

async function getCorrelatedData(metric) {
  return [];
}

module.exports = {
  createTrendDefinition,
  addDataPoint,
  getTrendDataPoints,
  analyzeTrend,
  generateTrendForecast,
  detectSeasonality,
  calculateCorrelation,
  detectBreakpoints,
  createTrendAlert,
  getTrendAlerts,
  createDisasterAlert,
  listDisasterAlerts,
  getDisasterAlert,
  cancelDisasterAlert,
  getDisasterAlertAdvisory
};
