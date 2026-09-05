/**
 * Enterprise-Grade Request/Response Logging Middleware
 * 
 * Production-ready logging with:
 * - Structured logging with correlation IDs
 * - Request tracing across distributed systems
 * - Performance metrics and timing
 * - Sensitive data sanitization
 * - Log level based on response status
 * - Request/response body logging (configurable)
 * - Custom log fields and metadata
 * - Log aggregation integration support
 * - Request fingerprinting for anomaly detection
 * - User context and session tracking
 */

'use strict';

const { logger } = require('../utils/logger');
const crypto = require('crypto');

/**
 * Generate request fingerprint for anomaly detection
 */
function generateFingerprint(req) {
  const fingerprintData = {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type')
  };
  return crypto.createHash('md5').update(JSON.stringify(fingerprintData)).digest('hex');
}

/**
 * Sanitize headers for logging (remove sensitive data)
 */
function sanitizeHeaders(headers) {
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
 * Sanitize body for logging (remove sensitive fields)
 */
function sanitizeBody(body) {
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
  let sanitized = { ...body };
  
  for (const field of sensitiveFields) {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Sanitize query parameters for logging
 */
function sanitizeQuery(query) {
  if (!query) return null;
  
  const sensitiveParams = ['token', 'key', 'secret', 'password', 'auth'];
  let sanitized = { ...query };
  
  for (const param of sensitiveParams) {
    if (sanitized[param]) {
      sanitized[param] = '[REDACTED]';
    }
  }
  
  return sanitized;
}

/**
 * Extract user context from request
 */
function extractUserContext(req) {
  if (!req.user) return null;
  
  return {
    id: req.user.id,
    email: req.user.email ? '[REDACTED]' : null,
    role: req.user.role,
    tenantId: req.user.tenantId,
    sessionId: req.sessionID
  };
}

/**
 * Determine log level based on response status
 */
function getLogLevel(statusCode) {
  if (statusCode >= 500) return 'error';
  if (statusCode >= 400) return 'warn';
  if (statusCode >= 300) return 'info';
  return 'info';
}

/**
 * Request logging middleware with structured logging
 */
function requestLogger(req, res, next) {
  const startTime = Date.now();
  const requestId = req.id || crypto.randomUUID();
  
  // Attach request ID to request object
  req.id = requestId;
  req.startTime = startTime;
  
  // Set request ID in response header for tracing
  res.setHeader('X-Request-ID', requestId);
  
  // Generate request fingerprint
  const fingerprint = generateFingerprint(req);
  
  // Log incoming request
  logger.info('Incoming request', {
    requestId,
    fingerprint,
    method: req.method,
    url: req.url,
    path: req.path,
    query: sanitizeQuery(req.query),
    ip: req.ip,
    userAgent: req.get('user-agent'),
    contentType: req.get('content-type'),
    contentLength: req.get('content-length'),
    headers: sanitizeHeaders(req.headers),
    body: req.body ? sanitizeBody(req.body) : null,
    user: extractUserContext(req),
    timestamp: new Date().toISOString()
  });
  
  // Capture response
  const originalSend = res.send;
  const originalJson = res.json;

  let responseSize = 0;

  res.send = function(data) {
    // Buffer.byteLength() only accepts a string/Buffer/TypedArray - res.send()
    // is also legally called with an object, a number, or no argument at
    // all (Express stringifies/JSON-encodes those itself), all of which
    // used to throw here and crash the request before it ever reached the
    // route handler's real response.
    if (typeof data === 'string' || Buffer.isBuffer(data)) {
      responseSize = Buffer.byteLength(data);
    } else if (data !== undefined && data !== null) {
      try {
        responseSize = Buffer.byteLength(JSON.stringify(data));
      } catch {
        responseSize = 0;
      }
    } else {
      responseSize = 0;
    }
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    // res.json() with no argument (or undefined) is valid and JSON.stringify
    // returns `undefined` (not a string) for it, which Buffer.byteLength
    // used to throw on.
    const serialized = JSON.stringify(data);
    responseSize = typeof serialized === 'string' ? Buffer.byteLength(serialized) : 0;
    return originalJson.call(this, data);
  };
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logLevel = getLogLevel(res.statusCode);
    
    const logData = {
      requestId,
      fingerprint,
      method: req.method,
      url: req.url,
      path: req.path,
      statusCode: res.statusCode,
      statusMessage: res.statusMessage,
      duration: `${duration}ms`,
      durationMs: duration,
      ip: req.ip,
      user: extractUserContext(req),
      responseSize,
      responseSizeFormatted: `${(responseSize / 1024).toFixed(2)}KB`,
      timestamp: new Date().toISOString(),
      // Performance metrics
      performance: {
        slow: duration > 1000,
        verySlow: duration > 5000,
        timeout: duration > 30000
      },
      // Rate limit information
      rateLimit: {
        limit: res.getHeader('X-RateLimit-Limit'),
        remaining: res.getHeader('X-RateLimit-Remaining'),
        reset: res.getHeader('X-RateLimit-Reset')
      }
    };
    
    // Add response headers for debugging
    if (process.env.NODE_ENV === 'development') {
      logData.headers = {
        contentType: res.getHeader('content-type'),
        contentEncoding: res.getHeader('content-encoding'),
        cacheControl: res.getHeader('cache-control'),
        etag: res.getHeader('etag')
      };
    }
    
    logger[logLevel]('Request completed', logData);
    
    // Log slow requests as warnings
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        ...logData,
        performance: {
          ...logData.performance,
          threshold: '1000ms',
          actual: `${duration}ms`
        }
      });
    }
    
    // Log very slow requests as errors
    if (duration > 5000) {
      logger.error('Very slow request detected', {
        ...logData,
        performance: {
          ...logData.performance,
          threshold: '5000ms',
          actual: `${duration}ms`
        }
      });
    }
  });
  
  next();
}

