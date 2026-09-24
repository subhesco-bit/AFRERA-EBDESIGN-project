/**
 * Agro farming systems + vision — /api/v1/agro-farming
 */
const express = require('express');
const farming = require('../modules/agro/FarmingSystemsEngine');
const vision = require('../modules/agro/AgroVisionAnalysis');
const orchestra = require('../modules/agro/AgroIntelligenceOrchestra');
const knowledge = require('../modules/agro/AgroKnowledgeEngine');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'agro-farming',
    systems: Object.keys(farming.SYSTEMS),
    vision_symptoms: vision.VISUAL_SYMPTOMS.length,
  });
});

router.get('/systems', (_req, res) => {
  res.json({ success: true, data: farming.SYSTEMS, disclaimer: farming.FARM_DISCLAIMER });
});

router.get('/crops', (_req, res) => {
  res.json({ success: true, data: farming.CROP_RECIPES_INDIA });
});

router.post('/systems/conference', (req, res) => {
  try {
    res.json({ success: true, data: farming.runFarmingSystemConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/climate/advise', (req, res) => {
  try {
    const systemId = farming.normalizeSystem(req.body?.system);
    res.json({
      success: true,
      data: farming.climateAdvice(systemId, req.body?.telemetry || {}),
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Picture / APK vision path */
router.post('/vision/analyze', (req, res) => {
  try {
    res.json({ success: true, data: vision.analyzeVision(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message, disclaimer: vision.VISION_DISCLAIMER });
  }
});

/** Full orchestra: seasonal + system + vision */
router.post('/intelligence', (req, res) => {
  try {
    res.json({ success: true, data: orchestra.runFullAgroIntelligence(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/knowledge/conference', (req, res) => {
  try {
    res.json({ success: true, data: knowledge.runAgroConference(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
