'use strict';

const crypto = require('crypto');
const contract = require('../../../.ai/autonomous-program/EXECUTION_WIRE_CONTRACT.json');

function id() { return crypto.randomUUID(); }

function createContext(input = {}) {
  return {
    requestId: input.requestId || id(),
    correlationId: input.correlationId || input.requestId || id(),
    actor: input.actor || null, tenantId: input.tenantId || null,
    roles: Array.isArray(input.roles) ? input.roles : [],
    permissions: Array.isArray(input.permissions) ? input.permissions : [],
    idempotencyKey: input.idempotencyKey || null,
    deadlineMs: Number(input.deadlineMs || 30000),
    mutating: input.mutating === true,
    authorization: input.authorization || null,
    idempotencyStore: input.idempotencyStore || null,
  };
}

function validateModule(module) {
  const errors=[];
  if(!module || typeof module!=='object') return {valid:false,errors:['module must be an object']};
  for(const method of contract.requiredModuleMethods){ if(typeof module[method] !== 'function') errors.push('missing method '+method); }
  if(!module.moduleId && !module.constructor?.MODULE_ID) errors.push('moduleId is required');
  return {valid:errors.length===0,errors};
}

function errorEnvelope(moduleId, operation, context, startedAt, error) {
  return { success:false,moduleId,operation,requestId:context.requestId,correlationId:context.correlationId,timestamp:new Date().toISOString(),durationMs:Date.now()-startedAt,data:null,error:{code:error.code||'MODULE_EXECUTION_ERROR',message:error.message||String(error),category:error.category||'execution',retryable:error.retryable===true,details:error.details||null},warnings:[],evidence:[] };
}

function successEnvelope(moduleId, operation, context, startedAt, data, evidence = []) {
  return { success:true,moduleId,operation,requestId:context.requestId,correlationId:context.correlationId,timestamp:new Date().toISOString(),durationMs:Date.now()-startedAt,data,error:null,warnings:[],evidence };
}

async function executeWithContract(module, operation, parameters = {}, inputContext = {}) {
  const context=createContext(inputContext);
  const check=validateModule(module);
  if(!check.valid) throw new Error('Invalid executable module: '+check.errors.join('; '));
  const moduleId=module.moduleId || module.constructor.MODULE_ID;
  const startedAt=Date.now();
  if(context.mutating && !context.idempotencyKey) return errorEnvelope(moduleId,operation,context,startedAt,Object.assign(new Error('idempotencyKey is required for mutating operations'),{code:'IDEMPOTENCY_REQUIRED',category:'validation'}));
  if(typeof context.authorization === 'function'){
    const allowed=await context.authorization({moduleId,operation,parameters,context});
    if(allowed !== true) return errorEnvelope(moduleId,operation,context,startedAt,Object.assign(new Error('operation is not authorized'),{code:'FORBIDDEN',category:'authorization'}));
  }
  if(context.idempotencyStore && context.idempotencyKey){
    const existing=await context.idempotencyStore.get(context.idempotencyKey);
    if(existing) return {...existing,replayed:true};
  }
  try{
    let timer=null;
    const timeout=new Promise((_,reject)=>{
      timer=setTimeout(()=>reject(Object.assign(new Error('execution deadline exceeded'),{code:'EXECUTION_TIMEOUT',category:'timeout',retryable:true})),context.deadlineMs);
    });
    let data;
    try {
      data=await Promise.race([Promise.resolve(module.execute(operation,parameters,context)),timeout]);
    } finally {
      if(timer) clearTimeout(timer);
    }
    const envelope=successEnvelope(moduleId,operation,context,startedAt,data);
    if(context.idempotencyStore && context.idempotencyKey) await context.idempotencyStore.set(context.idempotencyKey,envelope);
    return envelope;
  }catch(error){ return errorEnvelope(moduleId,operation,context,startedAt,error); }
}

module.exports={ contract, createContext, validateModule, executeWithContract, successEnvelope, errorEnvelope };
