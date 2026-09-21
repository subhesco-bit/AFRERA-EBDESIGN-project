'use strict';

/**
 * MEP Design routes — /api/v1/mep-design
 *
 * GET  /capabilities
 * POST /plan              — package + capacity; optional createEstimate
 * POST /brief             — AI advisory only
 * POST /boq/preview       — draft BOQ lines (no DB write)
 * POST /boq/estimate      — real createCostEstimate via engineeringProjectService
 */

const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const mepDesignService = require('../services/legacy/mepDesignService');
const mepBoqBridge = require('../services/legacy/mepBoqBridge');

const router = express.Router();

router.get('/capabilities', authMiddleware, (req, res) => {
  try {
    res.set('Cache-Control', 'private, max-age=60');
    const caps = mepDesignService.getCapabilities();
    caps.boq = {
      preview: 'POST /api/v1/mep-design/boq/preview',
      estimate: 'POST /api/v1/mep-design/boq/estimate',
      templates: Object.keys(mepBoqBridge.BOQ_TEMPLATES || {}),
    };
    res.json({ success: true, data: caps });
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

    // Optional: attach BOQ preview always when facility known
    data.boqPreview = mepBoqBridge.previewBoqFromMep(data.facilityType, {
      quantityOverrides: req.body.quantityOverrides || {},
      unitRateOverrides: req.body.unitRateOverrides || {},
    });

    // Optional: persist estimate (real BOQ + cost_estimates)
    if (req.body.createEstimate && req.body.projectId) {
      data.costEstimate = await mepBoqBridge.createEstimateFromMep({
        facilityType: data.facilityType,
        projectId: req.body.projectId,
        userId: req.user.id,
        isAdmin: req.user.role === 'admin',
        region: req.body.region || null,
        contingencyPercentage: req.body.contingencyPercentage != null
          ? Number(req.body.contingencyPercentage)
          : 10,
        quantityOverrides: req.body.quantityOverrides || {},
        unitRateOverrides: req.body.unitRateOverrides || {},
        estimateType: req.body.estimateType || 'preliminary',
      });
    }

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

router.post('/boq/preview', authMiddleware, (req, res) => {
  try {
    if (!req.body.facilityType) {
      return res.status(400).json({ success: false, error: 'facilityType is required', code: 'FACILITY_TYPE_REQUIRED' });
    }
    const data = mepBoqBridge.previewBoqFromMep(req.body.facilityType, {
      quantityOverrides: req.body.quantityOverrides || {},
      unitRateOverrides: req.body.unitRateOverrides || {},
    });
    res.json({ success: true, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/boq/estimate', authMiddleware, async (req, res) => {
  try {
    const data = await mepBoqBridge.createEstimateFromMep({
      facilityType: req.body.facilityType,
      projectId: req.body.projectId,
      userId: req.user.id,
      isAdmin: req.user.role === 'admin',
      region: req.body.region || null,
      contingencyPercentage: req.body.contingencyPercentage != null
        ? Number(req.body.contingencyPercentage)
        : 10,
      quantityOverrides: req.body.quantityOverrides || {},
      unitRateOverrides: req.body.unitRateOverrides || {},
      estimateType: req.body.estimateType || 'preliminary',
    });
    const status = data.ok ? 200 : (data.code === 'UNRESOLVED_RATES' ? 422 : 400);
    res.status(status).json({ success: data.ok, data });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message, code: 'MEP_BOQ_ESTIMATE_FAILED' });
  }
});

module.exports = router;
