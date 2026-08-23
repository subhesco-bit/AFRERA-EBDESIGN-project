/**
 * Routes for the 6 Crop-domain CRUD resources - see
 * backend/src/services/cropManagementService.js. Mounted at flat prefixes
 * in index.js matching frontend/src/services/api.js exactly
 * (e.g. /api/v1/crop-registration/crops), so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const {
  cropRegistration, cropVariety, seedPlanning, nurseryManagement, sowingManagement, cropMonitoring,
} = require('../services/cropManagementService');

function crudRouter(service) {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try { res.json({ success: true, data: await service.list(req.query) }); }
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
  cropRegistrationRoutes: crudRouter(cropRegistration),
  cropVarietyRoutes: crudRouter(cropVariety),
  seedPlanningRoutes: crudRouter(seedPlanning),
  nurseryManagementRoutes: crudRouter(nurseryManagement),
  sowingManagementRoutes: crudRouter(sowingManagement),
  cropMonitoringRoutes: crudRouter(cropMonitoring),
};
