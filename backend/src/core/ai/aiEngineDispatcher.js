'use strict';

const { AI_ENGINES, getEngine, getEngineRuntimeStatus } = require('./aiEngineRegistry');

function resolveEngine(engineOrKey){
  if(typeof engineOrKey==='string')return AI_ENGINES[engineOrKey]||getEngine(engineOrKey);
  return engineOrKey||null;
}

async function dispatch(engineOrKey,input={},options={}){
  const engine=resolveEngine(engineOrKey);
  if(!engine){const e=new Error('Unknown AI engine');e.code='AI_ENGINE_UNKNOWN';throw e;}
  const runtime=getEngineRuntimeStatus(engine);
  if(!runtime.available && options.allowUnavailable!==true){
    const e=new Error(`AI engine is not executable: ${engine.name} (${runtime.state})`);
    e.code='AI_ENGINE_NOT_EXECUTABLE';e.runtime=runtime;throw e;
  }

  switch(engine.executionAdapter){
    case 'real_orchestrator': {
      const orchestrator=require('../aiOrchestrator');
      const payload=options.payloadBuilder?options.payloadBuilder(input,engine,options):(options.realPayload||input);
      return orchestrator.route(engine.realTaskType,payload,options.routeOptions||{});
    }
    case 'hybrid_retrieval': {
      const svc=require('../../services/hybridRetrievalService').singleton;
      const query=typeof input==='string'?input:(input.query||'');
      return svc.search(query,{...(input.options||{}),...(options.searchOptions||{})});
    }
    case 'deterministic_registry': {
      const registry=require('../deterministicAlgorithmCatalog').buildDeterministicAlgorithmRegistry();
      const algorithmId=input.algorithmId||options.algorithmId;
      if(!algorithmId){const e=new Error('deterministic engine requires algorithmId');e.code='AI_ALGORITHM_ID_REQUIRED';throw e;}
      return registry.run(algorithmId,input.input||input.parameters||{});
    }
    case 'statistical_anomaly':
      return require('./statisticalAnomalyEngine').analyze(input);
    case 'transparent_risk':
      return require('./transparentRiskScoringEngine').score(input);
    case 'geospatial':
      return require('./geospatialEngine').execute(input.operation,input.input||input);
    case 'evaluation':
      return require('./evaluationHarness').evaluate(input.kind,input.rows||[],input.options||{});
    case 'agent_runtime': {
      const runtimeService=require('./agentRuntimeService');
      const templateId=input.templateId||options.templateId;
      if(!templateId){const e=new Error('agent runtime requires templateId');e.code='AI_AGENT_TEMPLATE_REQUIRED';throw e;}
      const task=input.task??input.input??input;
      return runtimeService.execute(templateId,task,options.context||{},options.agentOptions||{});
    }
    default: {
      const e=new Error('AI engine has no dispatcher adapter: '+engine.name);e.code='AI_ENGINE_ADAPTER_MISSING';throw e;
    }
  }
}

module.exports={dispatch,resolveEngine};
