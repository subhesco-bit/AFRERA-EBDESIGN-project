const express = require('express');
const os = require('../modules/platform/UnifiedIntelligenceOS');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'unified-intelligence-os',
    pillars: ['veterinary', 'nutrition', 'agro'],
    tier: 'grok-highest-industry',
  });
});

router.get('/gaps', (_req, res) => {
  res.json({ success: true, data: os.GAP_REGISTRY });
});

router.get('/lab-contracts', (_req, res) => {
  res.json({ success: true, data: os.LAB_CONTRACTS });
});

/** Cross-module operate */
router.post('/operate', (req, res) => {
  try {
    res.json({ success: true, data: os.operateUnified(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Outcome feedback for future learning */
router.post('/outcomes', (req, res) => {
  try {
    res.json({ success: true, data: os.recordOutcome(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/nutrition/life-stage', (req, res) => {
  try {
    res.json({
      success: true,
      data: os.lifeStageNutritionFlags(req.body?.profile || req.body || {}),
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/veterinary/vision-bridge', (req, res) => {
  try {
    res.json({ success: true, data: os.vetVisionBridge(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
