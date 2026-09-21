'use strict';
const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth');
const service = require('../services/ai/optimizationJobService');
const router = express.Router();
const operator = requireRole('admin', 'super_admin', 'operations_manager', 'data_scientist');
const fail = (res, e) => res.status(e.statusCode || 500).json({ success: false, error: e.statusCode ? e.message : 'Optimization request failed' });

router.get('/objectives', authMiddleware, (req, res) => res.json({ success: true, data: service.listObjectives() }));
router.post('/jobs', authMiddleware, operator, async (req, res) => {
  try { res.status(201).json({ success: true, data: await service.create(req.body, req.user) }); } catch (e) { fail(res, e); }
});
router.post('/jobs/:jobId/execute', authMiddleware, operator, async (req, res) => {
  try { res.json({ success: true, data: await service.execute(req.params.jobId, req.user) }); } catch (e) { fail(res, e); }
});
router.get('/jobs/:jobId', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await service.get(req.params.jobId, req.user) }); } catch (e) { fail(res, e); }
});
module.exports = router;
