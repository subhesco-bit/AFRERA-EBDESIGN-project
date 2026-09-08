/**
 * API Response Standardizer Middleware
 * International Standards Compliance (RFC 7231, OpenAPI 3.0)
 * 
 * Features:
 * - Standardized response format across all endpoints
 * - Consistent error handling and status codes
 * - Request tracking and correlation IDs
 * - API versioning support
 * - Rate limit headers
 * - Pagination metadata
 * - Response time tracking
 */

const { logger } = require('../utils/logger');

/**
 * Standard API response format
 */
class StandardResponse {
  constructor(success, data, error = null, metadata = {}) {
    this.success = success;
    this.timestamp = new Date().toISOString();
    
    if (success) {
      this.data = data;
    } else {
      this.error = error;
    }
    
    // Add metadata if provided
    if (Object.keys(metadata).length > 0) {
      this.metadata = metadata;
    }
  }
}

/**
 * Create success response
 */
function successResponse(data, metadata = {}) {
  return new StandardResponse(true, data, null, metadata);
}

/**
 * Create error response
 */
function errorResponse(error, statusCode = 500) {
  const errorObj = {
    message: error.message || 'An error occurred',
    code: error.code || 'INTERNAL_ERROR',
    statusCode
  };
  
  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorObj.stack = error.stack;
  }
  
  return new StandardResponse(false, null, errorObj);
}

/**
 * Response standardizer middleware
 */
function standardizeResponse() {
  return (req, res, next) => {
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to standardize responses
    res.json = function(data) {
      // If response is already standardized, return as-is
      if (data && typeof data === 'object' && 'success' in data && 'timestamp' in data) {
        return originalJson.call(this, data);
      }
      
      // Standardize the response
      const standardized = {
        success: true,
        data: data,
        timestamp: new Date().toISOString(),
        requestId: req.id,
        path: req.path,
        method: req.method
      };
      
      return originalJson.call(this, standardized);
    };
    
    // Store original status method
    const originalStatus = res.status;
    
    // Override status method to track response status
    res.status = function(code) {
      res.statusCode = code;
      return originalStatus.call(this, code);
    };
    
    next();
  };
}

/**
 * Error response standardizer middleware
 */
function standardizeErrorResponse() {
  return (err, req, res, next) => {
    const statusCode = err.statusCode || err.status || 500;
    const errorResponse = {
      success: false,
      error: {
        message: err.message || 'Internal Server Error',
        code: err.code || 'INTERNAL_ERROR',
        statusCode
      },
      timestamp: new Date().toISOString(),
      requestId: req.id,
      path: req.path,
      method: req.method
    };
    
    // Add error details in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.error.stack = err.stack;
      errorResponse.error.details = err.details;
    }
    
    // Log error
    logger.error('API Error', {
      requestId: req.id,
      path: req.path,
      method: req.method,
      statusCode,
      error: err.message,
      stack: err.stack
    });
    
    res.status(statusCode).json(errorResponse);
  };
}

/**
 * Add standard headers to responses
 */
function addStandardHeaders() {
  return (req, res, next) => {
    // API version header
    res.setHeader('X-API-Version', '1.0.0');
    
    // Request ID header
    if (req.id) {
      res.setHeader('X-Request-ID', req.id);
    }
    
    // Response time header (will be set by response timer)
    res.setHeader('X-Response-Time', '0ms');
    
    // CORS headers if not already set
    if (!res.getHeader('Access-Control-Allow-Origin')) {
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    
    // Content type
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    
    next();
  };
}

/**
 * Response time tracking middleware
 */
function trackResponseTime() {
  return (req, res, next) => {
    const startTime = Date.now();
    
    res.on('finish', () => {
      const responseTime = Date.now() - startTime;
      res.setHeader('X-Response-Time', `${responseTime}ms`);
      
      // Log slow requests
      if (responseTime > 1000) {
        logger.warn('Slow API request', {
          requestId: req.id,
          path: req.path,
          method: req.method,
          responseTime: `${responseTime}ms`
        });
      }
    });
    
    next();
  };
}

/**
 * Pagination helper for list responses
 */
function paginateResponse(data, page = 1, limit = 10, total = null) {
  const offset = (page - 1) * limit;
  const paginatedData = Array.isArray(data) 
    ? data.slice(offset, offset + limit)
    : data;
  
  return {
    items: paginatedData,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: total !== null ? parseInt(total) : (Array.isArray(data) ? data.length : null),
      totalPages: total !== null ? Math.ceil(total / limit) : null,
      hasNext: total !== null ? (page * limit) < total : null,
      hasPrev: page > 1
    }
  };
}

/**
 * Add rate limit headers
 */
function addRateLimitHeaders(limit, remaining, reset) {
  return (req, res, next) => {
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);
    next();
  };
}

/**
 * API version middleware
 */
function apiVersion(versions = ['1.0.0']) {
  return (req, res, next) => {
    const requestedVersion = req.headers['api-version'] || req.query.version || '1.0.0';
    
    if (!versions.includes(requestedVersion)) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Unsupported API version: ${requestedVersion}`,
          code: 'UNSUPPORTED_API_VERSION',
          supportedVersions: versions
        },
        timestamp: new Date().toISOString()
      });
    }
    
    req.apiVersion = requestedVersion;
    res.setHeader('X-API-Version', requestedVersion);
    
    next();
  };
}

/**
 * Request correlation ID middleware
 */
function correlationId() {
  return (req, res, next) => {
    const correlationId = req.headers['x-correlation-id'] || 
                        req.headers['x-request-id'] || 
                        generateCorrelationId();
    
    req.id = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    
    next();
  };
}

/**
 * Generate correlation ID
 */
function generateCorrelationId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Content negotiation middleware
 */
function contentNegotiation() {
  return (req, res, next) => {
    const acceptHeader = req.headers.accept || 'application/json';
    
    // Currently only support JSON
    if (!acceptHeader.includes('application/json')) {
      return res.status(406).json({
        success: false,
        error: {
          message: 'Not Acceptable',
          code: 'NOT_ACCEPTABLE',
          supportedContentTypes: ['application/json']
        },
        timestamp: new Date().toISOString()
      });
    }
    
    next();
  };
}

module.exports = {
  StandardResponse,
  successResponse,
  errorResponse,
  standardizeResponse,
  standardizeErrorResponse,
  addStandardHeaders,
  trackResponseTime,
  paginateResponse,
  addRateLimitHeaders,
  apiVersion,
  correlationId,
  generateCorrelationId,
  contentNegotiation
};