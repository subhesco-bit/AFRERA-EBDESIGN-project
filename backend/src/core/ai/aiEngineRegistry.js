/**
 * Reconciled AI Engine Registry.
 *
 * Registry truth rules:
 *  - "available" means an executable local backing or a fully configured runtime exists.
 *  - provider metadata alone never means a live provider.
 *  - capabilities are attached only to a concrete backing.
 *  - cost metadata here is not billing authority; aiCostController owns runtime pricing truth.
 */
'use strict';

const { logger } = require('../../utils/logger');
const { randomUUID } = require('crypto');
const fs = require('fs');
const path = require('path');
const { providerStatus } = require('./aiProviderAdapters');

const AI_ENGINES = {
  llm_claude: {
    id:'EBD-ENG-00000001',name:'Claude LLM Adapter',type:'llm',provider:'claude',status:'declared',
    capabilities:['text_generation','analysis','classification','summarization','reasoning','structured_output'],
    cost_per_1k_tokens:0.003,max_tokens:8192,confidence_threshold:0.8,
    executionAdapter:'provider_metadata',costAuthority:'legacy-static-unverified',
  },
  llm_openai: {
    id:'EBD-ENG-00000002',name:'OpenAI LLM Adapter',type:'llm',provider:'openai',status:'declared',
    capabilities:['text_generation','analysis','classification','summarization','reasoning','structured_output'],
    cost_per_1k_tokens:0.002,max_tokens:4096,confidence_threshold:0.8,
    executionAdapter:'provider_metadata',costAuthority:'legacy-static-unverified',
  },
  llm_gemini: {
    id:'EBD-ENG-00000003',name:'Google Gemini Adapter',type:'llm',provider:'gemini',status:'declared',
    capabilities:['text_generation','analysis','classification','summarization','reasoning','structured_output'],
    cost_per_1k_tokens:0.001,max_tokens:8192,confidence_threshold:0.75,
    executionAdapter:'provider_metadata',costAuthority:'legacy-static-unverified',
  },
  vision_quality: {
    id:'EBD-ENG-00000004',name:'Vision Quality Analysis',type:'vision',provider:'local',status:'real',
    capabilities:['vision','image_analysis','quality_check','metadata'],
    cost_per_request:0,confidence_threshold:0.9,executionAdapter:'real_orchestrator',realTaskType:'vision_engine',
    backing:'services/legacy/visionService.js',costAuthority:'local-process-unpriced',
  },
  vision_ocr: {
    id:'EBD-ENG-00000005',name:'OCR Engine',type:'vision',provider:'local',status:'real',
    capabilities:['ocr','text_extraction','document_processing'],
    cost_per_request:0,confidence_threshold:0.85,executionAdapter:'real_orchestrator',realTaskType:'ocr_engine',
    backing:'services/legacy/ocrService.js',costAuthority:'local-process-unpriced',
  },
  speech_google: {
    id:'EBD-ENG-00000006',name:'Google Speech Adapter',type:'speech',provider:'google',status:'partial',
    capabilities:['transcription','synthesis'],cost_per_minute:0.006,confidence_threshold:0.85,
    executionAdapter:'real_orchestrator',realTaskType:'speech_engine',costAuthority:'legacy-static-unverified',
  },
  speech_azure: {
    id:'EBD-ENG-00000007',name:'Azure Speech Adapter',type:'speech',provider:'azure',status:'partial',
    capabilities:['transcription','synthesis'],cost_per_minute:0.008,confidence_threshold:0.85,
    executionAdapter:'real_orchestrator',realTaskType:'speech_engine',costAuthority:'legacy-static-unverified',
  },
  recommendation: {
    id:'EBD-ENG-00000008',name:'Recommendation Engine',type:'domain',provider:'local',status:'real',
    capabilities:['recommendation','product_recommendation','wellness_advice'],
    cost_per_request:0,confidence_threshold:0.9,executionAdapter:'real_orchestrator',realTaskType:'recommendation_engine',
    backing:'services/legacy/catalogIntelligenceService.js',costAuthority:'local-process-unpriced',
  },
  classification: {
    id:'EBD-ENG-00000009',name:'Classification Engine (Legacy Placeholder)',type:'domain',provider:'local',status:'unmapped',
    capabilities:['text_classification','category_mapping'],cost_per_request:0,confidence_threshold:0.85,
    executionAdapter:null,costAuthority:'local-process-unpriced',
  },
  llm_deepseek: {
    id:'EBD-ENG-00000010',name:'DeepSeek LLM Adapter',type:'llm',provider:'deepseek',status:'declared',
    capabilities:['text_generation','analysis','classification','summarization','reasoning','structured_output'],
    cost_per_1k_tokens:null,max_tokens:null,confidence_threshold:0.75,
    executionAdapter:'provider_metadata',costAuthority:'unknown',
  },
  llm_grok: {
    id:'EBD-ENG-00000011',name:'Grok/xAI LLM Adapter',type:'llm',provider:'grok',status:'declared',
    capabilities:['text_generation','analysis','classification','summarization','reasoning','structured_output'],
    cost_per_1k_tokens:null,max_tokens:null,confidence_threshold:0.75,
    executionAdapter:'provider_metadata',costAuthority:'unknown',
  },

  rule_engine: {
    id:'EBD-ENG-00000012',name:'Rule Engine',type:'rules',provider:'local',status:'real',
    capabilities:['rules','event_reasoning','classification'],confidence_threshold:1,
    executionAdapter:'real_orchestrator',realTaskType:'rule_engine',backing:'core/decisionEngine.js',
  },
  knowledge_graph: {
    id:'EBD-ENG-00000013',name:'Knowledge Graph',type:'retrieval',provider:'local',status:'real',
    capabilities:['retrieval','graph_retrieval','relationship_reasoning'],confidence_threshold:0.9,
    executionAdapter:'real_orchestrator',realTaskType:'knowledge_graph',backing:'services/legacy/knowledgeGraphService.js',
  },
  enterprise_memory: {
    id:'EBD-ENG-00000014',name:'Enterprise Memory',type:'memory',provider:'local',status:'real',
    capabilities:['memory','case_retrieval','outcome_context','retrieval'],confidence_threshold:0.9,
    executionAdapter:'real_orchestrator',realTaskType:'enterprise_memory',backing:'services/legacy/enterpriseMemoryService.js',
  },
  business_logic: {
    id:'EBD-ENG-00000015',name:'Business Logic Engine',type:'rules',provider:'local',status:'real',
    capabilities:['deterministic_rules','decision_support','risk_scoring','fraud_detection'],confidence_threshold:1,
    executionAdapter:'real_orchestrator',realTaskType:'business_logic_engine',backing:'services/legacy/decisionSupportService.js',
  },
  decision_mcda: {
    id:'EBD-ENG-00000016',name:'MCDA Decision Engine',type:'decision',provider:'local',status:'real',
    capabilities:['ranking','decision_support','optimization','analytics'],confidence_threshold:0.9,
    executionAdapter:'real_orchestrator',realTaskType:'decision_engine',backing:'core/mcda.js',
  },
  forecasting: {
    id:'EBD-ENG-00000017',name:'Demand Forecasting Engine',type:'forecast',provider:'local',status:'real',
    capabilities:['forecasting','time_series','analytics'],confidence_threshold:0.7,
    executionAdapter:'real_orchestrator',realTaskType:'forecasting_engine',backing:'services/advancedAIService/demandForecasting.js',
  },
  optimization: {
    id:'EBD-ENG-00000018',name:'Optimization/Ranking Engine',type:'optimization',provider:'local',status:'real',
    capabilities:['optimization','ranking','mcda'],confidence_threshold:0.9,
    executionAdapter:'real_orchestrator',realTaskType:'optimization_engine',backing:'core/mcda.js',
  },
  simulation: {
    id:'EBD-ENG-00000019',name:'Scenario Simulation Engine',type:'simulation',provider:'local',status:'partial',
    capabilities:['simulation','scenario_analysis'],confidence_threshold:0.5,
    executionAdapter:'real_orchestrator',realTaskType:'simulation_engine',backing:'services/legacy/advancedAIService.js',
    limitation:'Price-history wiring is incomplete for some current callers; insufficient data must remain explicit.',
  },
  workflow_proposal: {
    id:'EBD-ENG-00000020',name:'ERP AI Proposal Workflow Engine',type:'workflow',provider:'local',status:'real',
    capabilities:['workflow','proposal_generation','human_approval'],confidence_threshold:1,
    executionAdapter:'real_orchestrator',realTaskType:'workflow_engine',backing:'core/erpAgents.js',
  },
  module_dispatch: {
    id:'EBD-ENG-00000021',name:'Module Discovery/Dispatch Engine',type:'tooling',provider:'local',status:'real',
    capabilities:['module_discovery','tool_use','capability_dispatch'],confidence_threshold:1,
    executionAdapter:'real_orchestrator',realTaskType:'module_dispatch',backing:'core/moduleRegistry.js',
  },
  model_registry: {
    id:'EBD-ENG-00000022',name:'AI Model Registry',type:'governance',provider:'local',status:'real',
    capabilities:['model_registry','model_governance'],confidence_threshold:1,
    executionAdapter:'real_orchestrator',realTaskType:'model_registry',backing:'services/legacy/aiOrchestrationService.js',
  },
  hybrid_retrieval: {
    id:'EBD-ENG-00000023',name:'Hybrid Retrieval Engine',type:'retrieval',provider:'local',status:'real',
    capabilities:['retrieval','lexical_retrieval','semantic_retrieval','graph_retrieval','rrf_fusion','metadata_filtering'],
    confidence_threshold:0.8,executionAdapter:'hybrid_retrieval',backing:'services/hybridRetrievalService.js',
  },
  deterministic_algorithms: {
    id:'EBD-ENG-00000024',name:'Deterministic Algorithm Registry',type:'deterministic',provider:'local',status:'real',
    capabilities:['deterministic_calculation','formula','financial_math'],confidence_threshold:1,
    executionAdapter:'deterministic_registry',backing:'core/deterministicAlgorithmRegistry.js',
  },
  statistical_anomaly: {
    id:'EBD-ENG-00000025',name:'Statistical Anomaly Engine',type:'anomaly',provider:'local',status:'real',
    capabilities:['anomaly_detection','statistics'],confidence_threshold:0.7,
    executionAdapter:'statistical_anomaly',backing:'core/ai/statisticalAnomalyEngine.js',
  },
  transparent_risk: {
    id:'EBD-ENG-00000026',name:'Transparent Risk Scoring Engine',type:'risk',provider:'local',status:'real',
    capabilities:['risk_scoring','decision_support'],confidence_threshold:1,
    executionAdapter:'transparent_risk',backing:'core/ai/transparentRiskScoringEngine.js',
  },
  geospatial: {
    id:'EBD-ENG-00000027',name:'Geospatial Reasoning Engine',type:'geospatial',provider:'local',status:'real',
    capabilities:['geospatial','distance','geofence','route_measurement'],confidence_threshold:1,
    executionAdapter:'geospatial',backing:'core/ai/geospatialEngine.js',
  },
  evaluation: {
    id:'EBD-ENG-00000028',name:'AI Evaluation Harness',type:'evaluation',provider:'local',status:'real',
    capabilities:['evaluation','classification_metrics','regression_metrics','calibration','abstention_metrics'],
    confidence_threshold:1,executionAdapter:'evaluation',backing:'core/ai/evaluationHarness.js',
  },
  agent_runtime_gateway: {
    id:'EBD-ENG-00000029',name:'Isolated Agent Runtime Gateway',type:'agent_runtime',provider:'vercel_gateway',status:'configured_when_credentials_present',
    capabilities:['reasoning','analysis','classification','summarization','structured_output','tool_use','planning','recommendation','evaluation'],
    confidence_threshold:null,executionAdapter:'agent_runtime',backing:'core/ai/agentRuntimeService.js',costAuthority:'runtime-provider-pricing-required',
  },
};

