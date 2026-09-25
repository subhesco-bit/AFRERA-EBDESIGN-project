/**
 * Governed AI Orchestrator Core.
 * Validation -> authorization -> rate/cost -> real engine dispatch ->
 * output validation -> evidence-aware confidence -> audit.
 */
'use strict';

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');
const { listConfiguredProviders } = require('./aiProviderAdapters');
const {
  findBestEngine,
  listReadyEngines,
  capabilityCoverage,
} = require('./aiEngineRegistry');
const { dispatch } = require('./aiEngineDispatcher');
const {
  CONFIDENCE_DIMENSIONS,
  evaluateConfidenceStrict,
  getRecommendedAction,
} = require('./aiConfidenceEngine');
const {
  recordCost,
  getCostState,
  estimateCost,
  checkBudgetConstraints,
  pricingStatus,
} = require('./aiCostController');
const { validateInput, validateOutput, checkAuthorization, checkRateLimit } = require('./aiGuardrails');
const { logAIDecision, generateTraceId } = require('./aiAuditLogger');

function buildRealOrchestratorPayload(taskType, engine, input, options={}) {
  if (taskType === 'vision_engine') {
    return {
      buffer: options.buffer,
      imageBase64: options.imageBase64 || (typeof input === 'string' ? input : undefined),
      operation: options.operation || 'analyze_quality',
      width: options.width, height: options.height, fit: options.fit, format: options.format,
    };
  }
  if (taskType === 'ocr_engine') {
    return {
      buffer: options.buffer,
      imageBase64: options.imageBase64 || (typeof input === 'string' ? input : undefined),
      language: options.language || 'eng',
      reportNumber: options.reportNumber,
    };
  }
  if (taskType === 'speech_engine') {
    return {
      provider: engine.provider,
      action: options.action || 'transcribe',
      audioBase64: options.audioBase64,
      text: options.text || (typeof input === 'string' ? input : undefined),
    };
  }
  if (taskType === 'recommendation_engine') {
    return {
      concern: options.concern || input?.concern || (typeof input === 'string' ? input : undefined),
      month: options.month ?? input?.month,
    };
  }
  if (input && typeof input === 'object' && !Array.isArray(input)) return input;
  return { input };
}

function requiredConfidenceDimensions(engine) {
  if (!engine) return Object.values(CONFIDENCE_DIMENSIONS);
  if (['rules','deterministic','decision','geospatial','evaluation'].includes(engine.type)) {
    return [CONFIDENCE_DIMENSIONS.RULE_CONFIDENCE, CONFIDENCE_DIMENSIONS.CONSISTENCY];
  }
  if (engine.type === 'retrieval' || engine.type === 'memory') {
    return [CONFIDENCE_DIMENSIONS.RETRIEVAL_CONFIDENCE, CONFIDENCE_DIMENSIONS.SOURCE_CONFIDENCE];
  }
  if (engine.type === 'forecast') {
    return [CONFIDENCE_DIMENSIONS.HISTORICAL_ACCURACY, CONFIDENCE_DIMENSIONS.DATA_QUALITY];
  }
  if (engine.type === 'vision') {
    return [CONFIDENCE_DIMENSIONS.MODEL_CONFIDENCE, CONFIDENCE_DIMENSIONS.DATA_QUALITY];
  }
  return Object.values(CONFIDENCE_DIMENSIONS);
}

function confidenceEvidence(engine, result, options={}) {
  const supplied = { ...(options.confidenceEvidence || {}) };
  if (['rules','deterministic','decision','geospatial','evaluation'].includes(engine.type)) {
    if (supplied.ruleMatchStrength == null) supplied.ruleMatchStrength = 1;
    if (supplied.consistencyScore == null) supplied.consistencyScore = 1;
  }
  const output = result?.output ?? result;
  const measured = Number(output?.confidence ?? output?.confidenceScore ?? output?.accuracy);
  if (Number.isFinite(measured) && supplied.modelScore == null) {
    supplied.modelScore = measured > 1 ? measured / 100 : measured;
  }
  return supplied;
}

