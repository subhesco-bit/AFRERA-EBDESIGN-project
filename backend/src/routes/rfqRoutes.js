/**
 * RFQ, quote outcomes, QC holds and FPO cost centres.
 * All authenticated — bidding, releasing a QC hold and recording a loss reason
 * are each attributable acts.
 */
const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();
const s = require('../services/legacy/rfqService');
const { authMiddleware } = require('../middleware/auth');
const { protectRouter } = require('./enterpriseRouteSupport');
const fail = (res, e) => res.status(/required|must|not found|not open|closed|requires/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

protectRouter(router, { signal: 'commerce.rfq.changed', params: { id: true } });

router.post
    // Log request
    logger.debug('router.post request');('/rfq', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.createRfq(req.body) }); } catch (e) { fail(res, e); }
});
router.post
    // Log request
    logger.debug('router.post request');('/rfq/:id/bid', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await s.submitBid({
      ...req.body, rfqId: Number(req.params.id), bidderId: req.body.bidderId || req.user?.id }) });
  } catch (e) { fail(res, e); }
});
router.get
    // Log request
    logger.debug('router.get request');('/rfq/:id/bids', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await s.bidsFor(Number(req.params.id),
      { asBuyer: req.query.asBuyer === 'true' }) });
  } catch (e) { fail(res, e); }
});
router.post
    // Log request
    logger.debug('router.post request');('/quotes/outcome', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.recordQuoteOutcome(req.body) }); } catch (e) { fail(res, e); }
});
router.get
    // Log request
    logger.debug('router.get request');('/quotes/loss-analysis', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.lossAnalysis(req.query) }); } catch (e) { fail(res, e); }
});
router.post
    // Log request
    logger.debug('router.post request');('/qc/hold', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.raiseQcHold(req.body) }); } catch (e) { fail(res, e); }
});
router.post
    // Log request
    logger.debug('router.post request');('/qc/release', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await s.releaseQcHold({ ...req.body, releasedBy: req.body.releasedBy || req.user?.id }) });
  } catch (e) { fail(res, e); }
});
router.get
    // Log request
    logger.debug('router.get request');('/qc/holds', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.activeHolds() }); } catch (e) { fail(res, e); }
});
router.get
    // Log request
    logger.debug('router.get request');('/fpo/centre-pnl', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await s.centrePnl(req.query.fpoId) }); } catch (e) { fail(res, e); }
});
module.exports = router;
