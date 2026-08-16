/**
 * Database Enhancements Integration Module
 * Central module that initializes and manages all database enhancement systems
 */

const { logger } = require('../utils/logger');
const { initializeConnectionPool, shutdownConnectionPool } = require('./advanced_pool');
const { initializeRedisCache, shutdownRedisCache } = require('./cache/redis_cache');
const { initializeTransactionManager, shutdownTransactionManager } = require('./transactions/transaction_manager');
const { getDatabaseMonitor } = require('./monitoring/database_monitor');
const { getDatabaseSecurity } = require('./security/database_security');
const BackupManager = require('./backup/backup_manager');
const { getQueryOptimizer } = require('./optimization/query_optimizer');

class DatabaseEnhancements {
  constructor(config = {}) {
    this.config = {
      // Enable/disable individual enhancements
      enableAdvancedPooling: config.enableAdvancedPooling !== false,
      enableCaching: config.enableCaching !== false,
      enableTransactions: config.enableTransactions !== false,
      enableMonitoring: config.enableMonitoring !== false,
      enableSecurity: config.enableSecurity !== false,
      enableBackup: config.enableBackup !== false,
      enableOptimization: config.enableOptimization !== false,
      
      // Global configuration
      environment: config.environment || process.env.NODE_ENV || 'development',
      
      // Individual configurations
      poolConfig: config.poolConfig || {},
      cacheConfig: config.cacheConfig || {},
      transactionConfig: config.transactionConfig || {},
      monitoringConfig: config.monitoringConfig || {},
      securityConfig: config.securityConfig || {},
      backupConfig: config.backupConfig || {},
      optimizationConfig: config.optimizationConfig || {},
      
      ...config
    };

    this.components = {
      pool: null,
      cache: null,
      transactionManager: null,
      monitor: null,
      security: null,
      backupManager: null,
      optimizer: null
    };

    this.isInitialized = false;
    this.isShuttingDown = false;
  }

  /**
   * Initialize all database enhancements
   */
  async initialize() {
    if (this.isInitialized) {
      logger.warn('Database enhancements already initialized');
      return;
    }

    logger.info('Initializing database enhancements...', {
      environment: this.config.environment,
      components: Object.keys(this.config)
        .filter(key => key.startsWith('enable') && this.config[key])
    });

    try {
      // Initialize advanced connection pool
      if (this.config.enableAdvancedPooling) {
        logger.info('Initializing advanced connection pool...');
        this.components.pool = await initializeConnectionPool(this.config.poolConfig);
        logger.info('Advanced connection pool initialized');
      }

      // Initialize Redis cache
      if (this.config.enableCaching) {
        logger.info('Initializing Redis cache...');
        this.components.cache = await initializeRedisCache(this.config.cacheConfig);
        logger.info('Redis cache initialized');
      }

      // Initialize transaction manager
      if (this.config.enableTransactions) {
        logger.info('Initializing transaction manager...');
        this.components.transactionManager = await initializeTransactionManager(this.config.transactionConfig);
        logger.info('Transaction manager initialized');
      }

      // Initialize monitoring
      if (this.config.enableMonitoring) {
        logger.info('Initializing database monitoring...');
        this.components.monitor = getDatabaseMonitor(this.config.monitoringConfig);
        await this.components.monitor.initialize();
        this.components.monitor.startMonitoring();
        logger.info('Database monitoring initialized');
      }

      // Initialize security
      if (this.config.enableSecurity) {
        logger.info('Initializing database security...');
        this.components.security = getDatabaseSecurity(this.config.securityConfig);
        await this.components.security.initialize();
        logger.info('Database security initialized');
      }

      // Initialize backup manager
      if (this.config.enableBackup) {
        logger.info('Initializing backup manager...');
        this.components.backupManager = new BackupManager(this.config.backupConfig);
        await this.components.backupManager.initialize();
        
        // Start scheduled backups in production
        if (this.config.environment === 'production') {
          this.components.backupManager.startScheduledBackups();
        }
        
        logger.info('Backup manager initialized');
      }

      // Initialize query optimizer
      if (this.config.enableOptimization) {
        logger.info('Initializing query optimizer...');
        this.components.optimizer = getQueryOptimizer(this.config.optimizationConfig);
        await this.components.optimizer.initialize();
        logger.info('Query optimizer initialized');
      }

      this.isInitialized = true;
      logger.info('All database enhancements initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database enhancements', { error: error.message });
      await this.shutdown();
      throw error;
    }
  }

