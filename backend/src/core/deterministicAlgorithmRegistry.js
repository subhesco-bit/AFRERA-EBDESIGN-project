'use strict';

class DeterministicAlgorithmRegistry {
  constructor(){this.algorithms=new Map();}
  validate(id,definition={}){
    const errors=[];
    if(!id||typeof id!=='string')errors.push('id is required');
    if(!definition.domain)errors.push('domain is required');
    if(!definition.kind)errors.push('kind is required');
    if(typeof definition.execute!=='function')errors.push('execute function is required');
    if(!definition.basis)errors.push('basis is required');
    if(!definition.source)errors.push('source is required');
    if(definition.deterministic!==true)errors.push('deterministic must be true');
    if(definition.inputs&&!Array.isArray(definition.inputs))errors.push('inputs must be an array');
    if(definition.outputs&&!Array.isArray(definition.outputs))errors.push('outputs must be an array');
    return {valid:errors.length===0,errors};
  }
  register(id,definition={}){
    const check=this.validate(id,definition);
    if(!check.valid){const e=new Error('Invalid deterministic algorithm '+id+': '+check.errors.join('; '));e.code='ALGORITHM_DEFINITION_INVALID';e.details=check.errors;throw e;}
    const record={id,version:String(definition.version||'1.0.0'),domain:definition.domain,kind:definition.kind,deterministic:true,inputs:definition.inputs||[],outputs:definition.outputs||[],units:definition.units||{},basis:definition.basis,limitations:definition.limitations||[],evidenceClass:definition.evidenceClass||'CALCULATED',source:definition.source,tests:definition.tests||[],execute:definition.execute};
    this.algorithms.set(id,record);return record;
  }
  get(id){return this.algorithms.get(id)||null;}
  list(){return [...this.algorithms.values()].map(({execute,...meta})=>meta);}
  run(id,input){
    const algorithm=this.get(id);
    if(!algorithm){const e=new Error('Algorithm not found: '+id);e.code='ALGORITHM_NOT_FOUND';throw e;}
    const started=Date.now();
    const value=algorithm.execute(input);
    if(value&&typeof value.then==='function')throw new Error('DeterministicAlgorithmRegistry.run requires synchronous pure calculation; use a service wrapper for I/O');
    return {algorithmId:id,version:algorithm.version,domain:algorithm.domain,kind:algorithm.kind,deterministic:true,evidenceClass:algorithm.evidenceClass,basis:algorithm.basis,limitations:algorithm.limitations,source:algorithm.source,durationMs:Date.now()-started,value};
  }
}

module.exports={DeterministicAlgorithmRegistry};
