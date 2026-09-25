'use strict';

const fs=require('fs');
const path=require('path');

const BACKINGS=Object.freeze({
  knowledge:'services/hybridRetrievalService.js',
  enterpriseCases:'services/platform/enterpriseMemoryService.js',
  outcomeSink:'core/outcomeSink.js',
  outcomeResolver:'core/outcomeResolver.js',
  schema:'database/migrations/9997_enterprise_memory_schema.sql',
});

function exists(relative){return fs.existsSync(path.resolve(__dirname,'../..',relative));}

function status(){
  const backings={};
  for(const [name,relative] of Object.entries(BACKINGS))backings[name]={path:'backend/src/'+relative,exists:exists(relative)};
  return {
    status:Object.values(backings).every((x)=>x.exists)?'ready':'degraded',
    backings,
    memoryClasses:{
      taskScoped:{status:'runtime',owner:'agentRuntimeService',persistence:'none by default'},
      knowledge:{status:backings.knowledge.exists?'ready':'missing',mode:'hybrid retrieval'},
      enterpriseCase:{status:backings.enterpriseCases.exists?'ready':'missing',mode:'Postgres case memory'},
      outcome:{status:backings.outcomeSink.exists&&backings.outcomeResolver.exists?'ready':'missing',mode:'prediction/outcome/calibration memory'},
    },
    externalAccessPolicy:'No raw enterprise memory is sent to external agents by default; isolation transformer minimization applies.',
  };
}

async function recallKnowledge(query,options={}){
  return require('../../services/hybridRetrievalService').singleton.search(query,options);
}
async function recallCases(query,options={}){
  return require('../../services/platform/enterpriseMemoryService').recallSimilar(query,options);
}
async function recallEntity(entityType,entityId,options={}){
  return require('../../services/platform/enterpriseMemoryService').recallByEntity(entityType,entityId,options);
}
async function actorGate(actorId){
  return require('../outcomeResolver').gateFor(actorId);
}
async function actorAccuracy(){
  return require('../outcomeSink').getAccuracy();
}
async function calibration(){
  return require('../outcomeSink').getCalibration();
}
async function runLearningCycle(){
  return require('../outcomeResolver').runCycle();
}

module.exports={BACKINGS,status,recallKnowledge,recallCases,recallEntity,actorGate,actorAccuracy,calibration,runLearningCycle};
