'use strict';

const crypto = require('crypto');
const { buildAgentTemplateRegistry } = require('./agentTemplateCatalog');
const { buildAgentToolRegistry } = require('./agentToolRegistry');

class AgentRuntimeService {
  constructor(options={}){
    const built=options.templateBundle||buildAgentTemplateRegistry();
    this.promptRegistry=built.promptRegistry;
    this.agentRegistry=built.agentRegistry;
    this.toolRegistry=options.toolRegistry||buildAgentToolRegistry();
    this.env=options.env||process.env;
    this.sdkLoader=options.sdkLoader||(()=>import('ai'));
    this.governance=options.governance||null;
  }

  runtimeStatus(){
    const model=this.env.AI_AGENT_DEFAULT_MODEL||this.env.AI_GATEWAY_DEFAULT_MODEL||null;
    const gatewayCredential=Boolean(this.env.AI_GATEWAY_API_KEY||this.env.VERCEL_OIDC_TOKEN);
    return {
      sdk:'ai',
      sdkExpectedMajor:7,
      modelConfigured:Boolean(model),
      defaultModel:model,
      gatewayConfigured:gatewayCredential,
      executable:Boolean(model&&gatewayCredential),
      credentialSources:{aiGatewayApiKey:Boolean(this.env.AI_GATEWAY_API_KEY),vercelOidcToken:Boolean(this.env.VERCEL_OIDC_TOKEN)},
    };
  }

  _resolveModel(options={}){
    const configured=this.env.AI_AGENT_DEFAULT_MODEL||this.env.AI_GATEWAY_DEFAULT_MODEL||null;
    if(options.modelOverride){
      const allowed=String(this.env.AI_AGENT_ALLOWED_MODELS||'').split(',').map((x)=>x.trim()).filter(Boolean);
      if(!allowed.includes(options.modelOverride)){const e=new Error('Requested model override is not allow-listed');e.code='AI_AGENT_MODEL_NOT_ALLOWED';throw e;}
      return options.modelOverride;
    }
    return configured;
  }

  _publicToolMetadata(template){
    return template.tools.map((id)=>{
      const t=this.toolRegistry.get(id);
      if(!t)return {id,registered:false};
      return {id,registered:true,description:t.description,riskClass:t.riskClass,mutates:t.mutates,needsApproval:Boolean(t.needsApproval),source:t.source,dataAccess:t.dataAccess};
    });
  }

  plan(templateId,input={},options={}){
    const template=this.agentRegistry.get(templateId);
    if(!template){const e=new Error('Agent template not found: '+templateId);e.code='AGENT_TEMPLATE_NOT_FOUND';throw e;}
    if(!template.enabled){const e=new Error('Agent template disabled: '+templateId);e.code='AGENT_TEMPLATE_DISABLED';throw e;}
    const model=this._resolveModel(options);
    const prompt=this.promptRegistry.get(template.promptId);
    const promptVariables=options.promptVariables||{};
    const instructions=this.promptRegistry.render(template.promptId,promptVariables);
    return {
      template:this.agentRegistry.publicMetadata(templateId),
      prompt:{id:prompt.id,version:prompt.version,instructionsSha256:prompt.instructionsSha256},
      runtime:this.runtimeStatus(),
      selectedModel:model,
      tools:this._publicToolMetadata(template),
      inputSummary:{type:typeof input,bytes:Buffer.byteLength(JSON.stringify(input||{}))},
      executionPolicy:{maxSteps:template.maxSteps,riskClass:template.riskClass,approvalPolicy:template.approvalPolicy,outputUsePolicy:template.outputUsePolicy},
      _private:{instructions},
    };
  }

  publicPlan(templateId,input={},options={}){
    const plan=this.plan(templateId,input,options);
    const {_private,...safe}=plan;return safe;
  }

  async _compileTools(template,sdk,options={}){
    const compiled={};
    const readOnly=options.toolPolicy==='read_only';
    for(const toolId of template.tools){
      const def=this.toolRegistry.get(toolId);
      if(!def){const e=new Error('Template references unregistered tool: '+toolId);e.code='AGENT_TOOL_UNREGISTERED';throw e;}
      if(readOnly && (def.mutates || def.needsApproval)) continue;
      compiled[toolId]=sdk.tool({
        description:def.description,
        inputSchema:def.inputSchema,
        needsApproval:def.needsApproval,
        execute:async(args)=>def.execute(args,{templateId:template.id}),
      });
    }
    return compiled;
  }

  async execute(templateId,input,context={},options={}){
    const plan=this.plan(templateId,input,options);
    if(!plan.runtime.executable){
      const e=new Error('Agent runtime is not configured: set AI_GATEWAY_API_KEY or VERCEL_OIDC_TOKEN and AI_AGENT_DEFAULT_MODEL/AI_GATEWAY_DEFAULT_MODEL');
      e.code='AI_AGENT_RUNTIME_NOT_CONFIGURED';
      e.runtime=plan.runtime;
      throw e;
    }
    const template=this.agentRegistry.get(templateId);
    const sdk=await this.sdkLoader();
    if(typeof sdk.ToolLoopAgent!=='function'||typeof sdk.tool!=='function'||typeof sdk.stepCountIs!=='function'){
      const e=new Error('Installed AI SDK does not provide ToolLoopAgent/tool/stepCountIs');e.code='AI_SDK_INCOMPATIBLE';throw e;
    }
    const tools=await this._compileTools(template,sdk,options);
    const agent=new sdk.ToolLoopAgent({
      model:plan.selectedModel,
      instructions:plan._private.instructions,
      tools,
      stopWhen:sdk.stepCountIs(template.maxSteps),
    });
    const prompt=typeof input==='string'?input:JSON.stringify(input||{});
    const requestId=context.requestId||crypto.randomUUID();
    const started=Date.now();
    const result=await agent.generate({prompt});
    const usage=result.totalUsage||result.usage||null;
    const governance=this.governance||require('../../services/aiGovernanceService');
    const audit=await governance.audit({
      correlationId:requestId,
      actorId:context.userId||null,
      actorType:context.actorType||'user',
      action:'ai.agent.execute',
      domain:template.domain,
      risk:template.riskClass,
      decision:'allowed_assistive_draft',
      approvalRequired:Boolean(template.approvalPolicy.executionApprovalRequired),
      approvalId:context.approvalId||null,
      metadata:{templateId,templateVersion:template.version,model:plan.selectedModel,promptHash:plan.prompt.instructionsSha256,usage,toolPolicy:options.toolPolicy||'governed'},
    });
    return {
      success:true,
      requestId,
      templateId,
      templateVersion:template.version,
      model:plan.selectedModel,
      durationMs:Date.now()-started,
      text:result.text||'',
      finishReason:result.finishReason||null,
      usage,
      steps:Array.isArray(result.steps)?result.steps.length:null,
      warnings:result.warnings||[],
      toolPolicy:options.toolPolicy||'governed',
      toolCountPresented:Object.keys(tools).length,
      reviewRequired:Boolean(template.approvalPolicy.humanReviewRequired||template.outputUsePolicy.draftOnly),
      outputUsePolicy:template.outputUsePolicy,
      audit,
    };
  }

  health(){
    const templates=this.agentRegistry.list();
    const tools=this.toolRegistry.list();
    return {status:'healthy',service:'agentRuntimeService',templates:templates.length,tools:tools.length,medicalTemplates:templates.filter((t)=>t.stream==='medical').length,runtime:this.runtimeStatus()};
  }
}

const singleton=new AgentRuntimeService();
module.exports=singleton;
module.exports.AgentRuntimeService=AgentRuntimeService;
