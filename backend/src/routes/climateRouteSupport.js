/**
 * Climate Route Support
 *
 * 2026-09-16: this was a 12-line placeholder exporting only an Express
 * router with a /health endpoint - weatherRoutes_merged.js (a real,
 * already-written router over services/legacy/weatherService.js) imports
 * 9 named request-validation helpers from this file
 * (bodyValidator/queryValidator/date/dateTime/enumValue/numberValue/fail/
 * invalid/requestId) that never existed, so it couldn't be required and
 * was left unmounted since this PR's very first commit. This is generic
 * request-validation plumbing, not business logic - each function's
 * contract is derived directly from how weatherRoutes_merged.js already
 * calls it (e.g. numberValue/enumValue must tolerate `undefined` and
 * skip validation, since weatherService.recordForecast defaults a
 * missing `provider` to 'imd' server-side rather than requiring it).
 */

'use strict';

const express = require('express');
const crypto = require('crypto');
const { logger } = require('../utils/logger');

// index.js mounts this at /api/climateroutesupport via `climateRouteSupport.router`
// (predates this fix) - preserved alongside the new named validator exports below.
const router = express.Router();
router.get('/health', (req, res) => {
  res.json({ success: true, module: 'climateRouteSupport', status: 'operational' });
});

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isEmpty(value) {
  return value === undefined || value === null || value === '';
}

/**
 * Build a validation error. Callers throw this (or a plain Error, which
 * bodyValidator/queryValidator treat as a 400 too) to reject a request.
 */
function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  return error;
}

/**
 * Uniform error responder. `statusCode` is resolved by the caller
 * (typically `error.status || 500`) so validation errors surface as 400
 * and everything else as whatever the underlying service/route decided.
 */
function fail(req, res, error, operation, statusCode) {
  const status = statusCode || error.status || 500;
  if (status >= 500) {
    logger.error(`weather.${operation} failed`, { error: error.message, stack: error.stack, requestId: req.id });
  }
  res.status(status).json({ success: false, error: error.message, operation, requestId: req.id });
}

/** Correlation ID for signalBus emissions - reuses the request's own ID
 * (set globally by middleware/requestId.js) rather than minting a second,
 * unrelated one. */
function requestId(req, prefix) {
  return `${prefix}-${req.id || crypto.randomUUID()}`;
}

/**
 * Validates a numeric field. Optional by default (undefined/null/''
 * skips validation) - callers that need a value present check that
 * themselves first, same as every other field in this file.
 */
function numberValue(value, fieldName, { min, max, integer = false } = {}) {
  if (isEmpty(value)) return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) throw invalid(`${fieldName} must be a number`);
  if (integer && !Number.isInteger(n)) throw invalid(`${fieldName} must be an integer`);
  if (min !== undefined && n < min) throw invalid(`${fieldName} must be >= ${min}`);
  if (max !== undefined && n > max) throw invalid(`${fieldName} must be <= ${max}`);
  return n;
}

/** Validates a field is one of a fixed set of values. Optional (see numberValue). */
function enumValue(value, fieldName, allowed) {
  if (isEmpty(value)) return undefined;
  if (!allowed.includes(value)) throw invalid(`${fieldName} must be one of: ${allowed.join(', ')}`);
  return value;
}

/**
 * Validates a calendar date (YYYY-MM-DD, no time component). `futureDays`
 * caps how far into the future the date may be (0 = today or earlier).
 */
function date(value, fieldName, { futureDays } = {}) {
  if (isEmpty(value)) return undefined;
  if (typeof value !== 'string' || !DATE_RE.test(value)) {
    throw invalid(`${fieldName} must be a date in YYYY-MM-DD format`);
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) throw invalid(`${fieldName} is not a valid date`);
  if (futureDays !== undefined) {
    const maxDate = new Date();
    maxDate.setUTCDate(maxDate.getUTCDate() + futureDays);
    maxDate.setUTCHours(23, 59, 59, 999);
    if (parsed > maxDate) throw invalid(`${fieldName} cannot be more than ${futureDays} day(s) in the future`);
  }
  return value;
}

/** Validates a full ISO 8601 date-time (has a time component, unlike `date`). */
function dateTime(value, fieldName) {
  if (isEmpty(value)) return undefined;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) throw invalid(`${fieldName} must be a valid ISO 8601 date-time`);
  return value;
}

/** Wraps a `(body) => void` validator (throws to reject) as Express middleware. */
function bodyValidator(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req.body || {});
      next();
    } catch (error) {
      fail(req, res, error, 'validation', error.status || 400);
    }
  };
}

/** Wraps a `(query) => void` validator (throws to reject) as Express middleware. */
function queryValidator(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req.query || {});
      next();
    } catch (error) {
      fail(req, res, error, 'validation', error.status || 400);
    }
  };
}

module.exports = {
  router,
  invalid,
  fail,
  requestId,
  numberValue,
  enumValue,
  date,
  dateTime,
  bodyValidator,
  queryValidator,
};
