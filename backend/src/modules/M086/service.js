/**
 * Real-time Monitoring Service (M086)
 * Business Intelligence & Analytics - Real-time data monitoring and alerting
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/aiService');
const pool = require('../../database/pool');

/**
 * Create monitoring source
 */
async function createMonitoringSource(sourceData) {
  try {
    const {
      source_name,
      source_type,
      connection_config,
      refresh_interval,
      data_format
    } = sourceData;

    const source = {
      source_id: generateId(),
      source_name,
      source_type,
      connection_config,
      refresh_interval,
      data_format,
      status: 'active',
      created_at: new Date().toISOString()
    };

    // AI-powered source configuration
    const aiRequest = {
      task: 'monitoring_source_optimization',
      parameters: {
        source_type: source_type,
        connection_config: connection_config,
        best_practices: await getMonitoringBestPractices(source_type),
        similar_sources: await getSimilarSources(source_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    source.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO monitoring_sources 
       (source_id, source_name, source_type, connection_config, refresh_interval, 
        data_format, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        source.source_id,
        source.source_name,
        source.source_type,
        JSON.stringify(source.connection_config),
        source.refresh_interval,
        source.data_format,
        source.status,
        source.created_at
      ]
    );

    logger.info(`Monitoring source created: ${source.source_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating monitoring source', { error: error.message, stack: error.stack });
    throw new Error('Failed to create monitoring source');
  }
}

/**
 * Add monitoring metric
 */
async function addMonitoringMetric(metricData) {
  try {
    const {
      source_id,
      metric_name,
      metric_type,
      data_path,
      aggregation_method,
      unit,
      thresholds
    } = metricData;

    const result = await pool.query(
      `INSERT INTO monitoring_metrics 
       (metric_id, source_id, metric_name, metric_type, data_path, 
        aggregation_method, unit, thresholds, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        generateId(),
        source_id,
        metric_name,
        metric_type,
        data_path,
        aggregation_method,
        unit,
        JSON.stringify(thresholds || {}),
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Monitoring metric added: ${result.rows[0].metric_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding monitoring metric', { error: error.message });
    throw new Error('Failed to add monitoring metric');
  }
}

/**
 * Ingest real-time data
 */
async function ingestRealTimeData(metricId, value, timestamp, metadata = {}) {
  try {
    // AI-powered data quality assessment
    const aiRequest = {
      task: 'data_quality_assessment',
      parameters: {
        metric_id: metricId,
        current_value: value,
        historical_values: await getHistoricalData(metricId),
        expected_range: await getExpectedRange(metricId)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);

    const data = {
      data_id: generateId(),
      metric_id: metricId,
      value,
      timestamp,
      quality_score: aiResponse.quality_score,
      metadata: JSON.stringify(metadata),
      ingested_at: new Date().toISOString()
    };

    const result = await pool.query(
      `INSERT INTO real_time_data 
       (data_id, metric_id, value, timestamp, quality_score, metadata, ingested_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        data.data_id,
        data.metric_id,
        data.value,
        data.timestamp,
        data.quality_score,
        data.metadata,
        data.ingested_at
      ]
    );

    // Check for alerts
    await checkMonitoringAlerts(metricId, value);

    logger.info(`Real-time data ingested: ${data.data_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error ingesting real-time data', { error: error.message });
    throw new Error('Failed to ingest real-time data');
  }
}

/**
 * Get real-time data
 */
async function getRealTimeData(metricId, filters = {}) {
  try {
    const { start_time, end_time } = filters;
    let query = 'SELECT * FROM real_time_data WHERE metric_id = $1';
    const params = [metricId];
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

    query += ' ORDER BY timestamp DESC LIMIT 1000';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting real-time data', { error: error.message });
    throw new Error('Failed to get real-time data');
  }
}

/**
 * Create monitoring dashboard
 */
async function createMonitoringDashboard(dashboardData) {
  try {
    const {
      dashboard_name,
      dashboard_type,
      layout_config,
      refresh_interval,
      is_public,
      created_by
    } = dashboardData;

    const result = await pool.query(
      `INSERT INTO monitoring_dashboards 
       (dashboard_id, dashboard_name, dashboard_type, layout_config, 
        refresh_interval, is_public, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        generateId(),
        dashboard_name,
        dashboard_type,
        JSON.stringify(layout_config || {}),
        refresh_interval || 30,
        is_public || false,
        created_by,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Monitoring dashboard created: ${result.rows[0].dashboard_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating monitoring dashboard', { error: error.message });
    throw new Error('Failed to create monitoring dashboard');
  }
}

/**
 * Add dashboard widget
 */
async function addDashboardWidget(widgetData) {
  try {
    const {
      dashboard_id,
      metric_id,
      widget_type,
      widget_config,
      position_x,
      position_y,
      width,
      height
    } = widgetData;

    const result = await pool.query(
      `INSERT INTO dashboard_widgets 
       (widget_id, dashboard_id, metric_id, widget_type, widget_config, 
        position_x, position_y, width, height, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        generateId(),
        dashboard_id,
        metric_id,
        widget_type,
        JSON.stringify(widget_config || {}),
        position_x,
        position_y,
        width,
        height,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Dashboard widget added: ${result.rows[0].widget_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding dashboard widget', { error: error.message });
    throw new Error('Failed to add dashboard widget');
  }
}

/**
 * Create monitoring alert
 */
async function createMonitoringAlert(alertData) {
  try {
    const {
      metric_id,
      alert_name,
      alert_type,
      condition_type,
      threshold_value,
      severity,
      notification_channels,
      recipients,
      cooldown_period
    } = alertData;

    const result = await pool.query(
      `INSERT INTO monitoring_alerts 
       (alert_id, metric_id, alert_name, alert_type, condition_type, 
        threshold_value, severity, notification_channels, recipients, 
        cooldown_period, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        generateId(),
        metric_id,
        alert_name,
        alert_type,
        condition_type,
        threshold_value,
        severity,
        notification_channels,
        recipients,
        cooldown_period,
        true,
        new Date().toISOString()
      ]
    );

    logger.info(`Monitoring alert created: ${result.rows[0].alert_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating monitoring alert', { error: error.message });
    throw new Error('Failed to create monitoring alert');
  }
}

/**
 * Get monitoring alerts
 */
async function getMonitoringAlerts(metricId) {
  try {
    const result = await pool.query(
      'SELECT * FROM monitoring_alerts WHERE metric_id = $1 AND is_active = $2',
      [metricId, true]
    );
    return result.rows;
  } catch (error) {
    logger.error('Error getting monitoring alerts', { error: error.message });
    throw new Error('Failed to get monitoring alerts');
  }
}

/**
 * Log monitoring event
 */
async function logMonitoringEvent(eventData) {
  try {
    const {
      event_type,
      entity_id,
      entity_type,
      event_data,
      severity,
      source,
      timestamp
    } = eventData;

    const result = await pool.query(
      `INSERT INTO monitoring_events 
       (event_id, event_type, entity_id, entity_type, event_data, 
        severity, source, timestamp, processed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        generateId(),
        event_type,
        entity_id,
        entity_type,
        JSON.stringify(event_data || {}),
        severity,
        source,
        timestamp,
        new Date().toISOString()
      ]
    );

    logger.info(`Monitoring event logged: ${result.rows[0].event_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error logging monitoring event', { error: error.message });
    throw new Error('Failed to log monitoring event');
  }
}

/**
 * Get alert history
 */
async function getAlertHistory(alertId, filters = {}) {
  try {
    const { start_time, end_time } = filters;
    let query = 'SELECT * FROM alert_history WHERE alert_id = $1';
    const params = [alertId];
    let paramCount = 1;

    if (start_time) {
      paramCount++;
      query += ` AND triggered_at >= $${paramCount}`;
      params.push(start_time);
    }

    if (end_time) {
      paramCount++;
      query += ` AND triggered_at <= $${paramCount}`;
      params.push(end_time);
    }

    query += ' ORDER BY triggered_at DESC';

    const result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting alert history', { error: error.message });
    throw new Error('Failed to get alert history');
  }
}

// Helper functions
function generateId() {
  return `RTM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getMonitoringBestPractices(sourceType) {
  return {
    recommended_refresh_intervals: ['1s', '5s', '30s', '1m'],
    data_formats: ['json', 'csv', 'xml'],
    connection_methods: ['websocket', 'polling', 'webhook']
  };
}

async function getSimilarSources(sourceType) {
  try {
    const result = await pool.query(
      'SELECT * FROM monitoring_sources WHERE source_type = $1 LIMIT 5',
      [sourceType]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getHistoricalData(metricId) {
  try {
    const result = await pool.query(
      'SELECT value, timestamp FROM real_time_data WHERE metric_id = $1 ORDER BY timestamp DESC LIMIT 100',
      [metricId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getExpectedRange(metricId) {
  try {
    const result = await pool.query(
      'SELECT thresholds FROM monitoring_metrics WHERE metric_id = $1',
      [metricId]
    );
    return result.rows[0]?.thresholds || {};
  } catch (error) {
    return {};
  }
}

async function checkMonitoringAlerts(metricId, value) {
  try {
    const alerts = await getMonitoringAlerts(metricId);
    for (const alert of alerts) {
      const triggered = evaluateAlertCondition(alert, value);
      if (triggered) {
        await triggerMonitoringAlert(alert, value);
      }
    }
  } catch (error) {
    logger.error('Error checking monitoring alerts', { error: error.message });
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

async function triggerMonitoringAlert(alert, value) {
  try {
    const history = {
      history_id: generateId(),
      alert_id: alert.alert_id,
      metric_id: alert.metric_id,
      triggered_value: value,
      threshold_value: alert.threshold_value,
      message: `Alert triggered: ${alert.alert_name}`,
      status: 'triggered',
      triggered_at: new Date().toISOString()
    };

    await pool.query(
      `INSERT INTO alert_history 
       (history_id, alert_id, metric_id, triggered_value, threshold_value, 
        message, status, triggered_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        history.history_id,
        history.alert_id,
        history.metric_id,
        history.triggered_value,
        history.threshold_value,
        history.message,
        history.status,
        history.triggered_at
      ]
    );

    // Update alert trigger count
    await pool.query(
      'UPDATE monitoring_alerts SET last_triggered = $1, trigger_count = trigger_count + 1 WHERE alert_id = $2',
      [new Date().toISOString(), alert.alert_id]
    );

    logger.info(`Monitoring alert triggered: ${alert.alert_id}`);
  } catch (error) {
    logger.error('Error triggering monitoring alert', { error: error.message });
  }
}

module.exports = {
  createMonitoringSource,
  addMonitoringMetric,
  ingestRealTimeData,
  getRealTimeData,
  createMonitoringDashboard,
  addDashboardWidget,
  createMonitoringAlert,
  getMonitoringAlerts,
  logMonitoringEvent,
  getAlertHistory
};
