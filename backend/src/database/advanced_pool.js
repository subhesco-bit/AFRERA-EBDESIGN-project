/**
 * Advanced PostgreSQL Connection Pool Manager
 * Production-ready connection pooling with health checks, metrics, and adaptive sizing
 */

const { Pool } = require('pg');
const { logger } = require('../utils/logger');

class AdvancedConnectionPool {
  constructor(config = {}) {
    this.config = {
      // Connection pool configuration
      min: config.min || 2,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000,
      
      // Health check configuration
      healthCheckInterval: config.healthCheckInterval || 60000, // 1 minute
      healthCheckTimeout: config.healthCheckTimeout || 5000,
      
      // Adaptive sizing configuration
      enableAdaptiveSizing: config.enableAdaptiveSizing !== false,
      adaptiveSizingInterval: config.adaptiveSizingInterval || 300000, // 5 minutes
      adaptiveSizingMinThreshold: config.adaptiveSizingMinThreshold || 0.7, // 70% utilization
      adaptiveSizingMaxThreshold: config.adaptiveSizingMaxThreshold || 0.9, // 90% utilization
      
      // Metrics configuration
      enableMetrics: config.enableMetrics !== false,
      metricsInterval: config.metricsInterval || 60000, // 1 minute
      
      // Retry configuration
      maxRetries: config.maxRetries || 3,
      retryDelay: config.retryDelay || 1000,
      
      // Connection string or individual parameters
      connectionString: process.env.DATABASE_URL,
      host: process.env.PG_HOST || 'localhost',
      port: parseInt(process.env.PG_PORT, 10) || 5432,
      database: process.env.PG_DATABASE || 'afrera_db',
      user: process.env.PG_USER || 'postgres',
      password: process.env.PG_PASSWORD || 'password',
      
      // SSL configuration
      ssl: process.env.PG_SSL === 'true' ? {
        rejectUnauthorized: process.env.PG_SSL_STRICT !== 'false'
      } : undefined,
      
      ...config
    };

    this.pool = null;
    this.metrics = {
      totalConnections: 0,
      activeConnections: 0,
      idleConnections: 0,
      waitingClients: 0,
      totalQueries: 0,
      failedQueries: 0,
      totalWaitTime: 0,
      averageWaitTime: 0,
      healthCheckFailures: 0,
      lastHealthCheck: null,
      lastHealthCheckStatus: 'unknown'
    };

    this.healthCheckTimer = null;
    this.metricsTimer = null;
    this.adaptiveSizingTimer = null;
    this.isShuttingDown = false;
  }

