/**
 * Centralized Error Classes
 * Used by multiple services for consistent error handling
 */

class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.timestamp = new Date();
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Unauthorized access') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Access forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class RateLimitError extends AppError {
  constructor(retryAfter = 60) {
    super('Rate limit exceeded. Please try again later.', 429, 'RATE_LIMIT');
    this.retryAfter = retryAfter;
  }
}

class ServiceError extends AppError {
  constructor(service, message) {
    super(`${service} error: ${message}`, 503, 'SERVICE_ERROR');
    this.service = service;
  }
}

/**
 * Raised when a database operation fails.
 *
 * 227 module services (e.g. modules/M177, M183) already
 * `throw new DatabaseError(...)` in their query error paths and import it from
 * this file, but it was never defined or exported. Every one of those paths
 * therefore threw "DatabaseError is not a constructor" instead of the intended
 * error -- breaking error handling precisely when the database was failing.
 *
 * Call sites pass a single message string; `cause` is optional and additive.
 */
class DatabaseError extends AppError {
  constructor(message, cause = null) {
    super(message, 500, 'DATABASE_ERROR');
    if (cause) this.cause = cause;
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
  ServiceError,
  DatabaseError,
};
