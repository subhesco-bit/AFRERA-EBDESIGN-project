'use strict';

const { apiLimiter } = require('../middleware/rateLimiter');
const { sanitizeObject } = require('../middleware/inputValidation');
const { logger } = require('../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');

const MAX_ID_LENGTH = 64;
const MAX_LIMIT = 100;
const MAX_PAGE = 1000000000;
const MAX_NUMBER = 1000000000;
const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function correlationId(req) {
  return req.id || req.correlationId || req.get('x-correlation-id') || 'unknown';
}

function fail(res, req, status, message, code = 'REQUEST_ERROR') {
  return res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error' : message,
    code: status >= 500 ? 'INTERNAL_ERROR' : code,
    requestId: correlationId(req)
  });
}

function validateValue(value, key) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string' && value.length > 4096) return `${key} is too long`;
  if (/date|_at$/i.test(key) && (typeof value !== 'string' || Number.isNaN(Date.parse(value)))) {
    return `${key} must be a valid date`;
  }
  if (/(^|_)(id|count|quantity|amount|price|cost|weight|volume|liters|percent|rate|days|number|acres|turnover|vintage)$/i.test(key)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || Math.abs(numeric) > MAX_NUMBER) return `${key} is outside the allowed range`;
  }
  if (Array.isArray(value) && value.length > MAX_LIMIT) return `${key} contains too many items`;
  if (value && typeof value === 'object') {
    for (const [childKey, childValue] of Object.entries(value)) {
      const error = validateValue(childValue, childKey);
      if (error) return error;
    }
  }
  return null;
}

function validateRouteParam(req, res, next, value) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(String(value))) {
    return fail(res, req, 400, 'resource ID is outside the allowed range', 'INVALID_ID');
  }
  return next();
}

function requestGuard(req, res, next, { signal, advisory = false } = {}) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) return fail(res, req, 400, 'page is outside the allowed range', 'INVALID_PAGINATION');
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return fail(res, req, 400, 'limit is outside the allowed range', 'INVALID_PAGINATION');

  req.body = sanitizeObject(req.body || {});
  let error = validateValue(req.body, 'body');
  if (error) return fail(res, req, 400, error, 'INVALID_INPUT');

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 500) {
      return originalJson({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        requestId: correlationId(req)
      });
    }
    let output = body;
    if (advisory && body && typeof body === 'object') {
      output = { ...body, advisory: true, humanAuthorizationRequired: true };
      if (Object.prototype.hasOwnProperty.call(body, 'data')) {
        output.data = { result: body.data, advisory: true, humanAuthorizationRequired: true };
      }
    }
    if (MUTATIONS.has(req.method) && signal) {
      signalBus.emitSignal(signal, { method: req.method, path: req.path }, {
        severity: SEVERITY.INFO,
        source: 'enterprise_routes',
        entityId: req.params.id || req.params.orderId || null,
        correlationId: correlationId(req)
      });
    }
    return originalJson(output);
  };
  logger.info('enterpriseRouteSupport:request', { method: req.method, path: req.path, requestId: correlationId(req) });
  next();
}

function protectRouter(router, options = {}) {
  Object.keys(options.params || {}).forEach((name) => router.param(name, validateRouteParam));
  router.use(apiLimiter);
  router.use((req, res, next) => requestGuard(req, res, next, options));
  return router;
}

function requireHumanAuthorization(req, res, next) {
  const authorized = req.get('x-human-authorization') === 'confirmed' || req.body?.humanAuthorized === true;
  if (!authorized) return fail(res, req, 403, 'Explicit human authorization is required', 'HUMAN_AUTHORIZATION_REQUIRED');
  next();
}

module.exports = { protectRouter, requireHumanAuthorization, correlationId, fail };