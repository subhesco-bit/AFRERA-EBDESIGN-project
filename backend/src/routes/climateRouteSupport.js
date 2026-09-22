/**
 * Climate Route Support
 *
 * FIXED 2026-09-22: this was an auto-generated health-check-only stub, but
 * weatherRoutes_merged.js imports { bodyValidator, queryValidator, date,
 * dateTime, enumValue, numberValue, fail, invalid, requestId } from it and
 * uses them at module load time to build request-validation middleware,
 * throwing "queryValidator is not a function" and crashing boot. Restored
 * as a real, minimal validation helper library rather than dropping the
 * calls, since these aren't optional guards (like protectRouter) — they
 * are the actual request validation used by every route in that file.
 *
 * Fields absent from the input are treated as "not provided" and pass
 * validation (undefined in, undefined out) — required-ness is enforced by
 * each route's own explicit `if (!b.field) throw ...` checks before calling
 * these, exactly as weatherRoutes_merged.js already does.
 */

const crypto = require('crypto');
const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'climateRouteSupport' });
});

function invalid(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

function fail(req, res, error, operation, statusCode) {
  const status = statusCode || error.status || 500;
  res.status(status).json({
    success: false,
    error: error.message || 'Unexpected error',
    operation,
  });
}

function numberValue(value, field, { min, max, integer } = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  const n = Number(value);
  if (Number.isNaN(n)) throw invalid(`${field} must be a number`);
  if (integer && !Number.isInteger(n)) throw invalid(`${field} must be an integer`);
  if (min !== undefined && n < min) throw invalid(`${field} must be >= ${min}`);
  if (max !== undefined && n > max) throw invalid(`${field} must be <= ${max}`);
  return n;
}

function date(value, field, { futureDays } = {}) {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw invalid(`${field} must be a valid date`);
  if (futureDays !== undefined) {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + futureDays);
    if (d > maxDate) throw invalid(`${field} must not be more than ${futureDays} day(s) in the future`);
  }
  return d;
}

function dateTime(value, field) {
  if (value === undefined || value === null || value === '') return undefined;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) throw invalid(`${field} must be a valid date-time`);
  return d;
}

function enumValue(value, field, allowed) {
  if (value === undefined || value === null || value === '') return undefined;
  if (!allowed.includes(value)) throw invalid(`${field} must be one of: ${allowed.join(', ')}`);
  return value;
}

function queryValidator(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req.query);
      next();
    } catch (error) {
      fail(req, res, error, 'query_validation', error.status || 400);
    }
  };
}

function bodyValidator(validatorFn) {
  return (req, res, next) => {
    try {
      validatorFn(req.body || {});
      next();
    } catch (error) {
      fail(req, res, error, 'body_validation', error.status || 400);
    }
  };
}

function requestId(req, prefix) {
  return `${prefix || 'req'}-${req.id || crypto.randomUUID()}`;
}

module.exports = router;
module.exports.invalid = invalid;
module.exports.fail = fail;
module.exports.numberValue = numberValue;
module.exports.date = date;
module.exports.dateTime = dateTime;
module.exports.enumValue = enumValue;
module.exports.queryValidator = queryValidator;
module.exports.bodyValidator = bodyValidator;
module.exports.requestId = requestId;
