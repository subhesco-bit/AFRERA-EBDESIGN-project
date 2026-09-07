// Service for System Administration (M006) - AI Enhanced
// Real CRUD over the `admin_settings` and `audit_logs` tables created in
// migrations/1002_system_administration.sql. Enhanced with AI-powered
// analytics, anomaly detection, and predictive maintenance.
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

async function listSettings() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT name, value, description, created_at, updated_at FROM admin_settings ORDER BY name ASC');
  return res.rows;
}

async function getSetting(name) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT name, value, description, created_at, updated_at FROM admin_settings WHERE name = $1', [name]);
  return res.rows[0] || null;
}

async function upsertSetting(name, value, description) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `INSERT INTO admin_settings (name, value, description, created_at, updated_at)
     VALUES ($1, $2, $3, NOW(), NOW())
     ON CONFLICT (name) DO UPDATE SET
       value = COALESCE(EXCLUDED.value, admin_settings.value),
       description = COALESCE(EXCLUDED.description, admin_settings.description),
       updated_at = NOW()
     RETURNING name, value, description, created_at, updated_at`,
    [name, value === undefined ? null : JSON.stringify(value), description || null]
  );
  
  // Emit signal for configuration change
  signalBus.emitSignal(SIGNAL.CONFIGURATION_CHANGED, {
    settingName: name,
    oldValue: res.rows[0]?.value,
    newValue: value,
    changedBy: 'admin'
  }, {
    severity: SEVERITY.INFO,
    source: 'system_administration_service',
    entityId: name
  });
  
  return res.rows[0];
}

async function ingestAuditLog(entry = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { userId = null, action, entity = null, entityId = null, details = null, ipAddress = null } = entry;
  if (!action) {
    logger.warn('ingestAuditLog called without an action', { entry });
    return { success: false, error: 'action is required' };
  }
  const res = await pg.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     RETURNING id, user_id, action, entity, entity_id, details, ip_address, created_at`,
    [userId, action, entity, entityId, details ? JSON.stringify(details) : null, ipAddress]
  );
  
  // Emit signal for audit log entry
  signalBus.emitSignal(SIGNAL.WORKFLOW_STARTED, {
    auditId: res.rows[0].id,
    userId,
    action,
    entity,
    entityId
  }, {
    severity: SEVERITY.INFO,
    source: 'system_administration_service',
    entityId: userId
  });
  
  return { success: true, data: res.rows[0] };
}

// AI-powered analytics
async function getSystemAnalytics() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get audit log statistics
  const auditStats = await pg.query(`
    SELECT 
      action,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM audit_logs 
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY action, DATE(created_at)
    ORDER BY date DESC, count DESC
  `);
  
  // Get system settings summary
  const settingsSummary = await pg.query(`
    SELECT 
      COUNT(*) as total_settings,
      COUNT(CASE WHEN updated_at > NOW() - INTERVAL '7 days' THEN 1 END) as recently_updated
    FROM admin_settings
  `);
  
  return {
    auditPatterns: auditStats.rows,
    settingsHealth: settingsSummary.rows[0],
    recommendations: generateAIRecommendations(auditStats.rows)
  };
}

// Anomaly detection
async function detectAnomalies() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Detect unusual activity patterns
  const unusualActivity = await pg.query(`
    SELECT 
      user_id,
      action,
      COUNT(*) as action_count,
      ip_address
    FROM audit_logs 
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id, action, ip_address
    HAVING COUNT(*) > 50
  `);
  
  const anomalies = unusualActivity.rows.map(row => ({
    type: 'high_frequency_activity',
    userId: row.user_id,
    action: row.action,
    count: row.action_count,
    ipAddress: row.ip_address,
    severity: row.action_count > 100 ? 'critical' : 'warning'
  }));
  
  if (anomalies.length > 0) {
    signalBus.emitSignal(SIGNAL.SECURITY_THREAT_DETECTED, {
      anomalies,
      detectionTime: new Date().toISOString()
    }, {
      severity: SEVERITY.WARNING,
      source: 'system_administration_service'
    });
  }
  
  return anomalies;
}

// Predictive maintenance
async function getPredictiveMaintenance() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Analyze system performance patterns
  const performanceData = await pg.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as total_actions
    FROM audit_logs 
    WHERE created_at > NOW() - INTERVAL '90 days'
    GROUP BY DATE(created_at)
    ORDER BY date ASC
  `);
  
  // Simple trend analysis
  const recent = performanceData.rows.slice(-7);
  const avgActions = recent.reduce((sum, row) => sum + parseInt(row.total_actions), 0) / recent.length;
  
  return {
    currentLoad: avgActions,
    trend: avgActions > 1000 ? 'high' : avgActions > 500 ? 'medium' : 'normal',
    recommendations: avgActions > 1000 ? [
      'Consider scaling database resources',
      'Review audit log retention policy',
      'Implement log aggregation service'
    ] : []
  };
}

function generateAIRecommendations(auditStats) {
  const recommendations = [];
  
  // Analyze action patterns
  const highFrequencyActions = auditStats.filter(row => parseInt(row.count) > 100);
  if (highFrequencyActions.length > 0) {
    recommendations.push({
      type: 'optimization',
      message: 'High-frequency actions detected. Consider implementing caching for frequently accessed resources.',
      actions: highFrequencyActions.map(a => a.action)
    });
  }
  
  return recommendations;
}

module.exports = {
  listSettings,
  getSetting,
  upsertSetting,
  ingestAuditLog,
  getSystemAnalytics,
  detectAnomalies,
  getPredictiveMaintenance,
};
