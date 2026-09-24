const express = require('express');
const { runNutritionEnhanced } = require('../modules/nutrition/NutritionEnhancedOperate');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'nutrition-enhanced',
    features: ['algorithms', 'workflow', 'evaluation', 'bus', 'viz', 'audio', 'confidence'],
  });
});

router.post('/enhanced', (req, res) => {
  try {
    res.json({ success: true, data: runNutritionEnhanced(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
