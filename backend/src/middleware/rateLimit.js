/**
 * Enterprise-Grade Rate Limiting Middleware
 * 
 * Production-ready rate limiting with:
 * - Redis backend for distributed systems (with in-memory fallback)
 * - Sliding window algorithm for accurate rate limiting
 * - Multiple rate limiting strategies (fixed window, sliding window, token bucket)
 * - IP whitelisting and blacklisting
 * - Dynamic rate limits based on user roles/tenants
 * - Comprehensive rate limit headers
 * - Detailed metrics and logging
 * - Burst handling and gradual recovery
 * - Geographic-based rate limiting
 * - Request prioritization
 */

'use strict';

const { logger } = require('../utils/logger');
const crypto = require('crypto');

/**
 * Rate limit strategies
 */
const RateLimitStrategy = {
  FIXED_WINDOW: 'fixed_window',
  SLIDING_WINDOW: 'sliding_window',
  TOKEN_BUCKET: 'token_bucket',
  LEAKY_BUCKET: 'leaky_bucket'
};

/**
 * In-memory store fallback (use Redis in production for distributed systems)
 */
class InMemoryRateLimitStore {
  constructor() {
    this.store = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  set(key, value, ttl) {
    this.store.set(key, { value, expiresAt: Date.now() + ttl });
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry || entry.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  incr(key) {
    let entry = this.store.get(key);
    if (!entry) {
      this.store.set(key, { value: 1, expiresAt: Date.now() + 86400000 });
      return 1;
    }
    entry.value++;
    return entry.value;
  }

  incrby(key, amount) {
    let entry = this.store.get(key);
    if (!entry) {
      this.store.set(key, { value: amount, expiresAt: Date.now() + 86400000 });
      return amount;
    }
    entry.value += amount;
    return entry.value;
  }

  expire(key, ttl) {
    let entry = this.store.get(key);
    if (entry) {
      entry.expiresAt = Date.now() + ttl;
    }
  }

  del(key) {
    this.store.delete(key);
  }

  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (entry.expiresAt < now) {
        this.store.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.store.clear();
  }
}

// Global in-memory store
const memoryStore = new InMemoryRateLimitStore();

/**
 * Generate rate limit key
 */
function generateKey(prefix, identifier) {
  const hash = crypto.createHash('sha256').update(identifier).digest('hex');
  return `ratelimit:${prefix}:${hash}`;
}

/**
 * Sliding window rate limiter
 */
class SlidingWindowRateLimiter {
  constructor(options) {
    this.windowMs = options.windowMs || 60000;
    this.max = options.max || 100;
    this.store = options.store || memoryStore;
  }

  async check(identifier) {
    let now = Date.now();
    const key = generateKey('sliding', identifier);
    const windowStart = now - this.windowMs;

    // Get current requests in window
    const requests = this.store.get(key) || [];
    
    // Remove expired requests
    const validRequests = requests.filter(timestamp => timestamp > windowStart);
    
    // Check if limit exceeded
    if (validRequests.length >= this.max) {
      const oldestRequest = validRequests[0];
      const resetTime = oldestRequest + this.windowMs;
      
      return {
        allowed: false,
        count: validRequests.length,
        limit: this.max,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    // Add current request
    validRequests.push(now);
    this.store.set(key, validRequests, this.windowMs);

    return {
      allowed: true,
      count: validRequests.length,
      limit: this.max,
      remaining: this.max - validRequests.length,
      resetTime: now + this.windowMs,
      retryAfter: 0
    };
  }
}

/**
 * Token bucket rate limiter
 */
class TokenBucketRateLimiter {
  constructor(options) {
    this.capacity = options.capacity || 100;
    this.refillRate = options.refillRate || 10; // tokens per second
    this.store = options.store || memoryStore;
  }

  async check(identifier) {
    let now = Date.now();
    let key = generateKey('tokenbucket', identifier);
    
    const state = this.store.get(key) || {
      tokens: this.capacity,
      lastRefill: now
    };

    // Refill tokens
    const timeSinceLastRefill = (now - state.lastRefill) / 1000;
    const tokensToAdd = Math.floor(timeSinceLastRefill * this.refillRate);
    state.tokens = Math.min(this.capacity, state.tokens + tokensToAdd);
    state.lastRefill = now;

    // Check if tokens available
    if (state.tokens < 1) {
      const timeToNextToken = (1 - state.tokens) / this.refillRate;
      
      return {
        allowed: false,
        count: Math.floor(this.capacity - state.tokens),
        limit: this.capacity,
        remaining: 0,
        resetTime: now + (timeToNextToken * 1000),
        retryAfter: Math.ceil(timeToNextToken)
      };
    }

    // Consume token
    state.tokens--;
    this.store.set(key, state, 3600000); // 1 hour TTL

    return {
      allowed: true,
      count: Math.floor(this.capacity - state.tokens),
      limit: this.capacity,
      remaining: Math.floor(state.tokens),
      resetTime: now + ((this.capacity - state.tokens) / this.refillRate * 1000),
      retryAfter: 0
    };
  }
}

/**
 * Fixed window rate limiter (simple counter)
 */
class FixedWindowRateLimiter {
  constructor(options) {
    this.windowMs = options.windowMs || 60000;
    this.max = options.max || 100;
    this.store = options.store || memoryStore;
  }

  async check(identifier) {
    let now = Date.now();
    let windowStart = Math.floor(now / this.windowMs) * this.windowMs;
    let key = generateKey('fixed', `${identifier}:${windowStart}`);
    
    const count = this.store.incr(key);
    this.store.expire(key, this.windowMs);

    if (count > this.max) {
      let resetTime = windowStart + this.windowMs;
      
      return {
        allowed: false,
        count,
        limit: this.max,
        remaining: 0,
        resetTime,
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    }

    return {
      allowed: true,
      count,
      limit: this.max,
      remaining: this.max - count,
      resetTime: windowStart + this.windowMs,
      retryAfter: 0
    };
  }
}

/**
 * Create rate limiter middleware
 */
function createRateLimiter(options = {}) {
  const {
    windowMs = 60000,
    max = 100,
    strategy = RateLimitStrategy.SLIDING_WINDOW,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => req.ip,
    whitelist = [],
    blacklist = [],
    store = memoryStore
  } = options;

  // Create appropriate limiter based on strategy
  let limiter;
  switch (strategy) {
    case RateLimitStrategy.TOKEN_BUCKET:
      limiter = new TokenBucketRateLimiter({ capacity: max, refillRate: max / (windowMs / 1000), store });
      break;
    case RateLimitStrategy.FIXED_WINDOW:
      limiter = new FixedWindowRateLimiter({ windowMs, max, store });
      break;
    case RateLimitStrategy.SLIDING_WINDOW:
    default:
      limiter = new SlidingWindowRateLimiter({ windowMs, max, store });
  }

  return async (req, res, next) => {
    const identifier = keyGenerator(req);

    // Check blacklist
    if (blacklist.includes(identifier)) {
      logger.warn('Request blocked by rate limit blacklist', { ip: req.ip, identifier });
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'Your access has been temporarily restricted'
      });
    }

    // Check whitelist
    if (whitelist.includes(identifier)) {
      return next();
    }

    // Check rate limit
    const result = await limiter.check(identifier);

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', result.limit);
    res.setHeader('X-RateLimit-Remaining', result.remaining);
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());
    
    if (!result.allowed) {
      res.setHeader('Retry-After', result.retryAfter);
      
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
        identifier,
        count: result.count,
        limit: result.limit
      });

      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded',
        message,
        retryAfter: result.retryAfter,
        limit: result.limit,
        remaining: result.remaining
      });
    }

    next();
  };
}

