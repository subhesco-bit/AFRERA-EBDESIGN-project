from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\routes\embeddedAiErpRoutes.js')
t=p.read_text(encoding='utf-8')
if "accountingCompletionRegistry" not in t:
    t=t.replace("const accountingIntelligence = require('../services/finance/accountingIntelligenceService');", "const accountingIntelligence = require('../services/finance/accountingIntelligenceService');\nconst accountingCompletion = require('../services/finance/accountingCompletionRegistry');",1)
anchor="// Financial / GST\n"
block=r'''// Accounting intelligence / compliance controls
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

'''
if "'/finance/intelligence/completion'" not in t:
    if anchor not in t: raise RuntimeError('financial route anchor missing')
    t=t.replace(anchor,block+anchor,1)
p.write_text(t,encoding='utf-8')
print('accounting intelligence routes added')