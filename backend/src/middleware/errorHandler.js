/**
 * Professional Error Handler Middleware
 * Centralized error handling with proper HTTP status codes and logging
 */

const { logger } = require('../utils/logger');

class AppError extends Error {
  constructor(message, statusCode, code = null, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  error.statusCode = err.statusCode || 500;

  // Log error for debugging
  logger.error('Error occurred:', {
    message: err.message,
    statusCode: error.statusCode,
    code: err.code,
    path: req.path,
    method: req.method,
    ip: req.ip,
    stack: err.stack
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404, 'CAST_ERROR');
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400, 'DUPLICATE_FIELD');
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = new AppError(message, 400, 'VALIDATION_ERROR');
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token. Please log in again.';
    error = new AppError(message, 401, 'INVALID_TOKEN');
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Your token has expired. Please log in again.';
    error = new AppError(message, 401, 'TOKEN_EXPIRED');
  }

  // PostgreSQL errors
  if (err.code === '23505') {
    const message = 'Duplicate entry';
    error = new AppError(message, 409, 'DUPLICATE_ENTRY');
  }

  if (err.code === '23503') {
    const message = 'Foreign key violation';
    error = new AppError(message, 400, 'FOREIGN_KEY_VIOLATION');
  }

  // Development vs Production response
  if (process.env.NODE_ENV === 'development') {
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message,
        code: error.code,
        stack: err.stack,
        details: error.details
      }
    });
  } else {
    // Production: don't leak stack traces
    res.status(error.statusCode).json({
      success: false,
      error: {
        message: error.message || 'Internal Server Error',
        code: error.code
      }
    });
  }
};

const notFound = (req, res, next) => {
  const error = new AppError(`Can't find ${req.originalUrl} on this server!`, 404, 'NOT_FOUND');
  next(error);
};

// Async handler wrapper to catch errors in async functions
const catchAsync = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  AppError,
  errorHandler,
  notFound,
  catchAsync
};