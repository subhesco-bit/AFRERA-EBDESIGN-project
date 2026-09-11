'use strict';

const express = require('express');
const router = express.Router();
const intelligence = require('../../services/ai/aiOperationIntelligenceService');
const brain = require('../../services/ai/aiBrainService');
const agents = require('../../services/ai/aiAgentService');
const { authMiddleware } = require('../../middleware/auth');

router.get('/agents', authMiddleware, (req, res) => {
  res.json({ success: true, data: agents.listAgents() });
});

router.post('/intelligence/assess', authMiddleware, async (req, res) => {
  try {
    const result = await intelligence.assess(req.body || {}, req.user?.id || req.user?.userId || null);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/decision/plan', authMiddleware, (req, res) => {
  try {
    const { objective, recommendations, context } = req.body || {};
    const result = brain.decide({ objective, recommendations, context });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/agents/:name/run', authMiddleware, async (req, res) => {
  try {
    const result = await agents.runAgent(req.params.name, req.body || {}, {
      createdBy: req.user?.id || req.user?.userId || null,
      approvalContext: req.body?.approvalContext || null,
    });
    res.status(result.status === 'awaiting_approval' ? 202 : 200).json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
