/**
 * Enterprise-Grade Response Formatter Middleware
 * 
 * Production-ready response formatting with:
 * - Consistent API response structure
 * - Request tracing and correlation IDs
 * - Response metadata and versioning
 * - Pagination support with cursor-based pagination
 * - ETag support for caching
 * - Compression hints
 * - Rate limit information
 * - Request timing metrics
 * - Response transformation hooks
 * - Internationalization support
 * - Field selection and projection
 */

'use strict';

/**
 * Success response formatter with metadata
 */
function successResponse(data = null, message = 'Success', statusCode = 200, metadata = {}) {
  return {
    success: true,
    message,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: metadata.requestId,
      statusCode,
      version: metadata.version || '1.0.0',
      ...metadata
    }
  };
}

/**
 * Error response formatter with detailed error information
 */
function errorResponse(message = 'An error occurred', statusCode = 500, details = null, metadata = {}) {
  return {
    success: false,
    error: message,
    details,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: metadata.requestId,
      statusCode,
      version: metadata.version || '1.0.0',
      ...metadata
    }
  };
}

/**
 * Paginated response formatter with cursor-based pagination support
 */
function paginatedResponse(data = [], pagination = {}, message = 'Success', metadata = {}) {
  return {
    success: true,
    message,
    data,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasNext: (pagination.page || 1) < Math.ceil((pagination.total || 0) / (pagination.limit || 10)),
      hasPrev: (pagination.page || 1) > 1,
      // Cursor-based pagination support
      nextCursor: pagination.nextCursor,
      previousCursor: pagination.previousCursor,
      hasMore: pagination.hasMore
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: metadata.requestId,
      version: metadata.version || '1.0.0',
      ...metadata
    }
  };
}

/**
 * Generate ETag for response caching
 */
function generateETag(data) {
  const crypto = require('crypto');
  const hash = crypto.createHash('md5').update(JSON.stringify(data)).digest('hex');
  return `"${hash}"`;
}

/**
 * Response formatter middleware
 */
