'use strict';

const { z } = require('zod');
const { singleton: hybridRetrievalService } = require('../../services/hybridRetrievalService');
const productMaster = require('../../services/catalog/neProductMasterService');
const { buildDeterministicAlgorithmRegistry } = require('../deterministicAlgorithmCatalog');
const { WorkflowDefinitionRegistry } = require('../workflowDefinitionRegistry');
const { registerCanonicalWorkflows } = require('../workflowCatalog');

class AgentToolRegistry {
  constructor(){this.tools=new Map();}
  register(id, definition={}) {
    if(!id||typeof id!=='string')throw new Error('tool id is required');
    if(!definition.description)throw new Error('tool description is required: '+id);
    if(!definition.inputSchema)throw new Error('tool inputSchema is required: '+id);
    if(typeof definition.execute!=='function')throw new Error('tool execute function is required: '+id);
    const record={
      id,
      description:definition.description,
      inputSchema:definition.inputSchema,
      execute:definition.execute,
      riskClass:definition.riskClass||'standard',
      mutates:Boolean(definition.mutates),
      needsApproval:definition.needsApproval??Boolean(definition.mutates),
      source:definition.source||null,
      dataAccess:definition.dataAccess||'internal',
      evidencePolicy:definition.evidencePolicy||'return_source_metadata',
    };
    this.tools.set(id,record);return record;
  }
  get(id){return this.tools.get(id)||null;}
  list(){return [...this.tools.values()].map(({inputSchema,execute,...meta})=>meta);}
  async execute(id,input,context={}){
    const tool=this.get(id);
    if(!tool){const e=new Error('Agent tool not found: '+id);e.code='AGENT_TOOL_NOT_FOUND';throw e;}
    const parsed=tool.inputSchema.parse(input||{});
    return tool.execute(parsed,context);
  }
}

function buildAgentToolRegistry(){
  const registry=new AgentToolRegistry();

  registry.register('knowledge_search',{
    description:'Search the canonical AFRERA/EBDESIGN knowledge library using lexical, semantic, field and dependency-graph evidence.',
    inputSchema:z.object({query:z.string().min(1).max(500),limit:z.number().int().min(1).max(20).optional(),type:z.string().optional(),category:z.string().optional(),status:z.string().optional()}),
    riskClass:'standard',mutates:false,source:'backend/src/services/hybridRetrievalService.js',
    execute:async(input)=>hybridRetrievalService.search(input.query,{limit:input.limit||8,filters:{type:input.type,category:input.category,status:input.status}}),
  });

  registry.register('ne_product_search',{
    description:'Search the canonical 1,171-product North-East product master. Farmer MAP/floor prices remain redacted.',
    inputSchema:z.object({query:z.string().max(300).optional().default(''),category:z.string().optional(),origin:z.string().optional(),giClaim:z.boolean().optional(),limit:z.number().int().min(1).max(50).optional()}),
    riskClass:'standard',mutates:false,source:'backend/src/services/catalog/neProductMasterService.js',
    execute:async(input)=>productMaster.search(input.query||'',{category:input.category,origin:input.origin,giClaim:input.giClaim,limit:input.limit||10}),
  });

  registry.register('deterministic_calculation',{
    description:'Execute a registered deterministic calculation with explicit basis, provenance and limitations. Never substitutes an LLM estimate for a formula.',
    inputSchema:z.object({algorithmId:z.string().min(1),input:z.record(z.string(),z.any()).default({})}),
    riskClass:'standard',mutates:false,source:'backend/src/core/deterministicAlgorithmRegistry.js',
    execute:async(input)=>buildDeterministicAlgorithmRegistry().run(input.algorithmId,input.input),
  });

  registry.register('workflow_catalog',{
    description:'Read the governed workflow/state-machine catalog including states, transitions, SLA metadata, approvals and source implementation.',
    inputSchema:z.object({workflowId:z.string().optional()}),
    riskClass:'standard',mutates:false,source:'backend/src/core/workflowCatalog.js',
    execute:async(input)=>{const r=new WorkflowDefinitionRegistry();registerCanonicalWorkflows(r);if(input.workflowId)return r.get(input.workflowId);return r.list();},
  });

  registry.register('medical_code_systems',{
    description:'Read the legacy/local medical coding-system inventory and integration status. This tool does not validate or finalize a medical code.',
    inputSchema:z.object({}),
    riskClass:'high',mutates:false,source:'backend/src/services/advancedMedicalCodingService.js',
    execute:async()=>({
      systems:require('../../services/advancedMedicalCodingService').advancedMedicalCodingService.getMedicalCodeSystems(),
      authoritativeMappingAvailable:false,
      verificationStatus:'LEGACY_LOCAL_INVENTORY_ONLY',
      warning:'searchMedicalCodes is not an authoritative terminology lookup; final coding requires validated terminology services and qualified human review.',
    }),
  });

  registry.register('medical_context_lookup',{
    description:'Read local clinical/nutrition/complementary-care context for drafting assistance. Output is legacy local knowledge and never a diagnosis, prescription or final code.',
    inputSchema:z.object({condition:z.string().min(1).max(200),context:z.enum(['dietitian','natural_therapist']).default('dietitian')}),
    riskClass:'high',mutates:false,source:'backend/src/services/advancedMedicalCodingService.js',
    execute:async(input)=>({
      context:input.context,
      result:(()=>{const svc=require('../../services/advancedMedicalCodingService').advancedMedicalCodingService;return input.context==='dietitian'?svc.getDietitianKnowledge(input.condition):svc.getNaturalTherapistKnowledge(input.condition);})(),
      verificationStatus:'LEGACY_LOCAL_CONTEXT_REQUIRES_EXTERNAL_VALIDATION',
      humanReviewRequired:true,
    }),
  });

  return registry;
}

module.exports={AgentToolRegistry,buildAgentToolRegistry};
