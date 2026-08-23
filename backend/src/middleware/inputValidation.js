/**
 * Input Validation Middleware
 * 
 * Provides comprehensive input validation and sanitization
 * for all API endpoints to prevent injection attacks and ensure data integrity
 */

const { logger } = require('../utils/logger');

/**
 * Sanitize user input to prevent XSS and injection attacks
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate and sanitize request body
 */
function validateBody(schema) {
  return (req, res, next) => {
    try {
      if (!req.body) {
        return res.status(400).json({
          success: false,
          error: 'Request body is required'
        });
      }

      // Sanitize all string values in the body
      const sanitizedBody = sanitizeObject(req.body);
      req.body = sanitizedBody;

      // If schema is provided, validate against it
      if (schema) {
        const validationResult = validateSchema(sanitizedBody, schema);
        if (!validationResult.valid) {
          logger.warn('Input validation failed', { errors: validationResult.errors });
          return res.status(400).json({
            success: false,
            error: 'Invalid input',
            details: validationResult.errors
          });
        }
      }

      next();
    } catch (error) {
      logger.error('Input validation error', { error: error.message });
      res.status(500).json({
        success: false,
        error: 'Validation error occurred'
      });
    }
  };
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      sanitized[key] = typeof obj[key] === 'string' 
        ? sanitizeInput(obj[key]) 
        : sanitizeObject(obj[key]);
    }
  }
  
  return sanitized;
}

/**
 * Validate object against schema
 */
function validateSchema(data, schema) {
  const errors = [];
  
  for (const field in schema) {
    const rules = schema[field];
    const value = data[field];
    
    // Required check
    if (rules.required && (value === undefined || value === null || value === '')) {
      errors.push(`${field} is required`);
      continue;
    }
    
    // Skip further validation if field is not required and not present
    if (!rules.required && (value === undefined || value === null)) {
      continue;
    }
    
    // Type check
    if (rules.type && typeof value !== rules.type) {
      errors.push(`${field} must be of type ${rules.type}`);
    }
    
    // Min length check
    if (rules.minLength && typeof value === 'string' && value.length < rules.minLength) {
      errors.push(`${field} must be at least ${rules.minLength} characters`);
    }
    
    // Max length check
    if (rules.maxLength && typeof value === 'string' && value.length > rules.maxLength) {
      errors.push(`${field} must not exceed ${rules.maxLength} characters`);
    }
    
    // Min value check
    if (rules.min !== undefined && typeof value === 'number' && value < rules.min) {
      errors.push(`${field} must be at least ${rules.min}`);
    }
    
    // Max value check
    if (rules.max !== undefined && typeof value === 'number' && value > rules.max) {
      errors.push(`${field} must not exceed ${rules.max}`);
    }
    
    // Pattern check
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      errors.push(`${field} format is invalid`);
    }
    
    // Enum check
    if (rules.enum && !rules.enum.includes(value)) {
      errors.push(`${field} must be one of: ${rules.enum.join(', ')}`);
    }
    
    // Email validation
    if (rules.email && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        errors.push(`${field} must be a valid email address`);
      }
    }
    
    // URL validation
    if (rules.url && typeof value === 'string') {
      try {
        new URL(value);
      } catch {
        errors.push(`${field} must be a valid URL`);
      }
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Common validation schemas
 */
const commonSchemas = {
  user: {
    email: { required: true, type: 'string', email: true },
    password: { required: true, type: 'string', minLength: 8 },
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 }
  },
  
  farmer: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 100 },
    phone: { required: true, type: 'string', pattern: /^\d{10}$/ },
    village: { required: true, type: 'string', minLength: 2, maxLength: 100 }
  },
  
  product: {
    name: { required: true, type: 'string', minLength: 2, maxLength: 200 },
    price: { required: true, type: 'number', min: 0 },
    category: { required: true, type: 'string' }
  }
};

module.exports = {
  validateBody,
  sanitizeInput,
  sanitizeObject,
  validateSchema,
  commonSchemas
};
