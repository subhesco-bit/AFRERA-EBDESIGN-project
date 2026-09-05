/**
 * Routes for the 3 Soil-domain CRUD resources - see
 * backend/src/services/soilManagementService.js. Mounted at flat prefixes
 * in index.js matching frontend/src/services/api.js exactly
 * (e.g. /api/v1/soil-health/cards), so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { rateLimiters } = require('../middleware/rateLimit');
const { validateBody } = require('../middleware/inputValidation');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');
const { logger } = require('../utils/logger');
const { validateId, parsePageQuery, bodyValidator, date, numberValue, fail, requestId } = require('./climateRouteSupport');
const { soilHealth, nutrientManagement, fertilityManagement } = require('../services/legacy/soilManagementService');

function crudRouter(service, validateCreate) {
  const router = express.Router();
  router.get('/', rateLimiters.read, parsePageQuery, async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { return fail(req, res, e, 'soil.list'); }
  });
  router.get('/:id', rateLimiters.read, validateId, async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'soil.get'); }
  });
  router.post('/', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateBody(), bodyValidator(validateCreate), async (req, res) => {
    try {
      const data = await service.create(req.body);
      emitMutation(req, 'create', data);
      res.status(201).json({ success: true, data });
    } catch (e) { return fail(req, res, e, 'soil.create', e.status || 500); }
  });
  router.put('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, validateBody(), bodyValidator(validateUpdate), async (req, res) => {
    try {
      let item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      emitMutation(req, 'update', item);
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'soil.update', e.status || 500); }
  });
  router.delete('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      emitMutation(req, 'delete', { id: req.params.id });
      res.json({ success: true });
    } catch (e) { return fail(req, res, e, 'soil.delete'); }
  });
  return router;
}

function validateSoilBody(body, requiredFields = []) {
  if (!Object.keys(body).length) throw new Error('At least one field is required');
  const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
  numberValue(body.ph_level, 'ph_level', { min: 0, max: 14 });
  numberValue(body.organic_matter_percent, 'organic_matter_percent', { min: 0, max: 100 });
  for (const field of ['card_date', 'plan_date', 'assessed_date']) date(body[field], field);
}

function validateUpdate(body) { validateSoilBody(body); }

function emitMutation(req, operation, item) {
  const id = String(item?.id || req.params.id || 'unknown');
  logger.info('soilManagementRoutes:mutation', { operation, entityId: id, requestId: requestId(req, 'soil') });
  signalBus.emitSignal(SIGNAL.SOIL_RECORD_CHANGED, { operation, resourceId: id }, {
    severity: SEVERITY.INFO, source: 'soil_management_routes', entityId: id, correlationId: requestId(req, 'soil')
  });
}

module.exports = {
  soilHealthRoutes: crudRouter(soilHealth, (body) => validateSoilBody(body, ['plot_name'])),
  nutrientManagementRoutes: crudRouter(nutrientManagement, (body) => validateSoilBody(body, ['plot_name'])),
  fertilityManagementRoutes: crudRouter(fertilityManagement, (body) => validateSoilBody(body, ['plot_name'])),
};
