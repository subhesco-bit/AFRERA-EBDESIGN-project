/**
 * RFQ, quote outcomes, QC holds and FPO cost centres.
 * All authenticated — bidding, releasing a QC hold and recording a loss reason
 * are each attributable acts.
 */
const express = require('express');
const router = express.Router();
const s = require('../services/rfqService');
const { authMiddleware } = require('../middleware/auth');
const fail = (res, e) => res.status(/required|must|not found|not open|closed|requires/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.post('/rfq', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.createRfq(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/rfq/:id/bid', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await s.submitBid({
      ...req.body, rfqId: Number(req.params.id), bidderId: req.body.bidderId || req.user?.id }) });
  } catch (e) { fail(res, e); }
});
router.get('/rfq/:id/bids', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await s.bidsFor(Number(req.params.id),
      { asBuyer: req.query.asBuyer === 'true' }) });
  } catch (e) { fail(res, e); }
});
router.post('/quotes/outcome', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.recordQuoteOutcome(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/quotes/loss-analysis', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.lossAnalysis(req.query) }); } catch (e) { fail(res, e); }
});
router.post('/qc/hold', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.raiseQcHold(req.body) }); } catch (e) { fail(res, e); }
});
router.post('/qc/release', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await s.releaseQcHold({ ...req.body, releasedBy: req.body.releasedBy || req.user?.id }) });
  } catch (e) { fail(res, e); }
});
router.get('/qc/holds', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.activeHolds() }); } catch (e) { fail(res, e); }
});
router.get('/fpo/centre-pnl', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.centrePnl(req.query.fpoId) }); } catch (e) { fail(res, e); }
});
module.exports = router;
