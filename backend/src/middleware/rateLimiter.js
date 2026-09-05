/**
 * Professional Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

// Create different rate limiters for different endpoint types

// General API rate limiter (100 requests per 15 minutes)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Too many requests from this IP, please try again after 15 minutes'
    });
  }
});

// Strict rate limiter for sensitive operations (10 requests per hour)
const strictLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: {
    success: false,
    error: 'Too many sensitive operations, please try again later'
  },
  handler: (req, res) => {
    logger.warn('Strict rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Too many sensitive operations, please try again later'
    });
  }
});

// Authentication rate limiter (5 requests per 15 minutes)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many authentication attempts, please try again later'
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Too many authentication attempts, please try again later'
    });
  }
});

// API key rate limiter (1000 requests per hour)
const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 1000,
  keyGenerator: (req) => {
    return req.headers['x-api-key'] || req.ip;
  },
  message: {
    success: false,
    error: 'API key rate limit exceeded'
  },
  handler: (req, res) => {
    logger.warn('API key rate limit exceeded', {
      apiKey: req.headers['x-api-key'] ? '***REDACTED***' : 'none',
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'API key rate limit exceeded'
    });
  }
});

// Upload rate limiter (5 uploads per hour)
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    error: 'Too many file uploads, please try again later'
  },
  handler: (req, res) => {
    logger.warn('Upload rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    res.status(429).json({
      success: false,
      error: 'Too many file uploads, please try again later'
    });
  }
});

// Custom rate limiter with dynamic configuration
const createCustomLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      error: message || 'Rate limit exceeded'
    },
    handler: (req, res) => {
      logger.warn('Custom rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      res.status(429).json({
        success: false,
        error: message || 'Rate limit exceeded'
      });
    }
  });
};

// Whitelist for bypassing rate limiting (for testing or trusted IPs)
const trustedIPs = process.env.TRUSTED_IPS ? process.env.TRUSTED_IPS.split(',') : [];

const isTrustedIP = (req) => {
  return trustedIPs.includes(req.ip);
};

// Conditional rate limiter (skips trusted IPs)
const conditionalLimiter = (limiter) => {
  return (req, res, next) => {
    if (isTrustedIP(req)) {
      return next();
    }
    return limiter(req, res, next);
  };
};

module.exports = {
  apiLimiter,
  strictLimiter,
  authLimiter,
  apiKeyLimiter,
  uploadLimiter,
  createCustomLimiter,
  conditionalLimiter,
  isTrustedIP
};