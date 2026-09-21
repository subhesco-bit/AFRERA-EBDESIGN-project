/**
 * COMPLETE REMEDIATION IMPLEMENTATIONS - ALL ISSUES
 * =================================================
 * Ready-to-use code for fixing ALL identified shortcomings
 */

'use strict';

// ============================================================================
// 1. ENHANCED MIDDLEWARE SETUP
// ============================================================================

const setupEnhancedMiddleware = (app, express) => {
  const compression = require('compression');
  const helmet = require('helmet');
  const rateLimit = require('express-rate-limit');
  const requestId = require('express-request-id');

  // Security headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  }));

  // Request ID tracking
  app.use(requestId());

  // Compression
  app.use(compression({
    level: 6,
    threshold: 1000,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Request timeout
  app.use((req, res, next) => {
    res.setTimeout(30000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    next();
  });

  // Request size limiting
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ limit: '10kb' }));

  // Idempotency key handler
  const idempotencyCache = new Map();
  app.use((req, res, next) => {
    if (!['POST', 'PUT', 'DELETE'].includes(req.method)) {
      return next();
    }

    const key = req.get('Idempotency-Key');
    if (key && idempotencyCache.has(key)) {
      return res.json(idempotencyCache.get(key));
    }

    const originalJson = res.json.bind(res);
    res.json = function(data) {
      if (key) {
        idempotencyCache.set(key, data);
        // Clean up after 1 hour
        setTimeout(() => idempotencyCache.delete(key), 3600000);
      }
      return originalJson(data);
    };

    next();
  });

  return app;
};

// ============================================================================
// 2. ENHANCED ERROR HANDLING
// ============================================================================

class AppError extends Error {
  constructor(message, statusCode, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  const logger = require('./logger');

  logger.error('Error occurred', {
    requestId: req.id,
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  const statusCode = err.statusCode || 500;
  const response = {
    error: err.message || 'Internal Server Error',
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.id,
    timestamp: new Date().toISOString(),
  };

  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
};

// ============================================================================
// 3. ENHANCED AUTHENTICATION
// ============================================================================

const setupEnhancedAuth = () => {
  const jwt = require('jsonwebtoken');
  const bcrypt = require('bcrypt');

  const tokens = {
    access: {
      expiresIn: '15m',
      secret: process.env.JWT_SECRET,
    },
    refresh: {
      expiresIn: '7d',
      secret: process.env.JWT_REFRESH_SECRET,
    },
  };

  const passwordPolicy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  const validatePassword = (password) => {
    if (password.length < passwordPolicy.minLength) {
      return { valid: false, error: 'Password too short' };
    }
    if (passwordPolicy.requireUppercase && !/[A-Z]/.test(password)) {
      return { valid: false, error: 'Missing uppercase letter' };
    }
    if (passwordPolicy.requireLowercase && !/[a-z]/.test(password)) {
      return { valid: false, error: 'Missing lowercase letter' };
    }
    if (passwordPolicy.requireNumbers && !/[0-9]/.test(password)) {
      return { valid: false, error: 'Missing number' };
    }
    if (passwordPolicy.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
      return { valid: false, error: 'Missing special character' };
    }
    return { valid: true };
  };

  const generateTokens = (userId) => {
    const accessToken = jwt.sign({ id: userId }, tokens.access.secret, {
      expiresIn: tokens.access.expiresIn,
    });
    const refreshToken = jwt.sign({ id: userId }, tokens.refresh.secret, {
      expiresIn: tokens.refresh.expiresIn,
    });
    return { accessToken, refreshToken };
  };

  const loginAttempts = new Map();

  const checkLoginAttempts = (email) => {
    const attempts = loginAttempts.get(email) || { count: 0, lockedUntil: null };
    
    if (attempts.lockedUntil && attempts.lockedUntil > Date.now()) {
      throw new AppError('Account temporarily locked', 429, 'ACCOUNT_LOCKED');
    }
    
    return attempts;
  };

  const recordFailedLogin = (email) => {
    const attempts = loginAttempts.get(email) || { count: 0 };
    attempts.count++;
    
    if (attempts.count >= 5) {
      attempts.lockedUntil = Date.now() + (15 * 60 * 1000); // 15 minutes
    }
    
    loginAttempts.set(email, attempts);
  };

  const recordSuccessfulLogin = (email) => {
    loginAttempts.delete(email);
  };

  return {
    tokens,
    passwordPolicy,
    validatePassword,
    generateTokens,
    checkLoginAttempts,
    recordFailedLogin,
    recordSuccessfulLogin,
  };
};

// ============================================================================
// 4. ENHANCED DATA VALIDATION
// ============================================================================

const setupDataValidation = () => {
  const Joi = require('joi');

  const schemas = {
    createUser: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().min(12).required(),
      name: Joi.string().required(),
      role: Joi.string().valid('user', 'admin', 'manager'),
    }),

    createOrder: Joi.object({
      userId: Joi.string().uuid().required(),
      items: Joi.array().items(
        Joi.object({
          productId: Joi.string().uuid().required(),
          quantity: Joi.number().positive().required(),
          price: Joi.number().positive().required(),
        })
      ).required(),
      shippingAddress: Joi.object({
        street: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
      }).required(),
    }),
  };

  const sanitizeInput = (input) => {
    if (typeof input === 'string') {
      return input
        .replace(/[<>]/g, '') // Remove HTML tags
        .replace(/['";]/g, '') // Remove quotes
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

  const validateInput = (schema) => {
    return (req, res, next) => {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.details.map(d => ({
            field: d.path.join('.'),
            message: d.message,
          })),
        });
      }

      req.validatedData = sanitizeInput(value);
      next();
    };
  };

  return { schemas, sanitizeInput, validateInput };
};

// ============================================================================
// 5. ENHANCED DATABASE MANAGEMENT
// ============================================================================

const setupEnhancedDatabase = (db) => {
  // Distributed locking
  const redis = require('redis');
  const client = redis.createClient();

  const acquireLock = async (resource, ttl = 10000) => {
    const lockId = Math.random().toString(36).substring(7);
    const result = await client.set(
      `lock:${resource}`,
      lockId,
      'EX',
      Math.ceil(ttl / 1000),
      'NX'
    );
    return result ? lockId : null;
  };

  const releaseLock = async (resource, lockId) => {
    const currentId = await client.get(`lock:${resource}`);
    if (currentId === lockId) {
      await client.del(`lock:${resource}`);
    }
  };

  // Optimistic locking
  const updateWithOptimisticLock = async (table, id, updates, version) => {
    const updateClauses = Object.keys(updates)
      .map((key, i) => `${key} = $${i + 2}`)
      .join(', ');

    const result = await db.query(
      `UPDATE ${table} SET ${updateClauses}, version = version + 1 
       WHERE id = $1 AND version = $${Object.keys(updates).length + 2}
       RETURNING *`,
      [id, ...Object.values(updates), version]
    );

    if (result.rows.length === 0) {
      throw new AppError('Concurrent modification detected', 409, 'CONFLICT');
    }

    return result.rows[0];
  };

  // Transaction management
  const withTransaction = async (callback) => {
    const client = await db.connect();
    try {
      await client.query('BEGIN ISOLATION LEVEL SERIALIZABLE');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  };

  return { acquireLock, releaseLock, updateWithOptimisticLock, withTransaction };
};

// ============================================================================
// 6. ENHANCED CACHING
// ============================================================================

const setupEnhancedCaching = (redis) => {
  const cacheStrategies = {
    products: { ttl: 7200, pattern: 'products:*' },
    users: { ttl: 1800, pattern: 'users:*' },
    orders: { ttl: 300, pattern: 'orders:*' },
    crops: { ttl: 3600, pattern: 'crops:*' },
  };

  const get = async (key) => {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  };

  const set = async (key, value, ttl = 3600) => {
    await redis.setex(key, ttl, JSON.stringify(value));
  };

  const del = async (key) => {
    await redis.del(key);
  };

  const invalidatePattern = async (pattern) => {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  };

  const warmCache = async (loader) => {
    const data = await loader();
    for (const [key, value, ttl] of data) {
      await set(key, value, ttl);
    }
  };

  return { get, set, del, invalidatePattern, warmCache, cacheStrategies };
};

// ============================================================================
// 7. ENHANCED HEALTH CHECKS
// ============================================================================

const setupHealthChecks = (app, db, redis, cache) => {
  app.get('/health', (req, res) => {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
    res.json(health);
  });

  app.get('/ready', async (req, res) => {
    try {
      // Check database
      await db.query('SELECT 1');
      
      // Check Redis
      await redis.ping();
      
      // Check cache
      await cache.ping();

      res.json({ ready: true, timestamp: new Date().toISOString() });
    } catch (err) {
      res.status(503).json({ ready: false, error: err.message });
    }
  });

  app.get('/live', (req, res) => {
    res.json({ alive: true, timestamp: new Date().toISOString() });
  });
};

// ============================================================================
// 8. GRACEFUL SHUTDOWN
// ============================================================================

const setupGracefulShutdown = (server, db, redis) => {
  const logger = require('./logger');

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down gracefully`);

    // Stop accepting new connections
    server.close(() => {
      logger.info('HTTP server closed');
    });

    // Set timeout for forced shutdown
    setTimeout(() => {
      logger.error('Forced shutdown after 30 seconds');
      process.exit(1);
    }, 30000);

    try {
      // Close database connections
      await db.end();
      logger.info('Database connections closed');

      // Close Redis connections
      await redis.disconnect();
      logger.info('Redis connections closed');

      process.exit(0);
    } catch (err) {
      logger.error('Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  // Handle uncaught exceptions
  process.on('uncaughtException', (err) => {
    logger.error('Uncaught exception:', err);
    process.exit(1);
  });

  // Handle unhandled rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

// ============================================================================
// 9. MONITORING & METRICS
// ============================================================================

const setupMetrics = (app) => {
  const prometheus = require('prom-client');

  // Create metrics
  const httpRequestDuration = new prometheus.Histogram({
    name: 'http_request_duration_ms',
    help: 'Duration of HTTP requests in ms',
    labelNames: ['method', 'route', 'status_code'],
    buckets: [0.1, 5, 15, 50, 100, 500],
  });

  const httpRequestTotal = new prometheus.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
  });

  // Middleware
  app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      httpRequestDuration
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .observe(duration);
      httpRequestTotal
        .labels(req.method, req.route?.path || req.path, res.statusCode)
        .inc();
    });

    next();
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    res.set('Content-Type', prometheus.register.contentType);
    res.end(await prometheus.register.metrics());
  });
};

// ============================================================================
// 10. STRUCTURED LOGGING
// ============================================================================

const setupStructuredLogging = () => {
  const winston = require('winston');
  const { ElasticsearchTransport } = require('winston-elasticsearch');

  const logger = winston.createLogger({
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json()
    ),
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        ),
      }),
      new ElasticsearchTransport({
        level: 'info',
        clientOpts: { node: process.env.ELASTICSEARCH_URL },
        index: 'logs',
      }),
    ],
  });

  return logger;
};

module.exports = {
  setupEnhancedMiddleware,
  setupEnhancedAuth,
  setupDataValidation,
  setupEnhancedDatabase,
  setupEnhancedCaching,
  setupHealthChecks,
  setupGracefulShutdown,
  setupMetrics,
  setupStructuredLogging,
  AppError,
  errorHandler,
};
