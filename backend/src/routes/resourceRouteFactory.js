/**
 * Hardened CRUD 

router factory for the flat, table-backed resources created
 * via services/legacy/resourceCrudFactory.js (soil, water, and similar
 * simple domains). Originally these routers (soilManagementRoutes.js,
 * waterManagementRoutes.js) each hand-rolled a bare try/catch per verb with
 * no pagination bounds, no ID format check, no input sanitization, and no
 * signal emission - real gaps a real test suite
 * (routes/__tests__/waterSoilManagementRoutes.test.js) already existed to
 * catch, they just failed silently because that test file had an unrelated
 * `expresson()` typo that made the whole suite fail to load.
 *
 * This factory brings those routers up to the pattern already used
 * elsewhere in this domain (see routes/livestockRouteSupport.js): bounded
 * pagination, numeric-ID route params, request sanitization, a redacted
 * generic 500 response (never leak a raw service/DB error message to the
 * client), and a correlated signalBus emission on every mutation.
 */

'use strict';

const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { sanitizeObject } = require('../middleware/inputValidation');
const { signalBus, SEVERITY } = require('../core/signalBus');

const express = require('express');

const MAX_LIMIT = 200;
const MAX_ID = 1000000000;

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

/**
 * @param {object} service - { list, get, create, update, remove } from createCrudService
 * @param {object} opts
 * @param {string} opts.signal - a SIGNAL.* constant to emit on create/update/delete
 * @param {string} opts.source - label recorded on the emitted signal
 * @param {(payload: object) => string|null} [opts.validate] - domain-specific
 *   field validation (e.g. ph_level 0-14); return an error string to reject
 *   with 400, or null/undefined to allow.
 */
function createHardenedCrudRouter(service, { signal, source, validate } = {}) {
  const router = express.Router();

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();

}

}

}

  router.param('id', (req, res, next, value) => {
    if (!/^\d+$/.test(String(value)) || Number(value) < 1 || Number(value) > MAX_ID) {
      return fail(res, 400, 'id must be a positive integer', req);
    }
    return next();
  });

  function emit(req, entityId, payload) {
    signalBus.emitSignal(signal, payload, {
      severity: SEVERITY.INFO,
      source: source || 'resource_route',
      entityId: entityId ?? null,
      correlationId: requestId(req),
    });
  }

  router.get('/', async (req, res) => {
    const page = req.query.page === undefined ? 1 : Number(req.query.page);
    const limit = req.query.limit === undefined ? 20 : Number(req.query.limit);
    if (!Number.isInteger(page) || page < 1) return fail(res, 400, 'page is outside the allowed range', req);
    if (!Number.isInteger(limit) || limit < 1 || limit > MAX_LIMIT) return fail(res, 400, 'limit is outside the allowed range', req);
    try {
      const result = await service.list({ ...req.query, page, limit });
      res.json({ success: true, data: result.items, pagination: result.pagination });
    } catch (e) { fail(res, 500, e.message, req); }
  });

  router.get('/:id', async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return fail(res, 404, 'Not found', req);
      res.json({ success: true, data: item });
    } catch (e) { fail(res, 500, e.message, req); }
  });

  router.post('/', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    req.body = sanitizeObject(req.body || {});
    if (validate) {
      const error = validate(req.body);
      if (error) return fail(res, 400, error, req);
    }
    try {
      const item = await service.create(req.body);
      emit(req, item.id, req.body);
      res.status(201).json({ success: true, data: item });
    } catch (e) { fail(res, 400, e.message, req); }
  });

  router.put('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    req.body = sanitizeObject(req.body || {});
    if (validate) {
      const error = validate(req.body);
      if (error) return fail(res, 400, error, req);
    }
    try {
      const item = await service.update(req.params.id, req.body);
      if (!item) return fail(res, 404, 'Not found', req);
      emit(req, req.params.id, req.body);
      res.json({ success: true, data: item });
    } catch (e) { fail(res, 400, e.message, req); }
  });

  router.delete('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return fail(res, 404, 'Not found', req);
      emit(req, req.params.id, { deleted: true });
      res.json({ success: true });
    } catch (e) { fail(res, 500, e.message, req); }
  });

  return router;
}

module.exports = { createHardenedCrudRouter, fail, requestId, MAX_LIMIT };

}
}module.exports = router;