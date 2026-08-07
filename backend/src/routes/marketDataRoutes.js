/**
 * Agmarknet / e-NAM ingestion, price trends, DBT reconciliation.
 * Backed by services/marketDataService.js.
 *
 * Price reads are public — market price is the single most useful thing a
 * farmer can see and gating it behind a login defeats the purpose. Ingestion
 * and DBT are authenticated.
 */
const express = require('express');
const router = express.Router();
const md = require('../services/marketDataService');
const { authMiddleware } = require('../middleware/auth');
const fail = (res, e) => res.status(/required|must|Unknown/i.test(e.message) ? 400 : 500)
  .json({ success: false, error: e.message });

router.get('/prices/trend', async (req, res) => {
  try { res.json({ success: true, data: await md.priceTrend(req.query) }); } catch (e) { fail(res, e); }
});
router.post('/prices/ingest', authMiddleware, async (req, res) => {
  try {
    const { records, source } = req.body || {};
    res.json({ success: true, data: await md.ingestMandiPrices(records, source) });
  } catch (e) { fail(res, e); }
});
router.post('/dbt/reconcile', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await md.reconcileDbt(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/dbt/unclaimed', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await md.unclaimedEntitlements(req.query) }); } catch (e) { fail(res, e); }
});
router.post('/competitor/observe', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await md.recordCompetitorPrice(req.body) }); } catch (e) { fail(res, e); }
});
router.get('/competitor/position', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await md.competitivePosition(req.query) }); } catch (e) { fail(res, e); }
});

module.exports = router;
