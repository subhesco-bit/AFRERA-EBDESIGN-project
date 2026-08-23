/**
 * Routes for M106 Preventive Maintenance - see
 * backend/src/services/preventiveMaintenanceService.js. Mounted at
 * /api/v1/preventive-maintenance in index.js, matching
 * frontend/src/services/api.js exactly.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { FARM_OPERATIONS_ROLES } = require('../middleware/roleGroups');
const { preventiveMaintenance } = require('../services/preventiveMaintenanceService');

router.get('/', async (req, res) => {
  try { res.json({ success: true, data: await preventiveMaintenance.list(req.query) }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.get('/:id', async (req, res) => {
  try {
    const item = await preventiveMaintenance.get(req.params.id);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
router.post('/', authMiddleware, async (req, res) => {
  try { res.status(201).json({ success: true, data: await preventiveMaintenance.create(req.body) }); }
  catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
router.put('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const item = await preventiveMaintenance.update(req.params.id, req.body);
    if (!item) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: item });
  } catch (e) { res.status(400).json({ success: false, error: e.message }); }
});
router.delete('/:id', authMiddleware, requireRole(...FARM_OPERATIONS_ROLES), async (req, res) => {
  try {
    const ok = await preventiveMaintenance.remove(req.params.id);
    if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;
