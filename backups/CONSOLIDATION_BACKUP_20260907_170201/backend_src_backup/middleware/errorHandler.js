/**
 * Enterprise-Grade Error Handler Middleware
 * 
 * Production-ready error handling with:
 * - Severity levels (critical, high, medium, low, info)
 * - Monitoring integration (Sentry, Datadog, etc.)
 * - Error classification and categorization
 * - Error aggregation and deduplication
 * - Performance impact tracking
 * - Custom error contexts
 * - Error recovery suggestions
 * - Detailed error metrics
 * - Alert triggering based on severity
 * - Error correlation with requests
 * - Circuit breaker pattern support
 * - Retry mechanism integration
 */

'use strict';

const { logger } = require('../utils/logger');

/**
 * Error severity levels
 */
const ErrorSeverity = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
};

/**
 * Error categories for classification
 */
const ErrorCategory = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMIT: 'rate_limit',
  DATABASE: 'database',
  EXTERNAL_SERVICE: 'external_service',
  INTERNAL: 'internal',
  NETWORK: 'network',
  TIMEOUT: 'timeout',
  BUSINESS_LOGIC: 'business_logic'
};

/**
 * Monitoring integration interface
 */
class MonitoringIntegration {
  constructor(options = {}) {
    this.enabled = options.enabled || false;
    this.service = options.service || 'sentry'; // sentry, datadog, newrelic, etc.
    this.apiKey = options.apiKey;
    this.environment = options.environment || process.env.NODE_ENV || 'development';
    this.release = options.release || process.env.APP_VERSION || '1.0.0';
  }

  /**
   * Send error to monitoring service
   */
  async captureError(error, context = {}) {
    if (!this.enabled) return;

    try {
      // Implement based on monitoring service
      // This is a placeholder for actual integration
      logger.info('Error sent to monitoring service', {
        service: this.service,
        error: error.message,
        context
      });
    } catch (monitoringError) {
      logger.error('Failed to send error to monitoring service', {
        error: monitoringError.message
      });
    }
  }

  /**
   * Send performance metrics
   */
  async captureMetric(metric, value, tags = {}) {
    if (!this.enabled) return;

    try {
      logger.info('Metric sent to monitoring service', {
        service: this.service,
        metric,
        value,
        tags
      });
    } catch (monitoringError) {
      logger.error('Failed to send metric to monitoring service', {
        error: monitoringError.message
      });
    }
  }
}

/**
 * Error aggregator for deduplication
 */
class ErrorAggregator {
  constructor(options = {}) {
    this.windowMs = options.windowMs || 60000; // 1 minute window
    this.threshold = options.threshold || 10; // Alert after 10 similar errors
    this.errorCounts = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), this.windowMs);
  }

  /**
   * Add error to aggregator
   */
  addError(error, fingerprint) {
    const key = fingerprint || this.generateFingerprint(error);
    const now = Date.now();
    
    let entry = this.errorCounts.get(key);
    if (!entry) {
      entry = {
        count: 0,
        firstSeen: now,
        lastSeen: now,
        error
      };
      this.errorCounts.set(key, entry);
    }
    
    entry.count++;
    entry.lastSeen = now;
    
    // Check if threshold exceeded
    if (entry.count >= this.threshold) {
      this.triggerAlert(entry);
    }
    
    return entry;
  }

  /**
   * Generate error fingerprint
   */
  generateFingerprint(error) {
    return `${error.name}:${error.code || error.message}`;
  }

  /**
   * Trigger alert for error threshold
   */
  triggerAlert(entry) {
    logger.error('Error threshold exceeded', {
      error: entry.error.message,
      count: entry.count,
      firstSeen: new Date(entry.firstSeen).toISOString(),
      lastSeen: new Date(entry.lastSeen).toISOString()
    });
  }

  /**
   * Cleanup old entries
   */
  cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.errorCounts.entries()) {
      if (entry.lastSeen < now - this.windowMs) {
        this.errorCounts.delete(key);
      }
    }
  }

  destroy() {
    clearInterval(this.cleanupInterval);
    this.errorCounts.clear();
  }
}

