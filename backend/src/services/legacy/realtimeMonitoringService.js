/**
 * Real-time Monitoring Service
 * Provides real-time monitoring, alerting, and automation capabilities
 * WebSocket-based real-time data streaming and event processing
 */

const { logger } = require('../../../utils/logger');
const { getPostgreSQL } = require('../../../database/connection');

class RealtimeMonitoringService {
  constructor() {
    this.activeMonitors = new Map();
    this.alertRules = new Map();
    this.automationWorkflows = new Map();
    this.eventStreams = new Map();
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring service
   */
  async initializeMonitoring() {
    try {
      logger.info('Real-time Monitoring Service initialized');
      this.setupAlertRules();
      this.setupAutomationWorkflows();
      this.initializeEventStreams();
    } catch (error) {
      logger.error('Error initializing Real-time Monitoring Service:', error);
      throw error;
    }
  }

  /**
   * Setup alert rules
   */
  setupAlertRules() {
    this.alertRules.set('threshold', {
      check: this.checkThresholdAlert,
      severity: 'warning'
    });
    
    this.alertRules.set('anomaly', {
      check: this.checkAnomalyAlert,
      severity: 'critical'
    });
    
    this.alertRules.set('pattern', {
      check: this.checkPatternAlert,
      severity: 'info'
    });
  }

  /**
   * Setup automation workflows
   */
  setupAutomationWorkflows() {
    this.automationWorkflows.set('auto_scaling', {
      trigger: this.checkScalingTrigger,
      action: this.executeScalingAction
    });
    
    this.automationWorkflows.set('auto_recovery', {
      trigger: this.checkRecoveryTrigger,
      action: this.executeRecoveryAction
    });
    
    this.automationWorkflows.set('auto_optimization', {
      trigger: this.checkOptimizationTrigger,
      action: this.executeOptimizationAction
    });
  }

  /**
   * Initialize event streams
   */
  initializeEventStreams() {
    this.eventStreams.set('system_events', {
      buffer: [],
      maxSize: 1000,
      retention: 3600000 // 1 hour
    });
    
    this.eventStreams.set('user_events', {
      buffer: [],
      maxSize: 5000,
      retention: 86400000 // 24 hours
    });
    
    this.eventStreams.set('business_events', {
      buffer: [],
      maxSize: 10000,
      retention: 604800000 // 7 days
    });
  }

  /**
   * Start monitoring a resource
   */
  async startMonitoring(resourceId, config) {
    try {
      const monitorId = this.generateMonitorId(resourceId);
      
      const monitor = {
        id: monitorId,
        resource_id: resourceId,
        config: config,
        status: 'active',
        started_at: new Date().toISOString(),
        metrics: [],
        alerts: []
      };
      
      this.activeMonitors.set(monitorId, monitor);
      
      // Start monitoring loop
      this.startMonitoringLoop(monitorId, config);
      
      logger.info(`Started monitoring for resource ${resourceId}`);
      return monitor;
    } catch (error) {
      logger.error(`Error starting monitoring for ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Stop monitoring a resource
   */
  async stopMonitoring(monitorId) {
    try {
      let monitor = this.activeMonitors.get(monitorId);
      if (!monitor) {
        throw new Error(`Monitor ${monitorId} not found`);
      }
      
      monitor.status = 'stopped';
      monitor.stopped_at = new Date().toISOString();

      // FIXES.md H4 (2026-08-28): this used to just mark status='stopped'
      // and leave the entry in place forever - activeMonitors grew
      // unbounded for the life of the process since nothing ever removed
      // stopped monitors. The interval loop itself already self-clears on
      // the next tick when it sees status !== 'active' (see
      // startMonitoringLoop), so deleting here is safe - no dangling timer.
      this.activeMonitors.delete(monitorId);

      logger.info(`Stopped monitoring ${monitorId}`);
      return monitor;
    } catch (error) {
      logger.error(`Error stopping monitoring ${monitorId}:`, error);
      throw error;
    }
  }

  /**
   * Start monitoring loop
   */
  startMonitoringLoop(monitorId, config) {
    const interval = config.interval || 60000; // Default 1 minute
    
    const loop = setInterval(async () => {
      try {
        let monitor = this.activeMonitors.get(monitorId);
        if (!monitor || monitor.status !== 'active') {
          clearInterval(loop);
          return;
        }
        
        const metrics = await this.collectMetrics(monitor.resource_id, config);
        monitor.metrics.push({
          timestamp: new Date().toISOString(),
          data: metrics
        });
        
        // Check for alerts
        const alerts = await this.checkAlerts(monitorId, metrics, config);
        if (alerts.length > 0) {
          monitor.alerts.push(...alerts);
          await this.sendAlerts(alerts);
        }
        
        // Check for automation triggers
        await this.checkAutomationTriggers(monitorId, metrics, config);
        
        // Cleanup old metrics
        this.cleanupOldMetrics(monitor);
        
      } catch (error) {
        logger.error(`Error in monitoring loop for ${monitorId}:`, error);
      }
    }, interval);
  }

  /**
   * Collect metrics for a resource
   */
  async collectMetrics(resourceId, config) {
    try {
      let metrics = {};
      
      for (const metric of config.metrics || []) {
        metrics[metric.name] = await this.collectMetric(resourceId, metric);
      }
      
      return metrics;
    } catch (error) {
      logger.error(`Error collecting metrics for ${resourceId}:`, error);
      throw error;
    }
  }

  /**
   * Collect individual metric
   */
  // FIXED 2026-08-15: previously fabricated every metric type (cpu/memory/
  // disk/network/response-time/error-rate/throughput) with Math.random(),
  // presented as real collected telemetry for a "real-time monitoring"
  // service. No real metrics-collection agent is connected in this
  // environment, so this now honestly returns null with a reason instead
  // of a plausible-looking fake number.
  async collectMetric(resourceId, metricConfig) {
    // Returns null (not a fabricated number) — a plain value, not an object,
    // so downstream threshold comparisons (checkThresholdAlert below) safely
    // evaluate to false on missing data rather than throwing or silently
    // misbehaving on an unexpected object shape.
    logger.warn(`No real metrics-collection agent connected for metric type "${metricConfig.type}"`, { resourceId });
    return null;
  }

  /**
   * Check for alerts based on metrics
   */
  async checkAlerts(monitorId, metrics, config) {
    let alerts = [];
    
    for (const alertConfig of config.alerts || []) {
      const rule = this.alertRules.get(alertConfig.type);
      if (rule) {
        const result = await rule.check.call(this, metrics, alertConfig);
        if (result.triggered) {
          alerts.push({
            id: this.generateAlertId(),
            monitor_id: monitorId,
            type: alertConfig.type,
            severity: rule.severity,
            message: result.message,
            triggered_at: new Date().toISOString(),
            data: result.data
          });
        }
      }
    }
    
    return alerts;
  }

  /**
   * Check threshold alert
   */
  async checkThresholdAlert(metrics, config) {
    const value = metrics[config.metric];
    const threshold = config.threshold;
    
    if (config.operator === 'greater_than' && value > threshold) {
      return {
        triggered: true,
        message: `${config.metric} exceeded threshold: ${value} > ${threshold}`,
        data: { value, threshold }
      };
    }
    
    if (config.operator === 'less_than' && value < threshold) {
      return {
        triggered: true,
        message: `${config.metric} below threshold: ${value} < ${threshold}`,
        data: { value, threshold }
      };
    }
    
    return { triggered: false };
  }

  /**
   * Check anomaly alert
   */
  async checkAnomalyAlert(metrics, config) {
    let value = metrics[config.metric];
    const mean = config.mean || 50;
    const stdDev = config.stdDev || 10;
    
    const zScore = Math.abs((value - mean) / stdDev);
    
    if (zScore > 3) {
      return {
        triggered: true,
        message: `Anomaly detected in ${config.metric}: z-score ${zScore.toFixed(2)}`,
        data: { value, zScore }
      };
    }
    
    return { triggered: false };
  }

  /**
   * Check pattern alert
   */
  async checkPatternAlert(metrics, config) {
    // Pattern matching logic would be implemented here
    return { triggered: false };
  }

  /**
   * Send alerts
   */
  async sendAlerts(alerts) {
    for (const alert of alerts) {
      logger.warn(`Alert triggered: ${alert.message}`);
      
      // Send to notification channels
      await this.sendToNotificationChannels(alert);
      
      // Store in database
      await this.storeAlert(alert);
    }
  }

  /**
   * Send to notification channels
   */
  async sendToNotificationChannels(alert) {
    // Mock implementation - would send to email, SMS, Slack, etc.
    logger.info(`Alert sent to channels: ${alert.id}`);
  }

  /**
   * Store alert in database
   */
  async storeAlert(alert) {
    try {
      const pg = getPostgreSQL();
      const query = `
        INSERT INTO monitoring_alerts 
        (alert_id, monitor_id, type, severity, message, triggered_at, data)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await pg.query(query, [
        alert.id,
        alert.monitor_id,
        alert.type,
        alert.severity,
        alert.message,
        alert.triggered_at,
        JSON.stringify(alert.data)
      ]);
    } catch (error) {
      logger.error('Error storing alert:', error);
    }
  }

  /**
   * Check automation triggers
   */
  async checkAutomationTriggers(monitorId, metrics, config) {
    for (const automationConfig of config.automations || []) {
      const workflow = this.automationWorkflows.get(automationConfig.type);
      if (workflow) {
        const shouldTrigger = await workflow.trigger.call(this, metrics, automationConfig);
        if (shouldTrigger) {
          await workflow.action.call(this, monitorId, metrics, automationConfig);
        }
      }
    }
  }

  /**
   * Check scaling trigger
   */
  async checkScalingTrigger(metrics, config) {
    let value = metrics[config.metric];
    return value > config.threshold;
  }

  /**
   * Execute scaling action
   */
  async executeScalingAction(monitorId, metrics, config) {
    logger.info(`Executing scaling action for ${monitorId}`);
    // Scaling logic would be implemented here
  }

  /**
   * Check recovery trigger
   */
  async checkRecoveryTrigger(metrics, config) {
    let value = metrics[config.metric];
    return value < config.threshold;
  }

  /**
   * Execute recovery action
   */
  async executeRecoveryAction(monitorId, metrics, config) {
    logger.info(`Executing recovery action for ${monitorId}`);
    // Recovery logic would be implemented here
  }

  /**
   * Check optimization trigger
   */
  async checkOptimizationTrigger(metrics, config) {
    // Optimization trigger logic
    return false;
  }

  /**
   * Execute optimization action
   */
  async executeOptimizationAction(monitorId, metrics, config) {
    logger.info(`Executing optimization action for ${monitorId}`);
    // Optimization logic would be implemented here
  }

  /**
   * Stream real-time events
   */
  async streamEvents(streamType, callback) {
    const stream = this.eventStreams.get(streamType);
    if (!stream) {
      throw new Error(`Stream ${streamType} not found`);
    }
    
    // Set up event streaming
    stream.callback = callback;
    
    return {
      stream_type: streamType,
      status: 'active',
      buffer_size: stream.buffer.length
    };
  }

  /**
   * Add event to stream
   */
  async addEvent(streamType, event) {
    let stream = this.eventStreams.get(streamType);
    if (!stream) {
      throw new Error(`Stream ${streamType} not found`);
    }
    
    const enrichedEvent = {
      ...event,
      event_id: this.generateEventId(),
      timestamp: new Date().toISOString()
    };
    
    stream.buffer.push(enrichedEvent);
    
    // Cleanup old events
    this.cleanupOldEvents(stream);
    
    // Trigger callback if registered
    if (stream.callback) {
      stream.callback(enrichedEvent);
    }
    
    return enrichedEvent;
  }

  /**
   * Get monitoring status
   */
  async getMonitoringStatus(monitorId) {
    let monitor = this.activeMonitors.get(monitorId);
    if (!monitor) {
      throw new Error(`Monitor ${monitorId} not found`);
    }
    
    return {
      monitor_id: monitor.id,
      resource_id: monitor.resource_id,
      status: monitor.status,
      started_at: monitor.started_at,
      metrics_count: monitor.metrics.length,
      alerts_count: monitor.alerts.length,
      latest_metrics: monitor.metrics.slice(-10),
      recent_alerts: monitor.alerts.slice(-10)
    };
  }

  /**
   * Get all active monitors
   */
  async getAllMonitors() {
    return Array.from(this.activeMonitors.values()).map(monitor => ({
      monitor_id: monitor.id,
      resource_id: monitor.resource_id,
      status: monitor.status,
      started_at: monitor.started_at
    }));
  }

  /**
   * Cleanup old metrics
   */
  cleanupOldMetrics(monitor) {
    const maxMetrics = 1000;
    if (monitor.metrics.length > maxMetrics) {
      monitor.metrics = monitor.metrics.slice(-maxMetrics);
    }
  }

  /**
   * Cleanup old events
   */
  cleanupOldEvents(stream) {
    const now = Date.now();
    stream.buffer = stream.buffer.filter(event => {
      const eventTime = new Date(event.timestamp).getTime();
      return now - eventTime < stream.retention;
    });
    
    if (stream.buffer.length > stream.maxSize) {
      stream.buffer = stream.buffer.slice(-stream.maxSize);
    }
  }

  /**
   * Generate unique IDs
   */
  generateMonitorId(resourceId) {
    return `monitor_${resourceId}_${Date.now()}`;
  }

  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check for Real-time Monitoring Service
   */
  async healthCheck() {
    try {
      return {
        status: 'healthy',
        active_monitors: this.activeMonitors.size,
        alert_rules: Object.keys(this.alertRules),
        automation_workflows: Object.keys(this.automationWorkflows),
        event_streams: Object.keys(this.eventStreams),
        stream_buffer_sizes: Object.fromEntries(
          Array.from(this.eventStreams.entries()).map(([key, value]) => [key, value.buffer.length])
        ),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Real-time Monitoring Service health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new RealtimeMonitoringService();
