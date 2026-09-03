'use strict';

const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { sanitizeObject } = require('../middleware/inputValidation');
const { logger } = require('../utils/logger');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');

const MAX_ID = 1000000000;
const MAX_LIMIT = 100;
const MAX_NUMERIC = 1000000000;

function requestId(req) {
  return req.id || req.correlationId || req.get('x-correlation-id') || 'unknown';
}

function fail(res, status, error, req) {
  return res.status(status).json({
    success: false,
    error: status >= 500 ? 'Internal server error' : error,
    code: status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
    requestId: requestId(req),
  });
}

function validateValue(value, key) {
  if (value === undefined || value === null || value === '') return null;
  if (/date|_at$/i.test(key) && (typeof value !== 'string' || Number.isNaN(Date.parse(value)))) return `${key} must be a valid date`;
  if (/(^|_)(id|count|quantity|amount|price|cost|weight|volume|liters|percent|rate|days|number)$/i.test(key)) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric) || Math.abs(numeric) > MAX_NUMERIC) return `${key} is outside the allowed range`;
  }
  return null;
}

function validatePayload(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) return null;
  for (const [key, value] of Object.entries(payload)) {
    const error = validateValue(value, key);
    if (error) return error;
  }
  return null;
}

function validateRouteParam(req, res, next, value) {
  if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > MAX_ID) {
    return fail(res, 400, 'resource ID is outside the allowed range', req);
  }
  return next();
}

function requestGuard(req, res, next, mutationSignal = SIGNAL.LIVESTOCK_RECORD_CHANGED) {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);
  if (!Number.isInteger(page) || page < 1 || page > MAX_ID) return fail(res, 400, 'page is outside the allowed range', req);
  if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return fail(res, 400, 'limit is outside the allowed range', req);
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObject(req.body);
    const error = validatePayload(req.body);
    if (error) return fail(res, 400, error, req);
  }

  const originalJson = res.json.bind(res);
  res.json = (body) => {
    if (res.statusCode >= 400) return originalJson({ success: false, error: res.statusCode >= 500 ? 'Internal server error' : 'Request failed', code: res.statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR', requestId: requestId(req) });
    if (req.path.startsWith('/ai/')) {
      const data = body && body.data;
      body = { ...body, data: { result: data, advisory: true, provenance: 'livestock_ai_service', confidence: data && data.confidence !== undefined ? data.confidence : null } };
    }
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      signalBus.emitSignal(mutationSignal, { method: req.method, path: req.path, data: body && body.data }, { severity: SEVERITY.INFO, source: 'livestock_routes', entityId: req.params.id || null, correlationId: requestId(req) });
    }
    return originalJson(body);
  };
  logger.info('livestockRouteSupport:request', { method: req.method, path: req.path, requestId: requestId(req) });
  next();
}

function protectLivestockRouter(router, { requireWriteRole = false, signal = SIGNAL.LIVESTOCK_RECORD_CHANGED } = {}) {
  ['id', 'animalId', 'flockId', 'femaleId', 'sowId'].forEach((name) => router.param(name, validateRouteParam));
  router.use(rateLimiter);
  router.use((req, res, next) => requestGuard(req, res, next, signal));
  if (requireWriteRole) router.use((req, res, next) => req.method === 'GET' ? next() : authMiddleware(req, res, () => requireRole(...FARM_OPERATIONS_ROLES)(req, res, next)));
  return router;
}

module.exports = { protectLivestockRouter, requestGuard, fail };