/**
 * Cost routes.
 *
 * /breakup is authenticated: per-consignment cost reveals the platform's
 * margin on a specific lane, which is commercially sensitive.
 * /corridor-model is public — it is the published business-plan model and the
 * transparency about where the money goes is the point.
 */
const express = require('express');
const router = express.Router();
const costService = require('../services/legacy/costService');
const { authMiddleware } = require('../middleware/auth');

const fail = (res, e) => res.status(/required|No landed-cost/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.get('/breakup', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await costService.getCostBreakup(req.query) }); }
  catch (e) { fail(res, e); }
});

router.get('/corridor-model', async (req, res) => {
  try { res.json({ success: true, data: await costService.getCorridorModel(req.query.corridor) }); }
  catch (e) { fail(res, e); }
});

module.exports = router;
