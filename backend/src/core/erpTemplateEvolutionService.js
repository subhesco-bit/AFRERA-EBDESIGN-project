'use strict';

const crypto = require('crypto');
const { buildCell } = require('./erpIntelligenceCellRegistry');

const SOURCE_TYPES = new Set([
  'existing_project_code','legacy_project_code','backup','html_prototype','document_spec',
  'vendor_template','open_source_template','screenshot_reference','manual_requirement','industry_standard',
]);

const STAGES = Object.freeze([
  'extract','normalize','deduplicate','map_domain','gap_analyze','enhance','simulate',
  'security_review','cost_review','integrate','test','canary','measure','promote',
]);

function stable(value) {
  if(value===null||typeof value!=='object') return JSON.stringify(value);
  if(Array.isArray(value)) return '['+value.map(stable).join(',')+']';
  return '{'+Object.keys(value).sort().map((k)=>JSON.stringify(k)+':'+stable(value[k])).join(',')+'}';
}

function hash(value) {
  return crypto.createHash('sha256').update(stable(value)).digest('hex');
}

function normalizeTemplate(input={}) {
  if(!SOURCE_TYPES.has(input.sourceType)) {
    const e=new Error('Unsupported ERP template sourceType');e.code='ERP_TEMPLATE_SOURCE_INVALID';throw e;
  }
  if(!input.erpDomainId) {
    const e=new Error('erpDomainId is required');e.code='ERP_TEMPLATE_DOMAIN_REQUIRED';throw e;
  }
  const cell=buildCell(input.erpDomainId);
  if(!cell) {
    const e=new Error('Unknown ERP domain: '+input.erpDomainId);e.code='ERP_TEMPLATE_DOMAIN_UNKNOWN';throw e;
  }
  const normalized={
    templateId:input.templateId || 'ERPT-'+crypto.randomUUID(),
    sourceType:input.sourceType,
    sourceRef:input.sourceRef || null,
    sourceHash:input.sourceHash || null,
    sourceLicense:input.sourceLicense || 'UNKNOWN',
    erpDomainId:input.erpDomainId,
    name:String(input.name||'Unnamed ERP template').trim(),
    description:String(input.description||'').trim(),
    capabilities:[...new Set((input.capabilities||[]).map(String))].sort(),
    workflows:[...new Set((input.workflows||[]).map(String))].sort(),
    dataEntities:[...new Set((input.dataEntities||[]).map(String))].sort(),
    controls:[...new Set((input.controls||[]).map(String))].sort(),
    optimizationClaims:[...new Set((input.optimizationClaims||[]).map(String))].sort(),
    costClaims:[...new Set((input.costClaims||[]).map(String))].sort(),
    aiClaims:[...new Set((input.aiClaims||[]).map(String))].sort(),
    provenance:input.provenance||{},
    extractionStatus:'EXTRACTED_NOT_PRODUCTION_AUTHORITY',
  };
  normalized.normalizedHash=hash(normalized);
  return normalized;
}

function gapAnalyze(template) {
  const cell=buildCell(template.erpDomainId);
  if(!cell) throw new Error('Unknown ERP domain: '+template.erpDomainId);
  const domainCapabilities=new Set(cell.capabilities);
  const templateCapabilities=new Set(template.capabilities||[]);
  const covered=[...domainCapabilities].filter((c)=>templateCapabilities.has(c));
  const missing=[...domainCapabilities].filter((c)=>!templateCapabilities.has(c));
  const extras=[...templateCapabilities].filter((c)=>!domainCapabilities.has(c));
  return {
    erpDomainId:template.erpDomainId,
    capabilityCoverage:domainCapabilities.size?Math.round((covered.length/domainCapabilities.size)*10000)/100:100,
    coveredCapabilities:covered,
    missingCapabilities:missing,
    extraCandidateCapabilities:extras,
    mandatoryLayerGaps:{
      embeddedIntelligence:(template.aiClaims||[]).length===0,
      businessOptimization:(template.optimizationClaims||[]).length===0,
      costOptimization:(template.costClaims||[]).length===0,
      governance:(template.controls||[]).length===0,
      observability:true,
      outcomeLearning:true,
    },
    productionAuthority:false,
  };
}

function developEnhancementPlan(template) {
  const gaps=gapAnalyze(template);
  const cell=buildCell(template.erpDomainId);
  const actions=[];
  for(const cap of gaps.missingCapabilities) actions.push({type:'capability_gap',capability:cap,action:'map to existing service or implement behind module contract'});
  if(gaps.mandatoryLayerGaps.embeddedIntelligence) actions.push({type:'layer_gap',layer:'embedded_intelligence',action:'bind deterministic/rule intelligence before generative AI'});
  if(gaps.mandatoryLayerGaps.businessOptimization) actions.push({type:'layer_gap',layer:'business_optimization',action:'define objective, variables, hard constraints, cost and feasibility verification'});
  if(gaps.mandatoryLayerGaps.costOptimization) actions.push({type:'layer_gap',layer:'cost_optimization',action:'define business cost drivers plus runtime AI cost budget'});
  if(gaps.mandatoryLayerGaps.governance) actions.push({type:'layer_gap',layer:'governance',action:'add approvals, segregation of duties, audit and authority boundaries'});
  actions.push({type:'integration',layer:'isolated_agent_step_up',action:'use isolation transformer; external AI remains proposal-only'});
  actions.push({type:'verification',action:'unit + integration + regression + security + cost + outcome-measurement gates'});
  return {
    templateId:template.templateId,
    erpDomainId:template.erpDomainId,
    current:gaps,
    targetCell:cell,
    stages:[...STAGES],
    actions,
    promotionRule:'No template becomes production authority until every mandatory gate passes and its module system-of-record path remains authoritative.',
  };
}

function integrationContract(template) {
  const plan=developEnhancementPlan(template);
  return {
    templateId:template.templateId,
    erpDomainId:template.erpDomainId,
    status:'READY_FOR_CONTROLLED_DEVELOPMENT',
    embedding:{
      target:'ERP_MODULE_INTELLIGENCE_CELL',
      preserveSystemOfRecord:true,
      noDirectExternalMutation:true,
      optimizationLayer:true,
      costOptimizationLayer:true,
      outcomeLearning:true,
    },
    requiredStages:plan.stages,
    unresolved:plan.current,
    promotionRule:plan.promotionRule,
  };
}

module.exports={
  SOURCE_TYPES,
  STAGES,
  normalizeTemplate,
  gapAnalyze,
  developEnhancementPlan,
  integrationContract,
};
