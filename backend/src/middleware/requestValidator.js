/**
 * Request Validation Middleware
 * Validates incoming requests using Joi schema validation
 */

const Joi = require('joi');
const { logger } = require('../utils/logger');

// Validation middleware factory
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors
      stripUnknown: true, // Remove unknown fields
      allowUnknown: false
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      logger.warn('Request validation failed', {
        path: req.path,
        method: req.method,
        errors
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request body with validated value
    req.body = value;
    next();
  };
};

// Query parameter validation
const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      let errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        type: detail.type
      }));

      logger.warn('Query validation failed', {
        path: req.path,
        method: req.method,
        errors
      });

      return res.status(400).json({
        success: false,
        error: 'Query validation failed',
        details: errors
      });
    }

    req.query = value;
    next();
  };
};

// Common validation schemas
const schemas = {
  // Payment validation
  payment: Joi.object({
    userId: Joi.string().required(),
    amount: Joi.number().positive().required(),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    gateway: Joi.string().valid('stripe', 'razorpay', 'paytm', 'phonepe').required(),
    paymentMethod: Joi.string().valid('card', 'upi', 'netbanking', 'wallet').required(),
    description: Joi.string().max(500),
    metadata: Joi.object()
  }),

  // Wallet validation
  wallet: Joi.object({
    userId: Joi.string().required(),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    initialBalance: Joi.number().min(0).default(0)
  }),

  addFunds: Joi.object({
    amount: Joi.number().positive().required(),
    source: Joi.string().required(),
    referenceId: Joi.string(),
    description: Joi.string().max(500)
  }),

  // Transaction validation
  transaction: Joi.object({
    userId: Joi.string().required(),
    type: Joi.string().valid('credit', 'debit', 'transfer', 'payment', 'refund').required(),
    amount: Joi.number().required(),
    currency: Joi.string().valid('INR', 'USD', 'EUR').default('INR'),
    description: Joi.string().max(500),
    category: Joi.string(),
    referenceId: Joi.string(),
    metadata: Joi.object()
  }),

  // User validation
  user: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required(),
    phone: Joi.string().pattern(/^[+]?[\d\s-()]{10,}$/),
    firstName: Joi.string().max(50),
    lastName: Joi.string().max(50)
  }),

  // Login validation
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),

  // Pagination validation
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sortBy: Joi.string(),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  }),

  // ID validation
  id: Joi.object({
    id: Joi.string().required()
  }),

  // Date range validation
  dateRange: Joi.object({
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().greater(Joi.ref('startDate'))
  }),

  // Search validation
  search: Joi.object({
    query: Joi.string().min(2).max(100).required(),
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(50).default(20)
  })
};

// Response formatter
const formatResponse = (data, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    message,
    data,
    statusCode
  };
};

// Error response formatter
const formatErrorResponse = (message, details = null, statusCode = 400) => {
  const response = {
    success: false,
    error: message,
    statusCode
  };

  if (details) {
    response.details = details;
  }

  return response;
};

// Sanitize user input to prevent XSS
const sanitizeInput = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sanitized = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === 'string') {
        // Remove potentially dangerous HTML/JS
        sanitized[key] = obj[key]
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;')
          .replace(/\//g, '&#x2F;');
      } else if (typeof obj[key] === 'object') {
        sanitized[key] = sanitizeInput(obj[key]);
      } else {
        sanitized[key] = obj[key];
      }
    }
  }
  return sanitized;
};

// Sanitization middleware
const sanitize = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeInput(req.body);
  }
  if (req.query) {
    req.query = sanitizeInput(req.query);
  }
  if (req.params) {
    req.params = sanitizeInput(req.params);
  }
  next();
};

module.exports = {
  validate,
  validateQuery,
  schemas,
  formatResponse,
  formatErrorResponse,
  sanitize,
  sanitizeInput
};