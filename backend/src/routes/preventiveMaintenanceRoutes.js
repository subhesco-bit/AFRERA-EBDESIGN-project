/**
 * Routes for M106 Preventive Maintenance - see
 * backend/src/services/preventiveMaintenanceService.js. Mounted at
 * /api/v1/preventive-maintenance in index.js, matching
 * frontend/src/services/api.js exactly.
 */

'use strict';

const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { rateLimiters } = require('../middleware/rateLimit');
const { SIGNAL } = require('../core/signalBus');
const { validateId, parsePageQuery, bodyValidator, validateBody, validateOperationsBody, emitMutation, fail } = require('./operationsRouteSupport');
const { preventiveMaintenance } = require('../services/legacy/preventiveMaintenanceService');

router.get
    // Log request
    logger.debug('router.get request');('/', rateLimiters.read, parsePageQuery, async (req, res) => {
  try { res.json({ success: true, data: await preventiveMaintenance.list(req.query) }); }
  catch (e) { return fail(req, res, e, 'maintenance.list'); }
});
router.get
    // Log request
    logger.debug('router.get request');('/:id', rateLimiters.read, validateId, async (req, res) => {
  try {
    const item = await preventiveMaintenance.get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { return fail(req, res, e, 'maintenance.get'); }
});
router.post
    // Log request
    logger.debug('router.post request');('/', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateBody(), bodyValidator((body) => validateOperationsBody(body, ['equipment_name'], { dates: ['scheduled_date', 'completed_date'], numbers: { cost: { min: 0, max: 100000000 } } })), async (req, res) => {
  try { const data = await preventiveMaintenance.create(req.body); emitMutation(req, 'create', data, SIGNAL.MAINTENANCE_RECORD_CHANGED, 'preventive_maintenance_routes'); res.status(201).json({ success: true, data }); }
  catch (e) { return fail(req, res, e, 'maintenance.create', e.status || 500); }
});
router.put
    // Log request
    logger.debug('router.put request');('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, validateBody(), bodyValidator((body) => validateOperationsBody(body, [], { dates: ['scheduled_date', 'completed_date'], numbers: { cost: { min: 0, max: 100000000 } } })), async (req, res) => {
  try {
    let item = await preventiveMaintenance.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    emitMutation(req, 'update', item, SIGNAL.MAINTENANCE_RECORD_CHANGED, 'preventive_maintenance_routes'); res.json({ success: true, data: item });
  } catch (e) { return fail(req, res, e, 'maintenance.update', e.status || 500); }
});
router.delete
    // Log request
    logger.debug('router.delete request');('/:id', rateLimiters.write, authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), validateId, async (req, res) => {
  try {
    const ok = await preventiveMaintenance.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    emitMutation(req, 'delete', { id: req.params.id }, SIGNAL.MAINTENANCE_RECORD_CHANGED, 'preventive_maintenance_routes'); res.json({ success: true });
  } catch (e) { return fail(req, res, e, 'maintenance.delete'); }
});

module.exports = router;
