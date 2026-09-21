/**
 * COMPLETE MIDDLEWARE INTEGRATION
 * ==============================
 * All middleware wired together
 */

'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');
const { AppError, ValidationError } = require('../libs');

// ============================================================================
// REQUEST ID MIDDLEWARE
// ============================================================================

const requestIdMiddleware = (req, res, next) => {
  req.id = req.get('X-Request-ID') || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};

// ============================================================================
// LOGGING MIDDLEWARE
// ============================================================================

const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    logger.info(`${req.method} ${req.path}`, {
      requestId: req.id,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
};

// ============================================================================
// ERROR HANDLER MIDDLEWARE
// ============================================================================

const errorHandlerMiddleware = (err, req, res, next) => {
  logger.error('Request error', {
    requestId: req.id,
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  let statusCode = err.statusCode || 500;
  let code = err.code || 'INTERNAL_ERROR';

  // Handle specific error types
  if (err instanceof ValidationError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

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
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      throw new AppError('Missing authentication token', 401, 'AUTHENTICATION_ERROR');
    }

    // Verify JWT (implementation depends on your auth service)
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    next(err);
  }
};

// Placeholder for JWT verification
async function verifyToken(token) {
  // This should be implemented with your JWT library
  return { id: 'user-id', email: 'user@example.com' };
}

// ============================================================================
// VALIDATION MIDDLEWARE
// ============================================================================

const validationMiddleware = (schema) => {
  return (req, res, next) => {
    try {
      const { error, value } = schema.validate(req.body, {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const details = error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        }));
        throw new ValidationError('Validation failed', details);
      }

      req.validatedData = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};

// ============================================================================
// RATE LIMITING MIDDLEWARE
// ============================================================================

const rateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    const validRequests = userRequests.filter(time => now - time < windowMs);

    if (validRequests.length >= maxRequests) {
      logger.warn('Rate limit exceeded', { ip: req.ip });
      return res.status(429).json({ error: 'Too many requests' });
    }

    validRequests.push(now);
    requests.set(key, validRequests);

    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', maxRequests - validRequests.length);

    next();
  };
};

// ============================================================================
// CORS MIDDLEWARE
// ============================================================================

const corsMiddleware = (req, res, next) => {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',');
  const origin = req.get('origin');

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
  res.setHeader('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }

  next();
};

// ============================================================================
// SETUP COMPLETE MIDDLEWARE CHAIN
// ============================================================================

function setupMiddleware(app) {
  // Security and tracking
  app.use(requestIdMiddleware);
  app.use(loggingMiddleware);
  app.use(corsMiddleware);

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ limit: '10mb', extended: true }));

  // Rate limiting
  app.use(rateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes

  return app;
}

// ============================================================================
// SETUP ERROR HANDLING (call last)
// ============================================================================

function setupErrorHandling(app) {
  // 404 handler
  app.use((req, res) => {
    res.status(404).json({
      error: 'Not Found',
      code: 'NOT_FOUND',
      path: req.path,
    });
  });

  // Global error handler
  app.use(errorHandlerMiddleware);

  return app;
}

// ============================================================================
// EXPORTS
// ============================================================================

module.exports = {
  requestIdMiddleware,
  loggingMiddleware,
  errorHandlerMiddleware,
  authMiddleware,
  validationMiddleware,
  rateLimitMiddleware,
  corsMiddleware,
  setupMiddleware,
  setupErrorHandling,
};
