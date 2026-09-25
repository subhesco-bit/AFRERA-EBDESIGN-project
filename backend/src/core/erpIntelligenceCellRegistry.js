'use strict';

const fs = require('fs');
const path = require('path');
const { ERP_DOMAINS } = require('../services/erp/unifiedERPRegistry');
const { buildAgentTemplateRegistry } = require('./ai/agentTemplateCatalog');
const optimisation = require('./ai/optimisation');

const ERP_TO_CANONICAL = Object.freeze({
  finance: ['FINANCE','PAYMENTS_CREDIT'],
  supply_chain: ['SCM','PROCUREMENT','INVENTORY_WMS'],
  sales: ['COMMERCE','RETAIL'],
  marketing: ['COMMERCE','BI_ANALYTICS'],
  logistics: ['LOGISTICS','COLD_CHAIN'],
  crm: ['CRM_SERVICE'],
  erm: ['FOUNDATION','FARMER_FPO'],
  workforce: ['HCM'],
  insurance: ['INSURANCE'],
  retail: ['RETAIL','COMMERCE'],
  ecommerce: ['COMMERCE','RETAIL'],
  production: ['MANUFACTURING','PROCESSING'],
  quality: ['QUALITY_EHS','TRACEABILITY_GI'],
  asset: ['ASSET_EAM','IOT_TELEMETRY'],
  projects: ['PROJECT_EPC'],
  governance: ['REGULATORY','IDENTITY_GOVERNANCE'],
  data_ai: ['AI_INTELLIGENCE','BI_ANALYTICS','KNOWLEDGE_RETRIEVAL'],
});

const DOMAIN_SERVICES = Object.freeze({
  finance: ['backend/src/services/finance/enterpriseAccountingService.js','backend/src/services/indiaErpAccountingService.js'],
  supply_chain: ['backend/src/services/vendorProcurementService.js','backend/src/services/warehouseManagementService.js'],
  sales: ['backend/src/services/commerce/marketIntelligenceService.js'],
  marketing: ['backend/src/services/commerce/marketIntelligenceService.js'],
  logistics: ['backend/src/services/logistics/logisticsService.js','backend/src/services/logistics/logisticsEnhancementService.js'],
  crm: ['backend/src/services/legacy/erpService.js'],
  erm: ['backend/src/services/ruralEnterpriseService.js'],
  workforce: ['backend/src/core/erpAgents.js'],
  insurance: ['backend/src/services/finance/insuranceService.js','backend/src/services/finance/insuranceClaimsService.js'],
  retail: ['backend/src/services/legacy/ecommerceERPService.js'],
  ecommerce: ['backend/src/services/ecommerceERPService.js'],
  production: ['backend/src/services/productionSupplyBridgeService.js','backend/src/services/m051m100AgricultureProductionService.js'],
  quality: ['backend/src/services/qualityAssuranceService.js','backend/src/services/laboratoryERPService.js'],
  asset: ['backend/src/services/preventiveMaintenanceService.js'],
  projects: ['backend/src/services/projectSystemsService.js'],
  governance: ['backend/src/services/enterpriseControlService.js'],
  data_ai: ['backend/src/core/ai/agentRuntimeService.js','backend/src/core/ai/aiEngineRegistry.js'],
});

const COST_DRIVERS = Object.freeze({
  finance: ['working_capital','cash_conversion_cycle','cost_center_variance','late_payment','financing_cost','tax_compliance_cost'],
  supply_chain: ['landed_cost','inventory_holding','stockout','supplier_risk','expedite_cost','obsolescence'],
  sales: ['margin_leakage','discount_leakage','returns','channel_cost','cost_to_serve'],
  marketing: ['campaign_cost','cost_per_lead','cost_per_acquisition','promotion_margin_erosion'],
  logistics: ['freight','fuel','detention','route_distance','cold_chain_energy','spoilage','failed_delivery'],
  crm: ['case_handling_cost','sla_breach','repeat_contact','retention_cost'],
  erm: ['resource_underutilization','shared_capacity_idle_cost','service_delivery_cost'],
  workforce: ['overtime','idle_time','attrition','training_cost','contract_labour_variance'],
  insurance: ['loss_ratio','claim_leakage','fraud_loss','investigation_cost','reinsurance_cost'],
  retail: ['markdown','shrinkage','stockout','store_labor','returns','inventory_holding'],
  ecommerce: ['fulfilment_cost','return_cost','payment_cost','marketplace_fee','cart_abandonment'],
  production: ['yield_loss','scrap','rework','energy','labor','setup','downtime','packaging_cost'],
  quality: ['cost_of_poor_quality','rework','scrap','testing_cost','recall_risk','non_conformance'],
  asset: ['downtime','maintenance_cost','spares','energy','failure_risk','asset_underutilization'],
  projects: ['cost_variance','schedule_delay','change_order','rework','contractor_variance','resource_idle_cost'],
  governance: ['control_failure_cost','audit_remediation','compliance_penalty_risk','fraud_loss'],
  data_ai: ['model_inference_cost','token_cost','tool_execution_cost','latency_cost','retry_cost','human_review_cost'],
});

