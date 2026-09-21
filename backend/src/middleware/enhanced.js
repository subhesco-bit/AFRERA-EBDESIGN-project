/**
 * ENHANCED MIDDLEWARE - ALL SECURITY & PERFORMANCE FIXES
 * ======================================================
 * Complete middleware suite with all remediations
 */

'use strict';

const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { v4: uuidv4 } = require('uuid');

const logger = require('../utils/logger');

// ============================================================================
// 1. REQUEST ID MIDDLEWARE
// ============================================================================

const requestIdMiddleware = (req, res, next) => {
  req.id = req.get('X-Request-ID') || uuidv4();
  res.setHeader('X-Request-ID', req.id);

  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info('HTTP Request Complete', {
      requestId: req.id,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });

  next();
};

// ============================================================================
// 2. SECURITY HEADERS MIDDLEWARE
// ============================================================================

const securityHeadersMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// ============================================================================
// 3. HTTPS ENFORCEMENT MIDDLEWARE
// ============================================================================

const httpsEnforcementMiddleware = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.get('host')}${req.url}`);
  }
  next();
};

// ============================================================================
// 4. COMPRESSION MIDDLEWARE
// ============================================================================

const compressionMiddleware = compression({
  level: 6,
  threshold: 1000,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
});

// ============================================================================
// 5. RATE LIMITING MIDDLEWARE
// ============================================================================

const globalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.id,
});

const strictRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: false,
});

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => req.body.email || req.ip,
});

// ============================================================================
// 6. REQUEST SIZE LIMITING MIDDLEWARE
// ============================================================================

const requestSizeLimitMiddleware = [
  express.json({ limit: '10kb' }),
  express.urlencoded({ limit: '10kb' }),
];

// ============================================================================
// 7. REQUEST TIMEOUT MIDDLEWARE
// ============================================================================

const requestTimeoutMiddleware = (req, res, next) => {
  const timeout = parseInt(process.env.REQUEST_TIMEOUT || '30000');

  const timeoutHandle = setTimeout(() => {
    logger.warn('Request timeout', {
      requestId: req.id,
      method: req.method,
      path: req.path,
    });

    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request timeout',
        code: 'REQUEST_TIMEOUT',
        requestId: req.id,
      });
    }
  }, timeout);

  res.on('finish', () => {
    clearTimeout(timeoutHandle);
  });

  next();
};

// ============================================================================
// 8. IDEMPOTENCY KEY MIDDLEWARE
// ============================================================================

const idempotencyMiddleware = (() => {
  const idempotencyCache = new Map();

  return (req, res, next) => {
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return next();
    }

    const key = req.get('Idempotency-Key');

    if (!key) {
      return res.status(400).json({
        error: 'Idempotency-Key header required for this operation',
        code: 'IDEMPOTENCY_KEY_REQUIRED',
        requestId: req.id,
      });
    }

    if (idempotencyCache.has(key)) {
      const cached = idempotencyCache.get(key);
      logger.info('Idempotent request served from cache', {
        requestId: req.id,
        key,
      });
      return res.status(cached.status).json(cached.body);
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      idempotencyCache.set(key, {
        status: res.statusCode,
        body: data,
        timestamp: Date.now(),
      });

      // Clean up after 1 hour
      setTimeout(() => {
        idempotencyCache.delete(key);
      }, 3600000);

      res.setHeader('Idempotency-Status', 'new');
      return originalJson(data);
    };

    next();
  };
})();

// ============================================================================
// 9. CACHING HEADERS MIDDLEWARE
// ============================================================================

const cacheHeadersMiddleware = (req, res, next) => {
  if (req.method === 'GET') {
    const cacheControl = req.path.includes('/api/public/')
      ? 'public, max-age=3600'
      : 'private, max-age=1800';

    res.setHeader('Cache-Control', cacheControl);
    res.setHeader('ETag', `"${Date.now()}"`);
  }

  next();
};

// ============================================================================
// 10. CORS MIDDLEWARE
// ============================================================================

const corsMiddleware = (req, res, next) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');

  const origin = req.get('origin');
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Request-ID,Idempotency-Key');
  res.setHeader('Access-Control-Max-Age', '3600');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

// ============================================================================
// 11. INPUT SANITIZATION MIDDLEWARE
// ============================================================================

const sanitizeInput = (input) => {
  if (typeof input === 'string') {
    return input
      .replace(/[<>]/g, '')
      .replace(/['";]/g, '')
      .trim();
  }
  if (typeof input === 'object' && input !== null) {
    return Object.entries(input).reduce((acc, [key, value]) => {
      acc[key] = sanitizeInput(value);
      return acc;
    }, Array.isArray(input) ? [] : {});
  }
  return input;
};

const sanitizationMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeInput(req.body);
  }
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeInput(req.query);
  }
  next();
};

// ============================================================================
// 12. ERROR HANDLING MIDDLEWARE
// ============================================================================

const errorHandlerMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';

  logger.error('Error occurred', {
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    statusCode,
    code,
  });

  const response = {
    error: err.message || 'Internal Server Error',
    code,
    requestId: req.id,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.details = err.details || null;
  }

  res.status(statusCode).json(response);
};

// ============================================================================
// 13. 404 NOT FOUND MIDDLEWARE
// ============================================================================

const notFoundMiddleware = (req, res) => {
  logger.warn('Not found', {
    requestId: req.id,
    method: req.method,
    path: req.path,
  });

  res.status(404).json({
    error: 'Resource not found',
    code: 'NOT_FOUND',
    requestId: req.id,
    path: req.path,
  });
};

// ============================================================================
// 14. LOGGING MIDDLEWARE
// ============================================================================

const loggingMiddleware = (req, res, next) => {
  logger.debug('Incoming request', {
    requestId: req.id,
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next();
};

// ============================================================================
// 15. SETUP FUNCTION - APPLY ALL MIDDLEWARE
// ============================================================================

const setupMiddleware = (app) => {
  // Security first
  app.use(httpsEnforcementMiddleware);
  app.use(securityHeadersMiddleware);
  app.use(corsMiddleware);

  // Request tracking
  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);

  // Rate limiting
  app.use(globalRateLimiter);

  // Compression
  app.use(compressionMiddleware);

  // Body parsing with limits
  app.use(...requestSizeLimitMiddleware);

  // Input sanitization
  app.use(sanitizationMiddleware);

  // Request management
  app.use(requestTimeoutMiddleware);
  app.use(cacheHeadersMiddleware);
  app.use(idempotencyMiddleware);

  return app;
};

module.exports = {
  requestIdMiddleware,
  securityHeadersMiddleware,
  httpsEnforcementMiddleware,
  compressionMiddleware,
  globalRateLimiter,
  strictRateLimiter,
  authRateLimiter,
  requestSizeLimitMiddleware,
  requestTimeoutMiddleware,
  idempotencyMiddleware,
  cacheHeadersMiddleware,
  corsMiddleware,
  sanitizeInput,
  sanitizationMiddleware,
  errorHandlerMiddleware,
  notFoundMiddleware,
  loggingMiddleware,
  setupMiddleware,
};
