/**
 * Tax and statutory compliance routes. Authenticated throughout — every
 * endpoint here creates or reads a statutory record attributable to a person.
 */
const express = require('express');
const router = express.Router();
const c = require('../services/complianceService');
const { authMiddleware } = require('../middleware/auth');
const fail = (res, e) => res.status(/required|must|Unknown|Unsupported|No IRN/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.post('/tds/deduct', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.deductTds(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/tds/summary', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.tdsSummary(req.query) }); } catch (e) { fail(res, e); }
});
router.get('/tds/rates', authMiddleware, async (req, res) => {
  res.json({ success: true, data: c.TDS_RATES });
});
router.post('/irn/register', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.registerIrn(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/irn/result', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.recordIrnResult(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/gstr/draft', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.buildGstrDraft(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/rcm', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.recordRcm(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/rcm/outstanding', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await c.rcmOutstanding(req.query.period) }); } catch (e) { fail(res, e); }
});
module.exports = router;
