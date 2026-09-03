'use strict';

const { logger } = require('../utils/logger');

const UUID_OR_INT = /^(?:[1-9]\d*|[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function requestId(req, prefix = 'climate') {
  return req.correlationId || req.get('x-correlation-id') || `${prefix}-${Date.now()}`;
}

function fail(req, res, error, operation, status = 500) {
  const id = requestId(req);
  logger.error(`climate:${operation}`, { error: error.message, requestId: id });
  return res.status(status).json({ success: false, error: status >= 500 ? 'Internal server error' : error.message, code: status >= 500 ? 'INTERNAL_ERROR' : 'INVALID_INPUT', requestId: id });
}

function invalid(message) { const error = new Error(message); error.status = 400; return error; }

function requireObject(req) {
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body)) throw invalid('Request body must be an object');
}

function validateId(req, res, next) {
  if (!UUID_OR_INT.test(String(req.params.id))) return fail(req, res, invalid('id must be a positive integer or UUID'), 'validateId', 400);
  next();
}

function parsePageQuery(req, res, next) {
  for (const [name, value, max] of [['page', req.query.page, 100000], ['limit', req.query.limit, 200]]) {
    if (value !== undefined && (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > max)) return fail(req, res, invalid(`${name} must be an integer between 1 and ${max}`), 'validateQuery', 400);
  }
  try {
    for (const field of ['start_date', 'forecast_date', 'assessment_date', 'recorded_date']) date(req.query[field], field);
  } catch (error) { return fail(req, res, error, 'validateQuery', 400); }
  next();
}

function date(value, name, { futureDays = 30 } = {}) {
  if (value === undefined || value === null || value === '') return;
  if (!DATE_RE.test(String(value))) throw invalid(`${name} must use YYYY-MM-DD`);
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw invalid(`${name} is invalid`);
  if (parsed.getUTCFullYear() < 1900 || parsed > new Date(Date.now() + futureDays * 86400000)) throw invalid(`${name} is outside the allowed date range`);
}

function dateTime(value, name) {
  if (value === undefined || value === null || value === '') return;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime()) || parsed.getUTCFullYear() < 1900 || parsed > new Date(Date.now() + 30 * 86400000)) throw invalid(`${name} is outside the allowed date range`);
}

function enumValue(value, name, values) { if (value !== undefined && !values.includes(value)) throw invalid(`${name} must be one of: ${values.join(', ')}`); }

function numberValue(value, name, { min, max, integer = false } = {}) {
  if (value === undefined || value === null || value === '') return;
  const numeric = typeof value === 'number' ? value : (typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN);
  if (!Number.isFinite(numeric) || (integer && !Number.isInteger(numeric)) || numeric < min || numeric > max) throw invalid(`${name} is outside the allowed range`);
}

function bodyValidator(validate) {
  return (req, res, next) => { try { requireObject(req); validate(req.body); next(); } catch (error) { return fail(req, res, error, 'validateBody', error.status || 400); } };
}

function queryValidator(validate) {
  return (req, res, next) => { try { validate(req.query); next(); } catch (error) { return fail(req, res, error, 'validateQuery', error.status || 400); } };
}

module.exports = { requestId, fail, invalid, validateId, parsePageQuery, date, dateTime, enumValue, numberValue, bodyValidator, queryValidator };