function usageFrom(result, options={}) {
  const usage=result?.usage||result?.totalUsage||result?.output?.usage||result?.output?.totalUsage||{};
  const inputTokens=Number(options.inputTokens ?? usage.inputTokens ?? usage.promptTokens ?? 0);
  const outputTokens=Number(options.outputTokens ?? usage.outputTokens ?? usage.completionTokens ?? 0);
  return {
    inputTokens:Number.isFinite(inputTokens)?Math.max(0,inputTokens):0,
    outputTokens:Number.isFinite(outputTokens)?Math.max(0,outputTokens):0,
  };
}

class AIOrchestrator {
  constructor(config={}) {
    this.config={
      confidenceThreshold:config.confidenceThreshold ?? 0.7,
      costBudgetHourly:config.costBudgetHourly ?? 10,
      enableAuditLogging:config.enableAuditLogging !== false,
    };
    this.initialized=false;
  }

  async initialize() {
    try {
      await this.createAuditTable();
      this.initialized=true;
      logger.info('AI Orchestrator initialized successfully');
    } catch(error) {
      logger.error(`Failed to initialize AI Orchestrator: ${error.message}`);
      throw error;
    }
  }

  async createAuditTable() {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS ai_audit_logs (
        id VARCHAR(100) PRIMARY KEY,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actor_type VARCHAR(50),
        actor_id VARCHAR(255),
        operation VARCHAR(100),
        engine_id VARCHAR(50),
        provider VARCHAR(50),
        model VARCHAR(100),
        prompt_version VARCHAR(50),
        input_summary TEXT,
        output_summary TEXT,
        confidence_score DECIMAL(5,4),
        confidence_dimensions JSONB,
        data_sources JSONB,
        tools_used JSONB,
        rules_triggered JSONB,
        decision_factors JSONB,
        validation_status VARCHAR(50),
        human_approved BOOLEAN,
        approver_id VARCHAR(255),
        cost_tokens INTEGER,
        cost_usd DECIMAL(10,4),
        latency_ms INTEGER,
        error TEXT,
        trace_id VARCHAR(100)
      )
    `);
  }

  async route(taskType,payload={},options={}) {
    const traceId=generateTraceId();
    const startTime=Date.now();
    let selectedEngine=null;

    try {
      selectedEngine=findBestEngine(taskType,{
        preferProvider:options.provider,
        maxCost:options.maxCost,
        minConfidence:options.minConfidence,
        requireAvailable:options.requireAvailable !== false,
      });
      if(!selectedEngine) {
        const e=new Error(`No executable engine found for capability: ${taskType}`);
        e.code='AI_ENGINE_NOT_FOUND';
        throw e;
      }

      const rawInput=payload?.input !== undefined ? payload.input : payload;
      const inputValidation=validateInput(rawInput,options.inputContext);
      if(!inputValidation.valid) {
        const e=new Error(`Input validation failed: ${inputValidation.violations[0]?.message||'unknown violation'}`);
        e.code='AI_INPUT_INVALID';
        throw e;
      }

      const authCheck=checkAuthorization(options.user,taskType,options.resource);
      if(!authCheck.authorized) {
        const e=new Error(`Authorization failed: ${authCheck.reason}`);e.code='AI_AUTHORIZATION_FAILED';throw e;
      }
      const rateLimit=checkRateLimit(options.userId,taskType);
      if(!rateLimit.withinLimit) {
        const e=new Error('Rate limit exceeded');e.code='AI_RATE_LIMITED';throw e;
      }

      const estimatedTokens=Number(options.estimatedTokens||0);
      const estimatedCost=estimateCost(selectedEngine.provider,estimatedTokens,{
        inputTokens:options.estimatedInputTokens,
        outputTokens:options.estimatedOutputTokens,
      });
      if(estimatedCost!=null) {
        const budget=checkBudgetConstraints(estimatedCost);
        if(!budget.withinBudget) {
          const e=new Error(budget.reason||'AI budget limit would be exceeded');e.code='AI_BUDGET_EXCEEDED';throw e;
        }
      } else if(options.requireKnownCost===true && selectedEngine.provider!=='local') {
        const e=new Error('Provider cost is unknown; configure AI_PROVIDER_PRICING_JSON or supply observed runtime cost');
        e.code='AI_COST_UNKNOWN';
        throw e;
      }

      const dispatched=await this.executeEngine(selectedEngine,inputValidation.sanitized,{...options,sourcePayload:payload});
      const outputValidation=validateOutput(dispatched.output,options.outputContext);

      const evidence=confidenceEvidence(selectedEngine,dispatched,options);
      const confidence=evaluateConfidenceStrict(evidence,{
        requiredDimensions:options.requiredConfidenceDimensions||requiredConfidenceDimensions(selectedEngine),
      });
      let recommendedAction=getRecommendedAction(confidence);
      if(options.requiresHumanApproval===true || options.riskClass==='high') {
        recommendedAction={action:'review',reason:'Policy requires human approval for this operation',requiresHumanApproval:true};
      }

      const usage=usageFrom(dispatched,options);
      const actualCost=recordCost(selectedEngine.provider,usage.inputTokens,{
        inputTokens:usage.inputTokens,
        outputTokens:usage.outputTokens,
        costUsd:options.observedCostUsd,
        costAuthority:options.observedCostUsd!=null?'observed_runtime_cost':undefined,
        traceId,engineId:selectedEngine.id,taskType,
      });

      if(this.config.enableAuditLogging) {
        await logAIDecision({
          actorType:options.user?.type||'system',
          actorId:options.user?.id||'system',
          operation:taskType,
          engineId:selectedEngine.id,
          provider:selectedEngine.provider,
          model:selectedEngine.name,
          promptVersion:options.promptVersion||null,
          input:inputValidation.sanitized,
          output:dispatched.output,
          confidenceScore:confidence.overall,
          confidenceDimensions:confidence.dimensions,
          dataSources:options.dataSources||[],
          toolsUsed:options.toolsUsed||[],
          rulesTriggered:options.rulesTriggered||[],
          decisionFactors:{
            ...confidence.dimensions,
            evidenceCoverage:confidence.evidenceCoverage,
            missingDimensions:confidence.missingDimensions,
          },
          validationStatus:outputValidation.valid?'approved':'rejected',
          humanApproved:Boolean(options.humanApproved),
          approverId:options.humanApproved ? (options.approverId||null) : null,
          costTokens:usage.inputTokens+usage.outputTokens,
          costUsd:actualCost.cost,
          latencyMs:Date.now()-startTime,
          traceId,
        });
      }

      return {
        success:true,
        result:dispatched.output,
        engine:selectedEngine.name,
        engineId:selectedEngine.id,
        provider:selectedEngine.provider,
        confidence,
        recommendedAction,
        cost:actualCost,
        estimatedCost:{known:estimatedCost!=null,costUsd:estimatedCost},
        traceId,
        inputValidation,
        outputValidation,
      };
    } catch(error) {
      logger.error(`AI task routing failed: ${error.message}`);
      if(this.config.enableAuditLogging) {
        await logAIDecision({
          actorType:options.user?.type||'system',
          actorId:options.user?.id||'system',
          operation:taskType,
          engineId:selectedEngine?.id||'error',
          provider:selectedEngine?.provider||'error',
          model:selectedEngine?.name||'error',
          input:payload?.input??payload,
          output:null,
          confidenceScore:0,
          humanApproved:false,
          error:error.message,
          traceId,
        });
      }
      throw error;
    }
  }

  async executeEngine(engine,input,options={}) {
    const realPayload=engine.executionAdapter==='real_orchestrator'
      ? buildRealOrchestratorPayload(engine.realTaskType,engine,input,options)
      : undefined;
    const output=await dispatch(engine,input,{
      ...options,
      realPayload,
      templateId:options.templateId,
      agentOptions:options.agentOptions,
      context:options.agentContext,
    });
    return {output};
  }

  getStatus() {
    const ready=listReadyEngines();
    return {
      initialized:this.initialized,
      config:{...this.config},
      costState:getCostState(),
      pricing:pricingStatus(),
      configuredProviders:listConfiguredProviders(),
      readyEngines:ready.map((e)=>({id:e.id,name:e.name,type:e.type,provider:e.provider,runtime:e.runtime})),
      capabilityCoverage:capabilityCoverage(),
    };
  }
}

const orchestrator=new AIOrchestrator();

module.exports={
  AIOrchestrator,
  orchestrator,
  buildRealOrchestratorPayload,
  requiredConfidenceDimensions,
  confidenceEvidence,
  usageFrom,
};
