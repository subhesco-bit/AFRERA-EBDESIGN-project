'use strict';

const path = require('path');
const taxonomy = require(path.resolve(__dirname, '../../../../.ai/autonomous-program/CANONICAL_DOMAIN_TAXONOMY.json'));
const { buildAgentTemplateRegistry } = require('./agentTemplateCatalog');
const { findBestEngine, getEnginesByCapability, getEngineRuntimeStatus } = require('./aiEngineRegistry');
const { buildDeterministicAlgorithmRegistry } = require('../deterministicAlgorithmCatalog');

const DOMAIN_PROFILES = Object.freeze({
  FOUNDATION: { primaryTemplateId:'SOFTWARE_REVIEW_AGENT', capabilities:['reasoning','classification','retrieval'], embeddedRules:['workflow.sla_breach','masterdata.quality'], riskClass:'elevated' },
  IDENTITY_GOVERNANCE: { primaryTemplateId:'IDENTITY_GOVERNANCE_AGENT', capabilities:['classification','anomaly_detection','reasoning'], embeddedRules:['compliance.sod'], riskClass:'high' },
  FINANCE: { primaryTemplateId:'ERP_FINANCE_AGENT', capabilities:['reasoning','forecasting','optimization'], embeddedRules:['finance.cashflow','finance.receivables','controlling.cost_variance'], riskClass:'high' },
  HCM: { primaryTemplateId:'HCM_WORKFORCE_AGENT', capabilities:['classification','forecasting','reasoning'], embeddedRules:['hr.leave_liability'], riskClass:'high' },
  PROCUREMENT: { primaryTemplateId:'PROCUREMENT_AGENT', capabilities:['optimization','ranking','reasoning'], embeddedRules:['procurement.vendor_selection'], riskClass:'high' },
  INVENTORY_WMS: { primaryTemplateId:'INVENTORY_WMS_AGENT', capabilities:['forecasting','optimization','anomaly_detection'], embeddedRules:['inventory.replenishment','inventory.slow_moving'], riskClass:'elevated' },
  SCM: { primaryTemplateId:'SCM_CONTROL_TOWER_AGENT', capabilities:['forecasting','optimization','simulation'], embeddedRules:['sales.demand_forecast','logistics.delay_risk'], riskClass:'elevated' },
  MANUFACTURING: { primaryTemplateId:'MANUFACTURING_PRODUCTION_AGENT', capabilities:['optimization','forecasting','anomaly_detection'], embeddedRules:['production.oee'], riskClass:'elevated' },
  QUALITY_EHS: { primaryTemplateId:'QUALITY_EHS_AGENT', capabilities:['classification','anomaly_detection','vision'], embeddedRules:['quality.ncr_trend'], riskClass:'high' },
  ASSET_EAM: { primaryTemplateId:'ASSET_EAM_AGENT', capabilities:['forecasting','anomaly_detection','optimization'], embeddedRules:['maintenance.predictive','assets.lifecycle'], riskClass:'elevated' },
  RETAIL: { primaryTemplateId:'RETAIL_STORE_AGENT', capabilities:['forecasting','recommendation','optimization'], embeddedRules:['sales.demand_forecast'], riskClass:'elevated' },
  COMMERCE: { primaryTemplateId:'MARKETPLACE_CATALOG_AGENT', capabilities:['recommendation','ranking','reasoning'], embeddedRules:[], riskClass:'elevated' },
  LOGISTICS: { primaryTemplateId:'LOGISTICS_TMS_AGENT', capabilities:['optimization','forecasting','geospatial'], embeddedRules:['logistics.delay_risk'], riskClass:'elevated' },
  INSURANCE: { primaryTemplateId:'INSURANCE_CLAIM_REVIEW_AGENT', capabilities:['classification','risk_scoring','fraud_detection'], embeddedRules:['risk.register_health'], riskClass:'high' },
  CRM_SERVICE: { primaryTemplateId:'SUPPORT_CASE_AGENT', capabilities:['classification','recommendation','reasoning'], embeddedRules:['crm.lead_qualification'], riskClass:'elevated' },
  PROJECT_EPC: { primaryTemplateId:'PROJECT_EPC_AGENT', capabilities:['forecasting','optimization','reasoning'], embeddedRules:[], riskClass:'high' },
  BI_ANALYTICS: { primaryTemplateId:'DATA_ANALYST', capabilities:['analytics','forecasting','reasoning'], embeddedRules:[], riskClass:'elevated' },
  AI_INTELLIGENCE: { primaryTemplateId:'AI_GOVERNANCE_AGENT', capabilities:['reasoning','evaluation','classification'], embeddedRules:[], riskClass:'high' },
  KNOWLEDGE_RETRIEVAL: { primaryTemplateId:'KNOWLEDGE_RAG', capabilities:['lexical_retrieval','semantic_retrieval','graph_retrieval'], embeddedRules:['masterdata.quality'], riskClass:'standard' },
  MOBILE_EDGE: { primaryTemplateId:'MOBILE_EDGE_AGENT', capabilities:['reasoning','classification','summarization'], embeddedRules:[], riskClass:'elevated' },
  IOT_TELEMETRY: { primaryTemplateId:'IOT_TELEMETRY_AGENT', capabilities:['anomaly_detection','forecasting','classification'], embeddedRules:[], riskClass:'high' },
  AGRI_PRODUCTION: { primaryTemplateId:'AGRONOMY_ADVISOR', capabilities:['forecasting','recommendation','reasoning'], embeddedRules:['agri.glut_warning'], riskClass:'high' },
  FARMER_FPO: { primaryTemplateId:'FPO_OPERATIONS_AGENT', capabilities:['optimization','recommendation','reasoning'], embeddedRules:[], riskClass:'elevated' },
  LIVESTOCK_VET: { primaryTemplateId:'VETERINARY_REVIEW_AGENT', capabilities:['classification','vision','reasoning'], embeddedRules:[], riskClass:'high' },
  FOOD_NUTRITION: { primaryTemplateId:'MEDICAL_RESEARCH_AGENT', capabilities:['retrieval','reasoning','classification'], embeddedRules:[], riskClass:'high' },
  COLD_CHAIN: { primaryTemplateId:'COLD_CHAIN_EXCEPTION_AGENT', capabilities:['anomaly_detection','forecasting','optimization'], embeddedRules:['maintenance.predictive','logistics.delay_risk'], riskClass:'high' },
  PROCESSING: { primaryTemplateId:'PROCESSING_VALUE_ADD_AGENT', capabilities:['optimization','forecasting','reasoning'], embeddedRules:['production.oee'], riskClass:'high' },
  SUSTAINABILITY: { primaryTemplateId:'ESG_EVIDENCE_AGENT', capabilities:['analytics','forecasting','reasoning'], embeddedRules:[], riskClass:'elevated' },
  RESEARCH: { primaryTemplateId:'DEEP_RESEARCH', capabilities:['retrieval','reasoning','evaluation'], embeddedRules:[], riskClass:'standard' },
  REGULATORY: { primaryTemplateId:'COMPLIANCE_AUDIT_AGENT', capabilities:['classification','retrieval','reasoning'], embeddedRules:['legal.obligation_watch','compliance.sod','risk.register_health'], riskClass:'high' },
  DOCUMENT_DMS: { primaryTemplateId:'DOCUMENT_DMS_AGENT', capabilities:['ocr','classification','retrieval'], embeddedRules:['masterdata.quality'], riskClass:'elevated' },
  PLM_ENGINEERING: { primaryTemplateId:'PLM_ENGINEERING_AGENT', capabilities:['reasoning','optimization','vision'], embeddedRules:['masterdata.quality'], riskClass:'high' },
  PAYMENTS_CREDIT: { primaryTemplateId:'PAYMENTS_CREDIT_AGENT', capabilities:['risk_scoring','fraud_detection','reasoning'], embeddedRules:['finance.cashflow','finance.receivables'], riskClass:'high' },
  SCHEMES_SUBSIDY: { primaryTemplateId:'GRANT_SUBSIDY_AGENT', capabilities:['retrieval','classification','reasoning'], embeddedRules:[], riskClass:'elevated' },
  TRACEABILITY_GI: { primaryTemplateId:'TRACEABILITY_GI_AGENT', capabilities:['retrieval','classification','graph_retrieval'], embeddedRules:[], riskClass:'elevated' },
  SECURITY_RESILIENCE: { primaryTemplateId:'INCIDENT_SUPERVISOR', capabilities:['anomaly_detection','classification','reasoning'], embeddedRules:['emergency.incident_command','risk.register_health','compliance.sod'], riskClass:'high' },
});

