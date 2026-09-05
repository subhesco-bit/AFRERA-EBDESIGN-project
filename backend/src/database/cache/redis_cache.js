/**
 * Redis Caching Layer for Database Queries
 * Production-ready caching with automatic invalidation, TTL management, and cache warming
 */

const Redis = require('ioredis');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class RedisCache {
  constructor(config = {}) {
    this.config = {
      // Redis connection configuration
      host: config.host || process.env.REDIS_HOST || 'localhost',
      port: config.port || parseInt(process.env.REDIS_PORT, 10) || 6379,
      password: config.password || process.env.REDIS_PASSWORD,
      db: config.db || parseInt(process.env.REDIS_DB, 10) || 0,
      
      // Cache configuration
      defaultTTL: config.defaultTTL || 3600, // 1 hour default
      enableCacheWarming: config.enableCacheWarming !== false,
      enableAutomaticInvalidation: config.enableAutomaticInvalidation !== false,
      
      // Cache key configuration
      keyPrefix: config.keyPrefix || 'afrera:',
      keyVersion: config.keyVersion || 'v1',
      
      // Cache size limits
      maxMemoryPolicy: config.maxMemoryPolicy || 'allkeys-lru',
      maxMemory: config.maxMemory || '256mb',
      
      // Performance configuration
      enableCompression: config.enableCompression !== false,
      enableSerialization: config.enableSerialization !== false,
      
      // Statistics
      enableStatistics: config.enableStatistics !== false,
      
      ...config
    };

    this.client = null;
    this.isInitialized = false;
    this.statistics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Initialize Redis client
   */
  async initialize() {
    try {
      this.client = new Redis({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password,
        db: this.config.db,
        retryStrategy: (times) => {
          const delay = Math.min(times * 50, 2000);
          return delay;
        },
        enableReadyCheck: true,
        maxRetriesPerRequest: 3
      });

      // Configure Redis memory policy
      await this.client.config('SET', 'maxmemory', this.config.maxMemory);
      await this.client.config('SET', 'maxmemory-policy', this.config.maxMemoryPolicy);

      // Test connection
      await this.client.ping();

      this.isInitialized = true;
      logger.info('Redis cache initialized', {
        host: this.config.host,
        port: this.config.port,
        db: this.config.db
      });
    } catch (error) {
      logger.error('Failed to initialize Redis cache', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate cache key
   */
  generateCacheKey(query, params = []) {
    const queryHash = crypto
      .createHash('md5')
      .update(query + JSON.stringify(params))
      .digest('hex');
    
    return `${this.config.keyPrefix}${this.config.keyVersion}:${queryHash}`;
  }

  /**
   * Serialize value for storage
   */
  serialize(value) {
    if (!this.config.enableSerialization) {
      return value;
    }

    try {
      return JSON.stringify(value);
    } catch (error) {
      logger.error('Failed to serialize value', { error: error.message });
      return value;
    }
  }

  /**
   * Deserialize value from storage
   */
  deserialize(value) {
    if (!this.config.enableSerialization) {
      return value;
    }

    try {
      return JSON.parse(value);
    } catch (error) {
      logger.error('Failed to deserialize value', { error: error.message });
      return value;
    }
  }

  /**
   * Get value from cache
   */
  async get(query, params = []) {
    if (!this.isInitialized) {
      return null;
    }

    const key = this.generateCacheKey(query, params);

    try {
      const value = await this.client.get(key);
      
      if (value !== null) {
        this.statistics.hits++;
        return this.deserialize(value);
      }

      this.statistics.misses++;
      return null;
    } catch (error) {
      this.statistics.errors++;
      logger.error('Cache get failed', { error: error.message, key });
      return null;
    }
  }

  /**
   * Set value in cache
   */
  async set(query, params, value, ttl = null) {
    if (!this.isInitialized) {
      return false;
    }

    let key = this.generateCacheKey(query, params);
    const serializedValue = this.serialize(value);
    const cacheTTL = ttl || this.config.defaultTTL;

    try {
      await this.client.setex(key, cacheTTL, serializedValue);
      this.statistics.sets++;
      return true;
    } catch (error) {
      this.statistics.errors++;
      logger.error('Cache set failed', { error: error.message, key });
      return false;
    }
  }

  /**
   * Delete value from cache
   */
  async delete(query, params = []) {
    if (!this.isInitialized) {
      return false;
    }

    let key = this.generateCacheKey(query, params);

    try {
      await this.client.del(key);
      this.statistics.deletes++;
      return true;
    } catch (error) {
      this.statistics.errors++;
      logger.error('Cache delete failed', { error: error.message, key });
      return false;
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern) {
    if (!this.isInitialized) {
      return 0;
    }

    const fullPattern = `${this.config.keyPrefix}${this.config.keyPrefix}:${pattern}`;

    try {
      const keys = await this.client.keys(fullPattern);
      
      if (keys.length > 0) {
        await this.client.del(...keys);
        logger.info('Cache pattern invalidated', { pattern, count: keys.length });
      }

      return keys.length;
    } catch (error) {
      logger.error('Cache pattern invalidation failed', { error: error.message, pattern });
      return 0;
    }
  }

  /**
   * Invalidate cache by table
   */
  async invalidateTable(tableName) {
    return this.invalidatePattern(`table:${tableName}:*`);
  }

  /**
   * Invalidate cache by entity
   */
  async invalidateEntity(entityType, entityId) {
    return this.invalidatePattern(`entity:${entityType}:${entityId}:*`);
  }

  /**
   * Get or set pattern (cache-aside)
   */
  async getOrSet(query, params, callback, ttl = null) {
    // Try to get from cache
    const cached = await this.get(query, params);
    if (cached !== null) {
      return cached;
    }

    // Execute callback to get value
    let value = await callback();

    // Set in cache
    await this.set(query, params, value, ttl);

    return value;
  }

  /**
   * Multi-get (pipeline)
   */
  async multiGet(queries) {
    if (!this.isInitialized) {
      return queries.map(() => null);
    }

    let keys = queries.map(q => this.generateCacheKey(q.query, q.params));

    try {
      const values = await this.client.mget(...keys);
      
      return values.map((value, index) => {
        if (value !== null) {
          this.statistics.hits++;
          return this.deserialize(value);
        }
        this.statistics.misses++;
        return null;
      });
    } catch (error) {
      this.statistics.errors++;
      logger.error('Cache multi-get failed', { error: error.message });
      return queries.map(() => null);
    }
  }

  /**
   * Multi-set (pipeline)
   */
  async multiSet(items, ttl = null) {
    if (!this.isInitialized) {
      return false;
    }

    let cacheTTL = ttl || this.config.defaultTTL;

    try {
      const pipeline = this.client.pipeline();

      for (const item of items) {
        let key = this.generateCacheKey(item.query, item.params);
        let serializedValue = this.serialize(item.value);
        pipeline.setex(key, cacheTTL, serializedValue);
      }

      await pipeline.exec();
      this.statistics.sets += items.length;
      return true;
    } catch (error) {
      this.statistics.errors++;
      logger.error('Cache multi-set failed', { error: error.message });
      return false;
    }
  }

  /**
   * Cache warming - pre-load frequently accessed data
   */
  async warmCache(warmupQueries) {
    if (!this.config.enableCacheWarming) {
      logger.info('Cache warming is disabled');
      return;
    }

    logger.info('Starting cache warming', { queries: warmupQueries.length });

    let warmed = 0;
    let failed = 0;

    for (const warmupQuery of warmupQueries) {
      try {
        let value = await warmupQuery.callback();
        await this.set(warmupQuery.query, warmupQuery.params, value, warmupQuery.ttl);
        warmed++;
      } catch (error) {
        failed++;
        logger.error('Cache warming failed for query', {
          query: warmupQuery.query,
          error: error.message
        });
      }
    }

    logger.info('Cache warming completed', { warmed, failed });
  }

  /**
   * Get cache statistics
   */
  getStatistics() {
    const total = this.statistics.hits + this.statistics.misses;
    const hitRate = total > 0 ? (this.statistics.hits / total) * 100 : 0;

    return {
      ...this.statistics,
      hitRate: hitRate.toFixed(2) + '%',
      total
    };
  }

  /**
   * Reset statistics
   */
  resetStatistics() {
    this.statistics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0
    };
  }

  /**
   * Flush all cache
   */
  async flush() {
    if (!this.isInitialized) {
      return false;
    }

    try {
      await this.client.flushdb();
      logger.info('Cache flushed');
      return true;
    } catch (error) {
      logger.error('Cache flush failed', { error: error.message });
      return false;
    }
  }

  /**
   * Get cache size
   */
  async getSize() {
    if (!this.isInitialized) {
      return null;
    }

    try {
      const info = await this.client.info('memory');
      const match = info.match(/used_memory:(\d+)/);
      return match ? parseInt(match[1]) : null;
    } catch (error) {
      logger.error('Failed to get cache size', { error: error.message });
      return null;
    }
  }

  /**
   * Get cache info
   */
  async getInfo() {
    if (!this.isInitialized) {
      return null;
    }

    try {
      let info = await this.client.info();
      return info;
    } catch (error) {
      logger.error('Failed to get cache info', { error: error.message });
      return null;
    }
  }

  /**
   * Shutdown cache
   */
  async shutdown() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }

    this.isInitialized = false;
    logger.info('Redis cache shutdown complete');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton cache instance
 */
function getRedisCache(config = {}) {
  if (!instance) {
    instance = new RedisCache(config);
  }
  return instance;
}

/**
 * Initialize the cache
 */
async function initializeRedisCache(config = {}) {
  const cache = getRedisCache(config);
  return await cache.initialize();
}

/**
 * Shutdown the cache
 */
async function shutdownRedisCache() {
  if (instance) {
    await instance.shutdown();
    instance = null;
  }
}

module.exports = {
  RedisCache,
  getRedisCache,
  initializeRedisCache,
  shutdownRedisCache
};
