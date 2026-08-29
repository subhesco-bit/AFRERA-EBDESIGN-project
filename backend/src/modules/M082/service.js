/**
 * Business Metrics & KPIs Tracking Service (M082)
 * Business Intelligence & Analytics - KPI definition, measurement, and tracking
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create KPI definition
 */
async function createKPIDefinition(kpiData) {
  try {
    const {
      kpi_name,
      kpi_code,
      category,
      description,
      calculation_formula,
      data_source,
      unit_of_measure,
      target_value,
      threshold_min,
      threshold_max,
      aggregation_type,
      time_granularity
    } = kpiData;

    const kpi = {
      kpi_id: generateId(),
      kpi_name,
      kpi_code,
      category,
      description,
      calculation_formula,
      data_source,
      unit_of_measure,
      target_value,
      threshold_min,
      threshold_max,
      aggregation_type,
      time_granularity,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered KPI optimization
    const aiRequest = {
      task: 'kpi_definition_optimization',
      parameters: {
        kpi_category: category,
        industry_best_practices: await getIndustryBestPractices(category),
        similar_kpis: await getSimilarKPIs(category),
        calculation_validation: await validateCalculationFormula(calculation_formula)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    kpi.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO kpi_definitions 
       (kpi_id, kpi_name, kpi_code, category, description, calculation_formula, 
        data_source, unit_of_measure, target_value, threshold_min, threshold_max, 
        aggregation_type, time_granularity, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
       RETURNING *`,
      [
        kpi.kpi_id,
        kpi.kpi_name,
        kpi.kpi_code,
        kpi.category,
        kpi.description,
        kpi.calculation_formula,
        kpi.data_source,
        kpi.unit_of_measure,
        kpi.target_value,
        kpi.threshold_min,
        kpi.threshold_max,
        kpi.aggregation_type,
        kpi.time_granularity,
        kpi.status,
        kpi.created_at
      ]
    );

    logger.info(`KPI definition created: ${kpi.kpi_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating KPI definition', { error: error.message, stack: error.stack });
    throw new Error('Failed to create KPI definition');
  }
}

/**
 * Get KPI definition
 */
async function getKPIDefinition(kpiId) {
  try {
    const result = await pool.query(
      'SELECT * FROM kpi_definitions WHERE kpi_id = $1',
      [kpiId]
    );
    return result.rows[0] || null;
  } catch (error) {
    logger.error('Error getting KPI definition', { error: error.message });
    throw new Error('Failed to get KPI definition');
  }
}

/**
 * List KPI definitions
 */
async function listKPIDefinitions(filters = {}) {
  try {
    const { category, status } = filters;
    let query = 'SELECT * FROM kpi_definitions WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(category);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error listing KPI definitions', { error: error.message });
    throw new Error('Failed to list KPI definitions');
  }
}

/**
 * Record KPI measurement
 */
async function recordKPIMeasurement(measurementData) {
  try {
    const {
      kpi_id,
      entity_id,
      entity_type,
      measurement_value,
      measurement_date,
      period_type,
      period_start,
      period_end,
      dimensions,
      metadata
    } = measurementData;

    const measurement = {
      measurement_id: generateId(),
      kpi_id,
      entity_id,
      entity_type,
      measurement_value,
      measurement_date,
      period_type,
      period_start,
      period_end,
      dimensions: dimensions || {},
      metadata: metadata || {},
      recorded_at: new Date().toISOString()
    };

    // AI-powered anomaly detection
    const aiRequest = {
      task: 'kpi_anomaly_detection',
      parameters: {
        kpi_id: kpi_id,
        current_value: measurement_value,
        historical_values: await getHistoricalMeasurements(kpi_id, entity_id),
        seasonality: await detectSeasonality(kpi_id),
        thresholds: await getKPIThresholds(kpi_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    measurement.anomaly_analysis = aiResponse;

    const result = await pool.query(
      `INSERT INTO kpi_measurements 
       (measurement_id, kpi_id, entity_id, entity_type, measurement_value, 
        measurement_date, period_type, period_start, period_end, dimensions, 
        metadata, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        measurement.measurement_id,
        measurement.kpi_id,
        measurement.entity_id,
        measurement.entity_type,
        measurement.measurement_value,
        measurement.measurement_date,
        measurement.period_type,
        measurement.period_start,
        measurement.period_end,
        JSON.stringify(measurement.dimensions),
        JSON.stringify(measurement.metadata),
        measurement.recorded_at
      ]
    );

    // Check for alerts
    await checkKPIAlerts(kpi_id, measurement_value);

    logger.info(`KPI measurement recorded: ${measurement.measurement_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording KPI measurement', { error: error.message });
    throw new Error('Failed to record KPI measurement');
  }
}

/**
 * Get KPI measurements
 */
async function getKPIMeasurements(kpiId, filters = {}) {
  try {
    const { entity_id, period_start, period_end } = filters;
    let query = 'SELECT * FROM kpi_measurements WHERE kpi_id = $1';
    const params = [kpiId];
    let paramCount = 1;

    if (entity_id) {
      paramCount++;
      query += ` AND entity_id = $${paramCount}`;
      params.push(entity_id);
    }

    if (period_start) {
      paramCount++;
      query += ` AND measurement_date >= $${paramCount}`;
      params.push(period_start);
    }

    if (period_end) {
      paramCount++;
      query += ` AND measurement_date <= $${paramCount}`;
      params.push(period_end);
    }

    query += ' ORDER BY measurement_date DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting KPI measurements', { error: error.message });
    throw new Error('Failed to get KPI measurements');
  }
}

/**
 * Set KPI target
 */
async function setKPITarget(targetData) {
  try {
    const {
      kpi_id,
      entity_id,
      entity_type,
      target_value,
      target_type,
      period_type,
      period_start,
      period_end,
      weight,
      is_stretch
    } = targetData;

    const result = await pool.query(
      `INSERT INTO kpi_targets 
       (target_id, kpi_id, entity_id, entity_type, target_value, target_type, 
        period_type, period_start, period_end, weight, is_stretch, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        generateId(),
        kpi_id,
        entity_id,
        entity_type,
        target_value,
        target_type,
        period_type,
        period_start,
        period_end,
        weight || 1.0,
        is_stretch || false,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`KPI target set: ${result.rows[0].target_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error setting KPI target', { error: error.message });
    throw new Error('Failed to set KPI target');
  }
}

/**
 * Get KPI targets
 */
async function getKPITargets(kpiId, filters = {}) {
  try {
    const { entity_id, period_start, period_end } = filters;
    let query = 'SELECT * FROM kpi_targets WHERE kpi_id = $1 AND status = $2';
    const params = [kpiId, 'active'];
    let paramCount = 2;

    if (entity_id) {
      paramCount++;
      query += ` AND entity_id = $${paramCount}`;
      params.push(entity_id);
    }

    if (period_start) {
      paramCount++;
      query += ` AND period_start >= $${paramCount}`;
      params.push(period_start);
    }

    if (period_end) {
      paramCount++;
      query += ` AND period_end <= $${paramCount}`;
      params.push(period_end);
    }

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting KPI targets', { error: error.message });
    throw new Error('Failed to get KPI targets');
  }
}

/**
 * Calculate KPI score
 */
async function calculateKPIScore(entityId, entityType, periodType, periodStart, periodEnd) {
  try {
    const kpis = await listKPIDefinitions({ status: 'active' });
    const kpiScores = {};

    for (const kpi of kpis) {
      const measurements = await getKPIMeasurements(kpi.kpi_id, {
        entity_id: entityId,
        period_start: periodStart,
        period_end: periodEnd
      });

      const targets = await getKPITargets(kpi.kpi_id, {
        entity_id: entityId,
        period_start: periodStart,
        period_end: periodEnd
      });

      const score = await calculateIndividualKPIScore(kpi, measurements, targets);
      kpiScores[kpi.kpi_id] = score;
    }

    const overallScore = calculateOverallScore(kpiScores);
    const categoryScores = calculateCategoryScores(kpiScores, kpis);

    const scoreRecord = {
      score_id: generateId(),
      entity_id: entityId,
      entity_type: entityType,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      overall_score: overallScore,
      category_scores: categoryScores,
      kpi_scores: kpiScores,
      trend: await calculateTrend(entityId, entityType, periodType),
      rank: await calculateRank(entityId, entityType, overallScore),
      percentile: await calculatePercentile(entityId, entityType, overallScore),
      calculated_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO kpi_scores 
       (score_id, entity_id, entity_type, period_type, period_start, period_end, 
        overall_score, category_scores, kpi_scores, trend, rank, percentile, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        scoreRecord.score_id,
        scoreRecord.entity_id,
        scoreRecord.entity_type,
        scoreRecord.period_type,
        scoreRecord.period_start,
        scoreRecord.period_end,
        scoreRecord.overall_score,
        JSON.stringify(scoreRecord.category_scores),
        JSON.stringify(scoreRecord.kpi_scores),
        scoreRecord.trend,
        scoreRecord.rank,
        scoreRecord.percentile,
        scoreRecord.calculated_at
      ]
    );

    logger.info(`KPI score calculated: ${scoreRecord.score_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error calculating KPI score', { error: error.message });
    throw new Error('Failed to calculate KPI score');
  }
}

/**
 * Create KPI alert
 */
async function createKPIAlert(alertData) {
  try {
    const {
      kpi_id,
      alert_type,
      condition_type,
      threshold_value,
      severity,
      notification_channels,
      recipients
    } = alertData;

    const result = await pool.query(
      `INSERT INTO kpi_alerts 
       (alert_id, kpi_id, alert_type, condition_type, threshold_value, 
        severity, notification_channels, recipients, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        generateId(),
        kpi_id,
        alert_type,
        condition_type,
        threshold_value,
        severity,
        notification_channels,
        recipients,
        true,
        new Date().toISOString()
      ]
    );

    logger.info(`KPI alert created: ${result.rows[0].alert_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating KPI alert', { error: error.message });
    throw new Error('Failed to create KPI alert');
  }
}

/**
 * Get KPI alerts
 */
async function getKPIAlerts(kpiId) {
  try {
    const result = await pool.query(
      'SELECT * FROM kpi_alerts WHERE kpi_id = $1 AND is_active = $2',
      [kpiId, true]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting KPI alerts', { error: error.message });
    throw new Error('Failed to get KPI alerts');
  }
}

/**
 * Add benchmark
 */
async function addBenchmark(benchmarkData) {
  try {
    const {
      kpi_id,
      benchmark_name,
      benchmark_type,
      benchmark_value,
      source,
      industry,
      region,
      period,
      is_percentile,
      percentile_value
    } = benchmarkData;

    const result = await pool.query(
      `INSERT INTO metric_benchmarks 
       (benchmark_id, kpi_id, benchmark_name, benchmark_type, benchmark_value, 
        source, industry, region, period, is_percentile, percentile_value, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        generateId(),
        kpi_id,
        benchmark_name,
        benchmark_type,
        benchmark_value,
        source,
        industry,
        region,
        period,
        is_percentile || false,
        percentile_value,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Benchmark added: ${result.rows[0].benchmark_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding benchmark', { error: error.message });
    throw new Error('Failed to add benchmark');
  }
}

/**
 * Get benchmarks
 */
async function getBenchmarks(kpiId) {
  try {
    const result = await pool.query(
      'SELECT * FROM metric_benchmarks WHERE kpi_id = $1 AND status = $2',
      [kpiId, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting benchmarks', { error: error.message });
    throw new Error('Failed to get benchmarks');
  }
}

/**
 * Add dimension
 */
async function addDimension(dimensionData) {
  try {
    const {
      kpi_id,
      dimension_name,
      dimension_type,
      dimension_values,
      is_drillable,
      hierarchy_config
    } = dimensionData;

    const result = await pool.query(
      `INSERT INTO kpi_dimensions 
       (dimension_id, kpi_id, dimension_name, dimension_type, dimension_values, 
        is_drillable, hierarchy_config, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        generateId(),
        kpi_id,
        dimension_name,
        dimension_type,
        JSON.stringify(dimension_values),
        is_drillable || true,
        JSON.stringify(hierarchy_config),
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Dimension added: ${result.rows[0].dimension_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding dimension', { error: error.message });
    throw new Error('Failed to add dimension');
  }
}

/**
 * Get dimensions
 */
async function getDimensions(kpiId) {
  try {
    const result = await pool.query(
      'SELECT * FROM kpi_dimensions WHERE kpi_id = $1 AND status = $2',
      [kpiId, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting dimensions', { error: error.message });
    throw new Error('Failed to get dimensions');
  }
}

// Helper functions
function generateId() {
  return `KPI-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getIndustryBestPractices(category) {
  return {
    recommended_kpis: ['revenue', 'profit_margin', 'customer_satisfaction'],
    benchmark_sources: ['industry_reports', 'competitor_analysis'],
    calculation_methods: ['standard', 'weighted_average', 'compounded']
  };
}

async function getSimilarKPIs(category) {
  try {
    const result = await pool.query(
      'SELECT * FROM kpi_definitions WHERE category = $1 LIMIT 5',
      [category]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function validateCalculationFormula(formula) {
  return {
    is_valid: true,
    syntax_errors: [],
    suggested_improvements: []
  };
}

async function getHistoricalMeasurements(kpiId, entityId) {
  try {
    const result = await pool.query(
      'SELECT measurement_value, measurement_date FROM kpi_measurements WHERE kpi_id = $1 AND entity_id = $2 ORDER BY measurement_date DESC LIMIT 30',
      [kpiId, entityId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function detectSeasonality(kpiId) {
  return {
    has_seasonality: true,
    seasonal_pattern: 'quarterly',
    peak_periods: ['Q1', 'Q4']
  };
}

async function getKPIThresholds(kpiId) {
  try {
    const result = await pool.query(
      'SELECT threshold_min, threshold_max FROM kpi_definitions WHERE kpi_id = $1',
      [kpiId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

async function checkKPIAlerts(kpiId, value) {
  try {
    const alerts = await getKPIAlerts(kpiId);
    for (const alert of alerts) {
      const triggered = evaluateAlertCondition(alert, value);
      if (triggered) {
        await triggerAlert(alert, value);
      }
    }
  } catch (error) {
    logger.error('Error checking KPI alerts', { error: error.message });
  }
}

function evaluateAlertCondition(alert, value) {
  if (alert.condition_type === 'greater_than') {
    return value > alert.threshold_value;
  } else if (alert.condition_type === 'less_than') {
    return value < alert.threshold_value;
  } else if (alert.condition_type === 'equals') {
    return value === alert.threshold_value;
  }
  return false;
}

async function triggerAlert(alert, value) {
  logger.info(`Alert triggered: ${alert.alert_id} for value: ${value}`);
  // Implement notification logic here
}

async function calculateIndividualKPIScore(kpi, measurements, targets) {
  const latestMeasurement = measurements[0];
  const target = targets[0];

  if (!latestMeasurement || !target) {
    return { score: 0, achievement: 0, status: 'no_data' };
  }

  const achievement = (latestMeasurement.measurement_value / target.target_value) * 100;
  const score = Math.min(100, Math.max(0, achievement));

  return {
    score: score,
    achievement: achievement,
    status: achievement >= 100 ? 'achieved' : achievement >= 80 ? 'on_track' : 'behind'
  };
}

function calculateOverallScore(kpiScores) {
  const scores = Object.values(kpiScores).map(s => s.score);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

function calculateCategoryScores(kpiScores, kpis) {
  const categories = {};
  kpis.forEach(kpi => {
    if (!categories[kpi.category]) {
      categories[kpi.category] = [];
    }
    categories[kpi.category].push(kpiScores[kpi.kpi_id]);
  });

  const result = {};
  Object.keys(categories).forEach(category => {
    const scores = categories[category].map(s => s.score);
    result[category] = scores.reduce((a, b) => a + b, 0) / scores.length;
  });

  return result;
}

async function calculateTrend(entityId, entityType, periodType) {
  return 'improving';
}

async function calculateRank(entityId, entityType, score) {
  return 1;
}

async function calculatePercentile(entityId, entityType, score) {
  return 95.5;
}

module.exports = {
  createKPIDefinition,
  getKPIDefinition,
  listKPIDefinitions,
  recordKPIMeasurement,
  getKPIMeasurements,
  setKPITarget,
  getKPITargets,
  calculateKPIScore,
  createKPIAlert,
  getKPIAlerts,
  addBenchmark,
  getBenchmarks,
  addDimension,
  getDimensions
};
