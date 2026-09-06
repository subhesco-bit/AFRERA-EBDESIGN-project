'use strict';

const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const decisionService = require('../services/supplyChainDecisionService');

router.use(authMiddleware);

router.post('/select-farmers', (req, res) => {
  res.json({ success: true, data: decisionService.selectFarmers(req.body.candidates, req.body.requirements) });
});

router.post('/plan-delivery', (req, res) => {
  try {
    res.json({ success: true, data: decisionService.planDelivery(req.body) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/explain', async (req, res) => {
  try {
    const result = await decisionService.explainDecision(req.body.decision, req.body.context);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
