/**
 * Database Monitoring and Logging System
 * Production-ready monitoring with query tracking, performance metrics, and alerting
 */

const { Pool } = require('pg');
const { logger } = require('../../utils/logger');
const EventEmitter = require('events');

class DatabaseMonitor extends EventEmitter {
  constructor(config = {}) {
    super();
    
    this.config = {
      // Monitoring configuration
      enableQueryLogging: config.enableQueryLogging !== false,
      enableSlowQueryTracking: config.enableSlowQueryTracking !== false,
      slowQueryThreshold: config.slowQueryThreshold || 1000, // 1 second
      enableErrorTracking: config.enableErrorTracking !== false,
      enableConnectionTracking: config.enableConnectionTracking !== false,
      
      // Metrics collection
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000, // 1 minute
      
      // Alerting configuration
      enableAlerting: config.enableAlerting !== false,
      alertThresholds: config.alertThresholds || {
        slowQueryRate: 0.1, // 10% of queries are slow
        errorRate: 0.05, // 5% of queries fail
        connectionPoolUtilization: 0.9, // 90% pool utilization
        averageQueryTime: 500, // 500ms average query time
        deadlockCount: 1 // Any deadlock triggers alert
      },
      alertWebhook: config.alertWebhook || process.env.DB_ALERT_WEBHOOK,
      
      // Retention
      metricsRetentionDays: config.metricsRetentionDays || 30,
      logRetentionDays: config.logRetentionDays || 7,
      
      // Database connection
      databaseUrl: config.databaseUrl || process.env.DATABASE_URL,
      
      ...config
    };

    this.pool = null;
    this.metricsTimer = null;
    this.cleanupTimer = null;
    this.isMonitoring = false;

    // Metrics storage
    this.metrics = {
      queries: {
        total: 0,
        successful: 0,
        failed: 0,
        slow: 0,
        averageTime: 0,
        totalTime: 0
      },
      connections: {
        total: 0,
        active: 0,
        idle: 0,
        waiting: 0
      },
      errors: {
        total: 0,
        byType: new Map(),
        recent: []
      },
      slowQueries: [],
      deadlocks: 0,
      lockWaits: 0
    };
  }

  /**
   * Initialize monitoring system
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl
      });

      // Create monitoring tables
      await this.createMonitoringTables();

      // Enable pg_stat_statements if not already enabled
      await this.enableQueryStatistics();

      logger.info('Database monitoring system initialized');
    } catch (error) {
      logger.error('Failed to initialize monitoring system', { error: error.message });
      throw error;
    }
  }

  /**
   * Create monitoring tables
   */
  async createMonitoringTables() {
    const tables = [
      `CREATE TABLE IF NOT EXISTS query_logs (
        id SERIAL PRIMARY KEY,
        query_text TEXT NOT NULL,
        query_hash VARCHAR(64),
        execution_time_ms INTEGER NOT NULL,
        rows_affected INTEGER,
        success BOOLEAN NOT NULL,
        error_message TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255),
        session_id VARCHAR(255)
      )`,
      
      `CREATE TABLE IF NOT EXISTS slow_queries (
        id SERIAL PRIMARY KEY,
        query_text TEXT NOT NULL,
        query_hash VARCHAR(64),
        execution_time_ms INTEGER NOT NULL,
        rows_affected INTEGER,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        execution_plan TEXT
      )`,
      
      `CREATE TABLE IF NOT EXISTS error_logs (
        id SERIAL PRIMARY KEY,
        error_type VARCHAR(100) NOT NULL,
        error_message TEXT NOT NULL,
        query_text TEXT,
        stack_trace TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        user_id VARCHAR(255),
        session_id VARCHAR(255)
      )`,
      
      `CREATE TABLE IF NOT EXISTS connection_metrics (
        id SERIAL PRIMARY KEY,
        total_connections INTEGER NOT NULL,
        active_connections INTEGER NOT NULL,
        idle_connections INTEGER NOT NULL,
        waiting_clients INTEGER NOT NULL,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS performance_metrics (
        id SERIAL PRIMARY KEY,
        metric_name VARCHAR(100) NOT NULL,
        metric_value DECIMAL(15, 2) NOT NULL,
        metric_unit VARCHAR(50),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        tags JSONB DEFAULT '{}'
      )`
    ];

    // Create indexes for monitoring tables
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_query_logs_timestamp ON query_logs(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_query_logs_query_hash ON query_logs(query_hash)',
      'CREATE INDEX IF NOT EXISTS idx_slow_queries_timestamp ON slow_queries(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_slow_queries_execution_time ON slow_queries(execution_time_ms DESC)',
      'CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type)',
      'CREATE INDEX IF NOT EXISTS idx_connection_metrics_timestamp ON connection_metrics(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp ON performance_metrics(metric_name, timestamp DESC)'
    ];

    for (const table of tables) {
      await this.pool.query(table);
    }

    for (const index of indexes) {
      await this.pool.query(index);
    }
  }

