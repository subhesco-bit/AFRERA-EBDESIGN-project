/**
 * Bridge: attach Embedded AI + ERP snapshot to any of the three module enhanced results
 */

const embedded = require('./EmbeddedAI');
const erp = require('./ERPCore');

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

  // Auto ERP hints from decision
  const erp_hints = [];
  if (moduleName === 'veterinary' && enhancedResult.decision_quality?.action?.includes('REPORT')) {
    erp_hints.push({ action: 'create_document', type: 'treatment_order', reason: 'notifiable_or_treatment' });
  }
  if (moduleName === 'agro' && input.crop) {
    erp_hints.push({ action: 'check_inventory', sku_hint: 'seed_or_input', crop: input.crop });
  }
  if (moduleName === 'nutrition' && enhancedResult.conference) {
    erp_hints.push({ action: 'meal_indent', reason: 'plan_generated' });
  }

  return {
    ...enhancedResult,
    embedded_ai: ai,
    erp: {
      dashboard: erpSnap,
      hints: erp_hints,
      entity_types: erp.ENTITY_TYPES[moduleName],
      disclaimer: erp.ERP_DISCLAIMER,
    },
    capabilities: {
      embedded_ai: true,
      erp: true,
      offline_model_registry: true,
      inventory_documents_ledger: true,
    },
  };
}

module.exports = { attachAIERP };