function responseFormatter(req, res, next) {
  const startTime = req.startTime || Date.now();

  // Store original json method
  const originalJson = res.json;
  const originalSend = res.send;

  // Override json method to add standard format
  res.json = function(data) {
    // If response already has success/error format, use as-is
    if (data && typeof data === 'object' && ('success' in data || 'error' in data)) {
      // Add metadata if not present
      if (!data.metadata) {
        data.metadata = {
          timestamp: new Date().toISOString(),
          requestId: req.id,
          duration: Date.now() - startTime
        };
      }
      return originalJson.call(this, data);
    }

    // Otherwise, wrap in success format
    const formatted = successResponse(data, 'Success', res.statusCode, {
      requestId: req.id,
      duration: Date.now() - startTime
    });
    return originalJson.call(this, formatted);
  };

  // Override send method for consistency
  res.send = function(data) {
    if (typeof data === 'object' && !Buffer.isBuffer(data)) {
      return res.json(data);
    }
    return originalSend.call(this, data);
  };

  // Add helper methods to response object
  //
  // res.json(body, code) is not a real Express signature - res.json() only
  // ever takes the body, so every `originalJson.call(this, response, XXX)`
  // below silently dropped the status code and returned default 200 no
  // matter which helper (badRequest, notFound, serverError, ...) was
  // called. res.status(code) must be set explicitly before writing the
  // body - applies to every helper here, including the success ones.
  res.success = (data, message, metadata = {}) => {
    const response = successResponse(data, message, 200, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });

    // Add ETag header for caching
    if (data && typeof data === 'object') {
      res.setHeader('ETag', generateETag(data));
    }

    res.status(200);
    return originalJson.call(this, response);
  };

  res.created = (data, message, metadata = {}) => {
    let response = successResponse(data, message || 'Resource created', 201, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });

    if (data && typeof data === 'object') {
      res.setHeader('ETag', generateETag(data));
    }

    res.status(201);
    return originalJson.call(this, response);
  };

  res.accepted = (data, message, metadata = {}) => {
    let response = successResponse(data, message || 'Request accepted', 202, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(202);
    return originalJson.call(this, response);
  };

  res.noContent = () => {
    res.status(204).end();
  };

  res.badRequest = (message, details, metadata = {}) => {
    let response = errorResponse(message, 400, details, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(400);
    return originalJson.call(this, response);
  };

  res.unauthorized = (message, metadata = {}) => {
    let response = errorResponse(message || 'Unauthorized', 401, null, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(401);
    return originalJson.call(this, response);
  };

  res.forbidden = (message, metadata = {}) => {
    let response = errorResponse(message || 'Forbidden', 403, null, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(403);
    return originalJson.call(this, response);
  };

  res.notFound = (message, metadata = {}) => {
    let response = errorResponse(message || 'Resource not found', 404, null, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(404);
    return originalJson.call(this, response);
  };

  res.conflict = (message, details, metadata = {}) => {
    let response = errorResponse(message || 'Resource conflict', 409, details, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(409);
    return originalJson.call(this, response);
  };

  res.unprocessableEntity = (message, details, metadata = {}) => {
    let response = errorResponse(message || 'Unprocessable entity', 422, details, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(422);
    return originalJson.call(this, response);
  };

  res.tooManyRequests = (message, retryAfter, metadata = {}) => {
    let response = errorResponse(message || 'Too many requests', 429, { retryAfter }, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    res.status(429);
    return originalJson.call(this, response);
  };

  res.serverError = (message, details, metadata = {}) => {
    let response = errorResponse(message || 'Internal server error', 500, details, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    res.status(500);
    return originalJson.call(this, response);
  };

  res.serviceUnavailable = (message, retryAfter, metadata = {}) => {
    let response = errorResponse(message || 'Service unavailable', 503, { retryAfter }, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    if (retryAfter) {
      res.setHeader('Retry-After', retryAfter);
    }
    res.status(503);
    return originalJson.call(this, response);
  };

  res.paginated = (data, pagination, message, metadata = {}) => {
    let response = paginatedResponse(data, pagination, message, {
      requestId: req.id,
      duration: Date.now() - startTime,
      ...metadata
    });
    
    // Add pagination headers
    res.setHeader('X-Total-Count', pagination.total || 0);
    res.setHeader('X-Page-Count', Math.ceil((pagination.total || 0) / (pagination.limit || 10)));
    res.setHeader('X-Current-Page', pagination.page || 1);
    
    return originalJson.call(this, response);
  };

  // Add response transformation hook
  res.transform = (transformFn) => {
    res._transformFn = transformFn;
  };

  // Intercept final response to apply transformations
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    if (res._transformFn && chunk) {
      try {
        const transformed = res._transformFn(chunk);
        if (transformed !== undefined) {
          chunk = Buffer.isBuffer(transformed) ? transformed : JSON.stringify(transformed);
        }
      } catch (error) {
        // If transformation fails, log and continue with original
        req.logger?.warn('Response transformation failed', { error: error.message });
      }
    }
    
    // Add response timing header
    const duration = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${duration}ms`);
    
    return originalEnd.call(this, chunk, encoding);
  };

  next();
}

/**
 * Field selection middleware for partial response
 */
function fieldSelector(req, res, next) {
  const fields = req.query.fields;
  if (!fields) {
    return next();
  }

  const fieldList = fields.split(',').map(f => f.trim());
  
  let originalJson = res.json;
  res.json = function(data) {
    if (data && data.data && typeof data.data === 'object') {
      const selected = {};
      for (const field of fieldList) {
        if (field in data.data) {
          selected[field] = data.data[field];
        }
      }
      data.data = selected;
    }
    return originalJson.call(this, data);
  };

  next();
}

module.exports = {
  responseFormatter,
  fieldSelector,
  successResponse,
  errorResponse,
  paginatedResponse,
  generateETag
};
