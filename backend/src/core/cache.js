// Enterprise Caching Layer - Redis Integration
const redis = require('redis');
const logger = require('../utils/logger');

class CacheManager {
  constructor() {
    this.client = null;
    this.enabled = process.env.REDIS_ENABLED !== 'false';
    this.ttl = {
      short: 300,      // 5 minutes
      medium: 3600,    // 1 hour
      long: 86400,     // 24 hours
      analytics: 604800 // 7 days
    };
    this.init();
  }

  async init() {
    if (!this.enabled) {
      logger.info('Cache layer disabled');
      return;
    }

    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        socket: { reconnectStrategy: (retries) => Math.min(retries * 50, 500) }
      });

      this.client.on('error', (err) => logger.error('Redis error', err));
      this.client.on('connect', () => logger.info('Redis connected'));

      await this.client.connect();
    } catch (error) {
      logger.warn('Cache initialization failed, running without cache', error);
      this.enabled = false;
    }
  }

  async get(key) {
    if (!this.enabled) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.warn(`Cache get failed for key ${key}`, error);
      return null;
    }
  }

  async set(key, value, ttl = this.ttl.medium) {
    if (!this.enabled) return false;
    try {
      await this.client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.warn(`Cache set failed for key ${key}`, error);
      return false;
    }
  }

  async delete(key) {
    if (!this.enabled) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.warn(`Cache delete failed for key ${key}`, error);
      return false;
    }
  }

  async clear(pattern) {
    if (!this.enabled) return false;
    try {
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) await this.client.del(keys);
      return true;
    } catch (error) {
      logger.warn(`Cache clear failed for pattern ${pattern}`, error);
      return false;
    }
  }

  // Decorator for caching method results
  memoize(ttl = this.ttl.medium) {
    return (target, propertyKey, descriptor) => {
      const originalMethod = descriptor.value;

      descriptor.value = async function (...args) {
        const cacheKey = `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

        const cached = await this.cache.get(cacheKey);
        if (cached) {
          logger.debug(`Cache hit: ${cacheKey}`);
          return cached;
        }

        const result = await originalMethod.apply(this, args);
        await this.cache.set(cacheKey, result, ttl);
        return result;
      };

      return descriptor;
    };
  }
}

module.exports = new CacheManager();