  /**
   * Get connection pool
   */
  getPool() {
    if (!this.components.pool) {
      throw new Error('Connection pool not initialized');
    }
    return this.components.pool.getPool();
  }

  /**
   * Get cache
   */
  getCache() {
    if (!this.components.cache) {
      throw new Error('Cache not initialized');
    }
    return this.components.cache;
  }

  /**
   * Get transaction manager
   */
  getTransactionManager() {
    if (!this.components.transactionManager) {
      throw new Error('Transaction manager not initialized');
    }
    return this.components.transactionManager;
  }

  /**
   * Get monitor
   */
  getMonitor() {
    if (!this.components.monitor) {
      throw new Error('Monitor not initialized');
    }
    return this.components.monitor;
  }

  /**
   * Get security
   */
  getSecurity() {
    if (!this.components.security) {
      throw new Error('Security not initialized');
    }
    return this.components.security;
  }

  /**
   * Get backup manager
   */
  getBackupManager() {
    if (!this.components.backupManager) {
      throw new Error('Backup manager not initialized');
    }
    return this.components.backupManager;
  }

  /**
   * Get optimizer
   */
  getOptimizer() {
    if (!this.components.optimizer) {
      throw new Error('Optimizer not initialized');
    }
    return this.components.optimizer;
  }

  /**
   * Execute query with all enhancements applied
   */
  async executeQuery(query, params = {}, options = {}) {
    const startTime = Date.now();

    try {
      // Security validation
      if (this.components.security) {
        const validation = this.components.security.validateQuery(
          query,
          options.userId,
          options.ipAddress
        );
        
        if (!validation.valid) {
          throw new Error(`Query validation failed: ${validation.reason}`);
        }
      }

      // Query optimization
      let optimizedQuery = query;
      if (this.components.optimizer) {
        const optimization = await this.components.optimizer.optimizeQuery(query, params);
        if (optimization.optimized) {
          optimizedQuery = optimization.query;
          logger.debug('Query optimized', { suggestions: optimization.suggestions.length });
        }
      }

      // Check cache
      if (this.components.cache && options.useCache !== false) {
        const cached = await this.components.cache.get(optimizedQuery, params);
        if (cached !== null) {
          logger.debug('Cache hit', { query: query.substring(0, 50) });
          return cached;
        }
      }

      // Execute query
      const pool = this.getPool();
      const result = await pool.query(optimizedQuery, params);

      // Cache result
      if (this.components.cache && options.useCache !== false) {
        await this.components.cache.set(optimizedQuery, params, result, options.cacheTTL);
      }

      // Log query
      if (this.components.monitor) {
        this.components.monitor.logQuery(
          query,
          Date.now() - startTime,
          true,
          null,
          { userId: options.userId, sessionId: options.sessionId }
        );
      }

      return result;
    } catch (error) {
      // Log error
      if (this.components.monitor) {
        this.components.monitor.logQuery(
          query,
          Date.now() - startTime,
          false,
          error,
          { userId: options.userId, sessionId: options.sessionId }
        );
      }

      throw error;
    }
  }

  /**
   * Execute transaction with all enhancements
   */
  async executeTransaction(callback, options = {}) {
    const transactionManager = this.getTransactionManager();
    
    return transactionManager.executeInTransactionWithRetry(async (transaction) => {
      // Set user context for RLS
      if (this.components.security && options.userId) {
        await this.components.security.setUserContext(options.userId, options.userRole);
      }

      try {
        const result = await callback(transaction);
        return result;
      } finally {
        // Clear user context
        if (this.components.security) {
          await this.components.security.clearUserContext();
        }
      }
    }, options);
  }

  /**
   * Get comprehensive health status
   */
  async getHealthStatus() {
    const status = {
      healthy: true,
      components: {},
      timestamp: new Date()
    };

    // Check pool health
    if (this.components.pool) {
      const poolHealth = this.components.pool.getHealthStatus();
      status.components.pool = poolHealth;
      if (!poolHealth.healthy) {
        status.healthy = false;
      }
    }

    // Check cache health
    if (this.components.cache) {
      try {
        await this.components.cache.client.ping();
        status.components.cache = { healthy: true };
      } catch (error) {
        status.components.cache = { healthy: false, error: error.message };
        status.healthy = false;
      }
    }

    // Check monitor status
    if (this.components.monitor) {
      status.components.monitor = {
        metrics: this.components.monitor.getMetrics()
      };
    }

    // Check security status
    if (this.components.security) {
      status.components.security = {
        initialized: this.components.security.isInitialized
      };
    }

    // Get backup status
    if (this.components.backupManager) {
      const backups = await this.components.backupManager.listBackups();
      status.components.backup = {
        totalBackups: backups.length,
        lastBackup: backups.length > 0 ? backups[0].created : null
      };
    }

    return status;
  }