const BUSINESS_OPTIMIZATION_OBJECTIVES = Object.freeze({
  logistics: ['logistics.corridor_allocation'],
  supply_chain: ['logistics.corridor_allocation'],
  production: [],
  quality: [],
  asset: [],
  finance: [],
  sales: [],
  marketing: [],
  crm: [],
  erm: [],
  workforce: [],
  insurance: [],
  retail: [],
  ecommerce: [],
  projects: [],
  governance: [],
  data_ai: [],
});

const ERP_LAYER_CONTRACT = Object.freeze([
  'transactional_core',
  'embedded_intelligence',
  'business_optimization',
  'cost_optimization',
  'isolated_agent_step_up',
  'governance_and_approval',
  'observability_and_audit',
  'outcome_learning',
]);

function templateIndex() {
  const { agentRegistry } = buildAgentTemplateRegistry();
  const byDomain = {};
  for (const t of agentRegistry.list({enabled:true})) {
    (byDomain[t.domain] = byDomain[t.domain] || []).push(t);
  }
  return byDomain;
}

function sourceExists(root, relative) {
  try { return fs.existsSync(path.resolve(root, relative)); } catch { return false; }
}

function buildCell(domainId, options={}) {
  const domain=ERP_DOMAINS[domainId];
  if(!domain) return null;
  const projectRoot=options.projectRoot || path.resolve(__dirname,'../../..');
  const templates=templateIndex();
  const canonicalDomains=ERP_TO_CANONICAL[domainId] || [];
  const agentTemplates=canonicalDomains.flatMap((d)=>templates[d]||[]);
  const objectiveIds=BUSINESS_OPTIMIZATION_OBJECTIVES[domainId] || [];
  const executableObjectives=objectiveIds.filter((id)=>optimisation.OBJECTIVES.has(id));
  const serviceRefs=(DOMAIN_SERVICES[domainId]||[]).map((ref)=>({path:ref,exists:sourceExists(projectRoot,ref)}));

  return {
    erpDomainId:domainId,
    name:domain.name,
    capabilities:[...domain.capabilities],
    canonicalAIDomains:canonicalDomains,
    layers:{
      transactionalCore:{
        authority:'SYSTEM_OF_RECORD',
        mutationAuthority:'ERP_WORKFLOW_ONLY',
        sourceServices:serviceRefs,
        status:serviceRefs.some((x)=>x.exists)?'IMPLEMENTED_OR_PARTIAL':'SOURCE_NOT_VERIFIED',
      },
      embeddedIntelligence:{
        authority:'ADVISE_OR_PREAUTHORIZED_RULE_ONLY',
        ruleEngine:'backend/src/core/erpAgents.js',
        decisionQuality:'backend/src/modules/platform/DecisionQualityEngine.js',
        moduleBridge:'backend/src/modules/platform/ModuleAIERPBridge.js',
        status:'IMPLEMENTED_PARTIAL_RECONCILIATION_REQUIRED',
      },
      businessOptimization:{
        engine:'backend/src/core/ai/optimisation.js',
        objectiveIds,
        executableObjectiveIds:executableObjectives,
        status:objectiveIds.length===0?'CONTRACT_DEFINED_OBJECTIVE_NOT_YET_IMPLEMENTED':
          executableObjectives.length===objectiveIds.length?'EXECUTABLE':'PARTIAL_EXECUTION',
        guarantee:'Optimization must report feasibility, achieved cost and limitations; no unproven optimality claim.',
      },
      costOptimization:{
        businessCostDrivers:[...(COST_DRIVERS[domainId]||[])],
        runtimeCostController:'backend/src/core/ai/aiCostController.js',
        providerCostTruth:'LEGACY_STATIC_RATE_TABLE_REQUIRES_CURRENT_PROVIDER_PRICING_REFRESH',
        routingPolicy:[
          'deterministic/local before external when equivalent quality is available',
          'external step-up only when capability/evidence/confidence requires it',
          'capability/security/SLA gates override cheapest-provider choice',
          'record baseline cost, optimized cost, savings basis and observed outcome',
        ],
        status:'CONTRACT_DEFINED_EXISTING_CONTROLLER_REQUIRES_RATE_REFRESH',
      },
      isolatedAgentStepUp:{
        transformer:'backend/src/core/ai/aiIsolationTransformer.js',
        orchestrator:'backend/src/core/ai/dualBackboneOrchestrator.js',
        templates:agentTemplates.map((t)=>({id:t.id,domain:t.domain,stream:t.stream,riskClass:t.riskClass,pattern:t.pattern})),
        status:agentTemplates.length?'TEMPLATE_BOUND':'TEMPLATE_GAP',
        externalAuthority:'PROPOSAL_ONLY',
      },
      governanceAndApproval:{
        externalMutation:false,
        highImpactActionsRequireInternalAuthority:true,
        humanApprovalWherePolicyRequires:true,
        segregationOfDuties:true,
      },
      observabilityAndAudit:{
        costTracking:'backend/src/core/ai/aiCostController.js',
        predictionOutcome:'backend/src/core/outcomeResolver.js',
        optimizationJobs:'backend/src/database/migrations/10006_optimization_job_lifecycle.sql',
        provenanceRequired:true,
      },
      outcomeLearning:{
        resolver:'backend/src/core/outcomeResolver.js',
        calibrationGateRequired:true,
        status:'IMPLEMENTED_SHARED_ENGINE',
      },
    },
    templateLifecycle:{
      service:'backend/src/core/erpTemplateEvolutionService.js',
      stages:['extract','normalize','deduplicate','map_domain','gap_analyze','enhance','simulate','security_review','cost_review','integrate','test','canary','measure','promote'],
      rule:'Imported templates are source material, never production authority until reconciled into this intelligence-cell contract.',
    },
  };
}

