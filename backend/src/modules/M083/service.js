/**
 * Performance Analytics Service (M083)
 * Business Intelligence & Analytics - Performance measurement and analysis
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Record performance metric
 */
async function recordPerformanceMetric(metricData) {
  try {
    const {
      entity_id,
      entity_type,
      metric_name,
      metric_category,
      metric_value,
      metric_unit,
      baseline_value,
      period_type,
      period_start,
      period_end,
      dimensions,
      metadata
    } = metricData;

    const variance = baseline_value ? metric_value - baseline_value : 0;
    const variance_percentage = baseline_value ? (variance / baseline_value) * 100 : 0;

    const metric = {
      metric_id: generateId(),
      entity_id,
      entity_type,
      metric_name,
      metric_category,
      metric_value,
      metric_unit,
      baseline_value,
      variance,
      variance_percentage,
      period_type,
      period_start,
      period_end,
      dimensions: dimensions || {},
      metadata: metadata || {},
      recorded_at: new Date().toISOString()
    };

    // AI-powered performance analysis
    const aiRequest = {
      task: 'performance_metric_analysis',
      parameters: {
        metric_name: metric_name,
        current_value: metric_value,
        baseline_value: baseline_value,
        historical_performance: await getHistoricalPerformance(entity_id, metric_name),
        industry_benchmarks: await getIndustryBenchmarks(metric_name),
        context: await getPerformanceContext(entity_id, entity_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    metric.ai_insights = aiResponse;

    const result = await pool.query(
      `INSERT INTO performance_metrics 
       (metric_id, entity_id, entity_type, metric_name, metric_category, metric_value, 
        metric_unit, baseline_value, variance, variance_percentage, period_type, 
        period_start, period_end, dimensions, metadata, recorded_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
       RETURNING *`,
      [
        metric.metric_id,
        metric.entity_id,
        metric.entity_type,
        metric.metric_name,
        metric.metric_category,
        metric.metric_value,
        metric.metric_unit,
        metric.baseline_value,
        metric.variance,
        metric.variance_percentage,
        metric.period_type,
        metric.period_start,
        metric.period_end,
        JSON.stringify(metric.dimensions),
        JSON.stringify(metric.metadata),
        metric.recorded_at
      ]
    );

    logger.info(`Performance metric recorded: ${metric.metric_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error recording performance metric', { error: error.message, stack: error.stack });
    throw new Error('Failed to record performance metric');
  }
}

/**
 * Get performance metrics
 */
async function getPerformanceMetrics(entityId, entityType, filters = {}) {
  try {
    const { metric_category, period_start, period_end } = filters;
    let query = 'SELECT * FROM performance_metrics WHERE entity_id = $1 AND entity_type = $2';
    const params = [entityId, entityType];
    let paramCount = 2;

    if (metric_category) {
      paramCount++;
      query += ` AND metric_category = $${paramCount}`;
      params.push(metric_category);
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

    query += ' ORDER BY period_start DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting performance metrics', { error: error.message });
    throw new Error('Failed to get performance metrics');
  }
}

/**
 * Generate performance report
 */
async function generatePerformanceReport(entityId, entityType, reportType, periodType, periodStart, periodEnd) {
  try {
    const metrics = await getPerformanceMetrics(entityId, entityType, {
      period_start: periodStart,
      period_end: periodEnd
    });

    const benchmarks = await getRelevantBenchmarks(metrics);
    const trends = await analyzeTrends(entityId, entityType, metrics);
    const drivers = await identifyPerformanceDrivers(entityId, entityType, metrics);

    const categoryScores = calculateCategoryScores(metrics);
    const overallScore = calculateOverallScore(categoryScores);

    // AI-powered insights generation
    const aiRequest = {
      task: 'performance_report_insights',
      parameters: {
        metrics: metrics,
        benchmarks: benchmarks,
        trends: trends,
        drivers: drivers,
        entity_context: await getPerformanceContext(entityId, entityType)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const report = {
      report_id: generateId(),
      entity_id: entityId,
      entity_type: entityType,
      report_type: reportType,
      period_type: periodType,
      period_start: periodStart,
      period_end: periodEnd,
      overall_score: overallScore,
      category_scores: categoryScores,
      metric_details: metrics,
      trend_analysis: trends,
      insights: aiResponse.insights,
      recommendations: aiResponse.recommendations,
      generated_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO performance_reports 
       (report_id, entity_id, entity_type, report_type, period_type, period_start, period_end, 
        overall_score, category_scores, metric_details, trend_analysis, insights, recommendations, generated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        report.report_id,
        report.entity_id,
        report.entity_type,
        report.report_type,
        report.period_type,
        report.period_start,
        report.period_end,
        report.overall_score,
        JSON.stringify(report.category_scores),
        JSON.stringify(report.metric_details),
        JSON.stringify(report.trend_analysis),
        JSON.stringify(report.insights),
        JSON.stringify(report.recommendations),
        report.generated_at
      ]
    );

    logger.info(`Performance report generated: ${report.report_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error generating performance report', { error: error.message });
    throw new Error('Failed to generate performance report');
  }
}

/**
 * Analyze performance trends
 */
async function analyzePerformanceTrends(entityId, entityType, metricName, periodStart, periodEnd) {
  try {
    const metrics = await getPerformanceMetrics(entityId, entityType, {
      period_start: periodStart,
      period_end: periodEnd
    });

    const metricData = metrics.filter(m => m.metric_name === metricName);

    if (metricData.length < 2) {
      throw new Error('Insufficient data for trend analysis');
    }

    // AI-powered trend analysis
    const aiRequest = {
      task: 'performance_trend_analysis',
      parameters: {
        metric_name: metricName,
        time_series_data: metricData,
        seasonality: await detectSeasonality(metricName),
        external_factors: await getExternalFactors(entityId, entityType)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const trend = {
      trend_id: generateId(),
      entity_id: entityId,
      entity_type: entityType,
      metric_name: metricName,
      trend_type: aiResponse.trend_type,
      trend_direction: aiResponse.trend_direction,
      trend_strength: aiResponse.trend_strength,
      forecast_value: aiResponse.forecast_value,
      confidence_level: aiResponse.confidence_level,
      time_series_data: metricData,
      analysis_period_start: periodStart,
      analysis_period_end: periodEnd,
      calculated_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO performance_trends 
       (trend_id, entity_id, entity_type, metric_name, trend_type, trend_direction, 
        trend_strength, forecast_value, confidence_level, time_series_data, 
        analysis_period_start, analysis_period_end, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        trend.trend_id,
        trend.entity_id,
        trend.entity_type,
        trend.metric_name,
        trend.trend_type,
        trend.trend_direction,
        trend.trend_strength,
        trend.forecast_value,
        trend.confidence_level,
        JSON.stringify(trend.time_series_data),
        trend.analysis_period_start,
        trend.analysis_period_end,
        trend.calculated_at
      ]
    );

    logger.info(`Performance trend analyzed: ${trend.trend_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error analyzing performance trends', { error: error.message });
    throw new Error('Failed to analyze performance trends');
  }
}

/**
 * Compare performance
 */
async function comparePerformance(comparisonData) {
  try {
    const {
      entity_id,
      entity_type,
      comparison_type,
      comparison_entities,
      metrics_to_compare,
      comparison_date
    } = comparisonData;

    const results = {};
    const ranking = {};

    for (const metric of metrics_to_compare) {
      const metricResults = [];
      for (const entity of comparison_entities) {
        const metrics = await getPerformanceMetrics(entity.id, entity.type, {
          metric_category: metric.category
        });
        const latestMetric = metrics[0];
        metricResults.push({
          entity_id: entity.id,
          entity_name: entity.name,
          value: latestMetric?.metric_value || 0,
          variance: latestMetric?.variance || 0
        });
      }

      // Sort by value
      metricResults.sort((a, b) => b.value - a.value);

      results[metric.name] = metricResults;
      ranking[metric.name] = metricResults.map((m, i) => ({
        entity_id: m.entity_id,
        rank: i + 1,
        value: m.value
      }));
    }

    const gaps = calculatePerformanceGaps(results);
    const opportunities = identifyOpportunities(results, ranking);

    // AI-powered comparison insights
    const aiRequest = {
      task: 'performance_comparison_insights',
      parameters: {
        comparison_type: comparison_type,
        results: results,
        ranking: ranking,
        gaps: gaps
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const comparison = {
      comparison_id: generateId(),
      entity_id,
      entity_type,
      comparison_type,
      comparison_entities,
      metrics_compared: metrics_to_compare,
      results,
      ranking,
      gaps,
      opportunities,
      ai_insights: aiResponse,
      comparison_date,
      created_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO performance_comparisons 
       (comparison_id, entity_id, entity_type, comparison_type, comparison_entities, 
        metrics_compared, results, ranking, gaps, opportunities, comparison_date, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        comparison.comparison_id,
        comparison.entity_id,
        comparison.entity_type,
        comparison.comparison_type,
        JSON.stringify(comparison.comparison_entities),
        JSON.stringify(comparison.metrics_compared),
        JSON.stringify(comparison.results),
        JSON.stringify(comparison.ranking),
        JSON.stringify(comparison.gaps),
        JSON.stringify(comparison.opportunities),
        comparison.comparison_date,
        comparison.created_at
      ]
    );

    logger.info(`Performance comparison created: ${comparison.comparison_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error comparing performance', { error: error.message });
    throw new Error('Failed to compare performance');
  }
}

/**
 * Set performance target
 */
async function setPerformanceTarget(targetData) {
  try {
    const {
      entity_id,
      entity_type,
      metric_name,
      target_value,
      target_type,
      stretch_target,
      baseline_value,
      period_type,
      period_start,
      period_end,
      weight
    } = targetData;

    const result = await pool.query(
      `INSERT INTO performance_targets 
       (target_id, entity_id, entity_type, metric_name, target_value, target_type, 
        stretch_target, baseline_value, period_type, period_start, period_end, weight, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [
        generateId(),
        entity_id,
        entity_type,
        metric_name,
        target_value,
        target_type,
        stretch_target,
        baseline_value,
        period_type,
        period_start,
        period_end,
        weight || 1.0,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Performance target set: ${result.rows[0].target_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error setting performance target', { error: error.message });
    throw new Error('Failed to set performance target');
  }
}

/**
 * Get performance targets
 */
async function getPerformanceTargets(entityId, entityType) {
  try {
    const result = await pool.query(
      'SELECT * FROM performance_targets WHERE entity_id = $1 AND entity_type = $2 AND status = $3',
      [entityId, entityType, 'active']
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting performance targets', { error: error.message });
    throw new Error('Failed to get performance targets');
  }
}

/**
 * Identify performance drivers
 */
async function identifyPerformanceDrivers(entityId, entityType, metrics) {
  try {
    // AI-powered driver identification
    const aiRequest = {
      task: 'performance_driver_identification',
      parameters: {
        metrics: metrics,
        entity_context: await getPerformanceContext(entityId, entityType),
        historical_correlations: await getHistoricalCorrelations(entityId, entityType)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const drivers = [];
    for (const driver of aiResponse.drivers) {
      const result = await pool.query(
        `INSERT INTO performance_drivers 
         (driver_id, entity_id, entity_type, driver_name, driver_category, 
          impact_score, correlation_coefficient, influence_weight, driver_data, 
          analysis_period_start, analysis_period_end, identified_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         RETURNING *`,
        [
          generateId(),
          entityId,
          entityType,
          driver.name,
          driver.category,
          driver.impact_score,
          driver.correlation_coefficient,
          driver.influence_weight,
          JSON.stringify(driver.data),
          driver.analysis_period_start,
          driver.analysis_period_end,
          new Date().toISOString()
        ]
      );
      drivers.push(result.rows[0]);
    }

    return drivers;
  } catch (error) {
    logger.error('Error identifying performance drivers', { error: error.message });
    throw new Error('Failed to identify performance drivers');
  }
}

/**
 * Create performance alert
 */
async function createPerformanceAlert(alertData) {
  try {
    const {
      entity_id,
      entity_type,
      metric_name,
      alert_type,
      severity,
      current_value,
      threshold_value,
      message,
      recommended_actions
    } = alertData;

    const result = await pool.query(
      `INSERT INTO performance_alerts 
       (alert_id, entity_id, entity_type, metric_name, alert_type, severity, 
        current_value, threshold_value, message, recommended_actions, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        generateId(),
        entity_id,
        entity_type,
        metric_name,
        alert_type,
        severity,
        current_value,
        threshold_value,
        message,
        JSON.stringify(recommended_actions),
        new Date().toISOString()
      ]
    );

    logger.info(`Performance alert created: ${result.rows[0].alert_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating performance alert', { error: error.message });
    throw new Error('Failed to create performance alert');
  }
}

/**
 * Get performance alerts
 */
async function getPerformanceAlerts(entityId, entityType, filters = {}) {
  try {
    const { is_resolved } = filters;
    let query = 'SELECT * FROM performance_alerts WHERE entity_id = $1 AND entity_type = $2';
    const params = [entityId, entityType];
    let paramCount = 2;

    if (is_resolved !== undefined) {
      paramCount++;
      query += ` AND is_resolved = $${paramCount}`;
      params.push(is_resolved);
    }

    query += ' ORDER BY triggered_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting performance alerts', { error: error.message });
    throw new Error('Failed to get performance alerts');
  }
}

// Helper functions
function generateId() {
  return `PERF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getHistoricalPerformance(entityId, metricName) {
  try {
    const result = await pool.query(
      'SELECT metric_value, period_start FROM performance_metrics WHERE entity_id = $1 AND metric_name = $2 ORDER BY period_start DESC LIMIT 12',
      [entityId, metricName]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getIndustryBenchmarks(metricName) {
  try {
    const result = await pool.query(
      'SELECT * FROM performance_benchmarks WHERE metric_name = $1 AND status = $2',
      [metricName, 'active']
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getPerformanceContext(entityId, entityType) {
  return {
    entity_size: 'medium',
    industry: 'agriculture',
    region: 'national',
    business_cycle: 'growth'
  };
}

async function getRelevantBenchmarks(metrics) {
  const benchmarks = {};
  for (const metric of metrics) {
    benchmarks[metric.metric_name] = await getIndustryBenchmarks(metric.metric_name);
  }
  return benchmarks;
}

async function analyzeTrends(entityId, entityType, metrics) {
  const trends = {};
  for (const metric of metrics) {
    trends[metric.metric_name] = {
      direction: 'increasing',
      strength: 0.75,
      forecast: metric.metric_value * 1.05
    };
  }
  return trends;
}

function calculateCategoryScores(metrics) {
  const categories = {};
  metrics.forEach(metric => {
    if (!categories[metric.metric_category]) {
      categories[metric.metric_category] = [];
    }
    categories[metric.metric_category].push(metric);
  });

  const scores = {};
  Object.keys(categories).forEach(category => {
    const values = categories[category].map(m => m.metric_value);
    scores[category] = values.reduce((a, b) => a + b, 0) / values.length;
  });

  return scores;
}

function calculateOverallScore(categoryScores) {
  const scores = Object.values(categoryScores);
  if (scores.length === 0) return 0;
  return scores.reduce((a, b) => a + b, 0) / scores.length;
}

async function detectSeasonality(metricName) {
  return {
    has_seasonality: true,
    pattern: 'quarterly'
  };
}

async function getExternalFactors(entityId, entityType) {
  return {
    market_conditions: 'favorable',
    regulatory_changes: 'none',
    economic_indicators: 'stable'
  };
}

function calculatePerformanceGaps(results) {
  const gaps = {};
  Object.keys(results).forEach(metricName => {
    const values = results[metricName];
    const max = Math.max(...values.map(v => v.value));
    const min = Math.min(...values.map(v => v.value));
    gaps[metricName] = {
      max_gap: max - min,
      gap_percentage: ((max - min) / max) * 100
    };
  });
  return gaps;
}

function identifyOpportunities(results, ranking) {
  return {
    improvement_areas: ['efficiency', 'cost_reduction'],
    best_practices: ['automation', 'data_driven_decisions']
  };
}

async function getHistoricalCorrelations(entityId, entityType) {
  return {};
}

module.exports = {
  recordPerformanceMetric,
  getPerformanceMetrics,
  generatePerformanceReport,
  analyzePerformanceTrends,
  comparePerformance,
  setPerformanceTarget,
  getPerformanceTargets,
  identifyPerformanceDrivers,
  createPerformanceAlert,
  getPerformanceAlerts
};
