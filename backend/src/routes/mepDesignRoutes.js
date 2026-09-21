'use strict';

/**
 * MEP Design routes — AI Engineer support for Mechanical / Electrical / Plumbing.
 * Auto-mounts via dynamicRouteLoader at /api/v1/mep-design.
 *
 * GET  /capabilities     → facility types + design rules
 * POST /plan             → deterministic MEP package + optional capacity hints
 * POST /brief            → AI advisory design brief only
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const mepDesignService = require('../services/legacy/mepDesignService');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    res.set('Cache-Control', 'private, max-age=60');
    res.json({ success: true, data: mepDesignService.getCapabilities() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/plan', authMiddleware, async (req, res) => {
  try {
    const data = await mepDesignService.buildMepDesignPlan({
      facilityType: req.body.facilityType,
      projectId: req.body.projectId || null,
      userId: req.user.id,
      isAdmin: req.user.role === 'admin',
      capacityInputs: req.body.capacityInputs || {},
    });
    res.set('X-Plan-Version', data.planVersion || '1.0');
    res.json({ success: true, data });
  } catch (error) {
    const bad = error.message === 'facilityType is required';
    res.status(bad ? 400 : 500).json({
      success: false,
      error: error.message,
      code: bad ? 'FACILITY_TYPE_REQUIRED' : 'MEP_PLAN_FAILED',
    });
  }
});

router.post('/brief', authMiddleware, async (req, res) => {
  try {
    const result = await mepDesignService.generateMepDesignBrief({
      facilityType: req.body.facilityType,
      projectName: req.body.projectName,
      disciplines: req.body.disciplines,
      capacityHints: req.body.capacityHints,
      notes: req.body.notes,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message, code: 'MEP_BRIEF_FAILED' });
  }
});

module.exports = router;
