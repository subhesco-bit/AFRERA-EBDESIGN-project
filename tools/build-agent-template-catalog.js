#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const { buildAgentTemplateRegistry }=require(path.join(root,'backend','src','core','ai','agentTemplateCatalog'));
const { buildAgentToolRegistry }=require(path.join(root,'backend','src','core','ai','agentToolRegistry'));
const { listProviders }=require(path.join(root,'backend','src','core','ai','aiProviderAdapters'));
const outDir=path.join(root,'.audit','phase-program','agent-template-reconciliation');
fs.mkdirSync(outDir,{recursive:true});

const {promptRegistry,agentRegistry}=buildAgentTemplateRegistry();
const toolRegistry=buildAgentToolRegistry();
const templates=agentRegistry.listPublic({enabled:true});
const prompts=promptRegistry.listPublic();
const tools=toolRegistry.list();
const providers=listProviders();

const byStream={};const byRisk={};const byPattern={};
for(const t of templates){byStream[t.stream]=(byStream[t.stream]||0)+1;byRisk[t.riskClass]=(byRisk[t.riskClass]||0)+1;byPattern[t.pattern]=(byPattern[t.pattern]||0)+1;}
const dangling=[];
for(const t of templates)for(const toolId of t.tools)if(!toolRegistry.get(toolId))dangling.push({templateId:t.id,toolId});
const medical=templates.filter((t)=>t.stream==='medical');

const manifest={
 schemaVersion:1,
 generatedAt:new Date().toISOString(),
 templateCount:templates.length,
 promptCount:prompts.length,
 toolCount:tools.length,
 providerMetadataCount:providers.length,
 byStream,byRisk,byPattern,
 medicalTemplateCount:medical.length,
 medicalTemplateIds:medical.map((t)=>t.id),
 danglingToolReferences:dangling,
 runtimeAdapter:{sdk:'ai',expectedMajor:7,executionClass:'ToolLoopAgent',credentialNames:['AI_GATEWAY_API_KEY','VERCEL_OIDC_TOKEN'],modelConfigNames:['AI_AGENT_DEFAULT_MODEL','AI_GATEWAY_DEFAULT_MODEL'],boundedSteps:true,toolApprovalSupported:true},
 sourcePatternResearch:[
  {source:'Anthropic Building Effective Agents',use:'simple composable workflows, routing, parallelization, evaluator/optimizer, bounded agents'},
  {source:'Vercel AI SDK Agents/ToolLoopAgent',use:'provider-neutral tool loop, step limits, tool approval'},
  {source:'OpenAI agent architecture patterns',use:'guardrails, handoffs, tracing, human approval'},
  {source:'Google ADK patterns',use:'sequential, parallel and loop composition'}
 ],
 truthRules:[
  'Template availability does not imply a live model credential is configured.',
  'Provider/model selection is runtime-configured and not hard-wired into business templates.',
  'System instructions are not emitted by public catalog APIs; only prompt hashes and metadata are exposed.',
  'Mutation tools require approval; current canonical tool set is read-only/deterministic.',
  'Medical agent output is draft-only and requires qualified human review.',
  'The legacy medical code search is not treated as authoritative terminology mapping.'
 ],
 templates,prompts,tools,providers
};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
const prodDir=path.join(root,'.ai','autonomous-program');fs.mkdirSync(prodDir,{recursive:true});
fs.writeFileSync(path.join(prodDir,'AGENT_TEMPLATE_CATALOG.json'),JSON.stringify({schemaVersion:1,templateCount:templates.length,promptCount:prompts.length,toolCount:tools.length,byStream,byRisk,byPattern,medicalTemplateIds:medical.map((t)=>t.id),templates,prompts,tools,runtimeAdapter:manifest.runtimeAdapter,truthRules:manifest.truthRules},null,2)+'\n');
console.log(JSON.stringify({ok:true,templateCount:templates.length,promptCount:prompts.length,toolCount:tools.length,providerMetadataCount:providers.length,medicalTemplateCount:medical.length,streams:Object.keys(byStream).length,danglingToolReferences:dangling.length,bytes:fs.statSync(path.join(outDir,'manifest.json')).size}));
