// Enterprise Input Validation - Production Grade
const { ValidationError } = require('./errorHandler');
const logger = require('../utils/logger');

class Validator {
  static string(value, options = {}) {
    const { required = true, minLength = 0, maxLength = 255, pattern = null } = options;

    if (!value && required) throw new ValidationError('String value is required');
    if (!value) return '';
    if (typeof value !== 'string') throw new ValidationError('Value must be a string');
    if (value.length < minLength) throw new ValidationError(`String must be at least ${minLength} characters`);
    if (value.length > maxLength) throw new ValidationError(`String must not exceed ${maxLength} characters`);
    if (pattern && !pattern.test(value)) throw new ValidationError('String does not match required pattern');

    return value.trim();
  }

  static number(value, options = {}) {
    const { required = true, min = null, max = null, integer = false } = options;

    if (value === undefined || value === null) {
      if (required) throw new ValidationError('Number is required');
      return null;
    }

    const num = Number(value);
    if (isNaN(num)) throw new ValidationError('Value must be a valid number');
    if (integer && !Number.isInteger(num)) throw new ValidationError('Value must be an integer');
    if (min !== null && num < min) throw new ValidationError(`Number must be at least ${min}`);
    if (max !== null && num > max) throw new ValidationError(`Number must not exceed ${max}`);

    return num;
  }

  static email(value, options = { required: true }) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return this.string(value, { ...options, pattern: emailRegex });
  }

  static uuid(value, options = { required: true }) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return this.string(value, { ...options, pattern: uuidRegex });
  }

  static array(value, options = {}) {
    const { required = true, minLength = 0, maxLength = 1000, itemValidator = null } = options;

    if (!value && required) throw new ValidationError('Array is required');
    if (!Array.isArray(value)) throw new ValidationError('Value must be an array');
    if (value.length < minLength) throw new ValidationError(`Array must have at least ${minLength} items`);
    if (value.length > maxLength) throw new ValidationError(`Array must not exceed ${maxLength} items`);

    if (itemValidator) {
      return value.map(item => itemValidator(item));
    }

    return value;
  }

  static object(value, schema, options = { required: true }) {
    if (!value && options.required) throw new ValidationError('Object is required');
    if (!value) return null;
    if (typeof value !== 'object') throw new ValidationError('Value must be an object');

    const validated = {};
    for (const [key, validator] of Object.entries(schema)) {
      validated[key] = validator(value[key]);
    }

    return validated;
  }

  static enum(value, allowedValues, options = { required: true }) {
    const validated = this.string(value, { required: options.required });
    if (value && !allowedValues.includes(validated)) {
      throw new ValidationError(`Value must be one of: ${allowedValues.join(', ')}`);
    }
    return validated;
  }
}

// Validation middleware
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      req.validated = {};

      for (const [key, validator] of Object.entries(schema)) {
        const source = req.body[key] !== undefined ? req.body : req.params;
        req.validated[key] = validator(source[key]);
      }

      next();
    } catch (error) {
      if (error instanceof ValidationError) {
        logger.warn(`Validation error: ${error.message}`, { requestId: req.id });
        return res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: error.message,
            requestId: req.id
          }
        });
      }
      next(error);
    }
  };
};

module.exports = { Validator, validateRequest, ValidationError };
