/**
 * Routes for the 8 Input Supply-domain CRUD resources - see
 * backend/src/services/inputSupplyManagementService.js. Mounted at flat
 * prefixes in index.js matching frontend/src/services/api.js exactly
 * (e.g. /api/v1/biofertilizers), so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const {
  biofertilizer, pesticideInventory, bioPesticide, micronutrient,
  organicInput, inputProcurement, inputDistribution, inputTraceability,
} = require('../services/inputSupplyManagementService');

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
  biofertilizerRoutes: crudRouter(biofertilizer),
  pesticideInventoryRoutes: crudRouter(pesticideInventory),
  bioPesticideRoutes: crudRouter(bioPesticide),
  micronutrientRoutes: crudRouter(micronutrient),
  organicInputRoutes: crudRouter(organicInput),
  inputProcurementRoutes: crudRouter(inputProcurement),
  inputDistributionRoutes: crudRouter(inputDistribution),
  inputTraceabilityRoutes: crudRouter(inputTraceability),
};