/**
 * Detailed error logging middleware (use after error handler)
 */
function errorLogger(error, req, res, next) {
  let requestId = req.id || 'unknown';
  let duration = Date.now() - (req.startTime || Date.now());
  
  logger.error('Request error', {
    requestId,
    fingerprint: generateFingerprint(req),
    method: req.method,
    url: req.url,
    path: req.path,
    statusCode: res.statusCode,
    duration: `${duration}ms`,
    durationMs: duration,
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      code: error.code,
      statusCode: error.statusCode
    },
    ip: req.ip,
    userAgent: req.get('user-agent'),
    headers: sanitizeHeaders(req.headers),
    body: req.body ? sanitizeBody(req.body) : null,
    query: sanitizeQuery(req.query),
    params: req.params,
    user: extractUserContext(req),
    timestamp: new Date().toISOString()
  });
  
  next(error);
}

/**
 * Request context middleware for additional metadata
 */
function requestContext(req, res, next) {
  // Add request context for logging
  req.context = {
    requestId: req.id,
    startTime: req.startTime,
    fingerprint: generateFingerprint(req),
    userAgent: req.get('user-agent'),
    ip: req.ip,
    method: req.method,
    path: req.path,
    url: req.url
  };
  
  // Add response context
  res.context = {
    requestId: req.id,
    startTime: req.startTime
  };
  
  next();
}

/**
 * Log aggregation integration point
 * This can be extended to send logs to external services like:
 * - Elasticsearch
 * - Splunk
 * - Datadog
 * - CloudWatch
 * - Loggly
 */
class LogAggregator {
  constructor(options = {}) {
    this.enabled = options.enabled || false;
    this.endpoint = options.endpoint;
    this.batchSize = options.batchSize || 100;
    this.batch = [];
    this.flushInterval = options.flushInterval || 5000;
    
    if (this.enabled) {
      this.startFlushInterval();
    }
  }
  
  addLog(logData) {
    if (!this.enabled) return;
    
    this.batch.push(logData);
    
    if (this.batch.length >= this.batchSize) {
      this.flush();
    }
  }
  
  flush() {
    if (this.batch.length === 0) return;
    
    // Send batch to external service
    // This is a placeholder - implement based on your log aggregation service
    this.batch = [];
  }
  
  startFlushInterval() {
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
  }
  
  destroy() {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    this.flush();
  }
}

// Global log aggregator instance
const logAggregator = new LogAggregator({
  enabled: process.env.LOG_AGGREGATION_ENABLED === 'true',
  endpoint: process.env.LOG_AGGREGATION_ENDPOINT
});

module.exports = {
  requestLogger,
  errorLogger,
  requestContext,
  sanitizeHeaders,
  sanitizeBody,
  sanitizeQuery,
  extractUserContext,
  generateFingerprint,
  LogAggregator,
  logAggregator
};
