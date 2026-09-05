'use strict';

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const service = require('../services/legacy/engineeringProjectService');

const router = express.Router();

router.post('/projects', authLimiter, authMiddleware, async (req, res) => {
  try {
    const project = await service.createProject(req.user.id, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/projects', authMiddleware, async (req, res) => {
  try {
    const projects = await service.listProjects(req.user.id, req.query);
    res.json({ success: true, data: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/projects/:id', authMiddleware, async (req, res) => {
  try {
    let project = await service.getProject(req.params.id, req.user.id, req.user.role === 'admin');
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(error.message === 'Project not found' ? 404 : 500).json({ success: false, error: error.message });
  }
});

router.put('/projects/:id/phase', authLimiter, authMiddleware, async (req, res) => {
  try {
    let project = await service.updateProjectPhase(
      req.params.id, req.user.id, req.user.role === 'admin', req.body
    );
    res.json({ success: true, data: project });
  } catch (error) {
    res.status(error.message === 'Project not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.post('/projects/:id/cost-estimates', authLimiter, authMiddleware, async (req, res) => {
  try {
    const result = await service.createCostEstimate(
      req.params.id, req.user.id, req.user.role === 'admin', req.body
    );
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    if (error.code === 'UNRESOLVED_RATES') {
      return res.status(422).json({ success: false, error: error.message, unresolvedLines: error.unresolvedLines });
    }
    res.status(error.message === 'Project not found' ? 404 : 400).json({ success: false, error: error.message });
  }
});

router.get('/projects/:id/cost-estimates', authMiddleware, async (req, res) => {
  try {
    const estimates = await service.getCostEstimates(req.params.id, req.user.id, req.user.role === 'admin');
    res.json({ success: true, data: estimates });
  } catch (error) {
    res.status(error.message === 'Project not found' ? 404 : 500).json({ success: false, error: error.message });
  }
});

module.exports = router;

