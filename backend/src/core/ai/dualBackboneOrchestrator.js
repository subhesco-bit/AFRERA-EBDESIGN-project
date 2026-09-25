'use strict';

const crypto = require('crypto');
const {
  getDomainAI,
  selectEngine,
  evaluateEmbeddedRule,
  coverage,
} = require('./enterpriseDualBackboneCatalog');
const isolation = require('./aiIsolationTransformer');

function trace(prefix='hybrid-ai') {
  return `${prefix}_${Date.now()}_${crypto.randomBytes(5).toString('hex')}`;
}

function highRisk(domain) {
  return domain?.riskClass === 'high';
}

function safeDomainSummary(domain) {
  if(!domain) return null;
  return {
    domainId:domain.domainId,
    domainCode:domain.domainCode,
    domainName:domain.domainName,
    riskClass:domain.riskClass,
    dataClassification:domain.dataClassification,
    embeddedBackbone:{
      contractId:domain.embeddedBackbone.contractId,
      mode:domain.embeddedBackbone.mode,
      directRuleAgentIds:[...domain.embeddedBackbone.directRuleAgentIds],
      deterministicAlgorithmIds:[...domain.embeddedBackbone.deterministicAlgorithmIds],
      requiredEngineCapabilities:[...domain.embeddedBackbone.requiredEngineCapabilities],
      engineCandidates:domain.embeddedBackbone.engineCandidates,
      executionPolicy:{...domain.embeddedBackbone.executionPolicy},
    },
    agenticBackbone:{
      contractId:domain.agenticBackbone.contractId,
      primaryTemplateId:domain.agenticBackbone.primaryTemplateId,
      templates:domain.agenticBackbone.templates,
      approvalPolicy:domain.agenticBackbone.approvalPolicy,
    },
    isolation:{
      internal:'protected enterprise intelligence bus',
      external:'isolated specialist/agentic intelligence bus',
      transformer:'aiIsolationTransformer',
      externalExecutionAuthority:'none',
    },
  };
}

class DualBackboneOrchestrator {
  constructor(options={}) {
    this.agentRuntime=options.agentRuntime||null;
    this.embeddedExecutor=options.embeddedExecutor||null;
  }

  getAgentRuntime() {
    if(!this.agentRuntime) this.agentRuntime=require('./agentRuntimeService');
    return this.agentRuntime;
  }

  health() {
    const c=coverage();
    return {
      status:c.missingDomains.length===0&&c.agenticMissingDomains.length===0?'healthy':'degraded',
      architecture:'isolated-hybrid-dual-backbone',
      internalBackbone:'protected enterprise/deterministic/local intelligence',
      externalBackbone:'isolated specialist/frontier agent intelligence',
      transformer:'data-minimizing cognitive step-up / authority step-down',
      sharedEngineFabric:true,
      islandMode:true,
      externalDirectMutation:false,
      coverage:c,
    };
  }

