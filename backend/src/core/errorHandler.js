// Enterprise Error Handler - Production Grade
const logger = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.timestamp = new Date().toISOString();
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401, 'AUTH_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHZ_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource', details = null) {
    super(`${resource} not found`, 404, 'NOT_FOUND', details);
  }
}

class ConflictError extends AppError {
  constructor(message, details = null) {
    super(message, 409, 'CONFLICT', details);
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT');
  }
}

class ServerError extends AppError {
  constructor(message = 'Internal server error', details = null) {
    super(message, 500, 'SERVER_ERROR', details);
  }
}

// Global error handler middleware
const errorHandler = (err, req, res, next) => {
  err.timestamp = new Date().toISOString();
  err.path = req.originalUrl;
  err.method = req.method;
  err.requestId = req.id;

  if (err.isOperational) {
    logger.warn('Operational Error', {
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      requestId: req.id
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId: req.id,
        timestamp: err.timestamp
      }
    });
  }

  // Programming or unknown error
  logger.error('Unexpected Error', {
    error: err.message,
    stack: err.stack,
    requestId: req.id
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      requestId: req.id,
      timestamp: new Date().toISOString()
    }
  });
};

module.exports = {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ServerError,
  errorHandler
};
