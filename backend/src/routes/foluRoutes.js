/**
 * FOLU land use, carbon and NE organic scheme status.
 *
 * Routes only — the logic lives in services/organicTraceabilityService.js,
 * extended rather than duplicated into a parallel FOLU service. Same parcels,
 * same certification state, one owner.
 */
const express = require('express');
const router = express.Router();
const organic = require('../services/organicTraceabilityService');
const { authMiddleware } = require('../middleware/auth');
const fail = (res, e) => res.status(/required|must|Refusing/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.get('/land-use/summary', async (req, res) => {
  try { res.json({ success: true, data: await organic.landUseSummary(req.query) }); } catch (e) { fail(res, e); }
});
router.post('/parcels', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await organic.registerLandParcel(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/land-use/change', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await organic.recordLandUseChange(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/carbon/estimate', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await organic.estimateCarbon(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/schemes/:farmerId', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await organic.organicSchemeStatus(req.params.farmerId) }); } catch (e) { fail(res, e); }
});
module.exports = router;