  /**
   * Get comprehensive metrics
   */
  async getMetrics() {
    const metrics = {
      timestamp: new Date(),
      components: {}
    };

    if (this.components.pool) {
      metrics.components.pool = this.components.pool.getMetrics();
    }

    if (this.components.cache) {
      metrics.components.cache = this.components.cache.getStatistics();
    }

    if (this.components.monitor) {
      metrics.components.monitor = this.components.monitor.getMetrics();
    }

    if (this.components.security) {
      metrics.components.security = await this.components.security.getSecurityStatistics();
    }

    if (this.components.optimizer) {
      metrics.components.optimizer = {
        slowQueries: await this.components.optimizer.getSlowQueries(10)
      };
    }

    return metrics;
  }

  /**
   * Shutdown all database enhancements
   */
  async shutdown() {
    if (this.isShuttingDown) {
      logger.warn('Database enhancements already shutting down');
      return;
    }

    this.isShuttingDown = true;
    logger.info('Shutting down database enhancements...');

    const shutdownOrder = [
      { name: 'backup manager', shutdown: async () => {
        if (this.components.backupManager) {
          this.components.backupManager.stopScheduledBackups();
          await this.components.backupManager.shutdown();
        }
      }},
      { name: 'monitor', shutdown: async () => {
        if (this.components.monitor) {
          await this.components.monitor.shutdown();
        }
      }},
      { name: 'optimizer', shutdown: async () => {
        if (this.components.optimizer) {
          await this.components.optimizer.shutdown();
        }
      }},
      { name: 'security', shutdown: async () => {
        if (this.components.security) {
          await this.components.security.shutdown();
        }
      }},
      { name: 'transaction manager', shutdown: async () => {
        await shutdownTransactionManager();
      }},
      { name: 'cache', shutdown: async () => {
        await shutdownRedisCache();
      }},
      { name: 'pool', shutdown: async () => {
        await shutdownConnectionPool();
      }}
    ];

    for (const component of shutdownOrder) {
      try {
        logger.info(`Shutting down ${component.name}...`);
        await component.shutdown();
        logger.info(`${component.name} shutdown complete`);
      } catch (error) {
        logger.error(`Failed to shutdown ${component.name}`, { error: error.message });
      }
    }

    this.components = {};
    this.isInitialized = false;
    this.isShuttingDown = false;

    logger.info('All database enhancements shutdown complete');
  }

  /**
   * Run database maintenance tasks
   */
  async runMaintenance() {
    logger.info('Running database maintenance tasks...');

    const tasks = [];

    // Analyze tables
    if (this.components.optimizer) {
      const tables = ['users', 'products', 'orders', 'farmers', 'fpos'];
      for (const table of tables) {
        tasks.push(this.components.optimizer.analyzeTable(table));
      }
    }

    // Cleanup old monitoring logs
    if (this.components.monitor) {
      tasks.push(this.components.monitor.cleanupOldLogs());
    }

    // Cleanup old backups
    if (this.components.backupManager) {
      tasks.push(this.components.backupManager.cleanupOldBackups());
    }

    const results = await Promise.allSettled(tasks);
    
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    logger.info('Database maintenance complete', { successful, failed });

    return { successful, failed, results };
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton database enhancements instance
 */
function getDatabaseEnhancements(config = {}) {
  if (!instance) {
    instance = new DatabaseEnhancements(config);
  }
  return instance;
}

/**
 * Initialize all database enhancements
 */
async function initializeDatabaseEnhancements(config = {}) {
  const enhancements = getDatabaseEnhancements(config);
  return await enhancements.initialize();
}

/**
 * Shutdown all database enhancements
 */
async function shutdownDatabaseEnhancements() {
  if (instance) {
    await instance.shutdown();
    instance = null;
  }
}

module.exports = {
  DatabaseEnhancements,
  getDatabaseEnhancements,
  initializeDatabaseEnhancements,
  shutdownDatabaseEnhancements
};
