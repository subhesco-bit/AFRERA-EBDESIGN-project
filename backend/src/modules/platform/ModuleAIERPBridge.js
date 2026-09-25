const embedded = require('./EmbeddedAI');
const erp = require('./ERPCore');
const fin = require('./FinancialERP');
const oneRT = require('./OneRuntimeInterpretation');
const sync = require('./erp/ErpSyncEngine');
const erpCells = require('../../core/erpIntelligenceCellRegistry');
const erpOptimizer = require('../../core/erpOptimizationEngine');
const erpCostOptimizer = require('../../core/erpCostOptimizationService');


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

function attachAIERP(moduleName, enhancedResult = {}, input = {}) {
  const ai = {
    models: embedded.listModels(moduleName),
    rag_packs: embedded.listRag(moduleName),
    route: embedded.routeInference({
      module: moduleName,
      task: input.ai_task,
      prefer_offline: input.prefer_offline !== false,
      text: input.text || input.description,
      image_url: input.image_url,
    }),
  };

  if (input.run_embedded || input.image_url || input.text) {
    ai.embedded_analyze = embedded.runEmbeddedAnalyze({
      module: moduleName,
      text: input.text || input.description,
      task: input.ai_task,
    });
  }

  const erpSnap = erp.erpDashboard(moduleName);
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
  }

  const erp_hints = [];
  if (moduleName === 'veterinary' && enhancedResult.decision_quality?.action?.includes('REPORT')) {
    erp_hints.push({ action: 'treatment_order', reason: 'notifiable_or_treatment' });
  }
  if (moduleName === 'agro' && input.crop) {
    erp_hints.push({ action: 'check_inventory', crop: input.crop });
  }
  if (moduleName === 'nutrition' && enhancedResult.conference) {
    erp_hints.push({ action: 'meal_indent', reason: 'plan_generated' });
  }

  const interpretation = oneRT.interpretOnce({
    module: moduleName,
    enhanced: enhancedResult,
    invoice_lines: input.invoice_lines,
    taxable_value: input.taxable_value,
    gst_card: input.gst_card,
    supply_type: input.supply_type,
    lang: input.lang,
  });

  // Optional commercial sync preview (never live unless input.sync_live)
  let commercial = null;
  if (input.sync_commercial || input.invoice_lines || input.invoice) {
    // syncCommercial is async — return plan synchronously for bridge; caller can hit /integrate/sync
    commercial = {
      plan: 'Call POST /api/v1/ai-erp/integrate/sync with same invoice_lines',
      adapters: input.targets || ['zoho_books'],
      default_mode: input.sync_live ? 'live' : 'dry_run',
      catalogue: sync.adapterCatalogue(),
    };
  }

  return {
    ...enhancedResult,
    embedded_ai: ai,
    erp: {
      operational: erpSnap,
      financial: finSnap,
      hints: erp_hints,
      entity_types: erp.ENTITY_TYPES[moduleName],
      commercial_integration: commercial,
      intelligence_cell: intelligenceCell,
      optimization,
      cost_optimization: costOptimization,
      optimization_authority: 'PROPOSAL_ONLY_UNTIL_ERP_WORKFLOW_APPROVAL',
      disclaimer: erp.ERP_DISCLAIMER,
      financial_disclaimer: fin.FIN_DISCLAIMER,
    },
    interpretation,
    capabilities: {
      embedded_ai: true,
      erp_operational: true,
      erp_financial: true,
      gst_taxation: true,
      one_runtime_interpretation: true,
      zoho_books_adapter: true,
      tally_xml_adapter: true,
      gsp_einvoice_adapter: true,
      erp_sync_engine: true,
      erp_intelligence_cell: Boolean(intelligenceCell),
      business_optimization: Boolean(intelligenceCell),
      cost_optimization: Boolean(intelligenceCell),
      isolated_agent_step_up: Boolean(intelligenceCell),
    },
  };
}

module.exports = { attachAIERP, resolveERPDomain, MODULE_TO_ERP_DOMAIN };
