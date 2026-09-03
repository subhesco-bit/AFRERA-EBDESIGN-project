/**
 * Unified Caching Service
 * Wraps Redis for session, API response, and data caching
 * Integrates with all critical services
 */

const redis = require('redis');
const { RedisClientType } = require('redis');

class CacheService {
  constructor() {
    this.client = null;
    this.ttl = {
      session: 3600, // 1 hour
      apiResponse: 300, // 5 minutes
      userData: 600, // 10 minutes
      schemes: 1800, // 30 minutes
      prices: 60, // 1 minute (live data)
      analytics: 3600, // 1 hour
      search: 300, // 5 minutes
      config: 86400, // 24 hours
    };
  }

  async init() {
    try {
      this.client = redis.createClient({
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
      });

      this.client.on('error', (err) => console.error('Redis error:', err));
      this.client.on('connect', () => console.log('Redis connected'));

      await this.client.connect();
      console.log('✅ Cache service initialized');
    } catch (error) {
      console.error('❌ Cache initialization failed:', error);
      throw error;
    }
  }

  async get(key) {
    try {
      if (!this.client) return null;
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  async set(key, value, ttl = null) {
    try {
      if (!this.client) return false;
      const serialized = JSON.stringify(value);
      const timeout = ttl || this.ttl.apiResponse;

      await this.client.setEx(key, timeout, serialized);
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  async del(key) {
    try {
      if (!this.client) return false;
      await this.client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache del error for key ${key}:`, error);
      return false;
    }
  }

  async invalidate(pattern) {
    try {
      if (!this.client) return false;
      const keys = await this.client.keys(pattern);
      if (keys.length > 0) {
        await this.client.del(keys);
      }
      return true;
    } catch (error) {
      console.error(`Cache invalidate error for pattern ${pattern}:`, error);
      return false;
    }
  }

  // Integration methods for common use cases
  async cacheSession(userId, sessionData) {
    return this.set(`session:${userId}`, sessionData, this.ttl.session);
  }

  async getSession(userId) {
    return this.get(`session:${userId}`);
  }

  async cacheUserData(userId, userData) {
    return this.set(`user:${userId}`, userData, this.ttl.userData);
  }

  async getUserData(userId) {
    return this.get(`user:${userId}`);
  }

  async cacheSchemes(schemes) {
    return this.set('schemes:all', schemes, this.ttl.schemes);
  }

  async getSchemes() {
    return this.get('schemes:all');
  }

  async cachePrices(prices) {
    return this.set('prices:current', prices, this.ttl.prices);
  }

  async getPrices() {
    return this.get('prices:current');
  }

  async invalidateUserCache(userId) {
    return this.invalidate(`user:${userId}:*`);
  }

  async invalidateSchemesCache() {
    return this.invalidate('schemes:*');
  }

  async invalidatePricesCache() {
    return this.invalidate('prices:*');
  }

  async stats() {
    try {
      if (!this.client) return null;
      const info = await this.client.info('stats');
      return info;
    } catch (error) {
      console.error('Cache stats error:', error);
      return null;
    }
  }

  async close() {
    if (this.client) {
      await this.client.quit();
      console.log('Cache service closed');
    }
  }
}

module.exports = new CacheService();
