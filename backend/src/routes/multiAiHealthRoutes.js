/**
 * Multi-AI Health Orchestra routes — /api/v1/multi-ai-health
 */
const express = require('express');
const { runMultiAIAnalysis, AI_MODES } = require('../modules/healthos/MultiAIOrchestra');
const { getReadiness } = require('../modules/healthos/UnifiedReadiness');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'multi-ai-health-orchestra',
    modes: AI_MODES.map((m) => m.id),
    tier: 'grok-highest',
  });
});

router.get('/modes', (_req, res) => {
  res.json({ success: true, data: AI_MODES });
});

router.get('/readiness', (_req, res) => {
  res.json({ success: true, data: getReadiness() });
});

/** Full multi-lens analysis + decision consensus */
router.post('/analyze', (req, res) => {
  try {
    const data = runMultiAIAnalysis(req.body || {});
    res.json({ success: true, data });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Decision-only fast path */
router.post('/decide', (req, res) => {
  try {
    const data = runMultiAIAnalysis({ ...req.body, modes: ['clinical_decision', 'scientific_research', 'one_health'] });
    res.json({
      success: true,
      data: {
        consensus: data.consensus,
        clinical_decision: data.lenses.clinical_decision,
        scientific: data.lenses.scientific_research,
        one_health: data.lenses.one_health,
        case_id: data.case_id,
      },
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