const DETERMINISTIC_HINTS = Object.freeze({
  FINANCE:['PRICE-FARMGATE-NET-001'],
  PROCUREMENT:[],
  INVENTORY_WMS:[],
  SCM:[],
  MANUFACTURING:[],
  LOGISTICS:[],
  COLD_CHAIN:[],
  PROCESSING:[],
  BI_ANALYTICS:[],
  SUSTAINABILITY:[],
  PAYMENTS_CREDIT:[],
});

function canonicalDomains() {
  return (taxonomy.domains || []).map((d) => ({...d}));
}

function templateMap() {
  const { agentRegistry } = buildAgentTemplateRegistry();
  const byDomain = {};
  for (const t of agentRegistry.list({enabled:true})) {
    (byDomain[t.domain] = byDomain[t.domain] || []).push(t);
  }
  return {agentRegistry, byDomain};
}

function engineCandidates(profile) {
  const seen = new Map();
  const capabilityCoverage = {};
  for (const capability of profile.capabilities || []) {
    const engines = getEnginesByCapability(capability) || [];
    capabilityCoverage[capability] = {
      declared: engines.length,
      available: engines.filter((engine) => getEngineRuntimeStatus(engine).available).length,
      engineIds: engines.map((engine) => engine.id),
    };
    for (const engine of engines) if (!seen.has(engine.id)) seen.set(engine.id, engine);
  }
  return {
    candidates: [...seen.values()].map((engine) => ({
      id:engine.id,
      name:engine.name,
      type:engine.type,
      provider:engine.provider,
      capabilities:engine.capabilities || [],
      runtime:getEngineRuntimeStatus(engine),
    })),
    capabilityCoverage,
  };
}

