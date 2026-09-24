const express = require('express');
const embedded = require('../modules/platform/EmbeddedAI');
const erp = require('../modules/platform/ERPCore');
const fin = require('../modules/platform/FinancialERP');
const oneRT = require('../modules/platform/OneRuntimeInterpretation');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    embedded_models: embedded.MODEL_REGISTRY.length,
    erp_modules: Object.keys(erp.ENTITY_TYPES),
    financial: true,
    gst: true,
    one_runtime_interpretation: true,
  });
});

// —— Embedded AI ——
router.get('/ai/models', (req, res) => {
  res.json({ success: true, data: embedded.listModels(req.query.module) });
});
router.get('/ai/rag', (req, res) => {
  res.json({ success: true, data: embedded.listRag(req.query.module) });
});
router.post('/ai/route', (req, res) => {
  res.json({ success: true, data: embedded.routeInference(req.body || {}) });
});
router.post('/ai/embedded/analyze', (req, res) => {
  res.json({ success: true, data: embedded.runEmbeddedAnalyze(req.body || {}) });
});

// —— Operational ERP ——
router.get('/erp/dashboard/:module', (req, res) => {
  res.json({ success: true, data: erp.erpDashboard(req.params.module) });
});
router.post('/erp/workflow', (req, res) => {
  try {
    res.json({ success: true, data: erp.runErpWorkflow(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});
router.get('/erp/inventory', (req, res) => {
  res.json({ success: true, data: erp.listInventory(req.query.module) });
});
router.get('/erp/documents', (req, res) => {
  res.json({ success: true, data: erp.listDocuments(req.query.module, req.query.type) });
});

// —— Financial / Accounts / GST ——
router.get('/finance/coa', (_req, res) => {
  res.json({ success: true, data: fin.COA, disclaimer: fin.FIN_DISCLAIMER });
});
router.get('/finance/dashboard/:module', (req, res) => {
  res.json({ success: true, data: fin.financialDashboard(req.params.module) });
});
router.get('/finance/trial-balance', (req, res) => {
  res.json({ success: true, data: fin.trialBalance(req.query.module) });
});
router.get('/finance/pnl', (req, res) => {
  res.json({ success: true, data: fin.profitAndLoss(req.query.module) });
});
router.get('/finance/gst', (req, res) => {
  res.json({ success: true, data: fin.gstSummary(req.query.module) });
});
router.get('/finance/gst/rates', (_req, res) => {
  res.json({ success: true, data: { rates: fin.GST_RATE_CARDS, hsn_hints: fin.HSN_HINTS, disclaimer: fin.FIN_DISCLAIMER } });
});
router.post('/finance/gst/compute', (req, res) => {
  try {
    res.json({ success: true, data: fin.computeGst(req.body || {}), disclaimer: fin.FIN_DISCLAIMER });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});
router.post('/finance/invoice', (req, res) => {
  try {
    res.json({ success: true, data: fin.createInvoice(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});
router.post('/finance/journal', (req, res) => {
  try {
    res.json({ success: true, data: fin.postJournal(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// —— One-runtime interpretation ——
router.post('/interpret/once', (req, res) => {
  try {
    res.json({ success: true, data: oneRT.interpretOnce(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
