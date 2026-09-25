'use strict';

const express = require('express');
const agentRuntime = require('../core/ai/agentRuntimeService');
const { authMiddleware, userRateLimit } = require('../middleware/auth');

const router = express.Router();
const MAX_INPUT_BYTES = 100 * 1024;

function mapError(error, res) {
  const code = error.code || 'AGENT_RUNTIME_ERROR';
  const status = {
    AGENT_TEMPLATE_NOT_FOUND: 404,
    AGENT_TEMPLATE_DISABLED: 409,
    AI_AGENT_RUNTIME_NOT_CONFIGURED: 503,
    AI_AGENT_MODEL_NOT_ALLOWED: 403,
    AGENT_TOOL_UNREGISTERED: 500,
    AI_SDK_INCOMPATIBLE: 500,
    PROMPT_VARIABLE_MISSING: 400,
  }[code] || 500;
  return res.status(status).json({success:false,error:error.message,code,runtime:error.runtime||undefined});
}

router.get('/health', (req, res) => {
  res.json({success:true,...agentRuntime.health()});
});

router.use(authMiddleware);

router.get('/templates', (req, res) => {
  const stream = req.query.stream || undefined;
  const riskClass = req.query.riskClass || undefined;
  const rows = agentRuntime.agentRegistry.listPublic({stream,riskClass,enabled:true});
  res.json({success:true,count:rows.length,templates:rows});
});

router.get('/templates/:templateId', (req, res) => {
  const row = agentRuntime.agentRegistry.publicMetadata(req.params.templateId);
  if(!row) return res.status(404).json({success:false,error:'Agent template not found',code:'AGENT_TEMPLATE_NOT_FOUND'});
  return res.json({success:true,template:row});
});

router.post('/plan', (req, res) => {
  try {
    const body=req.body||{};
    const bytes=Buffer.byteLength(JSON.stringify(body.input??{}));
    if(bytes>MAX_INPUT_BYTES)return res.status(413).json({success:false,error:'Agent input exceeds 100 KiB',code:'AGENT_INPUT_TOO_LARGE'});
    const plan=agentRuntime.publicPlan(body.templateId,body.input??{},{});
    return res.json({success:true,plan});
  } catch(error) {
    return mapError(error,res);
  }
});

router.post('/execute', userRateLimit(20, 60_000), async (req, res) => {
  try {
    const body=req.body||{};
    const bytes=Buffer.byteLength(JSON.stringify(body.input??{}));
    if(bytes>MAX_INPUT_BYTES)return res.status(413).json({success:false,error:'Agent input exceeds 100 KiB',code:'AGENT_INPUT_TOO_LARGE'});
    const result=await agentRuntime.execute(body.templateId,body.input??{},
      {userId:req.user?.id||null,actorType:'user',approvalId:body.approvalId||null,requestId:req.headers['x-request-id']||undefined},
      {}
    );
    return res.json(result);
  } catch(error) {
    return mapError(error,res);
  }
});

module.exports = router;
