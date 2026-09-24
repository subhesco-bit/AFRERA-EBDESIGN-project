const express = require('express');
const os = require('../modules/platform/UnifiedIntelligenceOS');
const enhanced = require('../modules/platform/EnhancedOperate');
const decisionEng = require('../modules/platform/DecisionQualityEngine');
const workflow = require('../modules/platform/WorkflowOrchestrator');
const bus = require('../modules/platform/InterModuleBus');
const interaction = require('../modules/platform/InteractionLayer');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    module: 'unified-intelligence-os',
    pillars: ['veterinary', 'nutrition', 'agro'],
    enhancements: ['decision_quality', 'workflow_fsm', 'inter_module_bus', 'viz', 'audio'],
    tier: 'grok-highest-industry',
  });
});

router.get('/gaps', (_req, res) => {
  res.json({ success: true, data: os.GAP_REGISTRY });
});

router.get('/lab-contracts', (_req, res) => {
  res.json({ success: true, data: os.LAB_CONTRACTS });
});

router.post('/operate', (req, res) => {
  try {
    res.json({ success: true, data: os.operateUnified(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

/** Full enhanced path: algorithms + workflow + bus + viz + audio */
router.post('/operate/enhanced', (req, res) => {
  try {
    res.json({ success: true, data: enhanced.operateEnhanced(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/decision/evaluate', (req, res) => {
  try {
    res.json({ success: true, data: decisionEng.buildDecisionPackage(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/workflow/create', (req, res) => {
  res.json({ success: true, data: workflow.createWorkflow(req.body || {}) });
});

router.post('/workflow/advance', (req, res) => {
  try {
    const wf = req.body?.workflow;
    if (!wf) return res.status(400).json({ success: false, error: 'workflow required' });
    res.json({ success: true, data: workflow.advance(wf, req.body.to_state, req.body.note) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/bus/events', (req, res) => {
  res.json({ success: true, data: bus.recentEvents(Number(req.query.limit) || 50) });
});

router.post('/bus/publish', (req, res) => {
  try {
    res.json({
      success: true,
      data: bus.publish(req.body?.type || 'custom', req.body?.payload || {}, req.body?.meta || {}),
    });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/interaction/bundle', (req, res) => {
  try {
    res.json({ success: true, data: interaction.buildInteractionBundle(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/outcomes', (req, res) => {
  try {
    const outcome = os.recordOutcome(req.body || {});
    bus.publish(bus.EVENT_TYPES.OUTCOME_RECORDED, outcome, { source_module: 'platform' });
    res.json({ success: true, data: outcome });
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