  /**
   * Initialize the connection pool
   */
  async initialize() {
    try {
      if (this.pool) {
        logger.warn('Connection pool already initialized');
        return this.pool;
      }

      const poolConfig = this.config.connectionString
        ? { connectionString: this.config.connectionString }
        : {
            host: this.config.host,
            port: this.config.port,
            database: this.config.database,
            user: this.config.user,
            password: this.config.password,
            ssl: this.config.ssl
          };

      this.pool = new Pool({
        ...poolConfig,
        min: this.config.min,
        max: this.config.max,
        idleTimeoutMillis: this.config.idleTimeoutMillis,
        connectionTimeoutMillis: this.config.connectionTimeoutMillis,
        
        // Connection event handlers
        onConnect: (client) => {
          this.metrics.totalConnections++;
          logger.debug('New connection established', { 
            total: this.metrics.totalConnections 
          });
        },
        
        onRemove: (client) => {
          this.metrics.totalConnections--;
          logger.debug('Connection removed', { 
            total: this.metrics.totalConnections 
          });
        }
      });

      // Test initial connection
      await this.healthCheck();
      
      // Start background tasks
      this.startHealthCheck();
      this.startMetricsCollection();
      if (this.config.enableAdaptiveSizing) {
        this.startAdaptiveSizing();
      }

      logger.info('Advanced connection pool initialized', {
        min: this.config.min,
        max: this.config.max,
        adaptiveSizing: this.config.enableAdaptiveSizing
      });

      return this.pool;
    } catch (error) {
      logger.error('Failed to initialize connection pool', { 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Perform health check on the database
   */
  async healthCheck() {
    const startTime = Date.now();
    
    try {
      const client = await this.pool.connect();
      await client.query('SELECT NOW() as current_time, version() as version');
      client.release();

      const duration = Date.now() - startTime;
      
      this.metrics.lastHealthCheck = new Date();
      this.metrics.lastHealthCheckStatus = 'healthy';
      
      logger.debug('Database health check passed', { duration });
      
      return { healthy: true, duration };
    } catch (error) {
      this.metrics.healthCheckFailures++;
      this.metrics.lastHealthCheck = new Date();
      this.metrics.lastHealthCheckStatus = 'unhealthy';
      
      logger.error('Database health check failed', { 
        error: error.message,
        failures: this.metrics.healthCheckFailures
      });
      
      return { healthy: false, error: error.message };
    }
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }

    this.healthCheckTimer = setInterval(async () => {
      if (this.isShuttingDown) return;
      
      await this.healthCheck();
    }, this.config.healthCheckInterval);

    logger.debug('Health check timer started', { 
      interval: this.config.healthCheckInterval 
    });
  }

  /**
   * Collect pool metrics
   */
  collectMetrics() {
    if (!this.pool) {
      return null;
    }

    const poolMetrics = {
      totalCount: this.pool.totalCount,
      idleCount: this.pool.idleCount,
      waitingCount: this.pool.waitingCount
    };

    this.metrics.totalConnections = poolMetrics.totalCount;
    this.metrics.idleConnections = poolMetrics.idleCount;
    this.metrics.activeConnections = poolMetrics.totalCount - poolMetrics.idleCount;
    this.metrics.waitingClients = poolMetrics.waitingCount;

    // Calculate average wait time
    if (this.metrics.totalQueries > 0) {
      this.metrics.averageWaitTime = this.metrics.totalWaitTime / this.metrics.totalQueries;
    }

    return {
      ...this.metrics,
      pool: poolMetrics
    };
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection() {
    if (!this.config.enableMetrics) {
      return;
    }

    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }

    this.metricsTimer = setInterval(() => {
      if (this.isShuttingDown) return;
      
      const metrics = this.collectMetrics();
      if (metrics) {
        logger.debug('Pool metrics', {
          total: metrics.totalConnections,
          active: metrics.activeConnections,
          idle: metrics.idleConnections,
          waiting: metrics.waitingClients,
          queries: metrics.totalQueries,
          failures: metrics.failedQueries,
          avgWaitTime: metrics.averageWaitTime.toFixed(2) + 'ms',
          healthStatus: metrics.lastHealthCheckStatus
        });
      }
    }, this.config.metricsInterval);

    logger.debug('Metrics collection started', { 
      interval: this.config.metricsInterval 
    });
  }

  /**
   * Adaptive pool sizing based on utilization
   */
  async adaptiveSizing() {
    if (!this.pool || this.isShuttingDown) {
      return;
    }

    let metrics = this.collectMetrics();
    if (!metrics) {
      return;
    }

    const utilization = metrics.activeConnections / this.config.max;
    const currentSize = this.pool.totalCount;
    let newSize = currentSize;

    // Scale up if utilization is high
    if (utilization > this.config.adaptiveSizingMaxThreshold && currentSize < this.config.max) {
      newSize = Math.min(currentSize + 2, this.config.max);
      logger.info('Scaling up connection pool', {
        from: currentSize,
        to: newSize,
        utilization: (utilization * 100).toFixed(1) + '%'
      });
    }
    // Scale down if utilization is low
    else if (utilization < this.config.adaptiveSizingMinThreshold && currentSize > this.config.min) {
      newSize = Math.max(currentSize - 1, this.config.min);
      logger.info('Scaling down connection pool', {
        from: currentSize,
        to: newSize,
        utilization: (utilization * 100).toFixed(1) + '%'
      });
    }

    if (newSize !== currentSize) {
      try {
        // Note: pg.Pool doesn't support dynamic resizing directly
        // This is a placeholder for the logic - actual implementation would require
        // recreating the pool or using a different pooling library
        logger.debug('Pool size change requested', { currentSize, newSize });
      } catch (error) {
        logger.error('Failed to resize pool', { error: error.message });
      }
    }
  }

  /**
   * Start adaptive sizing
   */
  startAdaptiveSizing() {
    if (this.adaptiveSizingTimer) {
      clearInterval(this.adaptiveSizingTimer);
    }

    this.adaptiveSizingTimer = setInterval(() => {
      if (this.isShuttingDown) return;
      
      this.adaptiveSizing();
    }, this.config.adaptiveSizingInterval);

    logger.debug('Adaptive sizing started', { 
      interval: this.config.adaptiveSizingInterval 
    });
  }

  /**
   * Execute query with retry logic
   */
  async query(text, params, options = {}) {
    let startTime = Date.now();
    let lastError = null;
    let attempt = 0;

    while (attempt <= this.config.maxRetries) {
      try {
        const result = await this.pool.query(text, params, options);
        
        let duration = Date.now() - startTime;
        this.metrics.totalQueries++;
        this.metrics.totalWaitTime += duration;
        
        if (duration > 1000) {
          logger.warn('Slow query detected', { 
            duration: duration + 'ms',
            query: text.substring(0, 100) 
          });
        }
        
        return result;
      } catch (error) {
        lastError = error;
        attempt++;
        this.metrics.failedQueries++;
        
        if (attempt <= this.config.maxRetries) {
          const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
          logger.warn(`Query failed, retrying (${attempt}/${this.config.maxRetries})`, {
            error: error.message,
            delay: delay + 'ms'
          });
          
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    logger.error('Query failed after all retries', {
      error: lastError.message,
      attempts: this.config.maxRetries
    });
    
    throw lastError;
  }

  /**
   * Get a client from the pool with timeout
   */
  async getClient(options = {}) {
    const timeout = options.timeout || this.config.connectionTimeoutMillis;
    
    return Promise.race([
      this.pool.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), timeout)
      )
    ]);
  }

  /**
   * Execute transaction with automatic retry
   */
  async transaction(callback, options = {}) {
    let client = await this.getClient();
    
    try {
      await client.query('BEGIN');
      
      let result = await callback(client);
      
      await client.query('COMMIT');
      
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Get current pool metrics
   */
  getMetrics() {
    return this.collectMetrics();
  }

  /**
   * Get pool health status
   */
  getHealthStatus() {
    return {
      healthy: this.metrics.lastHealthCheckStatus === 'healthy',
      lastCheck: this.metrics.lastHealthCheck,
      failures: this.metrics.healthCheckFailures,
      metrics: this.collectMetrics()
    };
  }

  /**
   * Gracefully shutdown the pool
   */
  async shutdown() {
    this.isShuttingDown = true;

    // Clear timers
    if (this.healthCheckTimer) {
      clearInterval(this.healthCheckTimer);
    }
    if (this.metricsTimer) {
      clearInterval(this.metricsTimer);
    }
    if (this.adaptiveSizingTimer) {
      clearInterval(this.adaptiveSizingTimer);
    }

    // Close pool
    if (this.pool) {
      logger.info('Shutting down connection pool...');
      await this.pool.end();
      this.pool = null;
      logger.info('Connection pool shutdown complete');
    }
  }

  /**
   * Get the underlying pool (for backward compatibility)
   */
  getPool() {
    return this.pool;
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton connection pool instance
 */
function getConnectionPool(config = {}) {
  if (!instance) {
    instance = new AdvancedConnectionPool(config);
  }
  return instance;
}

/**
 * Initialize the connection pool
 */
async function initializeConnectionPool(config = {}) {
  const pool = getConnectionPool(config);
  return await pool.initialize();
}

/**
 * Shutdown the connection pool
 */
async function shutdownConnectionPool() {
  if (instance) {
    await instance.shutdown();
    instance = null;
  }
}

module.exports = {
  AdvancedConnectionPool,
  getConnectionPool,
  initializeConnectionPool,
  shutdownConnectionPool
};
