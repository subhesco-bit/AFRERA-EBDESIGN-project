const express = require('express');
const embedded = require('../modules/platform/EmbeddedAI');
const erp = require('../modules/platform/ERPCore');
const fin = require('../modules/platform/FinancialERP');
const oneRT = require('../modules/platform/OneRuntimeInterpretation');
const sync = require('../modules/platform/erp/ErpSyncEngine');
const zoho = require('../modules/platform/erp/ZohoBooksAdapter');
const tally = require('../modules/platform/erp/TallyXmlAdapter');
const gsp = require('../modules/platform/erp/GspEInvoiceAdapter');
const erpCells = require('../core/erpIntelligenceCellRegistry');
const erpOptimizer = require('../core/erpOptimizationEngine');
const erpCostOptimizer = require('../core/erpCostOptimizationService');
const erpTemplates = require('../core/erpTemplateEvolutionService');
const erpCompletion = require('../core/erpCompletionRegistry');
const { authMiddleware } = require('../middleware/auth');
const accountingIntelligence = require('../services/finance/accountingIntelligenceService');
const accountingCompletion = require('../services/finance/accountingCompletionRegistry');

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({
    ok: true,
    embedded_models: embedded.MODEL_REGISTRY.length,
    erp_modules: Object.keys(erp.ENTITY_TYPES),
    financial: true,
    gst: true,
    one_runtime_interpretation: true,
    adapters: Object.keys(sync.ADAPTERS),
  });
});

// Embedded AI
router.get('/ai/models', (req, res) => res.json({ success: true, data: embedded.listModels(req.query.module) }));
router.get('/ai/rag', (req, res) => res.json({ success: true, data: embedded.listRag(req.query.module) }));
router.post('/ai/route', (req, res) => res.json({ success: true, data: embedded.routeInference(req.body || {}) }));
router.post('/ai/embedded/analyze', (req, res) => res.json({ success: true, data: embedded.runEmbeddedAnalyze(req.body || {}) }));


// ERP intelligence-cell completion / optimization layer
router.get('/erp/intelligence/completion', (_req, res) => {
  res.json({ success:true, data:erpCompletion.build() });
});

router.get('/erp/intelligence/cells', (_req, res) => {
  res.json({ success:true, data:erpCells.listCells() });
});

router.get('/erp/intelligence/cells/:domainId', (req, res) => {
  const cell=erpCells.buildCell(req.params.domainId);
  if(!cell)return res.status(404).json({success:false,error:'Unknown ERP domain'});
  return res.json({success:true,data:cell});
});

router.post('/erp/intelligence/:domainId/optimize', authMiddleware, (req, res) => {
  try {
    const result=erpOptimizer.optimize(req.params.domainId,req.body||{});
    res.json({success:true,status:'proposal_only',data:result,authority:'ERP_WORKFLOW_APPROVAL_REQUIRED_FOR_MUTATION'});
  } catch(e) {
    res.status(400).json({success:false,error:e.message});
  }
});

router.post('/erp/intelligence/:domainId/cost-optimize', authMiddleware, (req, res) => {
  try {
    const cell=erpCells.buildCell(req.params.domainId);
    if(!cell)return res.status(404).json({success:false,error:'Unknown ERP domain'});
    const result=erpCostOptimizer.optimize(req.params.domainId,{
      drivers:cell.layers.costOptimization.businessCostDrivers,
      ...(req.body||{}),
    });
    res.json({success:true,status:'proposal_only',data:result,authority:'ERP_WORKFLOW_APPROVAL_REQUIRED_FOR_MUTATION'});
  } catch(e) {
    res.status(400).json({success:false,error:e.message});
  }
});

router.post('/erp/intelligence/templates/plan', authMiddleware, (req, res) => {
  try {
    const normalized=erpTemplates.normalizeTemplate(req.body||{});
    const plan=erpTemplates.developEnhancementPlan(normalized);
    res.json({success:true,status:'not_production_authority',normalized,plan});
  } catch(e) {
    res.status(400).json({success:false,error:e.message});
  }
});

