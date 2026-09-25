'use strict';

const fs=require('fs');
const path=require('path');

const CAPABILITIES=Object.freeze({
  double_entry_gl:['backend/src/services/finance/enterpriseAccountingService.js','backend/src/database/migrations/996_enterprise_foundation.sql'],
  chart_of_accounts:['backend/src/services/finance/enterpriseAccountingService.js','backend/src/database/migrations/996_enterprise_foundation.sql'],
  journal_audit_reversal:['backend/src/services/finance/enterpriseAccountingService.js','backend/src/database/migrations/10001_enterprise_accounting_controls.sql'],
  ap:['backend/src/services/indiaErpAccountingService.js','backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  ar:['backend/src/services/indiaErpAccountingService.js','backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  payments_settlement:['backend/src/services/indiaErpAccountingService.js','backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  trial_balance_financial_statements:['backend/src/services/finance/enterpriseAccountingService.js'],
  fiscal_period_close:['backend/src/services/finance/enterpriseAccountingService.js','backend/src/services/indiaErpAccountingService.js'],
  bank_reconciliation:['backend/src/services/indiaErpAccountingService.js','backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  budgets:['backend/src/services/indiaErpAccountingService.js','backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  cost_profit_centers:['backend/src/database/migrations/996_enterprise_foundation.sql','backend/src/database/migrations/4000_comprehensive_erp_schema.sql'],
  fixed_assets_depreciation:['backend/src/services/assetAccountingService.js','backend/src/database/migrations/996_enterprise_foundation.sql'],
  multi_company_consolidation:['backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  intercompany:['backend/src/database/migrations/9997_india_erp_financial_controls.sql'],
  gst_ledger_itc:['backend/src/database/migrations/047_gst_tables.sql','backend/src/services/finance/accountingIntelligenceService.js'],
  gst_effective_dated_rules:['backend/src/database/migrations/10010_accounting_intelligence_compliance.sql','backend/src/services/finance/accountingIntelligenceService.js'],
  tds_tcs:['backend/src/database/migrations/056_named_missing_modules.sql','backend/src/services/finance/accountingIntelligenceService.js'],
  gstr_compliance:['backend/src/database/migrations/056_named_missing_modules.sql','backend/src/database/migrations/047_gst_tables.sql'],
  einvoice_eway:['backend/src/modules/platform/erp/GspEInvoiceAdapter.js','backend/src/database/migrations/056_named_missing_modules.sql'],
  three_way_match:['backend/src/database/migrations/995_erp_process_layer.sql','backend/src/services/flows/procurementFlow.js'],
  reconciliation_intelligence:['backend/src/services/finance/accountingIntelligenceService.js','backend/src/database/migrations/10010_accounting_intelligence_compliance.sql'],
  close_readiness:['backend/src/services/finance/accountingIntelligenceService.js','backend/src/database/migrations/10010_accounting_intelligence_compliance.sql'],
  cash_flow_treasury:['backend/src/services/finance/accountingIntelligenceService.js','backend/src/core/erpOptimizationEngine.js'],
  working_capital_optimization:['backend/src/services/finance/accountingIntelligenceService.js','backend/src/core/erpOptimizationEngine.js'],
  document_ocr_ingestion:['backend/src/services/ocrService.js'],
  ai_accounting_proposals:['backend/src/services/finance/accountingIntelligenceService.js','backend/src/database/migrations/10010_accounting_intelligence_compliance.sql'],
  gst_reconciliation_agent:['backend/src/core/ai/enterpriseAgentTemplateExtensions.js'],
  accounting_close_agent:['backend/src/core/ai/enterpriseAgentTemplateExtensions.js'],
  treasury_agent:['backend/src/core/ai/enterpriseAgentTemplateExtensions.js'],
  accounting_cost_optimization:['backend/src/core/erpCostOptimizationService.js'],
});

function exists(root,relative){return fs.existsSync(path.resolve(root,relative));}

function build(options={}){
  const root=options.projectRoot||path.resolve(__dirname,'../../../..');
  const capabilityRows=Object.entries(CAPABILITIES).map(([id,sources])=>({
    id,
    sources:sources.map(source=>({source,exists:exists(root,source)})),
    codeEvidence:sources.every(source=>exists(root,source)),
  }));
  const gaps=capabilityRows.filter(x=>!x.codeEvidence).map(x=>x.id);
  const configBlockers=[];
  if(!process.env.GSP_API_BASE)configBlockers.push('live_gsp_einvoice_eway_not_configured');
  if(!process.env.ACCOUNTING_TAX_RULE_DATASET_VERIFIED_AT)configBlockers.push('verified_current_tax_rule_dataset_not_attested_in_environment');

  const releaseGates=[
    {id:'implementation',pass:gaps.length===0,evidence:gaps.length===0?'declared_capability_sources_present':'missing_capability_sources'},
    {id:'integration',pass:Boolean(process.env.ACCOUNTING_INTEGRATION_VERIFIED_AT),evidence:process.env.ACCOUNTING_INTEGRATION_VERIFIED_AT||null},
    {id:'regression',pass:Boolean(process.env.ACCOUNTING_REGRESSION_VERIFIED_AT),evidence:process.env.ACCOUNTING_REGRESSION_VERIFIED_AT||null},
    {id:'statutory_rules',pass:Boolean(process.env.ACCOUNTING_TAX_RULE_DATASET_VERIFIED_AT),evidence:process.env.ACCOUNTING_TAX_RULE_DATASET_VERIFIED_AT||null},
    {id:'security_audit',pass:Boolean(process.env.ACCOUNTING_SECURITY_AUDIT_VERIFIED_AT),evidence:process.env.ACCOUNTING_SECURITY_AUDIT_VERIFIED_AT||null},
    {id:'performance_resilience',pass:Boolean(process.env.ACCOUNTING_PERFORMANCE_VERIFIED_AT),evidence:process.env.ACCOUNTING_PERFORMANCE_VERIFIED_AT||null},
    {id:'ui_api_coverage',pass:Boolean(process.env.ACCOUNTING_UI_API_COVERAGE_VERIFIED_AT),evidence:process.env.ACCOUNTING_UI_API_COVERAGE_VERIFIED_AT||null},
    {id:'runtime_external_rails',pass:configBlockers.length===0,evidence:configBlockers.length===0?'configured':'configuration_blockers'},
    {id:'evidence_gate',pass:Boolean(process.env.ACCOUNTING_EVIDENCE_GATE_VERIFIED_AT),evidence:process.env.ACCOUNTING_EVIDENCE_GATE_VERIFIED_AT||null},
  ];
  const complete=releaseGates.every(g=>g.pass);
  return {
    architecture:'ai-embedded-india-enterprise-accounting-cell',
    codeEvidencePresent:gaps.length===0,
    codeComplete:complete,
    complete,
    releaseStatus:complete?'COMPLETE':'GATED',
    runtimeFullyOperational:configBlockers.length===0,
    codeBlockers:gaps,
    configurationBlockers:configBlockers,
    releaseGates,
    capabilityGroups:capabilityRows.length,
    capabilities:capabilityRows,
    authority:{
      ledger:'enterpriseAccountingService + database constraints',
      statutoryCalculation:'deterministic verified effective-dated rules',
      ai:'proposal_only',
      gstFiling:'external_authorized_GSP_GSTN_workflow_only',
      payments:'authorized_payment_workflow_only',
      periodClose:'deterministic_close_controls_plus_authorized_approver',
    },
    truthRules:[
      'No GST/TDS/TCS rate or threshold is treated as current merely because it exists in legacy code.',
      'Statutory calculation requires a verified effective-dated source-provenanced rule.',
      'Dry-run e-invoice/e-way output never invents an IRN or e-way bill number.',
      'AI accounting output cannot directly post journals, file returns, release payments or close periods.',
      'Missing reconciliation/cost inputs are exceptions, never assumed zero or matched.',
    ],
    generatedAt:new Date().toISOString(),
  };
}

module.exports={CAPABILITIES,build};