const BACKEND_SRC = path.resolve(__dirname,'../..');

function engineKey(engine){
  const found=Object.entries(AI_ENGINES).find(([,value])=>value===engine||value.id===engine?.id);
  return found?found[0]:null;
}
function getEngine(engineId){return Object.values(AI_ENGINES).find((engine)=>engine.id===engineId);}
function getEngineByName(engineName){return AI_ENGINES[engineName];}
function getEnginesByType(type){return Object.values(AI_ENGINES).filter((engine)=>engine.type===type);}
function getEnginesByCapability(capability){return Object.values(AI_ENGINES).filter((engine)=>(engine.capabilities||[]).includes(capability));}
function listEngines(){return Object.values(AI_ENGINES);}
function backingExists(engine){
  if(!engine?.backing)return null;
  return fs.existsSync(path.resolve(BACKEND_SRC,engine.backing));
}

function getEngineRuntimeStatus(engineOrName){
  const engine=typeof engineOrName==='string'?(AI_ENGINES[engineOrName]||getEngine(engineOrName)):engineOrName;
  if(!engine)return {state:'unknown',available:false,configured:false,mapped:false};
  const key=engineKey(engine);

  if(engine.executionAdapter==='provider_metadata'){
    const provider=providerStatus(engine.provider);
    return {
      state:provider.configured?'configured_adapter_not_live':'not_configured',
      available:false,configured:provider.configured,mapped:false,
      reason:'Direct-provider registry entry is metadata only; live external execution uses the isolated agent runtime gateway.',
    };
  }
  if(engine.type==='speech'){
    const envName=engine.provider==='google'?'GOOGLE_SPEECH_API_KEY':engine.provider==='azure'?'AZURE_SPEECH_KEY':null;
    const configured=Boolean(envName&&process.env[envName]);
    return {state:configured?'configured_adapter_not_live':'not_configured',available:false,configured,mapped:true,reason:'Speech provider invocation remains intentionally not implemented.'};
  }
  if(key==='classification'){
    return {state:'unmapped',available:false,configured:true,mapped:false,reason:'Legacy standalone classification placeholder has no direct backing; use agent runtime or rule/LLM classification.'};
  }
  if(engine.executionAdapter==='agent_runtime'){
    const provider=providerStatus('vercel_gateway');
    const model=process.env.AI_AGENT_DEFAULT_MODEL||process.env.AI_GATEWAY_DEFAULT_MODEL||null;
    const file=backingExists(engine);
    const available=Boolean(file&&provider.configured&&model);
    return {
      state:available?'configured_live_adapter':'not_configured',
      available,configured:Boolean(provider.configured&&model),mapped:Boolean(file),
      backing:engine.backing,modelConfigured:Boolean(model),providerConfigured:provider.configured,
      reason:available?null:'Requires AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN plus AI_AGENT_DEFAULT_MODEL/AI_GATEWAY_DEFAULT_MODEL.',
    };
  }

  const exists=backingExists(engine);
  if(engine.executionAdapter&&exists){
    return {
      state:engine.status==='partial'?'verified_partial_local_backing':'verified_local_backing',
      available:true,configured:true,mapped:true,backing:engine.backing,
      limitation:engine.limitation||null,
    };
  }
  return {
    state:engine.executionAdapter?'missing_backing':(engine.status||'declared'),
    available:false,configured:false,mapped:false,
    backing:engine.backing||null,
    reason:engine.executionAdapter?'Backing source file is missing.':'No executable adapter recorded.',
  };
}

