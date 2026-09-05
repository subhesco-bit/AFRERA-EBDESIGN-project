/**
 * Monitoring and Logging Infrastructure
 * Comprehensive monitoring, logging, and alerting system
 * Metrics collection, distributed tracing, and log aggregation
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');

class MonitoringInfrastructure {
  constructor() {
    this.metrics = new Map();
    this.logs = [];
    this.alerts = [];
    this.traces = [];
    this.initializeMonitoring();
  }

  /**
   * Initialize monitoring infrastructure
   */
  async initializeMonitoring() {
    try {
      logger.info('Monitoring infrastructure initialized');
      this.setupMetricsCollection();
      this.setupLogAggregation();
      this.setupAlerting();
      this.setupDistributedTracing();
    } catch (error) {
      logger.error('Error initializing monitoring infrastructure:', error);
      throw error;
    }
  }

  /**
   * Setup metrics collection
   */
  setupMetricsCollection() {
    this.metricCollectors = {
      system: this.collectSystemMetrics,
      application: this.collectApplicationMetrics,
      database: this.collectDatabaseMetrics,
      external: this.collectExternalMetrics
    };
  }

  /**
   * Setup log aggregation
   */
  setupLogAggregation() {
    this.logLevels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };
    
    this.logCategories = {
      system: [],
      application: [],
      security: [],
      performance: [],
      business: []
    };
  }

  /**
   * Setup alerting
   */
  setupAlerting() {
    this.alertRules = {
      error_threshold: {
        check: (data) => data.error_count > 10,
        severity: 'critical',
        message: 'High error rate detected'
      },
      performance_degradation: {
        check: (data) => data.response_time > 1000,
        severity: 'warning',
        message: 'Performance degradation detected'
      },
      resource_exhaustion: {
        check: (data) => data.cpu_usage > 90 || data.memory_usage > 90,
        severity: 'critical',
        message: 'Resource exhaustion imminent'
      }
    };
  }

  /**
   * Setup distributed tracing
   */
  setupDistributedTracing() {
    this.traceSpans = [];
    this.activeTraces = new Map();
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    return {
      cpu_usage: process.cpuUsage().user / 1000000,
      memory_usage: process.memoryUsage().heapUsed / 1024 / 1024,
      total_memory: process.memoryUsage().heapTotal / 1024 / 1024,
      uptime: process.uptime(),
      load_average: require('os').loadavg(),
      timestamp: Date.now()
    };
  }

  /**
   * Collect application metrics
   */
  collectApplicationMetrics() {
    return {
      request_count: this.metrics.get('request_count') || 0,
      error_count: this.metrics.get('error_count') || 0,
      avg_response_time: this.metrics.get('avg_response_time') || 0,
      active_connections: this.metrics.get('active_connections') || 0,
      timestamp: Date.now()
    };
  }

  /**
   * Collect database metrics
   */
  async collectDatabaseMetrics() {
    try {
      const pg = getPostgreSQL();
      const startTime = Date.now();
      await pg.query('SELECT 1');
      const latency = Date.now() - startTime;

      return {
        connection_pool: {
          total: pg.totalCount || 10,
          idle: pg.idleCount || 5,
          waiting: pg.waitingCount || 0
        },
        query_latency: latency,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('Error collecting database metrics:', error);
      return {
        error: error.message,
        timestamp: Date.now()
      };
    }
  }

  /**
   * Collect external service metrics
   */
  collectExternalMetrics() {
    return {
      ai_gateway: this.metrics.get('ai_gateway_calls') || 0,
      analytics: this.metrics.get('analytics_calls') || 0,
      monitoring: this.metrics.get('monitoring_calls') || 0,
      timestamp: Date.now()
    };
  }

  /**
   * Record metric
   */
  recordMetric(name, value) {
    const current = this.metrics.get(name) || 0;
    this.metrics.set(name, current + value);
  }

  /**
   * Get metrics
   */
  getMetrics() {
    return {
      system: this.collectSystemMetrics(),
      application: this.collectApplicationMetrics(),
      database: this.collectDatabaseMetrics(),
      external: this.collectExternalMetrics(),
      custom: Object.fromEntries(this.metrics)
    };
  }

  /**
   * Add log entry
   */
  addLog(level, category, message, metadata = {}) {
    const logEntry = {
      id: this.generateLogId(),
      level,
      category,
      message,
      metadata,
      timestamp: new Date().toISOString()
    };

    this.logs.push(logEntry);
    
    // Add to category
    if (this.logCategories[category]) {
      this.logCategories[category].push(logEntry);
    }

    // Keep only recent logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-5000);
    }

    return logEntry;
  }

  /**
   * Get logs
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs];

    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level);
    }

    if (filters.category) {
      filteredLogs = filteredLogs.filter(log => log.category === filters.category);
    }

    if (filters.since) {
      const sinceDate = new Date(filters.since);
      filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= sinceDate);
    }

    if (filters.limit) {
      filteredLogs = filteredLogs.slice(-filters.limit);
    }

    return filteredLogs;
  }

  /**
   * Create trace span
   */
  createTraceSpan(traceId, operation, parentSpanId = null) {
    const span = {
      span_id: this.generateSpanId(),
      trace_id: traceId,
      parent_span_id: parentSpanId,
      operation,
      start_time: Date.now(),
      end_time: null,
      duration: null,
      metadata: {},
      status: 'active'
    };

    this.traceSpans.push(span);
    this.activeTraces.set(span.span_id, span);

    return span;
  }

  /**
   * Complete trace span
   */
  completeTraceSpan(spanId, metadata = {}) {
    let span = this.activeTraces.get(spanId);
    if (!span) {
      throw new Error(`Span ${spanId} not found`);
    }

    span.end_time = Date.now();
    span.duration = span.end_time - span.start_time;
    span.metadata = metadata;
    span.status = 'completed';

    this.activeTraces.delete(spanId);

    return span;
  }

  /**
   * Get trace
   */
  getTrace(traceId) {
    return this.traceSpans.filter(span => span.trace_id === traceId);
  }

  /**
   * Check alert rules
   */
  checkAlerts(metrics) {
    const triggeredAlerts = [];

    for (const [ruleName, rule] of Object.entries(this.alertRules)) {
      if (rule.check(metrics)) {
        triggeredAlerts.push({
          rule: ruleName,
          severity: rule.severity,
          message: rule.message,
          triggered_at: new Date().toISOString()
        });
      }
    }

    return triggeredAlerts;
  }

  /**
   * Generate log ID
   */
  generateLogId() {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate span ID
   */
  generateSpanId() {
    return `span_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const metrics = this.getMetrics();
      const alertStatus = this.checkAlerts(metrics.application);

      return {
        status: alertStatus.length === 0 ? 'healthy' : 'degraded',
        metrics: metrics,
        alerts: alertStatus,
        log_count: this.logs.length,
        trace_count: this.traceSpans.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Monitoring infrastructure health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new MonitoringInfrastructure();