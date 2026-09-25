from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\modules\platform\ModuleAIERPBridge.js')
t=p.read_text(encoding='utf-8')
if "erpIntelligenceCellRegistry" not in t:
    t=t.replace("const sync = require('./erp/ErpSyncEngine');", "const sync = require('./erp/ErpSyncEngine');\nconst erpCells = require('../../core/erpIntelligenceCellRegistry');\nconst erpOptimizer = require('../../core/erpOptimizationEngine');\nconst erpCostOptimizer = require('../../core/erpCostOptimizationService');",1)
insert="""
const MODULE_TO_ERP_DOMAIN = Object.freeze({
  agro:'production', agriculture:'production', processing:'production', manufacturing:'production',
  veterinary:'erm', livestock:'erm', farmer:'erm', fpo:'erm', village:'erm',
  nutrition:'quality', laboratory:'quality', quality:'quality',
  finance:'finance', accounting:'finance', banking:'finance', payments:'finance',
  procurement:'supply_chain', inventory:'supply_chain', warehouse:'supply_chain', scm:'supply_chain',
  logistics:'logistics', cold_chain:'logistics', transport:'logistics',
  insurance:'insurance', claims:'insurance',
  retail:'retail', ecommerce:'ecommerce', marketplace:'ecommerce',
  sales:'sales', marketing:'marketing', crm:'crm', service:'crm',
  workforce:'workforce', hr:'workforce', hcm:'workforce',
  asset:'asset', maintenance:'asset', project:'projects', epc:'projects',
  governance:'governance', compliance:'governance', ai:'data_ai', analytics:'data_ai',
});

function resolveERPDomain(moduleName,input={}){
  const explicit=input.erp_domain||input.erpDomain;
  if(explicit && erpCells.buildCell(explicit)) return explicit;
  return MODULE_TO_ERP_DOMAIN[String(moduleName||'').toLowerCase()] || null;
}
"""
anchor="function attachAIERP(moduleName, enhancedResult = {}, input = {}) {"
if insert.strip() not in t:
    t=t.replace(anchor,insert+'\n'+anchor,1)
old="""  const erpSnap = erp.erpDashboard(moduleName);
  const finSnap = fin.financialDashboard(moduleName);"""
new="""  const erpSnap = erp.erpDashboard(moduleName);
  const finSnap = fin.financialDashboard(moduleName);
  const erpDomainId = resolveERPDomain(moduleName, input);
  const intelligenceCell = erpDomainId ? erpCells.buildCell(erpDomainId) : null;
  let optimization = null;
  if (erpDomainId && input.erp_optimization && Array.isArray(input.erp_optimization.candidates)) {
    optimization = erpOptimizer.optimize(erpDomainId, input.erp_optimization);
  }
  let costOptimization = null;
  if (erpDomainId && input.erp_cost_optimization) {
    costOptimization = erpCostOptimizer.optimize(erpDomainId, {
      drivers: intelligenceCell?.layers?.costOptimization?.businessCostDrivers || [],
      ...input.erp_cost_optimization,
    });
  }"""
if old not in t: raise RuntimeError('bridge snapshots anchor missing')
t=t.replace(old,new,1)
old2="""      commercial_integration: commercial,
      disclaimer: erp.ERP_DISCLAIMER,"""
new2="""      commercial_integration: commercial,
      intelligence_cell: intelligenceCell,
      optimization,
      cost_optimization: costOptimization,
      optimization_authority: 'PROPOSAL_ONLY_UNTIL_ERP_WORKFLOW_APPROVAL',
      disclaimer: erp.ERP_DISCLAIMER,"""
if old2 not in t: raise RuntimeError('bridge erp return anchor missing')
t=t.replace(old2,new2,1)
old3="""      erp_sync_engine: true,
    },"""
new3="""      erp_sync_engine: true,
      erp_intelligence_cell: Boolean(intelligenceCell),
      business_optimization: Boolean(intelligenceCell),
      cost_optimization: Boolean(intelligenceCell),
      isolated_agent_step_up: Boolean(intelligenceCell),
    },"""
if old3 not in t: raise RuntimeError('bridge capabilities anchor missing')
t=t.replace(old3,new3,1)
t=t.replace("module.exports = { attachAIERP };","module.exports = { attachAIERP, resolveERPDomain, MODULE_TO_ERP_DOMAIN };")
p.write_text(t,encoding='utf-8')
print('ERP intelligence cells embedded into ModuleAIERPBridge')