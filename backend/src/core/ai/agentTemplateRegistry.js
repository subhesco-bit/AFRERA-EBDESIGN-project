'use strict';

const crypto = require('crypto');

const WORKFLOW_PATTERNS = new Set([
  'augmented_llm',
  'prompt_chain',
  'routing',
  'parallel_specialists',
  'evaluator_optimizer',
  'supervisor_handoff',
  'tool_loop',
  'human_approval_workflow',
]);
const RISK_CLASSES = new Set(['standard','elevated','high','critical']);

function uniqueStrings(values = []) {
  return [...new Set((values || []).map(String).map((v) => v.trim()).filter(Boolean))];
}

class PromptTemplateRegistry {
  constructor(){this.prompts=new Map();}
  validate(id, definition={}) {
    const errors=[];
    if(!id||typeof id!=='string') errors.push('prompt id is required');
    if(!definition.instructions||typeof definition.instructions!=='string') errors.push('instructions are required');
    if(definition.variables&&!Array.isArray(definition.variables)) errors.push('variables must be an array');
    if(definition.outputContract&&typeof definition.outputContract!=='object') errors.push('outputContract must be an object');
    return {valid:errors.length===0,errors};
  }
  register(id, definition={}) {
    const check=this.validate(id,definition);
    if(!check.valid){const e=new Error('Invalid prompt template '+id+': '+check.errors.join('; '));e.code='PROMPT_TEMPLATE_INVALID';e.details=check.errors;throw e;}
    const record={
      id,
      version:String(definition.version||'1.0.0'),
      name:definition.name||id,
      instructions:definition.instructions,
      variables:uniqueStrings(definition.variables),
      outputContract:definition.outputContract||{},
      evidencePolicy:definition.evidencePolicy||'cite_tool_or_source_evidence',
      jurisdiction:definition.jurisdiction||null,
      safetyNotes:uniqueStrings(definition.safetyNotes),
      sourcePatterns:definition.sourcePatterns||[],
      status:definition.status||'active',
    };
    record.instructionsSha256=crypto.createHash('sha256').update(record.instructions).digest('hex');
    this.prompts.set(id,record);return record;
  }
  get(id){return this.prompts.get(id)||null;}
  render(id, variables={}) {
    const prompt=this.get(id);
    if(!prompt){const e=new Error('Prompt template not found: '+id);e.code='PROMPT_TEMPLATE_NOT_FOUND';throw e;}
    let rendered=prompt.instructions;
    for(const variable of prompt.variables){
      if(!(variable in variables)){const e=new Error('Missing prompt variable: '+variable);e.code='PROMPT_VARIABLE_MISSING';throw e;}
      rendered=rendered.split('{{'+variable+'}}').join(String(variables[variable]));
    }
    return rendered;
  }
  publicMetadata(id){
    const p=this.get(id);if(!p)return null;
    const {instructions,...meta}=p;return meta;
  }
  listPublic(){return [...this.prompts.keys()].map((id)=>this.publicMetadata(id));}
}

class AgentTemplateRegistry {
  constructor(options={}){this.templates=new Map();this.promptRegistry=options.promptRegistry||new PromptTemplateRegistry();}
  validate(id, definition={}) {
    const errors=[];
    if(!id||typeof id!=='string')errors.push('template id is required');
    if(!definition.name)errors.push('name is required');
    if(!definition.stream)errors.push('stream is required');
    if(!WORKFLOW_PATTERNS.has(definition.pattern))errors.push('invalid workflow pattern');
    if(!RISK_CLASSES.has(definition.riskClass||'standard'))errors.push('invalid riskClass');
    if(!definition.promptId||!this.promptRegistry.get(definition.promptId))errors.push('registered promptId is required');
    if(definition.tools&&!Array.isArray(definition.tools))errors.push('tools must be an array');
    const maxSteps=Number(definition.maxSteps||8);
    if(!Number.isInteger(maxSteps)||maxSteps<1||maxSteps>30)errors.push('maxSteps must be an integer from 1 to 30');
    return {valid:errors.length===0,errors};
  }
  register(id, definition={}) {
    const check=this.validate(id,definition);
    if(!check.valid){const e=new Error('Invalid agent template '+id+': '+check.errors.join('; '));e.code='AGENT_TEMPLATE_INVALID';e.details=check.errors;throw e;}
    const record={
      id,
      version:String(definition.version||'1.0.0'),
      name:definition.name,
      stream:definition.stream,
      domain:definition.domain||definition.stream,
      description:definition.description||'',
      pattern:definition.pattern,
      riskClass:definition.riskClass||'standard',
      promptId:definition.promptId,
      tools:uniqueStrings(definition.tools),
      maxSteps:Number(definition.maxSteps||8),
      providerPolicy:{
        mode:definition.providerPolicy?.mode||'capability_routed',
        requiredCapabilities:uniqueStrings(definition.providerPolicy?.requiredCapabilities),
        preferredFamilies:uniqueStrings(definition.providerPolicy?.preferredFamilies),
        allowGateway:definition.providerPolicy?.allowGateway!==false,
        allowLocal:definition.providerPolicy?.allowLocal!==false,
      },
      inputGuardrails:uniqueStrings(definition.inputGuardrails),
      outputGuardrails:uniqueStrings(definition.outputGuardrails),
      approvalPolicy:{
        executionApprovalRequired:Boolean(definition.approvalPolicy?.executionApprovalRequired),
        mutationToolsRequireApproval:definition.approvalPolicy?.mutationToolsRequireApproval!==false,
        humanReviewRequired:Boolean(definition.approvalPolicy?.humanReviewRequired),
        finalizationRequiresHuman:Boolean(definition.approvalPolicy?.finalizationRequiresHuman),
      },
      outputUsePolicy:{
        draftOnly:Boolean(definition.outputUsePolicy?.draftOnly),
        decisionAuthority:definition.outputUsePolicy?.decisionAuthority||'assistive',
        prohibitedUses:uniqueStrings(definition.outputUsePolicy?.prohibitedUses),
      },
      memoryPolicy:definition.memoryPolicy||'task_scoped',
      sourcePatterns:definition.sourcePatterns||[],
      tags:uniqueStrings(definition.tags),
      enabled:definition.enabled!==false,
      status:definition.status||'active',
    };
    this.templates.set(id,record);return record;
  }
  get(id){return this.templates.get(id)||null;}
  list(filter={}){
    return [...this.templates.values()].filter((t)=>(!filter.stream||t.stream===filter.stream)&&(!filter.riskClass||t.riskClass===filter.riskClass)&&(filter.enabled==null||t.enabled===filter.enabled));
  }
  publicMetadata(id){
    const t=this.get(id);if(!t)return null;
    return {...t,prompt:this.promptRegistry.publicMetadata(t.promptId)};
  }
  listPublic(filter={}){return this.list(filter).map((t)=>this.publicMetadata(t.id));}
}

module.exports={PromptTemplateRegistry,AgentTemplateRegistry,WORKFLOW_PATTERNS,RISK_CLASSES};
