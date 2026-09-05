/**
 * Routes for the 6 Crop-domain CRUD resources - see
 * backend/src/services/cropManagementService.js. Mounted at flat prefixes
 * in index.js matching frontend/src/services/api.js exactly
 * (e.g. /api/v1/crop-registration/crops), so no frontend change is needed.
 */

'use strict';

const express = require('express');
const apiResponseHandler = require('../middleware/apiResponseHandler');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const {
  cropRegistration, cropVariety, seedPlanning, nurseryManagement, sowingManagement, cropMonitoring,
} = require('../services/legacy/cropManagementService');

function crudRouter(service) {
  const router = express.Router();
  router.get('/', async (req, res) => {
    try { 
      const items = (await service.list(req.query)).items;
      return apiResponseHandler.sendSuccess(res, items, 'Items retrieved successfully');
    }
    catch (e) { 
      return apiResponseHandler.sendError(res, 'Failed to retrieve items', 500, 'SERVER_ERROR', e.message); 
    }
  });
  router.get('/:id', async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return apiResponseHandler.sendError(res, 'Item not found', 404, 'NOT_FOUND');
      return apiResponseHandler.sendSuccess(res, item, 'Item retrieved successfully');
    } catch (e) { 
      return apiResponseHandler.sendError(res, 'Failed to retrieve item', 500, 'SERVER_ERROR', e.message); 
    }
  });
  router.post('/', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try { 
      let item = await service.create(req.body);
      return apiResponseHandler.sendSuccess(res, item, 'Item created successfully', 201);
    }
    catch (e) { 
      return apiResponseHandler.sendError(res, 'Failed to create item', 400, 'VALIDATION_ERROR', e.message); 
    }
  });
  router.put('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      let item = await service.update(req.params.id, req.body);
      if (!item) return apiResponseHandler.sendError(res, 'Item not found', 404, 'NOT_FOUND');
      return apiResponseHandler.sendSuccess(res, item, 'Item updated successfully');
    } catch (e) { 
      return apiResponseHandler.sendError(res, 'Failed to update item', 400, 'VALIDATION_ERROR', e.message); 
    }
  });
  router.delete('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return apiResponseHandler.sendError(res, 'Item not found', 404, 'NOT_FOUND');
      return apiResponseHandler.sendSuccess(res, null, 'Item deleted successfully');
    } catch (e) { 
      return apiResponseHandler.sendError(res, 'Failed to delete item', 500, 'SERVER_ERROR', e.message); 
    }
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
