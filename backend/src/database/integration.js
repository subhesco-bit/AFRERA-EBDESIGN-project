/**
 * DATABASE CONNECTION & INTEGRATION - Complete Setup
 * ====================================================
 */

'use strict';

const { Pool } = require('pg');
const redis = require('redis');
const { logger } = require('../utils/logger');

// ============================================================================
// DATABASE POOL CONFIGURATION
// ============================================================================

const dbConfig = {
  postgresql: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || 5432),
    database: process.env.DB_NAME || 'ebdesign',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || null,
    db: parseInt(process.env.REDIS_DB || 0),
  },
};

// ============================================================================
// CONNECTION STATE
// ============================================================================

let pgPool = null;
let redisClient = null;
let dbInitialized = false;

// ============================================================================
// POSTGRESQL CONNECTION POOL
// ============================================================================

class PostgreSQLConnection {
  static async initialize() {
    try {
      pgPool = new Pool(dbConfig.postgresql);

      // Test connection
      const client = await pgPool.connect();
      const result = await client.query('SELECT NOW()');
      logger.info('PostgreSQL connected:', result.rows[0]);
      client.release();

      // Setup error handlers
      pgPool.on('error', (err) => {
        logger.error('PostgreSQL pool error:', err);
      });

      dbInitialized = true;
      return pgPool;
    } catch (err) {
      logger.error('PostgreSQL connection failed:', err);
      throw err;
    }
  }

  static async query(sql, values = []) {
    try {
      if (!pgPool) {
        await this.initialize();
      }
      const result = await pgPool.query(sql, values);
      return result;
    } catch (err) {
      logger.error('PostgreSQL query error:', { sql, error: err.message });
      throw err;
    }
  }

  static async disconnect() {
    try {
      if (pgPool) {
        await pgPool.end();
        logger.info('PostgreSQL pool closed');
      }
    } catch (err) {
      logger.error('PostgreSQL disconnect error:', err);
    }
  }
}

// ============================================================================
// REDIS CONNECTION
// ============================================================================

class RedisConnection {
  static async initialize() {
    try {
      redisClient = redis.createClient(dbConfig.redis);

      redisClient.on('error', (err) => {
        logger.error('Redis error:', err);
      });

      redisClient.on('connect', () => {
        logger.info('Redis connected');
      });

      await redisClient.connect();
      logger.info('Redis initialized');
      return redisClient;
    } catch (err) {
      logger.error('Redis connection failed:', err);
      return null;
    }
  }

  static async get(key) {
    try {
      if (!redisClient) {
        await this.initialize();
      }
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (err) {
      logger.error(`Redis get error for key ${key}:`, err);
      return null;
    }
  }

  static async set(key, value, ttl = 3600) {
    try {
      if (!redisClient) {
        await this.initialize();
      }
      const serialized = JSON.stringify(value);
      await redisClient.setEx(key, ttl, serialized);
      return true;
    } catch (err) {
      logger.error(`Redis set error for key ${key}:`, err);
      return false;
    }
  }

  static async del(key) {
    try {
      if (!redisClient) {
        await this.initialize();
      }
      await redisClient.del(key);
      return true;
    } catch (err) {
      logger.error(`Redis delete error for key ${key}:`, err);
      return false;
    }
  }

  static async disconnect() {
    try {
      if (redisClient) {
        await redisClient.quit();
        logger.info('Redis disconnected');
      }
    } catch (err) {
      logger.error('Redis disconnect error:', err);
    }
  }
}

// ============================================================================
// HEALTH CHECKS
// ============================================================================

class HealthCheck {
  static async checkDatabase() {
    try {
      const result = await PostgreSQLConnection.query('SELECT 1');
      return { status: 'healthy', type: 'PostgreSQL' };
    } catch (err) {
      logger.error('Database health check failed:', err);
      return { status: 'unhealthy', type: 'PostgreSQL', error: err.message };
    }
  }

  static async checkCache() {
    try {
      if (redisClient && redisClient.isOpen) {
        return { status: 'healthy', type: 'Redis' };
      }
      return { status: 'unhealthy', type: 'Redis', error: 'Not connected' };
    } catch (err) {
      return { status: 'unhealthy', type: 'Redis', error: err.message };
    }
  }

  static async checkAll() {
    const db = await this.checkDatabase();
    const cache = await this.checkCache();

    return {
      status: db.status === 'healthy' && cache.status === 'healthy' ? 'healthy' : 'degraded',
      database: db,
      cache: cache,
      timestamp: new Date().toISOString(),
    };
  }
}

// ============================================================================
// DATABASE INITIALIZATION
// ============================================================================

async function initializeDatabase() {
  try {
    logger.info('Initializing database connections...');
    
    // Initialize PostgreSQL
    await PostgreSQLConnection.initialize();
    
    // Initialize Redis (optional, don't fail if unavailable)
    await RedisConnection.initialize().catch(err => {
      logger.warn('Redis unavailable, continuing without cache:', err.message);
    });

    dbInitialized = true;
    logger.info('Database initialization complete');
    return true;
  } catch (err) {
    logger.error('Database initialization failed:', err);
    throw err;
  }
}

// ============================================================================
// GRACEFUL SHUTDOWN
// ============================================================================

async function gracefulShutdown() {
  try {
    logger.info('Shutting down database connections...');
    await PostgreSQLConnection.disconnect();
    await RedisConnection.disconnect();
    logger.info('Database connections closed');
  } catch (err) {
    logger.error('Shutdown error:', err);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  PostgreSQLConnection,
  RedisConnection,
  HealthCheck,
  initializeDatabase,
  gracefulShutdown,
  
  // Convenience methods
  query: (sql, values) => PostgreSQLConnection.query(sql, values),
  getCache: (key) => RedisConnection.get(key),
  setCache: (key, value, ttl) => RedisConnection.set(key, value, ttl),
  delCache: (key) => RedisConnection.del(key),
  health: () => HealthCheck.checkAll(),
};
