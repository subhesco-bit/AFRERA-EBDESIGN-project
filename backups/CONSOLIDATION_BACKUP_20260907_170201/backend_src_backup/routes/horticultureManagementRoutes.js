/**
 * Routes for the 8 Horticulture-domain CRUD resources - see
 * backend/src/services/horticultureManagementService.js. Mounted at flat
 * prefixes in index.js matching frontend/src/services/api.js exactly
 * (e.g. /api/v1/vegetable-production), so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const {
  vegetableProduction, floriculture, polyhouseManagement, hydroponics,
  aeroponics, precisionHorticulture, protectedCultivation, horticultureAnalytics,
} = require('../services/legacy/horticultureManagementService');

function crudRouter(service) {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  router.get('/:id', async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  router.post('/', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try { res.status(201).json({ success: true, data: await service.create(req.body) }); }
    catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.put('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      const item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { res.status(400).json({ success: false, error: e.message }); }
  });
  router.delete('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
  });
  return router;
}

module.exports = {
  vegetableProductionRoutes: crudRouter(vegetableProduction),
  floricultureRoutes: crudRouter(floriculture),
  polyhouseManagementRoutes: crudRouter(polyhouseManagement),
  hydroponicsRoutes: crudRouter(hydroponics),
  aeroponicsRoutes: crudRouter(aeroponics),
  precisionHorticultureRoutes: crudRouter(precisionHorticulture),
  protectedCultivationRoutes: crudRouter(protectedCultivation),
  horticultureAnalyticsRoutes: crudRouter(horticultureAnalytics),
};
