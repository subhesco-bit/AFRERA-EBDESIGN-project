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
// 2026-09-17: both requires below pointed at nonexistent paths
// (services/finance/costService doesn't exist - the real module is
// services/costService.js, itself a thin re-export of
// services/legacy/costService.js per the 2026-09-08 duplicate-file
// remediation pass; and '../middleware/auth' from routes/finance/ resolves
// to the nonexistent routes/middleware/auth) - this file threw
// "Cannot find module" on require() and was never mountable. Fixed to the
// real paths; no route logic changed.
const costService = require('../../services/costService');
const { authMiddleware } = require('../../middleware/auth');


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
