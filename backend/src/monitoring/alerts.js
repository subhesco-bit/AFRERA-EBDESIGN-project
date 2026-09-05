const winston = require('winston');

// Alert logger
const alertLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/alerts.log' }),
    new winston.transports.Console()
  ]
});

// Alert severity levels
const SEVERITY = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical'
};

// Alert types
const ALERT_TYPES = {
  SYSTEM: 'system',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  BUSINESS: 'business',
  DATABASE: 'database',
  API: 'api'
};

// Alert thresholds
const THRESHOLDS = {
  // Performance thresholds
  responseTime: {
    warning: 1000, // 1 second
    error: 3000, // 3 seconds
    critical: 5000 // 5 seconds
  },
  errorRate: {
    warning: 0.01, // 1%
    error: 0.05, // 5%
    critical: 0.1 // 10%
  },
  cpuUsage: {
    warning: 70,
    error: 85,
    critical: 95
  },
  memoryUsage: {
    warning: 70,
    error: 85,
    critical: 95
  },
  diskUsage: {
    warning: 80,
    error: 90,
    critical: 95
  },
  databaseConnections: {
    warning: 70,
    error: 85,
    critical: 95
  }
};

// Alert class
class Alert {
  constructor(type, severity, message, metadata = {}) {
    this.id = this.generateId();
    this.type = type;
    this.severity = severity;
    this.message = message;
    this.metadata = metadata;
    this.timestamp = new Date();
    this.resolved = false;
    this.resolvedAt = null;
  }

