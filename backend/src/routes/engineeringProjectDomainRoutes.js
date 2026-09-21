/**
 * Real backend routes for EngineeringProjectPage.jsx, backed by
 * services/legacy/engineeringProjectService.js. userId/isAdmin filled
 * from the authenticated user.
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/engineeringProjectService');
const { authMiddleware } = require('../middleware/auth');

router.use(authMiddleware);

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/engineering-project/project', wrap((req) => svc.createProject(req.user.id, req.body)));
router.get('/engineering-project/project/:id', wrap((req) => svc.getProject(req.params.id, req.user.id, req.user?.role === 'admin')));
router.get('/engineering-project/projects', wrap((req) => svc.listProjects(req.user.id, req.query)));
router.put('/engineering-project/project/:id/phase', wrap((req) => svc.updateProjectPhase(req.params.id, req.user.id, req.user?.role === 'admin', req.body)));
router.post('/engineering-project/project/:id/cost-estimate', wrap((req) => svc.createCostEstimate(req.params.id, req.user.id, req.user?.role === 'admin', req.body)));
router.get('/engineering-project/project/:id/cost-estimates', wrap((req) => svc.getCostEstimates(req.params.id, req.user.id, req.user?.role === 'admin')));

module.exports = router;