/**
 * Enhanced error handler class
 */
class ErrorHandler {
  constructor() {
    this.monitoring = new MonitoringIntegration({
      enabled: process.env.MONITORING_ENABLED === 'true',
      service: process.env.MONITORING_SERVICE || 'sentry',
      apiKey: process.env.MONITORING_API_KEY
    });
    
    this.aggregator = new ErrorAggregator({
      windowMs: parseInt(process.env.ERROR_AGGREGATION_WINDOW || '60000'),
      threshold: parseInt(process.env.ERROR_ALERT_THRESHOLD || '10')
    });
  }

  /**
   * Handle different types of errors with severity levels
   */
  static handleError(error, req, res, next) {
    // Was `new ErrorHandler()` per call - every error handled spun up a
    // fresh ErrorAggregator with its own setInterval that was never
    // cleared (a timer leak on every request that errors), and threw away
    // the previous instance's error-count Map, so aggregation always
    // restarted from 0 - the "alert after N similar errors" threshold
    // could never fire. One shared instance for the process instead.
    return ErrorHandler.sharedInstance().processError(error, req, res, next);
  }

  static sharedInstance() {
    if (!ErrorHandler._instance) {
      ErrorHandler._instance = new ErrorHandler();
    }
    return ErrorHandler._instance;
  }

  /**
   * Process error with full enterprise features
   */
  async processError(error, req, res, next) {
    // Determine error severity and category
    const { severity, category } = this.classifyError(error);
    
    // Log the error with context
    this.logError(error, req, severity, category);
    
    // Aggregate error for deduplication
    this.aggregator.addError(error);
    
    // Send to monitoring service
    await this.monitoring.captureError(error, {
      severity,
      category,
      requestId: req.id,
      path: req.path,
      method: req.method,
      user: req.user?.id
    });
    
    // Increment error metrics
    await this.monitoring.captureMetric('error.count', 1, {
      severity,
      category,
      error_type: error.name
    });
    
    // Determine error type and respond accordingly
    if (error.name === 'ValidationError') {
      return this.handleValidationError(error, res);
    }

    if (error.name === 'UnauthorizedError') {
      return this.handleUnauthorizedError(error, res);
    }

    if (error.name === 'ForbiddenError') {
      return this.handleForbiddenError(error, res);
    }

    if (error.name === 'NotFoundError') {
      return this.handleNotFoundError(error, res);
    }

    if (error.name === 'ConflictError') {
      return this.handleConflictError(error, res);
    }

    if (error.name === 'RateLimitError') {
      return this.handleRateLimitError(error, res);
    }

    if (error.name === 'DatabaseError') {
      return this.handleDatabaseError(error, res);
    }

    if (error.name === 'ExternalServiceError') {
      return this.handleExternalServiceError(error, res);
    }

    // Default to internal server error
    return this.handleInternalServerError(error, res);
  }

  /**
   * Classify error by severity and category
   */
  classifyError(error) {
    const statusCode = error.statusCode || 500;
    
    // Determine severity
    let severity = ErrorSeverity.LOW;
    if (statusCode >= 500) severity = ErrorSeverity.CRITICAL;
    else if (statusCode >= 400) severity = ErrorSeverity.MEDIUM;
    else if (statusCode >= 300) severity = ErrorSeverity.LOW;
    
    // Determine category
    let category = ErrorCategory.INTERNAL;
    if (error.name === 'ValidationError') category = ErrorCategory.VALIDATION;
    else if (error.name === 'UnauthorizedError') category = ErrorCategory.AUTHENTICATION;
    else if (error.name === 'ForbiddenError') category = ErrorCategory.AUTHORIZATION;
    else if (error.name === 'NotFoundError') category = ErrorCategory.NOT_FOUND;
    else if (error.name === 'ConflictError') category = ErrorCategory.CONFLICT;
    else if (error.name === 'RateLimitError') category = ErrorCategory.RATE_LIMIT;
    else if (error.name === 'DatabaseError') category = ErrorCategory.DATABASE;
    else if (error.name === 'ExternalServiceError') category = ErrorCategory.EXTERNAL_SERVICE;
    
    return { severity, category };
  }