  generateId() {
    return `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  resolve() {
    this.resolved = true;
    this.resolvedAt = new Date();
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      severity: this.severity,
      message: this.message,
      metadata: this.metadata,
      timestamp: this.timestamp,
      resolved: this.resolved,
      resolvedAt: this.resolvedAt
    };
  }
}

// Alert manager
class AlertManager {
  constructor() {
    this.alerts = new Map();
    this.alertHandlers = [];
    this.alertRules = [];
  }

  // Add alert handler
  addAlertHandler(handler) {
    this.alertHandlers.push(handler);
  }

  // Add alert rule
  addAlertRule(rule) {
    this.alertRules.push(rule);
  }

  // Create alert
  createAlert(type, severity, message, metadata = {}) {
    const alert = new Alert(type, severity, message, metadata);
    this.alerts.set(alert.id, alert);

    // Log alert
    alertLogger.log(severity, message, {
      ...alert.toJSON()
    });

    // Notify handlers
    this.notifyHandlers(alert);

    return alert;
  }

  // Resolve alert
  resolveAlert(alertId) {
    let alert = this.alerts.get(alertId);
    if (alert) {
      alert.resolve();
      alertLogger.info('Alert resolved', alert.toJSON());
      this.notifyHandlers(alert);
    }
  }

  // Notify handlers
  notifyHandlers(alert) {
    this.alertHandlers.forEach(handler => {
      try {
        handler(alert);
      } catch (error) {
        console.error('Alert handler error:', error);
      }
    });
  }

  // Check rules
  async checkRules(metrics) {
    for (const rule of this.alertRules) {
      try {
        const shouldAlert = await rule.check(metrics);
        if (shouldAlert) {
          this.createAlert(
            rule.type,
            rule.severity,
            rule.message,
            rule.metadata
          );
        }
      } catch (error) {
        console.error('Alert rule error:', error);
      }
    }
  }

  // Get active alerts
  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter(alert => !alert.resolved);
  }

  // Get alerts by severity
  getAlertsBySeverity(severity) {
    return Array.from(this.alerts.values()).filter(
      alert => alert.severity === severity && !alert.resolved
    );
  }

  // Get alerts by type
  getAlertsByType(type) {
    return Array.from(this.alerts.values()).filter(
      alert => alert.type === type && !alert.resolved
    );
  }
}

// Create alert manager instance
const alertManager = new AlertManager();

// Default alert handlers
const consoleAlertHandler = (alert) => {
  console.log(`[${alert.severity.toUpperCase()}] ${alert.type}: ${alert.message}`);
};

const emailAlertHandler = (alert) => {
  // In production, send email
  if (alert.severity === SEVERITY.CRITICAL) {
    console.log(`[EMAIL ALERT] ${alert.message}`);
  }
};

const slackAlertHandler = (alert) => {
  // In production, send to Slack
  if (alert.severity === SEVERITY.CRITICAL || alert.severity === SEVERITY.ERROR) {
    console.log(`[SLACK ALERT] ${alert.message}`);
  }
};

// Add default handlers
alertManager.addAlertHandler(consoleAlertHandler);
alertManager.addAlertHandler(emailAlertHandler);
alertManager.addAlertHandler(slackAlertHandler);

// Performance alert rules
const performanceAlertRules = [
  {
    type: ALERT_TYPES.PERFORMANCE,
    severity: SEVERITY.WARNING,
    message: 'High response time detected',
    check: async (metrics) => {
      return metrics.responseTime > THRESHOLDS.responseTime.warning;
    },
    metadata: { threshold: THRESHOLDS.responseTime.warning }
  },
  {
    type: ALERT_TYPES.PERFORMANCE,
    severity: SEVERITY.ERROR,
    message: 'Critical response time detected',
    check: async (metrics) => {
      return metrics.responseTime > THRESHOLDS.responseTime.error;
    },
    metadata: { threshold: THRESHOLDS.responseTime.error }
  },
  {
    type: ALERT_TYPES.PERFORMANCE,
    severity: SEVERITY.CRITICAL,
    message: 'Response time exceeded critical threshold',
    check: async (metrics) => {
      return metrics.responseTime > THRESHOLDS.responseTime.critical;
    },
    metadata: { threshold: THRESHOLDS.responseTime.critical }
  }
];

// Error rate alert rules
const errorRateAlertRules = [
  {
    type: ALERT_TYPES.API,
    severity: SEVERITY.WARNING,
    message: 'High error rate detected',
    check: async (metrics) => {
      return metrics.errorRate > THRESHOLDS.errorRate.warning;
    },
    metadata: { threshold: THRESHOLDS.errorRate.warning }
  },
  {
    type: ALERT_TYPES.API,
    severity: SEVERITY.ERROR,
    message: 'Critical error rate detected',
    check: async (metrics) => {
      return metrics.errorRate > THRESHOLDS.errorRate.error;
    },
    metadata: { threshold: THRESHOLDS.errorRate.error }
  },
  {
    type: ALERT_TYPES.API,
    severity: SEVERITY.CRITICAL,
    message: 'Error rate exceeded critical threshold',
    check: async (metrics) => {
      return metrics.errorRate > THRESHOLDS.errorRate.critical;
    },
    metadata: { threshold: THRESHOLDS.errorRate.critical }
  }
];

// System resource alert rules
const systemResourceAlertRules = [
  {
    type: ALERT_TYPES.SYSTEM,
    severity: SEVERITY.WARNING,
    message: 'High CPU usage detected',
    check: async (metrics) => {
      return metrics.cpuUsage > THRESHOLDS.cpuUsage.warning;
    },
    metadata: { threshold: THRESHOLDS.cpuUsage.warning }
  },
  {
    type: ALERT_TYPES.SYSTEM,
    severity: SEVERITY.ERROR,
    message: 'Critical CPU usage detected',
    check: async (metrics) => {
      return metrics.cpuUsage > THRESHOLDS.cpuUsage.error;
    },
    metadata: { threshold: THRESHOLDS.cpuUsage.error }
  },
  {
    type: ALERT_TYPES.SYSTEM,
    severity: SEVERITY.WARNING,
    message: 'High memory usage detected',
    check: async (metrics) => {
      return metrics.memoryUsage > THRESHOLDS.memoryUsage.warning;
    },
    metadata: { threshold: THRESHOLDS.memoryUsage.warning }
  },
  {
    type: ALERT_TYPES.SYSTEM,
    severity: SEVERITY.ERROR,
    message: 'Critical memory usage detected',
    check: async (metrics) => {
      return metrics.memoryUsage > THRESHOLDS.memoryUsage.error;
    },
    metadata: { threshold: THRESHOLDS.memoryUsage.error }
  },
  {
    type: ALERT_TYPES.SYSTEM,
    severity: SEVERITY.WARNING,
    message: 'High disk usage detected',
    check: async (metrics) => {
      return metrics.diskUsage > THRESHOLDS.diskUsage.warning;
    },
    metadata: { threshold: THRESHOLDS.diskUsage.warning }
  },
  {
    type: ALERT_TYPES.SYSTEM,
    severity: SEVERITY.ERROR,
    message: 'Critical disk usage detected',
    check: async (metrics) => {
      return metrics.diskUsage > THRESHOLDS.diskUsage.error;
    },
    metadata: { threshold: THRESHOLDS.diskUsage.error }
  }
];

// Database alert rules
const databaseAlertRules = [
  {
    type: ALERT_TYPES.DATABASE,
    severity: SEVERITY.WARNING,
    message: 'High database connection usage',
    check: async (metrics) => {
      return metrics.dbConnections > THRESHOLDS.databaseConnections.warning;
    },
    metadata: { threshold: THRESHOLDS.databaseConnections.warning }
  },
  {
    type: ALERT_TYPES.DATABASE,
    severity: SEVERITY.ERROR,
    message: 'Critical database connection usage',
    check: async (metrics) => {
      return metrics.dbConnections > THRESHOLDS.databaseConnections.error;
    },
    metadata: { threshold: THRESHOLDS.databaseConnections.error }
  }
];

// Add all rules
performanceAlertRules.forEach(rule => alertManager.addAlertRule(rule));
errorRateAlertRules.forEach(rule => alertManager.addAlertRule(rule));
systemResourceAlertRules.forEach(rule => alertManager.addAlertRule(rule));
databaseAlertRules.forEach(rule => alertManager.addAlertRule(rule));

// Check metrics and trigger alerts
const checkMetrics = async (metrics) => {
  await alertManager.checkRules(metrics);
};

// Manual alert creation
const createAlert = (type, severity, message, metadata) => {
  return alertManager.createAlert(type, severity, message, metadata);
};

// Get alert summary
const getAlertSummary = () => {
  const activeAlerts = alertManager.getActiveAlerts();
  return {
    total: activeAlerts.length,
    bySeverity: {
      critical: alertManager.getAlertsBySeverity(SEVERITY.CRITICAL).length,
      error: alertManager.getAlertsBySeverity(SEVERITY.ERROR).length,
      warning: alertManager.getAlertsBySeverity(SEVERITY.WARNING).length,
      info: alertManager.getAlertsBySeverity(SEVERITY.INFO).length
    },
    byType: {
      system: alertManager.getAlertsByType(ALERT_TYPES.SYSTEM).length,
      performance: alertManager.getAlertsByType(ALERT_TYPES.PERFORMANCE).length,
      security: alertManager.getAlertsByType(ALERT_TYPES.SECURITY).length,
      business: alertManager.getAlertsByType(ALERT_TYPES.BUSINESS).length,
      database: alertManager.getAlertsByType(ALERT_TYPES.DATABASE).length,
      api: alertManager.getAlertsByType(ALERT_TYPES.API).length
    }
  };
};

module.exports = {
  Alert,
  AlertManager,
  alertManager,
  SEVERITY,
  ALERT_TYPES,
  THRESHOLDS,
  createAlert,
  checkMetrics,
  getAlertSummary
};
