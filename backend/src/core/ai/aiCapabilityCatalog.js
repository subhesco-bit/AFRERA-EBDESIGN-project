'use strict';

const { AI_ENGINES, getEngineRuntimeView } = require('./aiEngineRegistry');
const { ADVANCED_AI_MODELS } = require('../../services/advancedAIService/models');
const { AI_MODELS } = require('../../services/aiService/models');
const { MODELS: GOVERNED_MODELS } = require('../../services/ai/modelRegistryGovernance');

function modalitiesFor(entry={}) {
  const type=String(entry.type||'').toLowerCase();
  if(type.includes('vision')||type.includes('computer_vision'))return ['image'];
  if(type.includes('speech'))return ['audio','text'];
  if(type.includes('llm'))return ['text'];
  if(type.includes('multimodal'))return ['text','image','structured-data'];
  return ['structured-data','text'];
}

function riskClassFor(id,entry={}) {
  const text=(id+' '+JSON.stringify(entry)).toLowerCase();
  if(/credit|loan|insurance|clinical|prescription|medical/.test(text))return 'high';
  if(/fraud|eligibility|pricing|risk|disease|veterinary/.test(text))return 'elevated';
  if(/llm|agent|recommend|speech|vision/.test(text))return 'context-dependent';
  return 'standard';
}

function buildAICapabilityCatalog(){
  const records=[];
  for(const [key,engine] of Object.entries(AI_ENGINES)){
    const runtime=getEngineRuntimeView(key);
    records.push({
      id:'engine:'+key,
      sourceType:'engine-registry',
      name:engine.name,
      type:engine.type,
      provider:engine.provider,
      capabilities:engine.capabilities||[],
      modalities:modalitiesFor(engine),
      runtime:runtime.runtime,
      riskClass:riskClassFor(key,engine),
      confidenceThreshold:engine.confidence_threshold??null,
      legacyCostEstimate:{per1kTokens:engine.cost_per_1k_tokens??null,perRequest:engine.cost_per_request??null,perMinute:engine.cost_per_minute??null,authority:'legacy-static-not-billing-authority'},
      autoExecutionEligible:Boolean(runtime.runtime.available)&&riskClassFor(key,engine)==='standard',
      evidenceSource:'backend/src/core/ai/aiEngineRegistry.js'
    });
  }

  for(const [key,model] of Object.entries(ADVANCED_AI_MODELS)){
    records.push({id:'declared:advanced:'+key,sourceType:'declared-model-metadata',name:key,type:model.type,provider:'unspecified',capabilities:[key],modalities:modalitiesFor(model),runtime:{state:'declared_unverified',available:false,configured:false,mapped:false},riskClass:riskClassFor(key,model),accuracyClaim:model.accuracy??null,accuracyClaimAuthority:'legacy-static-metadata-unverified',autoExecutionEligible:false,evidenceSource:'backend/src/services/advancedAIService/models.js',modelVersion:model.model_version||null,retrainingInterval:model.retraining_interval||null});
  }

  for(const [key,model] of Object.entries(AI_MODELS)){
    records.push({id:'declared:baseline:'+key,sourceType:'declared-model-metadata',name:key,type:model.type,provider:'unspecified',capabilities:[key],modalities:modalitiesFor(model),runtime:{state:'declared_unverified',available:false,configured:false,mapped:false},riskClass:riskClassFor(key,model),accuracyClaim:model.accuracy??null,accuracyClaimAuthority:'legacy-static-metadata-unverified',autoExecutionEligible:false,evidenceSource:'backend/src/services/aiService/models.js'});
  }

  for(const model of GOVERNED_MODELS){
    records.push({id:'governed:'+model.id,sourceType:'governance-registry',name:model.name,type:model.type,provider:'local-or-service',capabilities:[model.id],modalities:modalitiesFor(model),runtime:{state:model.status||'unknown',available:model.status==='verified',configured:true,mapped:true},riskClass:riskClassFor(model.id,model),advisory:Boolean(model.advisory),policyVersion:model.policy_version||null,autoExecutionEligible:model.status==='verified'&&!model.advisory&&riskClassFor(model.id,model)==='standard',evidenceSource:'backend/src/services/ai/modelRegistryGovernance.js',endpoint:model.endpoint||null});
  }

  records.push({id:'knowledge:hybrid-retrieval',sourceType:'knowledge-engine',name:'Hybrid Retrieval and Knowledge Search',type:'retrieval',provider:'local',capabilities:['lexical_retrieval','semantic_retrieval','graph_retrieval','rrf_fusion','metadata_filtering'],modalities:['text','structured-data'],runtime:{state:'verified_local_backing',available:true,configured:true,mapped:true},riskClass:'standard',autoExecutionEligible:true,evidenceSource:'backend/src/services/hybridRetrievalService.js',fallback:'deterministic hashed-vector semantic channel when no embedding provider is configured'});

  return records;
}

function summarize(records=buildAICapabilityCatalog()){
  const byState={},byType={},byRisk={};
  for(const r of records){const state=r.runtime?.state||'unknown';byState[state]=(byState[state]||0)+1;byType[r.type]=(byType[r.type]||0)+1;byRisk[r.riskClass]=(byRisk[r.riskClass]||0)+1;}
  return {count:records.length,available:records.filter(r=>r.runtime?.available).length,autoExecutionEligible:records.filter(r=>r.autoExecutionEligible).length,unverifiedAccuracyClaims:records.filter(r=>r.accuracyClaim!=null&&r.accuracyClaimAuthority?.includes('unverified')).length,byState,byType,byRisk};
}

module.exports={buildAICapabilityCatalog,summarize,modalitiesFor,riskClassFor};
