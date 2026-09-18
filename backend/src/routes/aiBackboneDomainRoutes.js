/**
 * Real backend routes for AIBackbonePage.jsx / PlatformManagementPage.jsx,
 * backed by services/legacy/aiBackboneService.js. Exact 1:1 match; callAI
 * unwraps the page's single payload object into (prompt, options).
 */
'use strict';

const express = require('express');
const router = express.Router();
const svc = require('../services/legacy/aiBackboneService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.post('/ai-backbone/call', wrap((req) => svc.callAI(req.body.prompt, { provider: req.body.provider })));
router.post('/ai-backbone/reset-statistics', wrap(() => svc.resetAIStatistics()));
router.get('/ai-backbone/provider-status', wrap(() => svc.getAIProviderStatus()));

module.exports = router;