function buildDomainAICatalog() {
  const {agentRegistry, byDomain} = templateMap();
  const algorithms = buildDeterministicAlgorithmRegistry();
  return canonicalDomains().map((domain) => {
    const profile = DOMAIN_PROFILES[domain.code] || null;
    if (!profile) {
      return {
        domainId:domain.id,
        domainCode:domain.code,
        domainName:domain.name,
        contractStatus:'MISSING_PROFILE',
        embeddedBackbone:null,
        agenticBackbone:null,
      };
    }
    const templates = byDomain[domain.code] || [];
    const primary = agentRegistry.get(profile.primaryTemplateId);
    const deterministic = (DETERMINISTIC_HINTS[domain.code] || []).filter((id) => algorithms.get(id));
    const engines = engineCandidates(profile);
    return {
      domainId:domain.id,
      domainCode:domain.code,
      domainName:domain.name,
      owner:domain.owner,
      securityClass:domain.securityClass,
      dataClassification:domain.dataClassification,
      riskClass:profile.riskClass,
      contractStatus:'COVERED',
      embeddedBackbone:{
        contractId:`EMBEDDED:${domain.code}`,
        mode:profile.embeddedRules.length ? 'DOMAIN_RULES_PLUS_ENGINE_FABRIC' : 'ENGINE_FABRIC_CONTRACT',
        directRuleAgentIds:[...profile.embeddedRules],
        directRuleCoverage:profile.embeddedRules.length>0,
        deterministicAlgorithmIds:deterministic,
        requiredEngineCapabilities:[...profile.capabilities],
        engineCandidates:engines.candidates,
        engineCapabilityCoverage:engines.capabilityCoverage,
        executionPolicy:{
          deterministicFirst:true,
          retrievalBeforeGeneration:true,
          sideEffectsRequireAuthority:true,
          auditRequired:true,
        },
        sourceFiles:[
          'backend/src/core/erpAgents.js',
          'backend/src/core/ai/aiEngineRegistry.js',
          'backend/src/core/ai/capabilityClasses.js',
          'backend/src/core/ai/domainCapabilityContract.js',
        ],
      },
      agenticBackbone:{
        contractId:`AGENTIC:${domain.code}`,
        primaryTemplateId:profile.primaryTemplateId,
        templates:templates.map((t)=>({id:t.id,stream:t.stream,pattern:t.pattern,riskClass:t.riskClass,maxSteps:t.maxSteps})),
        templateCoverage:Boolean(primary),
        runtime:'backend/src/core/ai/agentRuntimeService.js',
        engineIntegration:'AI SDK ToolLoopAgent -> provider/model routing; tools -> deterministic/retrieval/domain services',
        approvalPolicy:primary?.approvalPolicy || null,
      },
      sharedSpine:{
        engineRegistry:'backend/src/core/ai/aiEngineRegistry.js',
        providerAdapters:'backend/src/core/ai/aiProviderAdapters.js',
        capabilityClasses:'backend/src/core/ai/capabilityClasses.js',
        deterministicRegistry:'backend/src/core/deterministicAlgorithmRegistry.js',
        retrieval:'backend/src/services/hybridRetrievalService.js',
        guardrails:'backend/src/core/ai/aiGuardrails.js',
        confidence:'backend/src/core/ai/aiConfidenceEngine.js',
        cost:'backend/src/core/ai/aiCostController.js',
        audit:'backend/src/core/ai/aiAuditLogger.js',
        workflow:'backend/src/core/workflowDefinitionRegistry.js',
      },
    };
  });
}