function getEngineRuntimeView(engineOrName){
  const engine=typeof engineOrName==='string'?(AI_ENGINES[engineOrName]||getEngine(engineOrName)):engineOrName;
  if(!engine)return null;
  return {...engine,registryKey:engineKey(engine),runtime:getEngineRuntimeStatus(engine)};
}
function listReadyEngines(){
  return Object.entries(AI_ENGINES)
    .map(([key,engine])=>({...engine,registryKey:key,runtime:getEngineRuntimeStatus(engine)}))
    .filter((engine)=>engine.runtime.available);
}
function registerEngine(engineConfig){
  const engineId=engineConfig.id||`EBD-ENG-${randomUUID().replace(/-/g,'').slice(0,16).toUpperCase()}`;
  const registryKey=engineConfig.key||String(engineConfig.name||engineId).trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'');
  AI_ENGINES[registryKey]={id:engineId,...engineConfig};
  delete AI_ENGINES[registryKey].key;
  logger.info(`Registered AI engine: ${engineConfig.name} (${engineId})`);
  return engineId;
}
function numericCost(engine){
  if(Number.isFinite(engine.cost_per_1k_tokens))return engine.cost_per_1k_tokens;
  if(Number.isFinite(engine.cost_per_request))return engine.cost_per_request;
  return Number.POSITIVE_INFINITY;
}
function findBestEngine(capability,options={}){
  const {preferProvider,maxCost,minConfidence,requireAvailable=false}=options;
  let candidates=getEnginesByCapability(capability);
  if(preferProvider)candidates=candidates.filter((e)=>e.provider===preferProvider);
  if(requireAvailable)candidates=candidates.filter((e)=>getEngineRuntimeStatus(e).available);
  if(maxCost!=null)candidates=candidates.filter((e)=>numericCost(e)<=maxCost);
  if(minConfidence!=null)candidates=candidates.filter((e)=>e.confidence_threshold!=null&&e.confidence_threshold>=minConfidence);
  candidates.sort((a,b)=>{
    const aa=getEngineRuntimeStatus(a).available?1:0,bb=getEngineRuntimeStatus(b).available?1:0;
    if(bb!==aa)return bb-aa;
    const ac=a.confidence_threshold??0,bc=b.confidence_threshold??0;
    if(bc!==ac)return bc-ac;
    return numericCost(a)-numericCost(b);
  });
  return candidates[0]||null;
}
function capabilityCoverage(){
  const capabilities=new Set();
  for(const engine of Object.values(AI_ENGINES))for(const c of engine.capabilities||[])capabilities.add(c);
  const result={};
  for(const capability of [...capabilities].sort()){
    const engines=getEnginesByCapability(capability);
    result[capability]={
      declared:engines.length,
      available:engines.filter((e)=>getEngineRuntimeStatus(e).available).length,
      engineKeys:engines.map(engineKey),
    };
  }
  return result;
}

module.exports={
  AI_ENGINES,getEngine,getEngineByName,getEnginesByType,getEnginesByCapability,listEngines,listReadyEngines,
  getEngineRuntimeStatus,getEngineRuntimeView,registerEngine,findBestEngine,capabilityCoverage,
};
