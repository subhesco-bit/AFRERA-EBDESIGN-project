/** Aggregate research-grade engines under one router */
'use strict';

const express = require('express');
const router = express.Router();

function tryReq(p) {
  try {
    return require(p);
  } catch {
    return null;
  }
}

const subsidy = tryReq('../services/research-grade/subsidyEligibilityEngine');
const logistics = tryReq('../services/research-grade/logisticsDecisionEngine');
const erp = tryReq('../services/research-grade/erpDoubleEntrySpine');
const erpExt = tryReq('../services/research-grade/erpControlsExtended');
const mep = tryReq('../services/research-grade/mepEngineeringEngine');
const ai = tryReq('../services/research-grade/aiBackboneEvidenceGateway');

router.get('/health', (req, res) => {
  res.json({
    success: true,
    engines: {
      subsidy: !!subsidy,
      logistics: !!logistics,
      erp: !!erp,
      erp_ext: !!erpExt,
      mep: !!mep,
      ai: !!ai,
    },
  });
});

router.post('/subsidy', (req, res) => {
  if (!subsidy) return res.status(503).json({ success: false, error: 'subsidy unavailable' });
  res.json({ success: true, ...subsidy.extractAll(req.body?.farmer || req.body, req.body?.as_of) });
});

router.post('/logistics', (req, res) => {
  if (!logistics) return res.status(503).json({ success: false, error: 'logistics unavailable' });
  res.json({ success: true, ...logistics.decide(req.body || {}) });
});

router.post('/erp/journal', (req, res) => {
  if (!erp) return res.status(503).json({ success: false, error: 'erp unavailable' });
  try {
    res.json({ success: true, ...erp.postJournal(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.get('/erp/trial-balance', (req, res) => {
  if (!erp) return res.status(503).json({ success: false });
  res.json({ success: true, ...erp.trialBalance() });
});

router.post('/erp/three-way-match', (req, res) => {
  if (!erpExt) return res.status(503).json({ success: false });
  res.json({ success: true, ...erpExt.threeWayMatch(req.body || {}) });
});

router.post('/mep', async (req, res) => {
  if (!mep) return res.status(503).json({ success: false });
  res.json({ success: true, ...(await mep.operate(req.body || {})) });
});

router.post('/ai/evidence', (req, res) => {
  if (!ai) return res.status(503).json({ success: false });
  res.json({ success: true, evidence: ai.evidenceBase(req.body || {}) });
});

module.exports = router;
