/**
 * Redis Cache Manager
 * Provides caching layer for frequently accessed data
 */

const Redis = require('ioredis');
const { logger } = require('../utils/logger');

let redisClient = null;

/**
 * Initialize Redis connection
 */
async function initializeRedis() {
  try {
    redisClient = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      maxRetriesPerRequest: 3,
    });

    redisClient.on('connect', () => {
      logger.info('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      logger.error('Redis connection error', { error: error.message, stack: error.stack });
    });

    // Test connection
    await redisClient.ping();
    
    return redisClient;
  } catch (error) {
    logger.error('Failed to initialize Redis', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get Redis client
 */
function getClient() {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

/**
 * Cache data with TTL
 */
async function set(key, value, ttl = 3600) {
  try {
    const client = getClient();
    const serializedValue = JSON.stringify(value);
    await client.setex(key, ttl, serializedValue);
    logger.debug(`Cached key: ${key} with TTL: ${ttl}s`);
  } catch (error) {
    logger.error('Error setting cache', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get cached data
 */
async function get(key) {
  try {
    let client = getClient();
    const value = await client.get(key);
    
    if (value === null) {
      return null;
    }
    
    return JSON.parse(value);
  } catch (error) {
    logger.error('Error getting cache', { error: error.message, stack: error.stack });
    return null;
  }
}

/**
 * Delete cached data
 */
async function del(key) {
  try {
    let client = getClient();
    await client.del(key);
    logger.debug(`Deleted cache key: ${key}`);
  } catch (error) {
    logger.error('Error deleting cache', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Delete multiple keys by pattern
 */
async function delPattern(pattern) {
  try {
    let client = getClient();
    const keys = await client.keys(pattern);
    
    if (keys.length > 0) {
      await client.del(...keys);
      logger.debug(`Deleted ${keys.length} keys matching pattern: ${pattern}`);
    }
    
    return keys.length;
  } catch (error) {
    logger.error('Error deleting cache pattern', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Check if key exists
 */
async function exists(key) {
  try {
    let client = getClient();
    return await client.exists(key) === 1;
  } catch (error) {
    logger.error('Error checking cache existence', { error: error.message, stack: error.stack });
    return false;
  }
}

/**
 * Set TTL for existing key
 */
async function expire(key, ttl) {
  try {
    let client = getClient();
    await client.expire(key, ttl);
  } catch (error) {
    logger.error('Error setting TTL', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Get TTL of key
 */
async function ttl(key) {
  try {
    let client = getClient();
    return await client.ttl(key);
  } catch (error) {
    logger.error('Error getting TTL', { error: error.message, stack: error.stack });
    return -1;
  }
}

/**
 * Increment counter
 */
async function incr(key) {
  try {
    let client = getClient();
    return await client.incr(key);
  } catch (error) {
    logger.error('Error incrementing counter', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Decrement counter
 */
async function decr(key) {
  try {
    let client = getClient();
    return await client.decr(key);
  } catch (error) {
    logger.error('Error decrementing counter', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Cache decorator for functions
 */
function cache(ttl = 3600, keyGenerator = null) {
  return function (target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args) {
      const cacheKey = keyGenerator 
        ? keyGenerator(...args) 
        : `${target.constructor.name}:${propertyKey}:${JSON.stringify(args)}`;

      // Try to get from cache
      const cachedValue = await get(cacheKey);
      if (cachedValue !== null) {
        logger.debug(`Cache hit for key: ${cacheKey}`);
        return cachedValue;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Cache the result
      await set(cacheKey, result, ttl);

      return result;
    };

    return descriptor;
  };
}

/**
 * Invalidate cache for specific entity
 */
async function invalidateEntity(entityType, entityId) {
  const pattern = `${entityType}:${entityId}:*`;
  return await delPattern(pattern);
}

/**
 * Health check
 */
function isHealthy() {
  return redisClient !== null && redisClient.status === 'ready';
}

/**
 * Close Redis connection
 */
async function close() {
  if (redisClient) {
    await redisClient.quit();
    logger.info('Redis connection closed');
  }
}

// Initialize on module load if not in test mode
if (process.env.NODE_ENV !== 'test') {
  initializeRedis().catch(error => {
    logger.error('Failed to initialize Redis', { error: error.message, stack: error.stack });
  });
}

module.exports = {
  initializeRedis,
  getClient,
  set,
  get,
  del,
  delPattern,
  exists,
  expire,
  ttl,
  incr,
  decr,
  cache,
  invalidateEntity,
  isHealthy,
  close
};
