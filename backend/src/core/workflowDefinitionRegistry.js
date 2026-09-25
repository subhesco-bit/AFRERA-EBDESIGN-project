'use strict';

class WorkflowDefinitionRegistry {
  constructor(){this.definitions=new Map();}
  validate(id,definition={}){
    const errors=[];
    if(!id)errors.push('workflow id is required');
    const steps=Array.isArray(definition.steps)?definition.steps:[];
    const states=Array.isArray(definition.states)?definition.states:[];
    const transitions=definition.transitions&&typeof definition.transitions==='object'?definition.transitions:{};
    if(!steps.length&&!states.length)errors.push('workflow requires steps or states');
    const stepIds=new Set();
    for(const step of steps){
      if(!step?.id)errors.push('step id is required');
      else if(stepIds.has(step.id))errors.push('duplicate step id '+step.id);
      else stepIds.add(step.id);
      if(!step?.type)errors.push('step '+(step?.id||'?')+' requires type');
    }
    const stateSet=new Set(states);
    if(states.length!==stateSet.size)errors.push('states must be unique');
    if(states.length){
      if(!definition.initialState)errors.push('initialState is required for state workflows');
      else if(!stateSet.has(definition.initialState))errors.push('initialState is not declared');
      for(const [from,toList] of Object.entries(transitions)){
        if(!stateSet.has(from))errors.push('transition source not declared: '+from);
        if(!Array.isArray(toList)){errors.push('transition list must be array: '+from);continue;}
        for(const to of toList)if(!stateSet.has(to))errors.push('transition target not declared: '+from+' -> '+to);
      }
      for(const terminal of definition.terminalStates||[]){
        if(!stateSet.has(terminal))errors.push('terminal state not declared: '+terminal);
        if((transitions[terminal]||[]).length)errors.push('terminal state has outbound transitions: '+terminal);
      }
      if(definition.initialState&&stateSet.has(definition.initialState)){
        const seen=new Set();const q=[definition.initialState];
        while(q.length){const s=q.shift();if(seen.has(s))continue;seen.add(s);for(const n of transitions[s]||[])q.push(n);}
        for(const s of states)if(!seen.has(s))errors.push('unreachable state from initialState: '+s);
      }
    }
    for(const [name,hours] of Object.entries(definition.slaHours||{})){
      if(!Number.isFinite(Number(hours))||Number(hours)<=0)errors.push('SLA must be positive for '+name);
    }
    for(const approval of definition.approvals||[]){
      if(!approval?.id)errors.push('approval id is required');
      if(!approval?.roles?.length)errors.push('approval '+(approval?.id||'?')+' requires roles');
    }
    return {valid:errors.length===0,errors};
  }
  register(id,definition={}){
    const result=this.validate(id,definition);
    if(!result.valid){const e=new Error('Invalid workflow '+id+': '+result.errors.join('; '));e.code='WORKFLOW_DEFINITION_INVALID';e.details=result.errors;throw e;}
    const normalized={id,name:definition.name||id,description:definition.description||'',states:definition.states||[],transitions:definition.transitions||{},initialState:definition.initialState||null,terminalStates:definition.terminalStates||[],steps:definition.steps||[],triggers:definition.triggers||[],slaHours:definition.slaHours||{},approvals:definition.approvals||[],exceptions:definition.exceptions||[],compensations:definition.compensations||{},owner:definition.owner||null,version:String(definition.version||'1.0.0'),source:definition.source||null};
    this.definitions.set(id,normalized);return normalized;
  }
  get(id){return this.definitions.get(id)||null;}
  list(){return [...this.definitions.values()];}
}

const workflowRegistry=new WorkflowDefinitionRegistry();
module.exports={WorkflowDefinitionRegistry,workflowRegistry};