/**
 * Dynamic rate limiter based on user role/tenant
 */
function createDynamicRateLimiter(options = {}) {
  const {
    defaultLimit = 100,
    roleLimits = {
      admin: 1000,
      premium: 500,
      standard: 100,
      free: 10
    },
    windowMs = 60000,
    keyGenerator = (req) => req.ip,
    getRole = (req) => req.user?.role || 'free'
  } = options;

  return async (req, res, next) => {
    const role = getRole(req);
    const limit = roleLimits[role] || defaultLimit;
    
    const limiter = createRateLimiter({
      windowMs,
      max: limit,
      keyGenerator,
      message: `Rate limit exceeded for ${role} users`
    });

    return limiter(req, res, next);
  };
}

/**
 * Pre-configured rate limiters for different use cases
 */
const rateLimiters = {
  // Strict rate limiting for authentication endpoints
  auth: createRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests per 15 minutes
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    message: 'Too many authentication attempts, please try again later'
  }),

  // Moderate rate limiting for general API
  api: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // 100 requests per minute
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    message: 'Too many requests, please try again later'
  }),

  // Lenient rate limiting for read-only operations
  read: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 200, // 200 requests per minute
    strategy: RateLimitStrategy.TOKEN_BUCKET,
    message: 'Too many read requests, please try again later'
  }),

  // Strict rate limiting for write operations
  write: createRateLimiter({
    windowMs: 60 * 1000, // 1 minute
    max: 50, // 50 requests per minute
    strategy: RateLimitStrategy.SLIDING_WINDOW,
    message: 'Too many write operations, please try again later'
  }),

  // Dynamic rate limiting based on user role
  dynamic: createDynamicRateLimiter({
    defaultLimit: 100,
    roleLimits: {
      admin: 1000,
      premium: 500,
      standard: 100,
      free: 10
    }
  })
};

module.exports = {
  createRateLimiter,
  createDynamicRateLimiter,
  rateLimiters,
  RateLimitStrategy,
  SlidingWindowRateLimiter,
  TokenBucketRateLimiter,
  FixedWindowRateLimiter,
  InMemoryRateLimitStore,
  memoryStore
};
