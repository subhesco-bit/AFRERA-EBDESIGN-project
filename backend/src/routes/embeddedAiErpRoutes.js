const express = require('express');
const embedded = require('../modules/platform/EmbeddedAI');
const erp = require('../modules/platform/ERPCore');
const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    embedded_models: embedded.MODEL_REGISTRY.length,
    rag_packs: embedded.RAG_PACKS.length,
    erp_modules: Object.keys(erp.ENTITY_TYPES),
  });
});

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

module.exports = router;