  /**
   * Enable pg_stat_statements for query statistics
   */
  async enableQueryStatistics() {
    try {
      await this.pool.query('CREATE EXTENSION IF NOT EXISTS pg_stat_statements');
      logger.info('pg_stat_statements extension enabled');
    } catch (error) {
      logger.warn('Failed to enable pg_stat_statements', { error: error.message });
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Monitoring already running');
      return;
    }

    this.isMonitoring = true;

    // Start metrics collection
    if (this.config.enableMetrics) {
      this.startMetricsCollection();
    }

    // Start cleanup
    this.startCleanup();

    logger.info('Database monitoring started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
      this.metricsTimer = null;
    }

    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }

    logger.info('Database monitoring stopped');
  }

  /**
   * Log query execution
   */
  logQuery(queryText, executionTime, success, error = null, metadata = {}) {
    if (!this.config.enableQueryLogging) {
      return;
    }

    const queryHash = this.generateQueryHash(queryText);

    // Update metrics
    this.metrics.queries.total++;
    this.metrics.queries.totalTime += executionTime;
    this.metrics.queries.averageTime = this.metrics.queries.totalTime / this.metrics.queries.total;

    if (success) {
      this.metrics.queries.successful++;
    } else {
      this.metrics.queries.failed++;
      this.trackError(error, queryText, metadata);
    }

    if (executionTime > this.config.slowQueryThreshold) {
      this.metrics.queries.slow++;
      this.trackSlowQuery(queryText, queryHash, executionTime, metadata);
    }

    // Log to database
    this.pool.query(`
      INSERT INTO query_logs (query_text, query_hash, execution_time_ms, success, error_message, user_id, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      queryText.substring(0, 10000), // Limit query text length
      queryHash,
      executionTime,
      success,
      error ? error.message : null,
      metadata.userId || null,
      metadata.sessionId || null
    ]).catch(err => {
      logger.error('Failed to log query', { error: err.message });
    });

    // Emit event
    this.emit('query', {
      queryHash,
      executionTime,
      success,
      metadata
    });
  }

  /**
   * Track slow query
   */
  async trackSlowQuery(queryText, queryHash, executionTime, metadata = {}) {
    const slowQuery = {
      queryText,
      queryHash,
      executionTime,
      timestamp: new Date(),
      metadata
    };

    this.metrics.slowQueries.push(slowQuery);

    // Keep only recent 100 slow queries
    if (this.metrics.slowQueries.length > 100) {
      this.metrics.slowQueries.shift();
    }

    // Get execution plan for analysis
    let executionPlan = null;
    try {
      const planResult = await this.pool.query('EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ' + queryText);
      executionPlan = JSON.stringify(planResult.rows[0]['QUERY PLAN']);
    } catch (error) {
      logger.warn('Failed to get execution plan', { error: error.message });
    }

    // Log to database
    await this.pool.query(`
      INSERT INTO slow_queries (query_text, query_hash, execution_time_ms, execution_plan)
      VALUES ($1, $2, $3, $4)
    `, [
      queryText.substring(0, 10000),
      queryHash,
      executionTime,
      executionPlan
    ]).catch(err => {
      logger.error('Failed to log slow query', { error: err.message });
    });

    // Emit event
    this.emit('slowQuery', slowQuery);

    // Check if alert needed
    this.checkSlowQueryAlert();
  }

  /**
   * Track error
   */
  trackError(error, queryText, metadata = {}) {
    if (!this.config.enableErrorTracking) {
      return;
    }

    const errorType = error.code || error.name || 'UNKNOWN';
    
    this.metrics.errors.total++;
    this.metrics.errors.byType.set(errorType, (this.metrics.errors.byType.get(errorType) || 0) + 1);
    
    this.metrics.errors.recent.push({
      errorType,
      message: error.message,
      queryText,
      timestamp: new Date(),
      metadata
    });

    // Keep only recent 50 errors
    if (this.metrics.errors.recent.length > 50) {
      this.metrics.errors.recent.shift();
    }

    // Log to database
    this.pool.query(`
      INSERT INTO error_logs (error_type, error_message, query_text, stack_trace, user_id, session_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [
      errorType,
      error.message,
      queryText ? queryText.substring(0, 10000) : null,
      error.stack,
      metadata.userId || null,
      metadata.sessionId || null
    ]).catch(err => {
      logger.error('Failed to log error', { error: err.message });
    });

    // Emit event
    this.emit('error', {
      errorType,
      error: error.message,
      queryText,
      metadata
    });

    // Check if alert needed
    this.checkErrorAlert();
  }

  /**
   * Track connection metrics
   */
  trackConnectionMetrics(poolMetrics) {
    if (!this.config.enableConnectionTracking) {
      return;
    }

    this.metrics.connections = {
      total: poolMetrics.totalCount,
      active: poolMetrics.totalCount - poolMetrics.idleCount,
      idle: poolMetrics.idleCount,
      waiting: poolMetrics.waitingCount
    };

    // Log to database
    this.pool.query(`
      INSERT INTO connection_metrics (total_connections, active_connections, idle_connections, waiting_clients)
      VALUES ($1, $2, $3, $4)
    `, [
      this.metrics.connections.total,
      this.metrics.connections.active,
      this.metrics.connections.idle,
      this.metrics.connections.waiting
    ]).catch(err => {
      logger.error('Failed to log connection metrics', { error: err.message });
    });

    // Check if alert needed
    this.checkConnectionAlert();
  }

  /**
   * Collect performance metrics from pg_stat_statements
   */
  async collectPerformanceMetrics() {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          query,
          calls,
          total_exec_time,
          mean_exec_time,
          max_exec_time,
          rows
        FROM pg_stat_statements
        ORDER BY mean_exec_time DESC
        LIMIT 20
      `);

      for (const row of rows) {
        await this.pool.query(`
          INSERT INTO performance_metrics (metric_name, metric_value, metric_unit, tags)
          VALUES ($1, $2, $3, $4)
        `, [
          'query_execution_time',
          row.mean_exec_time,
          'ms',
          JSON.stringify({
            query_hash: row.query,
            calls: row.calls,
            max_time: row.max_exec_time,
            rows: row.rows
          })
        ]);
      }

      return rows;
    } catch (error) {
      logger.error('Failed to collect performance metrics', { error: error.message });
      return [];
    }
  }

  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    this.metricsTimer = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.collectPerformanceMetrics();
        
        // Emit metrics event
        this.emit('metrics', this.getMetrics());
      } catch (error) {
        logger.error('Metrics collection failed', { error: error.message });
      }
    }, this.config.metricsInterval);

    logger.debug('Metrics collection started', { interval: this.config.metricsInterval });
  }

  /**
   * Start cleanup of old logs
   */
  startCleanup() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(async () => {
      if (!this.isMonitoring) return;

      try {
        await this.cleanupOldLogs();
      } catch (error) {
        logger.error('Cleanup failed', { error: error.message });
      }
    }, this.config.metricsInterval * 10); // Run cleanup less frequently

    logger.debug('Cleanup started');
  }

  /**
   * Clean up old logs based on retention policy
   */
  async cleanupOldLogs() {
    const queryCutoff = new Date();
    queryCutoff.setDate(queryCutoff.getDate() - this.config.logRetentionDays);

    const metricsCutoff = new Date();
    metricsCutoff.setDate(metricsCutoff.getDate() - this.config.metricsRetentionDays);

    let tables = [
      { table: 'query_logs', cutoff: queryCutoff },
      { table: 'slow_queries', cutoff: queryCutoff },
      { table: 'error_logs', cutoff: queryCutoff },
      { table: 'connection_metrics', cutoff: metricsCutoff },
      { table: 'performance_metrics', cutoff: metricsCutoff }
    ];

    for (const { table, cutoff } of tables) {
      await this.pool.query(`
        DELETE FROM ${table}
        WHERE timestamp < $1
      `, [cutoff]);
    }

    logger.debug('Old logs cleaned up');
  }

  /**
   * Check if slow query alert is needed
   */
  checkSlowQueryAlert() {
    if (!this.config.enableAlerting) return;

    const slowQueryRate = this.metrics.queries.slow / this.metrics.queries.total;
    
    if (slowQueryRate > this.config.alertThresholds.slowQueryRate) {
      this.sendAlert({
        type: 'slow_query_rate',
        severity: 'warning',
        message: `Slow query rate exceeded threshold: ${(slowQueryRate * 100).toFixed(1)}%`,
        metrics: {
          slowQueryRate,
          threshold: this.config.alertThresholds.slowQueryRate,
          totalQueries: this.metrics.queries.total,
          slowQueries: this.metrics.queries.slow
        }
      });
    }
  }

  /**
   * Check if error alert is needed
   */
  checkErrorAlert() {
    if (!this.config.enableAlerting) return;

    const errorRate = this.metrics.queries.failed / this.metrics.queries.total;
    
    if (errorRate > this.config.alertThresholds.errorRate) {
      this.sendAlert({
        type: 'error_rate',
        severity: 'critical',
        message: `Error rate exceeded threshold: ${(errorRate * 100).toFixed(1)}%`,
        metrics: {
          errorRate,
          threshold: this.config.alertThresholds.errorRate,
          totalQueries: this.metrics.queries.total,
          failedQueries: this.metrics.queries.failed
        }
      });
    }
  }

  /**
   * Check if connection alert is needed
   */
  checkConnectionAlert() {
    if (!this.config.enableAlerting) return;

    const utilization = this.metrics.connections.active / this.config.connections.total;
    
    if (utilization > this.config.alertThresholds.connectionPoolUtilization) {
      this.sendAlert({
        type: 'connection_pool_utilization',
        severity: 'warning',
        message: `Connection pool utilization high: ${(utilization * 100).toFixed(1)}%`,
        metrics: {
          utilization,
          threshold: this.config.alertThresholds.connectionPoolUtilization,
          activeConnections: this.metrics.connections.active,
          totalConnections: this.metrics.connections.total,
          waitingClients: this.metrics.connections.waiting
        }
      });
    }
  }

  /**
   * Send alert
   */
  async sendAlert(alert) {
    this.emit('alert', alert);
    
    logger.warn('Database alert triggered', alert);

    if (this.config.alertWebhook) {
      try {
        const axios = require('axios');
        await axios.post(this.config.alertWebhook, alert, {
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000
        });
      } catch (error) {
        logger.error('Failed to send alert webhook', { error: error.message });
      }
    }
  }

  /**
   * Generate query hash for deduplication
   */
  generateQueryHash(queryText) {
    // Normalize query by removing whitespace and parameter values
    const normalized = queryText
      .replace(/\s+/g, ' ')
      .replace(/\$\d+/g, '$1')
      .toLowerCase()
      .trim();
    
    return crypto.createHash('md5').update(normalized).digest('hex');
  }

  /**
   * Get current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      errors: {
        ...this.metrics.errors,
        byType: Object.fromEntries(this.metrics.errors.byType)
      }
    };
  }

  /**
   * Get query statistics
   */
  async getQueryStatistics(limit = 50) {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          query_hash,
          COUNT(*) as execution_count,
          AVG(execution_time_ms) as avg_time,
          MAX(execution_time_ms) as max_time,
          SUM(CASE WHEN success = FALSE THEN 1 ELSE 0 END) as failure_count
        FROM query_logs
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY query_hash
        ORDER BY execution_count DESC
        LIMIT $1
      `, [limit]);

      return rows;
    } catch (error) {
      logger.error('Failed to get query statistics', { error: error.message });
      return [];
    }
  }

  /**
   * Get slow queries
   */
  async getSlowQueries(limit = 20) {
    try {
      const { rows } = await this.pool.query(`
        SELECT * FROM slow_queries
        ORDER BY execution_time_ms DESC
        LIMIT $1
      `, [limit]);

      return rows;
    } catch (error) {
      logger.error('Failed to get slow queries', { error: error.message });
      return [];
    }
  }

  /**
   * Get error statistics
   */
  async getErrorStatistics(limit = 20) {
    try {
      const { rows } = await this.pool.query(`
        SELECT 
          error_type,
          COUNT(*) as error_count,
          MAX(timestamp) as last_occurrence
        FROM error_logs
        WHERE timestamp > NOW() - INTERVAL '24 hours'
        GROUP BY error_type
        ORDER BY error_count DESC
        LIMIT $1
      `, [limit]);

      return rows;
    } catch (error) {
      logger.error('Failed to get error statistics', { error: error.message });
      return [];
    }
  }

  /**
   * Shutdown monitoring
   */
  async shutdown() {
    this.stopMonitoring();

    if (this.pool) {
      await this.pool.end();
    }

    logger.info('Database monitoring shutdown complete');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton monitor instance
 */
function getDatabaseMonitor(config = {}) {
  if (!instance) {
    instance = new DatabaseMonitor(config);
  }
  return instance;
}

module.exports = {
  DatabaseMonitor,
  getDatabaseMonitor
};
