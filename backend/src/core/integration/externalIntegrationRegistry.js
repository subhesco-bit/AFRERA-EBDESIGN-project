'use strict';

const { randomUUID, createHash } = require('crypto');

const CATEGORIES = new Set(['payment','banking','logistics','weather','government','messaging','maps','identity','erp','storage','observability','ai','commerce','other']);
const AUTH_MODES = new Set(['none','api-key','basic','oauth2','oidc','hmac','signed-webhook','service-account','mutual-tls','custom']);
const TRANSPORTS = new Set(['sdk','https','webhook','smtp','queue','database','file','local']);

function normalizeEnvNames(names=[]) {
  return [...new Set((names||[]).map(String).filter(Boolean))].sort();
}

function validateContract(id, contract={}) {
  const errors=[];
  if(!id||typeof id!=='string')errors.push('integration id is required');
  if(!contract.provider)errors.push('provider is required');
  if(!CATEGORIES.has(contract.category||'other'))errors.push('invalid category');
  if(!TRANSPORTS.has(contract.transport||'https'))errors.push('invalid transport');
  if(!AUTH_MODES.has(contract.authMode||'none'))errors.push('invalid authMode');
  if(!Array.isArray(contract.capabilities)||contract.capabilities.length===0)errors.push('capabilities must be a non-empty array');
  if(contract.timeoutMs!=null&&(!Number.isFinite(Number(contract.timeoutMs))||Number(contract.timeoutMs)<=0))errors.push('timeoutMs must be positive');
  if(contract.maxAttempts!=null&&(!Number.isInteger(Number(contract.maxAttempts))||Number(contract.maxAttempts)<1||Number(contract.maxAttempts)>10))errors.push('maxAttempts must be an integer between 1 and 10');
  if(contract.dataClassifications&&!Array.isArray(contract.dataClassifications))errors.push('dataClassifications must be an array');
  return {valid:errors.length===0,errors};
}

class ExternalIntegrationRegistry {
  constructor(options={}){this.contracts=new Map();this.adapters=new Map();this.env=options.env||process.env;}
  register(id,contract={},adapter=null){
    const check=validateContract(id,contract);
    if(!check.valid){const e=new Error('Invalid integration '+id+': '+check.errors.join('; '));e.code='INTEGRATION_CONTRACT_INVALID';e.details=check.errors;throw e;}
    const normalized={
      id,
      provider:String(contract.provider),
      category:contract.category||'other',
      transport:contract.transport||'https',
      authMode:contract.authMode||'none',
      capabilities:[...new Set(contract.capabilities.map(String))],
      requiredEnv:normalizeEnvNames(contract.requiredEnv),
      optionalEnv:normalizeEnvNames(contract.optionalEnv),
      timeoutMs:Number(contract.timeoutMs||10000),
      maxAttempts:Number(contract.maxAttempts||1),
      retryableStatusCodes:contract.retryableStatusCodes||[408,425,429,500,502,503,504],
      idempotentOperations:[...new Set(contract.idempotentOperations||[])],
      webhookVerification:contract.webhookVerification||null,
      dataClassifications:contract.dataClassifications||['internal'],
      direction:contract.direction||'bidirectional',
      healthOperation:contract.healthOperation||null,
      source:contract.source||null,
      status:contract.status||'declared',
      notes:contract.notes||null
    };
    this.contracts.set(id,normalized);
    if(adapter)this.adapters.set(id,adapter);
    return this.describe(id);
  }
  bindAdapter(id,adapter){if(!this.contracts.has(id))throw new Error('Integration contract not registered: '+id);this.adapters.set(id,adapter);return this.describe(id);}
  get(id){return this.contracts.get(id)||null;}
  getAdapter(id){return this.adapters.get(id)||null;}
  configuration(id){
    const contract=this.get(id);if(!contract)return null;
    const missing=contract.requiredEnv.filter((name)=>!this.env[name]);
    return {configured:missing.length===0,missingRequiredEnv:missing,requiredEnv:[...contract.requiredEnv],optionalEnv:[...contract.optionalEnv]};
  }
  describe(id){
    const contract=this.get(id);if(!contract)return null;
    const config=this.configuration(id);
    const adapter=this.getAdapter(id);
    const operations=adapter&&typeof adapter==='object'?Object.keys(adapter).filter((key)=>typeof adapter[key]==='function'):[];
    return {...contract,configuration:config,adapterBound:Boolean(adapter),operations};
  }
  list(){return [...this.contracts.keys()].map((id)=>this.describe(id));}
  status(id){
    const d=this.describe(id);
    if(!d)return {state:'unknown',available:false};
    if(!d.configuration.configured)return {state:'not_configured',available:false,...d};
    if(!d.adapterBound)return {state:'configured_no_adapter',available:false,...d};
    return {state:'adapter_ready',available:true,...d};
  }
  redact(value){
    if(value==null||typeof value!=='object')return value;
    const sensitive=/secret|token|password|authorization|api[_-]?key|private[_-]?key|signature|credential/i;
    if(Array.isArray(value))return value.map((v)=>this.redact(v));
    const out={};
    for(const [k,v] of Object.entries(value))out[k]=sensitive.test(k)?'[REDACTED]':this.redact(v);
    return out;
  }
  fingerprintRequest(id,operation,payload){
    return createHash('sha256').update(JSON.stringify({id,operation,payload:this.redact(payload)})).digest('hex');
  }
}

module.exports={ExternalIntegrationRegistry,validateContract,CATEGORIES,AUTH_MODES,TRANSPORTS};
