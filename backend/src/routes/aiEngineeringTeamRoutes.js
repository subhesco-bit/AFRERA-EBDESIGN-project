'use strict';

/**
 * AI Engineering Design Team routes.
 * Auto-mounts at /api/v1/ai-engineering-team via dynamicRouteLoader.
 *
 * GET  /capabilities  → roles, facility types, design rules
 * POST /plan          → full team work packages (deterministic)
 * POST /brief         → AI advisory coordination brief only
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const aiEngineeringTeamService = require('../services/legacy/aiEngineeringTeamService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ success: true, data: aiEngineeringTeamService.getCapabilities() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/plan', authMiddleware, async (req, res) => {
  try {
    const data = await aiEngineeringTeamService.buildDesignTeamPlan({
      facilityType: req.body.facilityType,
      projectId: req.body.projectId || null,
      userId: req.user.id,
      isAdmin: req.user.role === 'admin',
      structuralInputs: req.body.structuralInputs || {},
      capacityInputs: req.body.capacityInputs || {},
      state: req.body.state || null,
    });
    res.set('X-Plan-Version', data.planVersion || '1.0');
    res.json({ success: true, data });
  } catch (error) {
    const bad = error.message === 'facilityType is required';
    res.status(bad ? 400 : 500).json({
      success: false,
      error: error.message,
      code: bad ? 'FACILITY_TYPE_REQUIRED' : 'DESIGN_TEAM_PLAN_FAILED',
    });
  }
});

router.post('/brief', authMiddleware, async (req, res) => {
  try {
    const result = await aiEngineeringTeamService.generateTeamBrief({
      facilityType: req.body.facilityType,
      projectName: req.body.projectName,
      team: req.body.team,
      notes: req.body.notes,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 'TEAM_BRIEF_FAILED' });
  }
});

module.exports = router;
