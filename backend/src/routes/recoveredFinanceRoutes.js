/**
 * Routes for finance and compliance logic recovered from v42/v44.
 * Backed by services/recoveredFinanceService.js and migration 053.
 *
 * Writes are authenticated throughout. A ledger entry, a warehouse receipt and
 * a risk event are all attributions — an unattributed one cannot be questioned
 * later, which defeats the purpose of recording it.
 */

'use strict';

const express = require('express');

const router = express.Router();
const fin = require('../services/recoveredFinanceService');
const { authMiddleware } = require('../middleware/auth');

function fail(res, error) {
  const bad = /required|must|Unknown|No GST rule|differ/i.test(error.message);
  res.status(bad ? 400 : 500).json({ success: false, error: error.message });
}

// ---- GST -------------------------------------------------------------------

router.get('/gst/classify', async (req, res) => {
  try {
    const { category, branded } = req.query;
    if (!category) throw new Error('category is required');
    res.json({ success: true, data: await fin.gstFor(category, branded !== 'false') });
  } catch (e) { fail(res, e); }
});

router.post('/gst/invoice', authMiddleware, async (req, res) => {
  try {
    if (!req.body?.items?.length) throw new Error('items are required');
    res.json({ success: true, data: await fin.buildInvoice(req.body) });
  } catch (e) { fail(res, e); }
});

// ---- Ledger ----------------------------------------------------------------

router.post('/ledger/entry', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    for (const k of ['debitAccount', 'creditAccount', 'amount', 'narration']) {
      if (!b[k]) throw new Error(`${k} is required`);
    }
    const entry = await fin.appendLedgerEntry({ ...b, recordedBy: req.user?.id });
    res.json({ success: true, data: entry });
  } catch (e) { fail(res, e); }
});

router.get('/ledger/trial-balance', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await fin.trialBalance() }); } catch (e) { fail(res, e); }
});

/**
 * Chain integrity. Returns 200 with ok:false when the chain is broken rather
 * than an error status — a detected break is a successful check, and a 5xx
 * would let monitoring treat tamper-evidence firing as an outage to be ignored.
 */
router.get('/ledger/verify', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await fin.verifyLedger() }); } catch (e) { fail(res, e); }
});

// ---- Schemes ---------------------------------------------------------------

router.get('/schemes/match', async (req, res) => {
  try {
    const { projectType, state } = req.query;
    if (!projectType) throw new Error('projectType is required');
    res.json({ success: true, data: await fin.matchSchemes(projectType, state) });
  } catch (e) { fail(res, e); }
});

// ---- eNWR ------------------------------------------------------------------

router.post('/enwr/issue', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await fin.issueEnwr({ ...req.body, issuedBy: req.user?.id }) });
  } catch (e) { fail(res, e); }
});

// ---- Freight ---------------------------------------------------------------

router.get('/freight/rate', async (req, res) => {
  try {
    const { km, class: cls, utilisation } = req.query;
    if (!km || !cls) throw new Error('km and class are required');
    res.json({
      success: true,
      data: await fin.freightRate({
        laneKm: Number(km),
        classKey: cls,
        utilisationPct: utilisation === undefined ? null : Number(utilisation),
      }),
    });
  } catch (e) { fail(res, e); }
});

// ---- Subsidy + risk --------------------------------------------------------

router.get('/subsidy/equipment', async (req, res) => {
  try {
    const { price, tier } = req.query;
    if (!price) throw new Error('price is required');
    res.json({ success: true, data: await fin.equipmentSubsidy(Number(price), tier || 'general') });
  } catch (e) { fail(res, e); }
});

router.post('/risk/event', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.partyId || !b.eventType) throw new Error('partyId and eventType are required');
    res.json({ success: true, data: await fin.recordRiskEvent(b) });
  } catch (e) { fail(res, e); }
});

router.get('/risk/:partyId', authMiddleware, async (req, res) => {
  try { res.json({ success: true, data: await fin.partyRisk(req.params.partyId) }); } catch (e) { fail(res, e); }
});

router.get('/certificates/expiring', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await fin.certExpiryAlerts(Number(req.query.days) || 120) });
  } catch (e) { fail(res, e); }
});

module.exports = router;