  plan(domainCode, task={}, options={}) {
    const domain=getDomainAI(domainCode);
    if(!domain) {
      const e=new Error('Unknown canonical AI domain: '+domainCode);e.code='AI_DOMAIN_UNKNOWN';throw e;
    }

    const runtime=this.getAgentRuntime().runtimeStatus();
    const capability=options.engineCapability||domain.embeddedBackbone.requiredEngineCapabilities[0]||null;
    const engineSelection=capability?selectEngine(domainCode,capability,options.engineOptions||{}):null;
    const stepUp=isolation.decideCognitiveStepUp({
      internalConfidence:options.internalConfidence,
      internalEngineAvailable:Boolean(engineSelection?.selected || domain.embeddedBackbone.directRuleAgentIds.length),
      requiresExternalResearch:Boolean(options.requiresExternalResearch),
      complexity:options.complexity||'medium',
      crossDomain:Boolean(options.crossDomain),
      dataClassification:options.dataClassification||String(domain.dataClassification||'internal').toLowerCase(),
      externalRuntimeAvailable:runtime.executable,
      riskClass:domain.riskClass,
      forceExternal:Boolean(options.forceExternal),
    });

    return {
      planId:trace('hybrid-plan'),
      architecture:'isolated-hybrid-step-up',
      domain:safeDomainSummary(domain),
      objective:task.objective||task.task||options.objective||'domain intelligence task',
      internal:{
        path:'protected_internal',
        directRuleAgentId:options.embeddedRuleId||domain.embeddedBackbone.directRuleAgentIds[0]||null,
        engineCapability:capability,
        engineSelection,
      },
      cognitiveStepUp:stepUp,
      external:stepUp.stepUp ? {
        path:'isolated_external',
        templateId:options.templateId||domain.agenticBackbone.primaryTemplateId,
        toolPolicy:'read_only',
        authorityCeiling:stepUp.executionAuthorityCeiling,
      } : null,
      authorityStepDown:{
        directExternalExecution:false,
        reconciliationRequired:stepUp.stepUp,
        highRiskHumanGate:highRisk(domain),
      },
    };
  }

  async runEmbedded(domainCode, task={}, options={}) {
    const domain=getDomainAI(domainCode);
    if(!domain) {const e=new Error('Unknown canonical AI domain: '+domainCode);e.code='AI_DOMAIN_UNKNOWN';throw e;}

    const ruleId=options.embeddedRuleId||null;
    if(ruleId) {
      const result=await evaluateEmbeddedRule(domainCode,ruleId,task.context||task);
      return {status:'evaluated',backbone:'internal',executionType:'domain_rule',domainCode,ruleAgentId:ruleId,result};
    }

    const capability=options.engineCapability||domain.embeddedBackbone.requiredEngineCapabilities[0]||null;
    const engine=capability?selectEngine(domainCode,capability,options.engineOptions||{}):null;

    if(!options.executeInternal) {
      return {status:'planned',backbone:'internal',executionType:'engine_fabric',domainCode,capability,engineSelection:engine};
    }
    if(highRisk(domain)&&!options.humanApproved&&options.internalAction===true) {
      return {status:'approval_required',backbone:'internal',domainCode,reason:'high_risk_internal_action'};
    }
    if(typeof this.embeddedExecutor!=='function') {
      return {status:'executor_required',backbone:'internal',domainCode,executionType:'engine_fabric',capability,engineSelection:engine};
    }
    const result=await this.embeddedExecutor({domain:safeDomainSummary(domain),capability,engineSelection:engine,task,options});
    return {status:'executed',backbone:'internal',domainCode,executionType:'engine_fabric',capability,engineSelection:engine,result};
  }

  async runExternalIsolated(domainCode, task={}, options={}) {
    const domain=getDomainAI(domainCode);
    if(!domain) {const e=new Error('Unknown canonical AI domain: '+domainCode);e.code='AI_DOMAIN_UNKNOWN';throw e;}

    const transformed=isolation.prepareOutbound({
      domainCode,
      task,
      dataClassification:options.dataClassification||String(domain.dataClassification||'internal').toLowerCase(),
      purpose:options.purpose||'cognitive_step_up',
      allowlistedPaths:options.allowlistedPaths||[],
      explicitExternalApproval:Boolean(options.explicitExternalApproval),
      correlationId:options.correlationId,
    });
    if(!transformed.allowed) return {status:'isolated_block',backbone:'external',domainCode,transform:transformed};

    const templateId=options.templateId||domain.agenticBackbone.primaryTemplateId;
    if(!options.executeExternal) {
      return {
        status:'planned',
        backbone:'external',
        domainCode,
        templateId,
        transform:{...transformed.envelope,payload:undefined},
        plan:this.getAgentRuntime().publicPlan(templateId,transformed.envelope.payload,options.agentOptions||{}),
      };
    }

    const result=await this.getAgentRuntime().execute(
      templateId,
      transformed.envelope.payload,
      {userId:options.userId||null,actorType:options.actorType||'user',approvalId:options.approvalId||null,requestId:transformed.envelope.correlationId},
      {...(options.agentOptions||{}),toolPolicy:'read_only'}
    );

    const steppedDown=isolation.stepDownExternalOutput({
      domainCode,
      output:result,
      correlationId:transformed.envelope.correlationId,
      riskClass:domain.riskClass,
      evidence:options.externalEvidence||[],
    });

    return {
      status:'executed_proposal_only',
      backbone:'external',
      domainCode,
      templateId,
      outbound:{...transformed.envelope,payload:undefined},
      result:steppedDown,
    };
  }

