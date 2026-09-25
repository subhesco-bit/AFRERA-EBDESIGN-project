/**
 * AI Intelligence Fabric - canonical entry point.
 */
'use strict';

const { AIOrchestrator, orchestrator } = require('./aiOrchestratorCore');
const aiProviderAdapters = require('./aiProviderAdapters');
const aiEngineRegistry = require('./aiEngineRegistry');
const aiConfidenceEngine = require('./aiConfidenceEngine');
const aiCostController = require('./aiCostController');
const aiGuardrails = require('./aiGuardrails');
const aiAuditLogger = require('./aiAuditLogger');
const aiBackboneRuntime = require('./aiBackboneRuntime'); // legacy compatibility control plane
const agentRuntimeService = require('./agentRuntimeService');
const dualBackboneOrchestrator = require('./dualBackboneOrchestrator');
const enterpriseDualBackboneCatalog = require('./enterpriseDualBackboneCatalog');
const aiMemoryRouter = require('./aiMemoryRouter');
const aiEvaluationRegistry = require('./aiEvaluationRegistry');
const aiCompletionRegistry = require('./aiCompletionRegistry');
const integrationRegistry = require('../integration/systemIntegrationRegistry');
const AI_MODULE_REGISTRY = require('./AI_MODULE_REGISTRY.json');

async function initializeAI(config={}) {
  try {
    await orchestrator.initialize();
    const completion=aiCompletionRegistry.build();
    return {
      success:true,
      message:'AI Intelligence Fabric initialized successfully',
      status:orchestrator.getStatus(),
      backbone:{
        architecture:'isolated-hybrid-enterprise-ai',
        legacyAgents:aiBackboneRuntime.listAgents().length,
        agentTemplates:completion.agents.templates,
        domainCoverage:completion.domains,
        dualBackbone:dualBackboneOrchestrator.health(),
        integrationContracts:integrationRegistry.listContracts().length,
      },
      completion:{
        codeComplete:completion.codeComplete,
        runtimeFullyOperational:completion.runtimeFullyOperational,
        codeBlockers:completion.codeBlockers,
        configurationBlockers:completion.configurationBlockers,
      },
      config:{hasConfig:Object.keys(config).length>0},
    };
  } catch(error) {
    return {success:false,message:`Failed to initialize AI Intelligence Fabric: ${error.message}`,error};
  }
}

function getAIStatus() {
  const completion=aiCompletionRegistry.build();
  return {
    module:AI_MODULE_REGISTRY,
    orchestrator:orchestrator.getStatus(),
    providers:aiProviderAdapters.listProviders(),
    engines:aiEngineRegistry.listReadyEngines(),
    cost:aiCostController.getCostState(),
    completion,
    backbone:{
      architecture:'isolated-hybrid-enterprise-ai',
      dual:dualBackboneOrchestrator.health(),
      domains:enterpriseDualBackboneCatalog.coverage(),
      legacyCompatibility:{
        agents:aiBackboneRuntime.listAgents(),
        autonomyLevels:aiBackboneRuntime.AUTONOMY,
      },
      agentRuntime:agentRuntimeService.health(),
      integrationContracts:integrationRegistry.listContracts(),
    },
    memory:aiMemoryRouter.status(),
    evaluation:aiEvaluationRegistry.status(),
  };
}

async function handleAIRequest(req,res) {
  try {
    const {taskType,payload={},options={},agentId,templateId,domainCode,objective,execute=false,autonomyLevel}=req.body;

    if(domainCode) {
      const result=await dualBackboneOrchestrator.run(domainCode,payload,{
        ...options,
        executeInternal:Boolean(options.executeInternal||execute),
        executeExternal:Boolean(options.executeExternal||execute),
        userId:req.user?.id||req.user?.userId,
      });
      return res.json({success:true,data:result});
    }

    if(templateId) {
      const result=execute
        ? await agentRuntimeService.execute(templateId,payload,{userId:req.user?.id||req.user?.userId,actorType:'user'},options.agentOptions||{})
        : agentRuntimeService.publicPlan(templateId,payload,options.agentOptions||{});
      return res.json({success:true,data:result});
    }

    if(agentId) {
      const result=await aiBackboneRuntime.runAgent({
        agentId,taskType,payload,objective,query:payload.query,context:payload.context,execute,
        autonomyLevel,options,actorId:req.user?.id||req.user?.userId,
      });
      return res.json({success:true,data:result});
    }

    if(!taskType)return res.status(400).json({success:false,error:'taskType, templateId, domainCode or agentId is required'});
    const result=await orchestrator.route(taskType,payload,{user:req.user,...options});
    return res.json({success:true,data:result});
  } catch(error) {
    const status=['UNKNOWN_AI_AGENT','AI_DOMAIN_UNKNOWN','AGENT_TEMPLATE_NOT_FOUND'].includes(error.code)?400:
      error.code==='AI_AGENT_RUNTIME_NOT_CONFIGURED'?503:500;
    return res.status(status).json({success:false,error:error.message,code:error.code||'AI_REQUEST_ERROR'});
  }
}

module.exports={
  AIOrchestrator,orchestrator,
  aiProviderAdapters,aiEngineRegistry,aiConfidenceEngine,aiCostController,aiGuardrails,aiAuditLogger,
  aiBackboneRuntime,agentRuntimeService,dualBackboneOrchestrator,enterpriseDualBackboneCatalog,
  aiMemoryRouter,aiEvaluationRegistry,aiCompletionRegistry,integrationRegistry,AI_MODULE_REGISTRY,
  initializeAI,getAIStatus,handleAIRequest,
};