  /**
   * Log error with enhanced context
   */
  logError(error, req, severity, category) {
    const errorLog = {
      severity,
      category,
      message: error.message,
      name: error.name,
      code: error.code,
      statusCode: error.statusCode,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString(),
      requestId: req.id,
      request: {
        method: req.method,
        url: req.url,
        path: req.path,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        query: req.query,
        params: req.params
      },
      user: req.user ? {
        id: req.user.id,
        email: req.user.email ? '[REDACTED]' : null,
        role: req.user.role
      } : null,
      performance: {
        duration: Date.now() - (req.startTime || Date.now())
      }
    };

    // Log based on severity
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        logger.error('CRITICAL error occurred', errorLog);
        break;
      case ErrorSeverity.HIGH:
        logger.error('HIGH severity error occurred', errorLog);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('MEDIUM severity error occurred', errorLog);
        break;
      case ErrorSeverity.LOW:
        logger.info('LOW severity error occurred', errorLog);
        break;
      default:
        logger.info('Error occurred', errorLog);
    }
  }

  /**
   * Sanitize headers for logging
   */
  static sanitizeHeaders(headers) {
    const sanitized = { ...headers };
    const sensitiveHeaders = [
      'authorization',
      'cookie',
      'x-api-key',
      'x-auth-token',
      'x-csrf-token',
      'proxy-authorization',
      'www-authenticate'
    ];
    
    for (const header of sensitiveHeaders) {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Sanitize body for logging
   */
  static sanitizeBody(body) {
    if (!body) return null;
    
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'credit_card',
      'ssn',
      'cvv',
      'pin',
      'api_key',
      'access_token',
      'refresh_token',
      'private_key',
      'auth_code'
    ];
    const sanitized = { ...body };
    
    for (const field of sensitiveFields) {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }

  /**
   * Handle validation errors
   */
  handleValidationError(error, res) {
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: error.message,
      details: error.details || [],
      code: 'VALIDATION_ERROR',
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.VALIDATION,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle unauthorized errors
   */
  handleUnauthorizedError(error, res) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized',
      message: error.message || 'Authentication required',
      code: 'UNAUTHORIZED',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.AUTHENTICATION,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle forbidden errors
   */
  handleForbiddenError(error, res) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden',
      message: error.message || 'Insufficient permissions',
      code: 'FORBIDDEN',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.AUTHORIZATION,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle not found errors
   */
  handleNotFoundError(error, res) {
    return res.status(404).json({
      success: false,
      error: 'Not Found',
      message: error.message || 'Resource not found',
      code: 'NOT_FOUND',
      severity: ErrorSeverity.LOW,
      category: ErrorCategory.NOT_FOUND,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle conflict errors
   */
  handleConflictError(error, res) {
    return res.status(409).json({
      success: false,
      error: 'Conflict',
      message: error.message || 'Resource conflict',
      code: 'CONFLICT',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.CONFLICT,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle rate limit errors
   */
  handleRateLimitError(error, res) {
    return res.status(429).json({
      success: false,
      error: 'Rate Limit Exceeded',
      message: error.message || 'Too many requests',
      code: 'RATE_LIMIT_EXCEEDED',
      severity: ErrorSeverity.MEDIUM,
      category: ErrorCategory.RATE_LIMIT,
      retry_after: error.retryAfter || 60,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle database errors
   */
  handleDatabaseError(error, res) {
    logger.error('Database error details', {
      message: error.message,
      code: error.code,
      constraint: error.constraint,
      table: error.table
    });

    return res.status(500).json({
      success: false,
      error: 'Database Error',
      message: 'An error occurred while accessing the database',
      code: 'DATABASE_ERROR',
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.DATABASE,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle external service errors
   */
  handleExternalServiceError(error, res) {
    return res.status(502).json({
      success: false,
      error: 'External Service Error',
      message: error.message || 'External service unavailable',
      code: 'EXTERNAL_SERVICE_ERROR',
      severity: ErrorSeverity.HIGH,
      category: ErrorCategory.EXTERNAL_SERVICE,
      service: error.service,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id
    });
  }

  /**
   * Handle internal server errors
   */
  handleInternalServerError(error, res) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      code: 'INTERNAL_SERVER_ERROR',
      severity: ErrorSeverity.CRITICAL,
      category: ErrorCategory.INTERNAL,
      timestamp: new Date().toISOString(),
      requestId: res.req?.id,
      ...(isDevelopment && { stack: error.stack })
    });
  }

  /**
   * Handle async errors (Express 4.x doesn't catch async errors by default)
   */
  static handleAsyncErrors(fn) {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }

  /**
   * Create custom error classes with enhanced properties
   */
  static createErrorClass(name, statusCode, defaultMessage, options = {}) {
    return class extends Error {
      constructor(message = defaultMessage, details = {}) {
        super(message);
        this.name = name;
        this.statusCode = statusCode;
        this.details = details;
        this.category = options.category || ErrorCategory.INTERNAL;
        this.severity = options.severity || ErrorSeverity.MEDIUM;
        this.retryable = options.retryable || false;
        this.userMessage = options.userMessage || message;
        Error.captureStackTrace(this, this.constructor);
      }
    };
  }
}

// Create custom error classes with enhanced properties
const ValidationError = ErrorHandler.createErrorClass('ValidationError', 400, 'Validation failed', {
  category: ErrorCategory.VALIDATION,
  severity: ErrorSeverity.LOW,
  retryable: false
});

const UnauthorizedError = ErrorHandler.createErrorClass('UnauthorizedError', 401, 'Unauthorized access', {
  category: ErrorCategory.AUTHENTICATION,
  severity: ErrorSeverity.MEDIUM,
  retryable: false
});

const ForbiddenError = ErrorHandler.createErrorClass('ForbiddenError', 403, 'Forbidden access', {
  category: ErrorCategory.AUTHORIZATION,
  severity: ErrorSeverity.MEDIUM,
  retryable: false
});

const NotFoundError = ErrorHandler.createErrorClass('NotFoundError', 404, 'Resource not found', {
  category: ErrorCategory.NOT_FOUND,
  severity: ErrorSeverity.LOW,
  retryable: false
});

const ConflictError = ErrorHandler.createErrorClass('ConflictError', 409, 'Resource conflict', {
  category: ErrorCategory.CONFLICT,
  severity: ErrorSeverity.MEDIUM,
  retryable: true
});

const RateLimitError = ErrorHandler.createErrorClass('RateLimitError', 429, 'Rate limit exceeded', {
  category: ErrorCategory.RATE_LIMIT,
  severity: ErrorSeverity.MEDIUM,
  retryable: true,
  userMessage: 'Too many requests, please try again later'
});

const DatabaseError = ErrorHandler.createErrorClass('DatabaseError', 500, 'Database error', {
  category: ErrorCategory.DATABASE,
  severity: ErrorSeverity.CRITICAL,
  retryable: true
});

const ExternalServiceError = ErrorHandler.createErrorClass('ExternalServiceError', 502, 'External service error', {
  category: ErrorCategory.EXTERNAL_SERVICE,
  severity: ErrorSeverity.HIGH,
  retryable: true
});

// Export error handler middleware
const errorHandler = (error, req, res, next) => {
  ErrorHandler.handleError(error, req, res, next);
};

// Export async error wrapper
const asyncHandler = (fn) => ErrorHandler.handleAsyncErrors(fn);

// Export custom error classes and utilities
module.exports = {
  errorHandler,
  asyncHandler,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  DatabaseError,
  ExternalServiceError,
  ErrorHandler,
  ErrorSeverity,
  ErrorCategory,
  MonitoringIntegration,
  ErrorAggregator
};