  async run(domainCode, task={}, options={}) {
    const requestedMode=options.mode||'hybrid_step_up';
    if(requestedMode==='embedded'||requestedMode==='internal') return this.runEmbedded(domainCode,task,options);
    if(requestedMode==='agentic'||requestedMode==='external') return this.runExternalIsolated(domainCode,task,options);
    if(!['hybrid_step_up','parallel'].includes(requestedMode)) {
      const e=new Error('Unknown dual-backbone mode: '+requestedMode);e.code='DUAL_BACKBONE_MODE_INVALID';throw e;
    }

    const domain=getDomainAI(domainCode);
    if(!domain) {const e=new Error('Unknown canonical AI domain: '+domainCode);e.code='AI_DOMAIN_UNKNOWN';throw e;}
    const runId=trace('hybrid-run');
    const embedded=await this.runEmbedded(domainCode,task,options);

    const runtime=this.getAgentRuntime().runtimeStatus();
    const stepUp=isolation.decideCognitiveStepUp({
      internalResult:embedded,
      internalConfidence:options.internalConfidence,
      internalEngineAvailable:embedded.status!=='executor_required',
      requiresExternalResearch:Boolean(options.requiresExternalResearch),
      complexity:options.complexity||'medium',
      crossDomain:Boolean(options.crossDomain),
      dataClassification:options.dataClassification||String(domain.dataClassification||'internal').toLowerCase(),
      externalRuntimeAvailable:runtime.executable,
      riskClass:domain.riskClass,
      forceExternal:Boolean(options.forceExternal),
    });

    if(!stepUp.stepUp) {
      return {
        runId,
        status:'completed_internal',
        mode:'hybrid_step_up',
        domainCode,
        embedded,
        cognitiveStepUp:stepUp,
        external:null,
        reconciliation:isolation.reconcile({embedded,external:null,riskClass:domain.riskClass}),
      };
    }

    const external=await this.runExternalIsolated(domainCode,task,{
      ...options,
      executeExternal:Boolean(options.executeExternal),
      correlationId:runId,
    });

    if(external.status==='isolated_block') {
      return {
        runId,status:'completed_internal_external_blocked',mode:'hybrid_step_up',domainCode,
        embedded,cognitiveStepUp:stepUp,external,
        reconciliation:isolation.reconcile({embedded,external:null,riskClass:domain.riskClass}),
      };
    }

    const externalProposal=external.result||external;
    const reconciliation=isolation.reconcile({
      embedded,
      external:externalProposal,
      riskClass:domain.riskClass,
      calculable:Boolean(options.calculable),
      deterministicValidation:options.deterministicValidation,
      evidenceConflict:Boolean(options.evidenceConflict),
    });

    return {
      runId,
      status:'completed_hybrid',
      mode:'hybrid_step_up',
      domainCode,
      embedded,
      cognitiveStepUp:stepUp,
      external,
      reconciliation,
      actionAuthority:reconciliation.actionAuthority,
    };
  }
}

const singleton=new DualBackboneOrchestrator();
module.exports=singleton;
module.exports.DualBackboneOrchestrator=DualBackboneOrchestrator;
module.exports.safeDomainSummary=safeDomainSummary;
