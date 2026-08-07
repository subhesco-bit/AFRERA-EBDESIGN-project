/**
 * Rate Limiter Middleware
 * Provides rate limiting for API endpoints to prevent abuse
 */

const { RateLimiterMemory, RateLimiterRedis } = require('rate-limiter-flexible');
const { logger } = require('../utils/logger');

// In-memory rate limiter (for development)
const rateLimiter = new RateLimiterMemory({
  points: 100, // Number of requests
  duration: 60, // Per 60 seconds
  blockDuration: 60 // Block for 60 seconds if limit exceeded
});

// Strict rate limiter for sensitive endpoints
const strictRateLimiter = new RateLimiterMemory({
  points: 10,
  duration: 60,
  blockDuration: 300
});

// Auth endpoint rate limiter (prevent brute force)
const authRateLimiter = new RateLimiterMemory({
  points: 5,
  duration: 60,
  blockDuration: 300
});

/**
 * General rate limiter middleware
 */
async function rateLimitMiddleware(req, res, next) {
  try {
    const key = req.ip || req.connection.remoteAddress;
    
    await rateLimiter.consume(key);
    
    // Add rate limit headers
    res.setHeader('X-RateLimit-Limit', rateLimiter.points);
    res.setHeader('X-RateLimit-Remaining', rateLimiter.getRemainingPoints ? 
      rateLimiter.getRemainingPoints(key) : 'unknown');
    
    next();
  } catch (rej) {
    const secs = Math.round(rej.msBeforeNext / 1000) || 1;
    
    res.setHeader('Retry-After', secs);
    res.setHeader('X-RateLimit-Limit', rateLimiter.points);
    res.setHeader('X-RateLimit-Remaining', 0);
    
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: secs
    });
  }
}

/**
 * Strict rate limiter for sensitive endpoints
 */
async function strictRateLimit(req, res, next) {
  try {
    const key = req.ip || req.connection.remoteAddress;
    
    await strictRateLimiter.consume(key);
    
    next();
  } catch (rej) {
    const secs = Math.round(rej.msBeforeNext / 1000) || 1;
    
    res.setHeader('Retry-After', secs);
    
    logger.warn(`Strict rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      error: 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: secs
    });
  }
}

/**
 * Auth-specific rate limiter
 */
async function authRateLimit(req, res, next) {
  try {
    const key = req.ip || req.connection.remoteAddress;
    
    await authRateLimiter.consume(key);
    
    next();
  } catch (rej) {
    const secs = Math.round(rej.msBeforeNext / 1000) || 1;
    
    res.setHeader('Retry-After', secs);
    
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`);
    
    res.status(429).json({
      error: 'Too many authentication attempts',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: secs
    });
  }
}

module.exports = {
  rateLimiter: rateLimitMiddleware,
  rateLimitMiddleware,
  strictRateLimit,
  authRateLimit
};
