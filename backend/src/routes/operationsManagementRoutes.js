/**
 * Routes for the 8 Operations-domain CRUD resources - see
 * backend/src/services/operationsManagementService.js. Each is mounted at
 * its own flat prefix in index.js to match frontend/src/services/api.js
 * exactly (e.g. /api/v1/farm-activities), so no frontend change is needed.
 */

'use strict';

const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { rateLimiters } = require('../middleware/rateLimit');
const { SIGNAL } = require('../core/signalBus');
const { validateId, parsePageQuery, bodyValidator, validateBody, validateOperationsBody, emitMutation, fail } = require('./operationsRouteSupport');
const {
  farmActivities, farmTasks, contractors, machineryOperations,
  equipmentScheduling, inputConsumption, farmProductivity, farmOperationsDashboard,
} = require('../services/legacy/operationsManagementService');

function crudRouter(service, validateCreate) {
  const router = express.Router();
  router.get('/', rateLimiters.read, parsePageQuery, async (req, res) => {
    try { res.json({ success: true, data: (await service.list(req.query)).items }); }
    catch (e) { return fail(req, res, e, 'operations.list'); }
  });
  router.get('/:id', rateLimiters.read, validateId, async (req, res) => {
    try {
      const item = await service.get(req.params.id);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'operations.get'); }
  });
  router.post('/', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateBody(), bodyValidator(validateCreate), async (req, res) => {
    try { const data = await service.create(req.body); emitMutation(req, 'create', data, SIGNAL.OPERATIONS_RECORD_CHANGED, 'operations_management_routes'); res.status(201).json({ success: true, data }); }
    catch (e) { return fail(req, res, e, 'operations.create', e.status || 500); }
  });
  router.put('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, validateBody(), bodyValidator((body) => validateOperationsBody(body)), async (req, res) => {
    try {
      let item = await service.update(req.params.id, req.body);
      if (!item) return res.status(404).json({ success: false, error: 'Not found' });
      emitMutation(req, 'update', item, SIGNAL.OPERATIONS_RECORD_CHANGED, 'operations_management_routes'); res.json({ success: true, data: item });
    } catch (e) { return fail(req, res, e, 'operations.update', e.status || 500); }
  });
  router.delete('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
    try {
      const ok = await service.remove(req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      emitMutation(req, 'delete', { id: req.params.id }, SIGNAL.OPERATIONS_RECORD_CHANGED, 'operations_management_routes'); res.json({ success: true });
    } catch (e) { return fail(req, res, e, 'operations.delete'); }
  });
  return router;
}

module.exports = {
  farmActivityRoutes: crudRouter(farmActivities, (body) => validateOperationsBody(body, ['activity_name', 'activity_type'], { dates: ['scheduled_date', 'completed_date'] })),
  farmTaskRoutes: crudRouter(farmTasks, (body) => validateOperationsBody(body, ['task_name'], { dates: ['due_date'], enums: { priority: ['low', 'medium', 'high', 'urgent'], status: ['pending', 'in_progress', 'completed', 'cancelled'] } })),
  contractorRoutes: crudRouter(contractors, (body) => validateOperationsBody(body, ['contractor_name', 'service_type'], { dates: ['contract_start', 'contract_end'], numbers: { rate: { min: 0, max: 100000000 } } })),
  machineryOperationsRoutes: crudRouter(machineryOperations, (body) => validateOperationsBody(body, ['machine_name', 'operation_type'], { dates: ['operation_date'], numbers: { hours_used: { min: 0, max: 100000 }, fuel_consumed_l: { min: 0, max: 10000000 } } })),
  equipmentSchedulingRoutes: crudRouter(equipmentScheduling, (body) => validateOperationsBody(body, ['equipment_name'], { dateTimes: ['start_time', 'end_time'] })),
  inputConsumptionRoutes: crudRouter(inputConsumption, (body) => validateOperationsBody(body, ['input_name', 'input_type'], { dates: ['consumption_date'], numbers: { quantity_used: { min: 0, max: 100000000 } } })),
  farmProductivityRoutes: crudRouter(farmProductivity, (body) => validateOperationsBody(body, ['metric_name'], { numbers: { value: { min: 0, max: 1000000000 }, benchmark: { min: 0, max: 1000000000 } } })),
  farmOperationsDashboardRoutes: crudRouter(farmOperationsDashboard, (body) => validateOperationsBody(body, ['kpi_name'], { numbers: { value: { min: 0, max: 1000000000 }, target: { min: 0, max: 1000000000 } } })),
};
