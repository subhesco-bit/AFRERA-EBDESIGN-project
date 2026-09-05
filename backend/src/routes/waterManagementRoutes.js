/**
 * Routes for the 5 Water-domain CRUD resources - see
 * backend/src/services/waterManagementService.js. Mounted at flat prefixes
 * in index.js matching frontend/src/services/api.js's nested paths
 * (e.g. /api/v1/water-budgeting/budgets), so no frontend change is needed.
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
const {
  waterBudgeting, waterQuality, rainwaterHarvesting, watershedManagement, waterAnalytics,
} = require('../services/legacy/waterManagementService');

function crudRouter(service, validateCreate) {
  const router = express.Router();
  router.get('/', rateLimiters.read, parsePageQuery, async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { return fail(req, res, e, 'water.list'); }
  });
  router.get('/:id', rateLimiters.read, validateId, async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'water.get'); }
  });
  router.post('/', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateBody(), bodyValidator(validateCreate), async (req, res) => {
    try {
      const data = await service.create(req.body);
      emitMutation(req, 'create', data);
      res.status(201).json({ success: true, data });
    } catch (e) { return fail(req, res, e, 'water.create', e.status || 500); }
  });
  router.put('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, validateBody(), bodyValidator(validateUpdate), async (req, res) => {
    try {
      let item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      emitMutation(req, 'update', item);
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'water.update', e.status || 500); }
  });
  router.delete('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      emitMutation(req, 'delete', { id: req.params.id });
      res.json({ success: true });
    } catch (e) { return fail(req, res, e, 'water.delete'); }
  });
  return router;
}

function validateWaterBody(body, requiredFields = []) {
  if (!Object.keys(body).length) throw new Error('At least one field is required');
  const missing = requiredFields.filter((field) => body[field] === undefined || body[field] === null || body[field] === '');
  if (missing.length) throw new Error(`${missing.join(', ')} ${missing.length > 1 ? 'are' : 'is'} required`);
  for (const field of ['demand_liters', 'supply_liters', 'capacity_liters', 'area_hectares', 'value']) numberValue(body[field], field, { min: 0, max: 1000000000 });
  for (const field of ['built_date', 'reading_date']) date(body[field], field);
}

function validateUpdate(body) { validateWaterBody(body); }

function emitMutation(req, operation, item) {
  const id = String(item?.id || req.params.id || 'unknown');
  logger.info('waterManagementRoutes:mutation', { operation, entityId: id, requestId: requestId(req, 'water') });
  signalBus.emitSignal(SIGNAL.WATER_RECORD_CHANGED, { operation, resourceId: id }, {
    severity: SEVERITY.INFO, source: 'water_management_routes', entityId: id, correlationId: requestId(req, 'water')
  });
}

module.exports = {
  waterBudgetingRoutes: crudRouter(waterBudgeting, (body) => validateWaterBody(body, ['plot_name'])),
  waterQualityRoutes: crudRouter(waterQuality, (body) => validateWaterBody(body, ['location', 'parameter'])),
  rainwaterHarvestingRoutes: crudRouter(rainwaterHarvesting, (body) => validateWaterBody(body, ['structure_name', 'structure_type'])),
  watershedManagementRoutes: crudRouter(watershedManagement, (body) => validateWaterBody(body, ['name'])),
  waterAnalyticsRoutes: crudRouter(waterAnalytics, (body) => validateWaterBody(body, ['metric', 'period'])),
};
