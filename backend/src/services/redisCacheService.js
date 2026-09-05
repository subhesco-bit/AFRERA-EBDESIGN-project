/**
 * Redis Cache Service
 * Handles caching operations using Redis
 */

const { logger } = require('../utils/logger');
const Redis = require('ioredis');

class RedisCacheService {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.defaultTTL = 3600; // 1 hour
  }

  async initialize() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redis = new Redis(redisUrl, {
        retryStrategy: (times) => {
          if (times > 3) {
            logger.error('Redis connection failed after 3 retries');
            return null;
          }
          return Math.min(times * 50, 2000);
        }
      });

      this.redis.on('connect', () => {
        this.isConnected = true;
        logger.info('Redis connected');
      });

      this.redis.on('error', (error) => {
        this.isConnected = false;
        logger.error('Redis connection error', error);
      });

      this.redis.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      logger.info('RedisCacheService initialized');
    } catch (error) {
      logger.error('RedisCacheService initialization failed', error);
    }
  }

  /**
   * Set a value in cache
   */
  async set(key, value, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache set skipped');
        return false;
      }

      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      logger.debug(`Cache set: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache set failed', error);
      return false;
    }
  }

  /**
   * Get a value from cache
   */
  async get(key) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache get skipped');
        return null;
      }

      const value = await this.redis.get(key);
      if (value === null) {
        return null;
      }

      return JSON.parse(value);
    } catch (error) {
      logger.error('Cache get failed', error);
      return null;
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache delete skipped');
        return false;
      }

      await this.redis.del(key);
      logger.debug(`Cache deleted: ${key}`);
      return true;
    } catch (error) {
      logger.error('Cache delete failed', error);
      return false;
    }
  }

  /**
   * Delete multiple keys from cache
   */
  async deleteMultiple(keys) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache delete multiple skipped');
        return false;
      }

      await this.redis.del(...keys);
      logger.debug(`Cache deleted multiple: ${keys.length} keys`);
      return true;
    } catch (error) {
      logger.error('Cache delete multiple failed', error);
      return false;
    }
  }

  /**
   * Check if key exists in cache
   */
  async exists(key) {
    try {
      if (!this.isConnected) {
        return false;
      }

      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists check failed', error);
      return false;
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMultiple(keyValuePairs, ttl = this.defaultTTL) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache set multiple skipped');
        return false;
      }

      const pipeline = this.redis.pipeline();
      for (const [key, value] of Object.entries(keyValuePairs)) {
        pipeline.setex(key, ttl, JSON.stringify(value));
      }
      await pipeline.exec();
      logger.debug(`Cache set multiple: ${Object.keys(keyValuePairs).length} keys`);
      return true;
    } catch (error) {
      logger.error('Cache set multiple failed', error);
      return false;
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMultiple(keys) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache get multiple skipped');
        return {};
      }

      const values = await this.redis.mget(...keys);
      let result = {};
      
      keys.forEach((key, index) => {
        if (values[index] !== null) {
          try {
            result[key] = JSON.parse(values[index]);
          } catch {
            result[key] = values[index];
          }
        }
      });

      return result;
    } catch (error) {
      logger.error('Cache get multiple failed', error);
      return {};
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async flushAll() {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache flush skipped');
        return false;
      }

      await this.redis.flushall();
      logger.warn('Cache flushed all');
      return true;
    } catch (error) {
      logger.error('Cache flush all failed', error);
      return false;
    }
  }

  /**
   * Clear cache by pattern
   */
  async flushByPattern(pattern) {
    try {
      if (!this.isConnected) {
        logger.warn('Redis not connected, cache flush by pattern skipped');
        return false;
      }

      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
        logger.debug(`Cache flushed by pattern: ${pattern} (${keys.length} keys)`);
      }
      return true;
    } catch (error) {
      logger.error('Cache flush by pattern failed', error);
      return false;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    try {
      if (!this.isConnected) {
        return {
          connected: false,
          keys: 0,
          memory: 0
        };
      }

      const info = await this.redis.info('memory');
      const dbsize = await this.redis.dbsize();
      
      return {
        connected: true,
        keys: dbsize,
        memory: this.parseMemoryInfo(info)
      };
    } catch (error) {
      logger.error('Get cache stats failed', error);
      return {
        connected: false,
        keys: 0,
        memory: 0
      };
    }
  }

  /**
   * Parse Redis memory info
   */
  parseMemoryInfo(info) {
    const lines = info.split('\n');
    const memoryInfo = {};
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        memoryInfo[key.trim()] = value.trim();
      }
    }

    return memoryInfo;
  }

  /**
   * Set value with complex key
   */
  async setWithPrefix(prefix, key, value, ttl = this.defaultTTL) {
    const fullKey = `${prefix}:${key}`;
    return await this.set(fullKey, value, ttl);
  }

  /**
   * Get value with complex key
   */
  async getWithPrefix(prefix, key) {
    let fullKey = `${prefix}:${key}`;
    return await this.get(fullKey);
  }

  /**
   * Increment a counter
   */
  async increment(key, amount = 1) {
    try {
      if (!this.isConnected) {
        return null;
      }

      return await this.redis.incrby(key, amount);
    } catch (error) {
      logger.error('Cache increment failed', error);
      return null;
    }
  }

  /**
   * Decrement a counter
   */
  async decrement(key, amount = 1) {
    try {
      if (!this.isConnected) {
        return null;
      }

      return await this.redis.decrby(key, amount);
    } catch (error) {
      logger.error('Cache decrement failed', error);
      return null;
    }
  }

  /**
   * Set expiry on existing key
   */
  async expire(key, ttl) {
    try {
      if (!this.isConnected) {
        return false;
      }

      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      logger.error('Cache expire failed', error);
      return false;
    }
  }

  /**
   * Get remaining time to live
   */
  async ttl(key) {
    try {
      if (!this.isConnected) {
        return -1;
      }

      return await this.redis.ttl(key);
    } catch (error) {
      logger.error('Cache ttl failed', error);
      return -1;
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    try {
      if (this.redis) {
        await this.redis.quit();
        this.isConnected = false;
        logger.info('Redis connection closed');
      }
    } catch (error) {
      logger.error('Close Redis connection failed', error);
    }
  }
}

module.exports = new RedisCacheService();