function coverage(catalog = buildDomainAICatalog()) {
  const covered = catalog.filter((d)=>d.contractStatus==='COVERED');
  const agentic = covered.filter((d)=>d.agenticBackbone?.templateCoverage);
  const embeddedContracts = covered.filter((d)=>Boolean(d.embeddedBackbone));
  const embeddedRules = covered.filter((d)=>d.embeddedBackbone?.directRuleCoverage);
  const declaredEngineCovered = covered.filter((d)=>Object.values(d.embeddedBackbone?.engineCapabilityCoverage||{}).every((x)=>x.declared>0));
  const executableEngineCovered = covered.filter((d)=>Object.values(d.embeddedBackbone?.engineCapabilityCoverage||{}).every((x)=>x.available>0));
  return {
    canonicalDomains:catalog.length,
    coveredDomains:covered.length,
    agenticTemplateCoveredDomains:agentic.length,
    embeddedContractCoveredDomains:embeddedContracts.length,
    embeddedDirectRuleCoveredDomains:embeddedRules.length,
    declaredEngineCoveredDomains:declaredEngineCovered.length,
    currentlyExecutableEngineCoveredDomains:executableEngineCovered.length,
    missingDomains:catalog.filter((d)=>d.contractStatus!=='COVERED').map((d)=>d.domainCode),
    agenticMissingDomains:covered.filter((d)=>!d.agenticBackbone?.templateCoverage).map((d)=>d.domainCode),
    embeddedDirectRuleGaps:covered.filter((d)=>!d.embeddedBackbone?.directRuleCoverage).map((d)=>d.domainCode),
    declaredEngineCoverageGaps:covered.filter((d)=>!declaredEngineCovered.includes(d)).map((d)=>d.domainCode),
    currentRuntimeEngineGaps:covered.filter((d)=>!executableEngineCovered.includes(d)).map((d)=>d.domainCode),
  };
}

function getDomainAI(domainCode) {
  return buildDomainAICatalog().find((d)=>d.domainCode===domainCode) || null;
}

function selectEngine(domainCode, capability, options={}) {
  const domain = getDomainAI(domainCode);
  if (!domain) return null;
  if (!(domain.embeddedBackbone.requiredEngineCapabilities || []).includes(capability)) {
    return {selected:null,reason:'capability_not_declared_for_domain',domainCode,capability};
  }
  const engine = findBestEngine(capability, { ...options, requireAvailable: options.requireAvailable !== false });
  return {selected:engine || null,reason:engine?'selected':'no_executable_engine',domainCode,capability};
}

async function evaluateEmbeddedRule(domainCode, ruleAgentId, context={}) {
  const domain=getDomainAI(domainCode);
  if(!domain) throw new Error('Unknown canonical domain: '+domainCode);
  if(!domain.embeddedBackbone.directRuleAgentIds.includes(ruleAgentId)) {
    const e=new Error('Embedded rule is not bound to domain: '+ruleAgentId);e.code='EMBEDDED_RULE_NOT_BOUND';throw e;
  }
  const erpAgents=require('../erpAgents');
  return erpAgents.runAgent(ruleAgentId,context);
}

module.exports={
  DOMAIN_PROFILES,
  DETERMINISTIC_HINTS,
  canonicalDomains,
  buildDomainAICatalog,
  coverage,
  getDomainAI,
  selectEngine,
  evaluateEmbeddedRule,
};