// Operational ERP
router.get('/erp/dashboard/:module', (req, res) => res.json({ success: true, data: erp.erpDashboard(req.params.module) }));
router.post('/erp/workflow', (req, res) => {
  try {
    res.json({ success: true, data: erp.runErpWorkflow(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});
router.get('/erp/inventory', (req, res) => res.json({ success: true, data: erp.listInventory(req.query.module) }));
router.get('/erp/documents', (req, res) => res.json({ success: true, data: erp.listDocuments(req.query.module, req.query.type) }));

// Accounting intelligence / compliance controls
router.get('/finance/intelligence/completion', authMiddleware, (_req, res) => {
  res.json({success:true,data:accountingCompletion.build()});
});

router.post('/finance/intelligence/withholding/compute', authMiddleware, (req, res) => {
  try {
    res.json({success:true,data:accountingIntelligence.computeWithholding(req.body||{})});
  } catch(e) { res.status(400).json({success:false,error:e.message,code:e.code||'WITHHOLDING_COMPUTE_ERROR'}); }
});

router.post('/finance/intelligence/reconcile', authMiddleware, (req, res) => {
  try {
    const body=req.body||{};
    res.json({success:true,data:accountingIntelligence.reconcile(body.sourceRows||[],body.targetRows||[],body.options||{}),authority:'DETERMINISTIC_RECONCILIATION'});
  } catch(e) { res.status(400).json({success:false,error:e.message}); }
});

router.post('/finance/intelligence/close-readiness', authMiddleware, (req, res) => {
  try { res.json({success:true,data:accountingIntelligence.closeReadiness(req.body||{})}); }
  catch(e) { res.status(400).json({success:false,error:e.message}); }
});

router.post('/finance/intelligence/cash-flow', authMiddleware, (req, res) => {
  try { res.json({success:true,data:accountingIntelligence.cashFlowSummary(req.body?.transactions||[])}); }
  catch(e) { res.status(400).json({success:false,error:e.message}); }
});

router.post('/finance/intelligence/working-capital', authMiddleware, (req, res) => {
  try { res.json({success:true,data:accountingIntelligence.workingCapitalMetrics(req.body||{})}); }
  catch(e) { res.status(400).json({success:false,error:e.message}); }
});

router.post('/finance/intelligence/ai-plan', authMiddleware, (req, res) => {
  try {
    const body=req.body||{};
    res.json({success:true,status:'proposal_only',data:accountingIntelligence.accountingAIPlan(body.task||{},body.options||{})});
  } catch(e) { res.status(400).json({success:false,error:e.message,code:e.code||'ACCOUNTING_AI_PLAN_ERROR'}); }
});

// Financial / GST
router.get('/finance/coa', (_req, res) => res.json({ success: true, data: fin.COA, disclaimer: fin.FIN_DISCLAIMER }));
router.get('/finance/dashboard/:module', (req, res) => res.json({ success: true, data: fin.financialDashboard(req.params.module) }));
router.get('/finance/trial-balance', (req, res) => res.json({ success: true, data: fin.trialBalance(req.query.module) }));
router.get('/finance/pnl', (req, res) => res.json({ success: true, data: fin.profitAndLoss(req.query.module) }));
router.get('/finance/gst', (req, res) => res.json({ success: true, data: fin.gstSummary(req.query.module) }));
router.get('/finance/gst/rates', (_req, res) =>
  res.json({ success: true, data: { rates: fin.GST_RATE_CARDS, hsn_hints: fin.HSN_HINTS, authoritative:false, status:'illustrative_legacy_reference_only', disclaimer: fin.FIN_DISCLAIMER } }),
);
router.post('/finance/gst/compute', (req, res) => {
  try {
    const body=req.body||{};
    if(!body.rule) return res.status(409).json({success:false,error:'A verified effective-dated GST rule is required',code:'GST_RULE_REQUIRED'});
    const data=accountingIntelligence.computeGST({
      taxableAmount:body.taxableAmount ?? body.taxable_value,
      supplyType:String(body.supplyType ?? body.supply_type ?? '').toLowerCase().startsWith('inter')?'inter_state':'intra_state',
      rule:body.rule,
    });
    res.json({success:true,data,authority:'DETERMINISTIC_FROM_VERIFIED_RULE'});
  } catch(e) {
    res.status(400).json({success:false,error:e.message,code:e.code||'GST_COMPUTE_ERROR'});
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

// Integration adapters
router.get('/integrate/adapters', (_req, res) => res.json({ success: true, data: sync.adapterCatalogue() }));

router.post('/integrate/sync', async (req, res) => {
  try {
    const result = await sync.syncCommercial(req.body || {});
    res.json({ success: result.ok, data: result });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

router.post('/integrate/zoho/invoice/preview', (req, res) => {
  res.json({ success: true, data: zoho.mapInvoice(req.body?.invoice || req.body || {}, req.body?.ctx || {}) });
});

router.post('/integrate/tally/voucher/xml', (req, res) => {
  res.type('application/xml');
  res.send(tally.salesVoucherXml(req.body?.invoice || req.body || {}));
});

router.post('/integrate/gsp/irn/preview', (req, res) => {
  res.json({ success: true, data: gsp.buildIrnRequest(req.body?.invoice || req.body || {}, req.body || {}) });
});

router.post('/interpret/once', (req, res) => {
  try {
    res.json({ success: true, data: oneRT.interpretOnce(req.body || {}) });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

module.exports = router;
