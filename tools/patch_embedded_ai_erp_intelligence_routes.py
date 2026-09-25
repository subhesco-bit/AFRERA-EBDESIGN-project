from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\routes\embeddedAiErpRoutes.js')
t=p.read_text(encoding='utf-8')
imports="""const erpCells = require('../core/erpIntelligenceCellRegistry');
const erpOptimizer = require('../core/erpOptimizationEngine');
const erpCostOptimizer = require('../core/erpCostOptimizationService');
const erpTemplates = require('../core/erpTemplateEvolutionService');
const erpCompletion = require('../core/erpCompletionRegistry');
const { authMiddleware } = require('../middleware/auth');
"""
anchor="const gsp = require('../modules/platform/erp/GspEInvoiceAdapter');\n"
if 'erpCompletionRegistry' not in t:
    if anchor not in t: raise RuntimeError('route import anchor missing')
    t=t.replace(anchor,anchor+imports,1)

insert=r'''
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

'''
anchor2="// Operational ERP\n"
if "'/erp/intelligence/completion'" not in t:
    if anchor2 not in t: raise RuntimeError('operational ERP anchor missing')
    t=t.replace(anchor2,insert+anchor2,1)
p.write_text(t,encoding='utf-8')
print('ERP intelligence routes added to existing ai-erp surface')