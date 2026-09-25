'use strict';

const fs=require('fs');
const path=require('path');
const { listProviders }=require('./aiProviderAdapters');
const { AI_ENGINES,listReadyEngines,capabilityCoverage }=require('./aiEngineRegistry');
const { buildAgentTemplateRegistry }=require('./agentTemplateCatalog');
const { buildAgentToolRegistry }=require('./agentToolRegistry');
const { coverage:domainCoverage,buildDomainAICatalog }=require('./enterpriseDualBackboneCatalog');
const memory=require('./aiMemoryRouter');
const evaluation=require('./aiEvaluationRegistry');
const cost=require('./aiCostController');

function file(relative){return {path:relative,exists:fs.existsSync(path.resolve(__dirname,'../../../..',relative))};}

function build(){
  const {agentRegistry,promptRegistry}=buildAgentTemplateRegistry();
  const templates=agentRegistry.list({enabled:true});
  const tools=buildAgentToolRegistry();
  const toolList=tools.list();
  const missingTools=[];
  for(const template of templates)for(const id of template.tools)if(!tools.get(id))missingTools.push({templateId:template.id,toolId:id});
  const domains=domainCoverage();
  const providers=listProviders();
  const ready=listReadyEngines();
  const agentRuntime=require('./agentRuntimeService').runtimeStatus();
  const mem=memory.status();
  const evalStatus=evaluation.status();
  const pricing=cost.pricingStatus();
  const criticalFiles={
    isolation:file('backend/src/core/ai/aiIsolationTransformer.js'),
    dualOrchestrator:file('backend/src/core/ai/dualBackboneOrchestrator.js'),
    engineDispatcher:file('backend/src/core/ai/aiEngineDispatcher.js'),
    agentRuntime:file('backend/src/core/ai/agentRuntimeService.js'),
    guardrails:file('backend/src/core/ai/aiGuardrails.js'),
    audit:file('backend/src/core/ai/aiAuditLogger.js'),
    confidence:file('backend/src/core/ai/aiConfidenceEngine.js'),
    cost:file('backend/src/core/ai/aiCostController.js'),
    memory:file('backend/src/core/ai/aiMemoryRouter.js'),
    evaluation:file('backend/src/core/ai/aiEvaluationRegistry.js'),
  };

  const codeBlockers=[];
  if(domains.coveredDomains!==domains.canonicalDomains)codeBlockers.push('canonical_domain_contract_gap');
  if(domains.agenticTemplateCoveredDomains!==domains.canonicalDomains)codeBlockers.push('agent_template_domain_gap');
  if(domains.declaredEngineCoveredDomains!==domains.canonicalDomains)codeBlockers.push('declared_engine_capability_gap');
  if(missingTools.length)codeBlockers.push('dangling_agent_tool_reference');
  if(!Object.values(criticalFiles).every((x)=>x.exists))codeBlockers.push('critical_ai_file_missing');
  if(mem.status!=='ready')codeBlockers.push('memory_spine_degraded');
  if(evalStatus.status!=='ready')codeBlockers.push('evaluation_spine_degraded');

  const configurationBlockers=[];
  if(!agentRuntime.executable)configurationBlockers.push('external_agent_runtime_not_configured');
  const externalPricing=pricing.configured.filter((x)=>x.provider!=='local');
  if(!externalPricing.length)configurationBlockers.push('external_provider_pricing_not_configured');
  if(domains.currentlyExecutableEngineCoveredDomains<domains.canonicalDomains)configurationBlockers.push('some_domain_capabilities_require_unconfigured_external_runtime');

  return {
    architecture:'isolated-hybrid-enterprise-ai',
    codeComplete:codeBlockers.length===0,
    runtimeFullyOperational:codeBlockers.length===0&&configurationBlockers.length===0,
    codeBlockers,
    configurationBlockers,
    domains,
    agents:{
      templates:templates.length,
      streams:new Set(templates.map((t)=>t.stream)).size,
      prompts:promptRegistry.listPublic().length,
      tools:toolList.length,
      missingToolReferences:missingTools,
      medicalTemplates:templates.filter((t)=>t.stream==='medical').length,
    },
    engines:{
      registered:Object.keys(AI_ENGINES).length,
      locallyOrCurrentlyExecutable:ready.length,
      capabilityCoverage:capabilityCoverage(),
    },
    providers:{
      known:providers.length,
      configured:providers.filter((p)=>p.configured).length,
      entries:providers.map((p)=>({provider:p.provider,configured:p.configured,mode:p.mode,missingRequired:p.missingRequired})),
      agentRuntime,
    },
    memory:mem,
    evaluation:evalStatus,
    cost:{
      pricing,
      state:cost.getCostState(),
      truthRule:'legacy static rates are not billing authority',
    },
    protection:{
      isolatedExternalBackbone:true,
      externalMutationAuthority:false,
      readOnlyExternalTools:true,
      cognitiveStepUp:true,
      authorityStepDown:true,
      deterministicReconciliation:true,
    },
    criticalFiles,
    generatedAt:new Date().toISOString(),
  };
}

module.exports={build};