function listCells(options={}) {
  return Object.keys(ERP_DOMAINS).map((id)=>buildCell(id,options));
}

function coverage(options={}) {
  const cells=listCells(options);
  return {
    erpDomains:cells.length,
    layerContract:ERP_LAYER_CONTRACT,
    completeLayerContracts:cells.filter((c)=>ERP_LAYER_CONTRACT.every((layer)=>({
      transactional_core:c.layers.transactionalCore,
      embedded_intelligence:c.layers.embeddedIntelligence,
      business_optimization:c.layers.businessOptimization,
      cost_optimization:c.layers.costOptimization,
      isolated_agent_step_up:c.layers.isolatedAgentStepUp,
      governance_and_approval:c.layers.governanceAndApproval,
      observability_and_audit:c.layers.observabilityAndAudit,
      outcome_learning:c.layers.outcomeLearning,
    })[layer])).length,
    agentTemplateCovered:cells.filter((c)=>c.layers.isolatedAgentStepUp.templates.length>0).length,
    executableBusinessOptimization:cells.filter((c)=>c.layers.businessOptimization.status==='EXECUTABLE').length,
    businessOptimizationObjectiveGaps:cells.filter((c)=>c.layers.businessOptimization.status==='CONTRACT_DEFINED_OBJECTIVE_NOT_YET_IMPLEMENTED').map((c)=>c.erpDomainId),
    serviceSourceGaps:cells.filter((c)=>!c.layers.transactionalCore.sourceServices.some((s)=>s.exists)).map((c)=>c.erpDomainId),
    costRateRefreshRequired:cells.filter((c)=>c.layers.costOptimization.providerCostTruth.includes('REQUIRES')).map((c)=>c.erpDomainId),
  };
}

module.exports={
  ERP_TO_CANONICAL,
  DOMAIN_SERVICES,
  COST_DRIVERS,
  BUSINESS_OPTIMIZATION_OBJECTIVES,
  ERP_LAYER_CONTRACT,
  buildCell,
  listCells,
  coverage,
};
