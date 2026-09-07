/**
 * Comparative Analytics Service (M085)
 * Business Intelligence & Analytics - Entity comparison and benchmarking
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create comparison group
 */
async function createComparisonGroup(groupData) {
  try {
    const {
      group_name,
      group_type,
      description,
      entity_ids,
      entity_types,
      comparison_dimensions,
      created_by
    } = groupData;

    const group = {
      group_id: generateId(),
      group_name,
      group_type,
      description,
      entity_ids,
      entity_types,
      comparison_dimensions: comparison_dimensions || {},
      created_by,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered group optimization
    const aiRequest = {
      task: 'comparison_group_optimization',
      parameters: {
        group_type: group_type,
        entities: entity_ids,
        comparison_best_practices: await getComparisonBestPractices(group_type),
        similar_groups: await getSimilarGroups(group_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    group.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO comparison_groups 
       (group_id, group_name, group_type, description, entity_ids, entity_types, 
        comparison_dimensions, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        group.group_id,
        group.group_name,
        group.group_type,
        group.description,
        group.entity_ids,
        group.entity_types,
        JSON.stringify(group.comparison_dimensions),
        group.created_by,
        group.status,
        group.created_at
      ]
    );

    logger.info(`Comparison group created: ${group.group_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating comparison group', { error: error.message, stack: error.stack });
    throw new Error('Failed to create comparison group');
  }
}

/**
 * Create comparison configuration
 */
async function createComparisonConfig(configData) {
  try {
    const {
      group_id,
      config_name,
      metrics_to_compare,
      dimensions_to_compare,
      weightings,
      normalization_method,
      aggregation_method,
      baseline_entity_id
    } = configData;

    const result = await pool.query(
      `INSERT INTO comparison_configs 
       (config_id, group_id, config_name, metrics_to_compare, dimensions_to_compare, 
        weightings, normalization_method, aggregation_method, baseline_entity_id, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        generateId(),
        group_id,
        config_name,
        metrics_to_compare,
        dimensions_to_compare,
        JSON.stringify(weightings || {}),
        normalization_method,
        aggregation_method,
        baseline_entity_id,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Comparison config created: ${result.rows[0].config_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating comparison config', { error: error.message });
    throw new Error('Failed to create comparison config');
  }
}

/**
 * Run comparison
 */
async function runComparison(configId, comparisonDate, periodStart, periodEnd) {
  try {
    const config = await getComparisonConfig(configId);
    const group = await getComparisonGroup(config.group_id);

    const entityScores = {};
    const metricComparisons = {};
    const rankings = {};

    for (const metric of config.metrics_to_compare) {
      const metricData = await fetchMetricData(metric, group.entity_ids, periodStart, periodEnd);
      const normalizedData = normalizeData(metricData, config.normalization_method);
      const weightedData = applyWeights(normalizedData, config.weightings);

      metricComparisons[metric] = weightedData;
      rankings[metric] = calculateRanking(weightedData);
    }

    for (const entityId of group.entity_ids) {
      entityScores[entityId] = calculateEntityScore(entityId, metricComparisons, config.weightings);
    }

    const gaps = calculateGaps(entityScores, config.baseline_entity_id);

    // AI-powered insights
    const aiRequest = {
      task: 'comparison_insights',
      parameters: {
        entity_scores: entityScores,
        metric_comparisons: metricComparisons,
        rankings: rankings,
        gaps: gaps,
        group_context: await getGroupContext(group.group_id)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const result = await pool.query(
      `INSERT INTO comparison_results 
       (result_id, config_id, comparison_date, period_start, period_end, 
        entity_scores, metric_comparisons, rankings, gaps, insights, recommendations, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        generateId(),
        configId,
        comparisonDate,
        periodStart,
        periodEnd,
        JSON.stringify(entityScores),
        JSON.stringify(metricComparisons),
        JSON.stringify(rankings),
        JSON.stringify(gaps),
        JSON.stringify(aiResponse.insights),
        JSON.stringify(aiResponse.recommendations),
        new Date().toISOString()
      ]
    );

    logger.info(`Comparison completed: ${result.rows[0].result_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error running comparison', { error: error.message });
    throw new Error('Failed to run comparison');
  }
}

/**
 * Add benchmark
 */
async function addBenchmark(benchmarkData) {
  try {
    const {
      group_id,
      benchmark_name,
      benchmark_type,
      benchmark_values,
      source,
      industry,
      region,
      period
    } = benchmarkData;

    const result = await pool.query(
      `INSERT INTO comparison_benchmarks 
       (benchmark_id, group_id, benchmark_name, benchmark_type, benchmark_values, 
        source, industry, region, period, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        generateId(),
        group_id,
        benchmark_name,
        benchmark_type,
        JSON.stringify(benchmark_values),
        source,
        industry,
        region,
        period,
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
async function getBenchmarks(groupId) {
  try {
    const result = await pool.query(
      'SELECT * FROM comparison_benchmarks WHERE group_id = $1 AND status = $2',
      [groupId, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting benchmarks', { error: error.message });
    throw new Error('Failed to get benchmarks');
  }
}

/**
 * Create comparison alert
 */
async function createComparisonAlert(alertData) {
  try {
    const {
      config_id,
      entity_id,
      alert_type,
      alert_condition,
      threshold_value,
      current_value,
      severity,
      message
    } = alertData;

    const result = await pool.query(
      `INSERT INTO comparison_alerts 
       (alert_id, config_id, entity_id, alert_type, alert_condition, 
        threshold_value, current_value, severity, message, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        generateId(),
        config_id,
        entity_id,
        alert_type,
        alert_condition,
        threshold_value,
        current_value,
        severity,
        message,
        new Date().toISOString()
      ]
    );

    logger.info(`Comparison alert created: ${result.rows[0].alert_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating comparison alert', { error: error.message });
    throw new Error('Failed to create comparison alert');
  }
}

/**
 * Get comparison alerts
 */
async function getComparisonAlerts(configId, filters = {}) {
  try {
    const { is_active } = filters;
    let query = 'SELECT * FROM comparison_alerts WHERE config_id = $1';
    const params = [configId];
    let paramCount = 1;

    if (is_active !== undefined) {
      paramCount++;
      query += ` AND is_active = $${paramCount}`;
      params.push(is_active);
    }

    query += ' ORDER BY triggered_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting comparison alerts', { error: error.message });
    throw new Error('Failed to get comparison alerts');
  }
}

/**
 * Create snapshot
 */
async function createSnapshot(configId, snapshotName, comparisonDate, createdBy) {
  try {
    const latestResult = await getLatestComparisonResult(configId);

    const result = await pool.query(
      `INSERT INTO comparison_snapshots 
       (snapshot_id, config_id, snapshot_name, snapshot_data, comparison_date, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        generateId(),
        configId,
        snapshotName,
        JSON.stringify(latestResult),
        comparisonDate,
        createdBy,
        new Date().toISOString()
      ]
    );

    logger.info(`Snapshot created: ${result.rows[0].snapshot_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating snapshot', { error: error.message });
    throw new Error('Failed to create snapshot');
  }
}

// Helper functions
function generateId() {
  return `COMP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getComparisonBestPractices(groupType) {
  return {
    recommended_metrics: ['revenue', 'profit', 'efficiency'],
    normalization_methods: ['min_max', 'z_score', 'percentile'],
    weighting_strategies: ['equal', 'manual', 'data_driven']
  };
}

async function getSimilarGroups(groupType) {
  try {
    const result = await pool.query(
      'SELECT * FROM comparison_groups WHERE group_type = $1 LIMIT 5',
      [groupType]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getComparisonConfig(configId) {
  try {
    const result = await pool.query(
      'SELECT * FROM comparison_configs WHERE config_id = $1',
      [configId]
    );
    return result.rows[0];
  } catch (error) {
    return null;
  }
}

async function getComparisonGroup(groupId) {
  try {
    const result = await pool.query(
      'SELECT * FROM comparison_groups WHERE group_id = $1',
      [groupId]
    );
    return result.rows[0];
  } catch (error) {
    return null;
  }
}

async function fetchMetricData(metric, entityIds, periodStart, periodEnd) {
  return {};
}

function normalizeData(data, method) {
  return data;
}

function applyWeights(data, weightings) {
  return data;
}

function calculateRanking(data) {
  return [];
}

function calculateEntityScore(entityId, metricComparisons, weightings) {
  return 0;
}

function calculateGaps(entityScores, baselineEntityId) {
  return {};
}

async function getGroupContext(groupId) {
  return {};
}

async function getLatestComparisonResult(configId) {
  try {
    const result = await pool.query(
      'SELECT * FROM comparison_results WHERE config_id = $1 ORDER BY generated_at DESC LIMIT 1',
      [configId]
    );
    return result.rows[0] || {};
  } catch (error) {
    return {};
  }
}

module.exports = {
  createComparisonGroup,
  createComparisonConfig,
  runComparison,
  addBenchmark,
  getBenchmarks,
  createComparisonAlert,
  getComparisonAlerts,
  createSnapshot
};
