/**
 * Alert Management Service (M087)
 * Business Intelligence & Analytics - Comprehensive alert management system
 */

const { logger } = require('../../utils/logger');
const { aiAPI } = require('../../services/legacy/aiService');
const pool = require('../../database/pool');

/**
 * Create alert rule
 */
async function createAlertRule(ruleData) {
  try {
    const {
      rule_name,
      rule_type,
      data_source,
      metric_name,
      condition_type,
      condition_config,
      severity,
      description,
      created_by
    } = ruleData;

    const rule = {
      rule_id: generateId(),
      rule_name,
      rule_type,
      data_source,
      metric_name,
      condition_type,
      condition_config,
      severity,
      description,
      is_active: true,
      created_by,
      created_at: new Date().toISOString()
    };

    // AI-powered rule optimization
    const aiRequest = {
      task: 'alert_rule_optimization',
      parameters: {
        rule_type: rule_type,
        condition_config: condition_config,
        best_practices: await getAlertBestPractices(rule_type),
        similar_rules: await getSimilarRules(rule_type)
      }
    };

    const aiResponse = await aiAPI.generateRecommendation(aiRequest);
    rule.ai_recommendations = aiResponse;

    const result = await pool.query(
      `INSERT INTO alert_rules 
       (rule_id, rule_name, rule_type, data_source, metric_name, condition_type, 
        condition_config, severity, description, is_active, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        rule.rule_id,
        rule.rule_name,
        rule.rule_type,
        rule.data_source,
        rule.metric_name,
        rule.condition_type,
        JSON.stringify(rule.condition_config),
        rule.severity,
        rule.description,
        rule.is_active,
        rule.created_by,
        rule.created_at
      ]
    );

    logger.info(`Alert rule created: ${rule.rule_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating alert rule', { error: error.message, stack: error.stack });
    throw new Error('Failed to create alert rule');
  }
}

/**
 * Add notification configuration
 */
async function addNotification(notificationData) {
  try {
    const {
      rule_id,
      notification_type,
      notification_config,
      recipients,
      priority,
      retry_policy
    } = notificationData;

    let result = await pool.query(
      `INSERT INTO alert_notifications 
       (notification_id, rule_id, notification_type, notification_config, 
        recipients, priority, retry_policy, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        generateId(),
        rule_id,
        notification_type,
        JSON.stringify(notification_config),
        recipients,
        priority || 'normal',
        JSON.stringify(retry_policy || {}),
        true,
        new Date().toISOString()
      ]
    );

    logger.info(`Notification added: ${result.rows[0].notification_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding notification', { error: error.message });
    throw new Error('Failed to add notification');
  }
}

/**
 * Create alert incident
 */
async function createIncident(incidentData) {
  try {
    const {
      rule_id,
      incident_type,
      severity,
      triggered_value,
      threshold_value,
      context_data,
      description
    } = incidentData;

    const incident = {
      incident_id: generateId(),
      rule_id,
      incident_type,
      severity,
      status: 'open',
      triggered_value,
      threshold_value,
      context_data: context_data || {},
      description,
      detected_at: new Date().toISOString()
    };

    // AI-powered incident classification
    let aiRequest = {
      task: 'incident_classification',
      parameters: {
        incident_type: incident_type,
        context_data: context_data,
        historical_incidents: await getHistoricalIncidents(rule_id),
        pattern_recognition: await recognizePatterns(rule_id)
      }
    };

    let aiResponse = await aiAPI.generateRecommendation(aiRequest);
    incident.ai_classification = aiResponse;

    let result = await pool.query(
      `INSERT INTO alert_incidents 
       (incident_id, rule_id, incident_type, severity, status, triggered_value, 
        threshold_value, context_data, description, detected_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        incident.incident_id,
        incident.rule_id,
        incident.incident_type,
        incident.severity,
        incident.status,
        incident.triggered_value,
        incident.threshold_value,
        JSON.stringify(incident.context_data),
        incident.description,
        incident.detected_at
      ]
    );

    // Trigger notifications
    await triggerNotifications(rule_id, incident);

    logger.info(`Alert incident created: ${incident.incident_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating incident', { error: error.message });
    throw new Error('Failed to create incident');
  }
}

/**
 * Acknowledge incident
 */
async function acknowledgeIncident(incidentId, acknowledgedBy) {
  try {
    let result = await pool.query(
      `UPDATE alert_incidents 
       SET status = $1, acknowledged_by = $2, acknowledged_at = $3 
       WHERE incident_id = $4 
       RETURNING *`,
      ['acknowledged', acknowledgedBy, new Date().toISOString(), incidentId]
    );

    // Log history
    await logIncidentHistory(incidentId, 'acknowledged', { acknowledged_by: acknowledgedBy }, acknowledgedBy);

    logger.info(`Incident acknowledged: ${incidentId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error acknowledging incident', { error: error.message });
    throw new Error('Failed to acknowledge incident');
  }
}

/**
 * Resolve incident. `wasFalsePositive` records whether the rule fired
 * incorrectly, which is the only real input calculateFalsePositiveRate()
 * has to work with - it is set explicitly by whoever resolves the incident,
 * never inferred.
 */
async function resolveIncident(incidentId, resolvedBy, resolutionDetails) {
  try {
    const wasFalsePositive = Boolean(resolutionDetails && resolutionDetails.wasFalsePositive);
    let result = await pool.query(
      `UPDATE alert_incidents
       SET status = $1, resolved_by = $2, resolved_at = $3, is_false_positive = $4
       WHERE incident_id = $5
       RETURNING *`,
      ['resolved', resolvedBy, new Date().toISOString(), wasFalsePositive, incidentId]
    );

    // Log history
    await logIncidentHistory(incidentId, 'resolved', resolutionDetails, resolvedBy);

    logger.info(`Incident resolved: ${incidentId}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error resolving incident', { error: error.message });
    throw new Error('Failed to resolve incident');
  }
}

/**
 * Get incidents
 */
async function getIncidents(filters = {}) {
  try {
    const { rule_id, status, start_time, end_time } = filters;
    let query = 'SELECT * FROM alert_incidents WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (rule_id) {
      paramCount++;
      query += ` AND rule_id = $${paramCount}`;
      params.push(rule_id);
    }

    if (status) {
      paramCount++;
      query += ` AND status = $${paramCount}`;
      params.push(status);
    }

    if (start_time) {
      paramCount++;
      query += ` AND detected_at >= $${paramCount}`;
      params.push(start_time);
    }

    if (end_time) {
      paramCount++;
      query += ` AND detected_at <= $${paramCount}`;
      params.push(end_time);
    }

    query += ' ORDER BY detected_at DESC';

    let result = await pool.query(query, params);
    return result.rows;
  } catch (error) {
    logger.error('Error getting incidents', { error: error.message });
    throw new Error('Failed to get incidents');
  }
}

/**
 * Add escalation
 */
async function addEscalation(escalationData) {
  try {
    const {
      rule_id,
      escalation_level,
      escalation_config,
      wait_time_minutes,
      auto_escalate
    } = escalationData;

    let result = await pool.query(
      `INSERT INTO alert_escalations 
       (escalation_id, rule_id, escalation_level, escalation_config, 
        wait_time_minutes, auto_escalate, is_active, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        generateId(),
        rule_id,
        escalation_level,
        JSON.stringify(escalation_config),
        wait_time_minutes,
        auto_escalate || true,
        true,
        new Date().toISOString()
      ]
    );

    logger.info(`Escalation added: ${result.rows[0].escalation_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error adding escalation', { error: error.message });
    throw new Error('Failed to add escalation');
  }
}

/**
 * Create suppression
 */
async function createSuppression(suppressionData) {
  try {
    const {
      rule_id,
      suppression_type,
      suppression_config,
      start_time,
      end_time,
      reason,
      created_by
    } = suppressionData;

    let result = await pool.query(
      `INSERT INTO alert_suppressions 
       (suppression_id, rule_id, suppression_type, suppression_config, 
        start_time, end_time, reason, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        generateId(),
        rule_id,
        suppression_type,
        JSON.stringify(suppression_config),
        start_time,
        end_time,
        reason,
        created_by,
        'active',
        new Date().toISOString()
      ]
    );

    logger.info(`Suppression created: ${result.rows[0].suppression_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating suppression', { error: error.message });
    throw new Error('Failed to create suppression');
  }
}

/**
 * Create maintenance window
 */
async function createMaintenanceWindow(windowData) {
  try {
    const {
      window_name,
      window_type,
      start_time,
      end_time,
      affected_rules,
      description,
      created_by
    } = windowData;

    let result = await pool.query(
      `INSERT INTO alert_maintenance_windows 
       (window_id, window_name, window_type, start_time, end_time, 
        affected_rules, description, created_by, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        generateId(),
        window_name,
        window_type,
        start_time,
        end_time,
        affected_rules,
        description,
        created_by,
        'scheduled',
        new Date().toISOString()
      ]
    );

    logger.info(`Maintenance window created: ${result.rows[0].window_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error creating maintenance window', { error: error.message });
    throw new Error('Failed to create maintenance window');
  }
}

/**
 * Calculate alert statistics
 */
async function calculateAlertStatistics(ruleId, periodType, periodStart, periodEnd) {
  try {
    const incidents = await getIncidents({
      rule_id: ruleId,
      start_time: periodStart,
      end_time: periodEnd
    });

    const totalIncidents = incidents.length;
    const acknowledgedIncidents = incidents.filter(i => i.status === 'acknowledged' || i.status === 'resolved').length;
    const resolvedIncidents = incidents.filter(i => i.status === 'resolved').length;

    const mta = calculateMeanTimeToAcknowledge(incidents);
    const mtr = calculateMeanTimeToResolve(incidents);
    const fpr = calculateFalsePositiveRate(incidents);

    let result = await pool.query(
      `INSERT INTO alert_statistics 
       (stat_id, rule_id, period_type, period_start, period_end, 
        total_incidents, acknowledged_incidents, resolved_incidents, 
        mean_time_to_acknowledge, mean_time_to_resolve, false_positive_rate, calculated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        generateId(),
        ruleId,
        periodType,
        periodStart,
        periodEnd,
        totalIncidents,
        acknowledgedIncidents,
        resolvedIncidents,
        mta,
        mtr,
        fpr,
        new Date().toISOString()
      ]
    );

    logger.info(`Alert statistics calculated: ${result.rows[0].stat_id}`);
    return result.rows[0];
  } catch (error) {
    logger.error('Error calculating alert statistics', { error: error.message });
    throw new Error('Failed to calculate alert statistics');
  }
}

// Helper functions
function generateId() {
  return `ALRT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function getAlertBestPractices(ruleType) {
  return {
    recommended_severities: ['low', 'medium', 'high', 'critical'],
    condition_types: ['threshold', 'anomaly', 'pattern', 'composite'],
    notification_strategies: ['immediate', 'batch', 'digest']
  };
}

async function getSimilarRules(ruleType) {
  try {
    let result = await pool.query(
      'SELECT * FROM alert_rules WHERE rule_type = $1 LIMIT 5',
      [ruleType]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function getHistoricalIncidents(ruleId) {
  try {
    let result = await pool.query(
      'SELECT * FROM alert_incidents WHERE rule_id = $1 ORDER BY detected_at DESC LIMIT 50',
      [ruleId]
    );
    return result.rows;
  } catch (error) {
    return [];
  }
}

async function recognizePatterns(ruleId) {
  return {
    has_seasonal_pattern: false,
    has_trend_pattern: false,
    common_triggers: []
  };
}

async function triggerNotifications(ruleId, incident) {
  try {
    const notifications = await pool.query(
      'SELECT * FROM alert_notifications WHERE rule_id = $1 AND is_active = $2',
      [ruleId, true]
    );

    for (const notification of notifications.rows) {
      // Implement notification sending logic here
      logger.info(`Notification triggered: ${notification.notification_id} for incident: ${incident.incident_id}`);
    }
  } catch (error) {
    logger.error('Error triggering notifications', { error: error.message });
  }
}

async function logIncidentHistory(incidentId, actionType, actionDetails, performedBy) {
  try {
    await pool.query(
      `INSERT INTO alert_history 
       (history_id, incident_id, action_type, action_details, performed_by, performed_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        generateId(),
        incidentId,
        actionType,
        JSON.stringify(actionDetails),
        performedBy,
        new Date().toISOString()
      ]
    );
  } catch (error) {
    logger.error('Error logging incident history', { error: error.message });
  }
}

function calculateMeanTimeToAcknowledge(incidents) {
  const acknowledged = incidents.filter(i => i.acknowledged_at && i.detected_at);
  if (acknowledged.length === 0) return 0;

  const times = acknowledged.map(i => {
    const detected = new Date(i.detected_at).getTime();
    let acknowledged = new Date(i.acknowledged_at).getTime();
    return (acknowledged - detected) / 1000 / 60; // minutes
  });

  return times.reduce((a, b) => a + b, 0) / times.length;
}

function calculateMeanTimeToResolve(incidents) {
  const resolved = incidents.filter(i => i.resolved_at && i.detected_at);
  if (resolved.length === 0) return 0;

  let times = resolved.map(i => {
    let detected = new Date(i.detected_at).getTime();
    let resolved = new Date(i.resolved_at).getTime();
    return (resolved - detected) / 1000 / 60; // minutes
  });

  return times.reduce((a, b) => a + b, 0) / times.length;
}

/**
 * Fraction of resolved incidents marked wasFalsePositive on resolution.
 * `null`, not a made-up default, when nothing has been resolved yet - there
 * is no honest rate to report from zero resolutions.
 */
function calculateFalsePositiveRate(incidents) {
  let resolved = incidents.filter((i) => i.status === 'resolved');
  if (resolved.length === 0) return null;
  const falsePositives = resolved.filter((i) => i.is_false_positive === true).length;
  return falsePositives / resolved.length;
}

module.exports = {
  createAlertRule,
  addNotification,
  createIncident,
  acknowledgeIncident,
  resolveIncident,
  getIncidents,
  addEscalation,
  createSuppression,
  createMaintenanceWindow,
  calculateAlertStatistics
};
