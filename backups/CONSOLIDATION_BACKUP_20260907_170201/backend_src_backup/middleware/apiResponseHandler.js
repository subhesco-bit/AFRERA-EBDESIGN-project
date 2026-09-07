/**
 * API Response Handler Middleware
 * Standardizes API responses across all endpoints for consistent UI/UX
 * 
 * Response Format:
 * {
 *   success: true|false,
 *   data: {},           // Present on success
 *   error: {},          // Present on error
 *   metadata: {},       // Pagination, timestamps, etc.
 *   requestId: string   // For tracing
 * }
 */

const { v4: uuidv4 } = require('uuid');

// Standard error codes with user-friendly messages
const ERROR_CODES = {
  // Authentication & Authorization
  UNAUTHORIZED: { code: 'AUTH_001', message: 'Authentication required', status: 401 },
  INVALID_CREDENTIALS: { code: 'AUTH_002', message: 'Invalid credentials', status: 401 },
  TOKEN_EXPIRED: { code: 'AUTH_003', message: 'Session expired, please login again', status: 401 },
  INSUFFICIENT_PERMISSIONS: { code: 'AUTH_004', message: 'You do not have permission to perform this action', status: 403 },
  
  // Validation Errors
  VALIDATION_ERROR: { code: 'VAL_001', message: 'Invalid input data', status: 400 },
  MISSING_REQUIRED_FIELD: { code: 'VAL_002', message: 'Required field is missing', status: 400 },
  INVALID_FORMAT: { code: 'VAL_003', message: 'Invalid data format', status: 400 },
  DUPLICATE_ENTRY: { code: 'VAL_004', message: 'This record already exists', status: 409 },
  
  // Resource Errors
  NOT_FOUND: { code: 'RES_001', message: 'Resource not found', status: 404 },
  CONFLICT: { code: 'RES_002', message: 'Resource conflict', status: 409 },
  RESOURCE_LOCKED: { code: 'RES_003', message: 'Resource is currently locked', status: 423 },
  
  // Server Errors
  INTERNAL_ERROR: { code: 'SRV_001', message: 'An unexpected error occurred', status: 500 },
  DATABASE_ERROR: { code: 'SRV_002', message: 'Database operation failed', status: 500 },
  EXTERNAL_SERVICE_ERROR: { code: 'SRV_003', message: 'External service unavailable', status: 503 },
  RATE_LIMIT_EXCEEDED: { code: 'SRV_004', message: 'Too many requests, please try again later', status: 429 },
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION: { code: 'BIZ_001', message: 'Business rule violation', status: 400 },
  OPERATION_NOT_ALLOWED: { code: 'BIZ_002', message: 'This operation is not allowed', status: 400 },
  INSUFFICIENT_FUNDS: { code: 'BIZ_003', message: 'Insufficient funds for this operation', status: 400 },
  QUANTITY_EXCEEDED: { code: 'BIZ_004', message: 'Requested quantity exceeds available stock', status: 400 },
};

/**
 * Success response helper
 */
function success(res, data, metadata = {}) {
  const response = {
    success: true,
    data,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4(),
      ...metadata
    }
  };
  
  return res.status(metadata.status || 200).json(response);
}

/**
 * Error response helper
 */
function error(res, errorCode, customMessage = null, details = null) {
  const errorInfo = ERROR_CODES[errorCode] || ERROR_CODES.INTERNAL_ERROR;
  
  const response = {
    success: false,
    error: {
      code: errorInfo.code,
      message: customMessage || errorInfo.message,
      details,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4()
    }
  };
  
  return res.status(errorInfo.status).json(response);
}

/**
 * sendSuccess(res, data, message, status = 200)
 * Alias matching the call signature used by the Tier 1 route files
 * (advancedAnalyticsRoutes.js, predictiveIntelligenceRoutes.js, iotIntegrationRoutes.js,
 * blockchainVerificationRoutes.js, digitalTwinRoutes.js, enterpriseIntegrationRoutes.js,
 * farmerRoutes.js, cropManagementRoutes.js, marketplaceEnhancements.js) — those files were
 * written against this shape but the middleware never defined it, so every call threw
 * `sendSuccess is not a function`.
 */
function sendSuccess(res, data, message = null, status = 200) {
  const response = {
    success: true,
    data,
    message: message || undefined,
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4()
    }
  };

  return res.status(status).json(response);
}

/**
 * sendError(res, message, status = 500, code = 'INTERNAL_ERROR', details = null)
 * Alias matching the call signature used by the same route files listed above — unlike
 * `error()`, whose second argument is a key into ERROR_CODES, callers here pass a free-text
 * message plus their own numeric status and code string directly.
 */
function sendError(res, message, status = 500, code = 'INTERNAL_ERROR', details = null) {
  const response = {
    success: false,
    error: {
      code,
      message: message || 'An unexpected error occurred',
      details,
      timestamp: new Date().toISOString(),
      requestId: res.locals.requestId || uuidv4()
    }
  };

  return res.status(status).json(response);
}

/**
 * Async route wrapper with standardized error handling
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    // Generate request ID for tracing
    res.locals.requestId = uuidv4();
    
    Promise.resolve(fn(req, res, next))
      .catch((err) => {
        console.error(`[${res.locals.requestId}] Error:`, err);
        
        // Handle known error types
        if (err.name === 'ValidationError') {
          return error(res, 'VALIDATION_ERROR', err.message, err.details);
        }
        
        if (err.name === 'UnauthorizedError') {
          return error(res, 'UNAUTHORIZED');
        }
        
        if (err.code === '23505') { // PostgreSQL unique violation
          return error(res, 'DUPLICATE_ENTRY');
        }
        
        if (err.code === '23503') { // PostgreSQL foreign key violation
          return error(res, 'VALIDATION_ERROR', 'Referenced resource does not exist');
        }
        
        // Default to internal server error
        return error(res, 'INTERNAL_ERROR', process.env.NODE_ENV === 'development' ? err.message : null);
      });
  };
}

/**
 * Validation error helper
 */
function validationError(res, message, field = null) {
  return error(res, 'VALIDATION_ERROR', message, field ? { field } : null);
}

/**
 * Not found error helper
 */
function notFoundError(res, resource = 'Resource') {
  return error(res, 'NOT_FOUND', `${resource} not found`);
}

/**
 * Unauthorized error helper
 */
function unauthorizedError(res, message = null) {
  return error(res, 'UNAUTHORIZED', message);
}

/**
 * Forbidden error helper
 */
function forbiddenError(res, message = null) {
  return error(res, 'INSUFFICIENT_PERMISSIONS', message);
}

/**
 * Pagination metadata helper
 */
function paginationMetadata(page, limit, total, totalPages) {
  return {
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages: Math.ceil(total / limit),
      hasNext: page < totalPages,
      hasPrev: page > 1
    }
  };
}

module.exports = {
  success,
  error,
  sendSuccess,
  sendError,
  asyncHandler,
  validationError,
  notFoundError,
  unauthorizedError,
  forbiddenError,
  paginationMetadata,
  ERROR_CODES
};