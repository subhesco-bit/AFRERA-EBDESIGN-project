'use strict';

const crypto=require('crypto');
const contract=require('../../../.ai/autonomous-program/MODULE_LIFECYCLE.json');

class ModuleLifecycle {
  constructor(moduleId, initial='discovered') {
    if(!moduleId) throw new Error('moduleId is required');
    if(!contract.states.includes(initial)) throw new Error('invalid initial state '+initial);
    this.moduleId=moduleId;this.instanceId=crypto.randomUUID();this.state=initial;
    this.history=[{at:new Date().toISOString(),from:null,to:initial,reason:'created',evidence:[]}];
  }
  canTransition(to){ return (contract.transitions[this.state]||[]).includes(to); }
  transition(to, options={}){
    if(!contract.states.includes(to)) throw new Error('unknown lifecycle state '+to);
    if(!this.canTransition(to)) throw new Error('invalid lifecycle transition '+this.state+' -> '+to);
    const from=this.state;this.state=to;
    const record={at:new Date().toISOString(),from,to,reason:options.reason||null,evidence:Array.isArray(options.evidence)?options.evidence:[],metadata:options.metadata||{}};
    this.history.push(record);return record;
  }
  degrade(reason,evidence=[]){return this.transition('degraded',{reason,evidence});}
  fail(error,evidence=[]){return this.transition('error',{reason:error?.message||String(error),evidence,metadata:{code:error?.code||null}});}
  shutdown(reason='shutdown requested'){return this.transition('shutdown',{reason});}
  snapshot(){return {moduleId:this.moduleId,instanceId:this.instanceId,state:this.state,history:[...this.history]};}
}

module.exports={ ModuleLifecycle, lifecycleContract:contract };
