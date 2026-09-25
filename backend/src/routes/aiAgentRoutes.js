'use strict';

const express=require('express');
const agentRuntime=require('../core/ai/agentRuntimeService');
const dualBackbone=require('../core/ai/dualBackboneOrchestrator');
const dualCatalog=require('../core/ai/enterpriseDualBackboneCatalog');
const completion=require('../core/ai/aiCompletionRegistry');
const { authMiddleware,userRateLimit }=require('../middleware/auth');

const router=express.Router();
const MAX_INPUT_BYTES=100*1024;

function mapError(error,res){
  const code=error.code||'AGENT_RUNTIME_ERROR';
  const status={
    AGENT_TEMPLATE_NOT_FOUND:404,
    AGENT_TEMPLATE_DISABLED:409,
    AI_AGENT_RUNTIME_NOT_CONFIGURED:503,
    AI_AGENT_MODEL_NOT_ALLOWED:403,
    AGENT_TOOL_UNREGISTERED:500,
    AI_SDK_INCOMPATIBLE:500,
    PROMPT_VARIABLE_MISSING:400,
    AI_DOMAIN_UNKNOWN:404,
    DUAL_BACKBONE_MODE_INVALID:400,
    AGENT_INPUT_TOO_LARGE:413,
  }[code]||500;
  return res.status(status).json({success:false,error:error.message,code,runtime:error.runtime||undefined});
}
function sizeGuard(value){
  return Buffer.byteLength(JSON.stringify(value??{}))<=MAX_INPUT_BYTES;
}

router.get('/health',(req,res)=>{
  const c=completion.build();
  res.json({
    success:true,
    service:'enterprise-ai',
    codeComplete:c.codeComplete,
    runtimeFullyOperational:c.runtimeFullyOperational,
    templates:c.agents.templates,
    streams:c.agents.streams,
    medicalTemplates:c.agents.medicalTemplates,
    domains:c.domains.canonicalDomains,
    coveredDomains:c.domains.coveredDomains,
    locallyOrCurrentlyExecutableEngines:c.engines.locallyOrCurrentlyExecutable,
    configurationBlockers:c.configurationBlockers,
    runtime:agentRuntime.runtimeStatus(),
  });
});

router.use(authMiddleware);

router.get('/completion',(req,res)=>res.json({success:true,data:completion.build()}));
router.get('/backbone/health',(req,res)=>res.json({success:true,data:dualBackbone.health()}));
router.get('/domains',(req,res)=>{
  const rows=dualCatalog.buildDomainAICatalog().map((d)=>({
    domainId:d.domainId,domainCode:d.domainCode,domainName:d.domainName,riskClass:d.riskClass,
    contractStatus:d.contractStatus,
    embeddedBackbone:{
      mode:d.embeddedBackbone?.mode,
      directRuleCoverage:d.embeddedBackbone?.directRuleCoverage,
      requiredEngineCapabilities:d.embeddedBackbone?.requiredEngineCapabilities,
      engineCapabilityCoverage:d.embeddedBackbone?.engineCapabilityCoverage,
    },
    agenticBackbone:{
      primaryTemplateId:d.agenticBackbone?.primaryTemplateId,
      templates:d.agenticBackbone?.templates,
      templateCoverage:d.agenticBackbone?.templateCoverage,
    },
  }));
  res.json({success:true,count:rows.length,data:rows});
});

router.get('/templates',(req,res)=>{
  const rows=agentRuntime.agentRegistry.listPublic({
    stream:req.query.stream||undefined,
    riskClass:req.query.riskClass||undefined,
    enabled:true,
  });
  res.json({success:true,count:rows.length,templates:rows});
});
router.get('/templates/:templateId',(req,res)=>{
  const row=agentRuntime.agentRegistry.publicMetadata(req.params.templateId);
  if(!row)return res.status(404).json({success:false,error:'Agent template not found',code:'AGENT_TEMPLATE_NOT_FOUND'});
  return res.json({success:true,template:row});
});

router.post('/plan',(req,res)=>{
  try{
    const body=req.body||{};
    if(!sizeGuard(body.input))return res.status(413).json({success:false,error:'Agent input exceeds 100 KiB',code:'AGENT_INPUT_TOO_LARGE'});
    return res.json({success:true,plan:agentRuntime.publicPlan(body.templateId,body.input??{},body.options||{})});
  }catch(error){return mapError(error,res);}
});

router.post('/backbone/plan',(req,res)=>{
  try{
    const body=req.body||{};
    if(!sizeGuard(body.task))return res.status(413).json({success:false,error:'AI task exceeds 100 KiB',code:'AGENT_INPUT_TOO_LARGE'});
    const plan=dualBackbone.plan(body.domainCode,body.task||{},body.options||{});
    return res.json({success:true,plan});
  }catch(error){return mapError(error,res);}
});

router.post('/execute',userRateLimit(20,60_000),async(req,res)=>{
  try{
    const body=req.body||{};
    if(!sizeGuard(body.input))return res.status(413).json({success:false,error:'Agent input exceeds 100 KiB',code:'AGENT_INPUT_TOO_LARGE'});
    const result=await agentRuntime.execute(
      body.templateId,body.input??{},
      {userId:req.user?.id||null,actorType:'user',approvalId:body.approvalId||null,requestId:req.headers['x-request-id']||undefined},
      body.options||{}
    );
    return res.json(result);
  }catch(error){return mapError(error,res);}
});

router.post('/backbone/run',userRateLimit(20,60_000),async(req,res)=>{
  try{
    const body=req.body||{};
    if(!sizeGuard(body.task))return res.status(413).json({success:false,error:'AI task exceeds 100 KiB',code:'AGENT_INPUT_TOO_LARGE'});
    const result=await dualBackbone.run(body.domainCode,body.task||{},{
      ...(body.options||{}),
      userId:req.user?.id||null,
      actorType:'user',
      requestId:req.headers['x-request-id']||undefined,
    });
    return res.json({success:true,data:result});
  }catch(error){return mapError(error,res);}
});

module.exports=router;
