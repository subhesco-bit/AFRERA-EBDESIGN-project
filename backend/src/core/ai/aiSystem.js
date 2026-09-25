/**
 * The AI system — one composition point for every AI part of the platform.
 *
 * These pieces were all present and all started separately, or not at all:
 *
 *   intelligence fabric   engines, provider adapters, guardrails, cost, audit
 *   capability classes    which kind of AI serves what, and its autonomy
 *   signal bus            55 signal types, the afferent channel
 *   decision engine       correlation rules over a windowed context
 *   reflex engine         synchronous, budgeted, pre-authorised responses
 *   effectors             the efferent channel — what actually happens
 *   human review bridge   decisions that need a person
 *   M400 AI backbone      decision/strategy/learning/prediction/coordination
 *   ERP agents            11 domain agents producing proposals
 *   outcome resolver      calibration: did the prediction come true?
 *
 * Started piecemeal, they behave as islands: the backbone reported every engine
 * "failed" because nothing called its initialize(); the decision layer's
 * start() methods were never called at all; and nothing could answer "is the
 * AI working?" without inspecting six modules by hand.
 *
 * This starts them in dependency order and reports one status. It owns no
 * logic of its own — every capability lives in the module that implements it.
 *
 * ORDER MATTERS:
 *   1. bus first — everything else subscribes to it
 *   2. decision/reflex/effectors — the loop from sensation to action
 *   3. human review — must exist before decisions start being made
 *   4. fabric and backbone — heavier, and nothing above depends on them
 *
 * A failure in any single component is contained. An AI subsystem that cannot
 * start must not prevent the platform from serving requests, so each step is
 * caught and reported rather than thrown.
 */

'use strict';

const { logger } = require('../../utils/logger');

const state = {
  started: false,
  startedAt: null,
  components: {},
};

function record(name, ok, detail) {
  state.components[name] = { ok, detail, at: new Date().toISOString() };
  if (ok) logger.info(`aiSystem: ${name} started`, detail || {});
  else logger.warn(`aiSystem: ${name} did not start`, detail || {});
}

/**
 * Start the whole AI system. Idempotent — calling it twice is a no-op, because
 * every underlying start() is itself idempotent and re-subscribing would
 * double-fire every handler.
 */
async function start(options = {}) {
  if (state.started) return status();

  // ---- 1. signal bus -------------------------------------------------
  let signalBus = null;
  try {
    ({ signalBus } = require('../signalBus'));
    record('signalBus', true, { signals: Object.keys(require('../signalBus').SIGNAL).length });
  } catch (error) {
    record('signalBus', false, { error: error.message });
    // Without the bus nothing else can be wired; stop rather than start
    // components that will silently never receive anything.
    state.started = true;
    state.startedAt = new Date().toISOString();
    return status();
  }

  // ---- 2. decision loop ----------------------------------------------
  try {
    const { decisionEngine } = require('../decisionEngine');
    decisionEngine.start();
    record('decisionEngine', true, { rules: decisionEngine.rules.length });
  } catch (error) {
    record('decisionEngine', false, { error: error.message });
  }

  try {
    const { reflexEngine } = require('../reflexEngine');
    reflexEngine.start();
    record('reflexEngine', true, { reflexes: reflexEngine.reflexes.size });
  } catch (error) {
    record('reflexEngine', false, { error: error.message });
  }

  try {
    const { registerEffectors } = require('../effectors');
    const count = registerEffectors();
    record('effectors', true, { registered: count });
  } catch (error) {
    record('effectors', false, { error: error.message });
  }

  // ---- 3. human review ------------------------------------------------
  try {
    const humanReviewBridge = require('../humanReviewBridge');
    humanReviewBridge.start();
    record('humanReviewBridge', true);
  } catch (error) {
    record('humanReviewBridge', false, { error: error.message });
  }

  // ---- 4. intelligence fabric ----------------------------------------
  try {
    const { initializeAI } = require('./index');
    const r = await initializeAI(options.fabric || {});
    record('intelligenceFabric', r.success !== false, { message: r.message });
  } catch (error) {
    record('intelligenceFabric', false, { error: error.message });
  }

  // ---- 5. M400 AI backbone -------------------------------------------
  // Its five engines only exist after initialize(). The route initialises it
  // lazily on first use, which meant healthCheck() reported every engine
  // "failed" until someone happened to call something. Starting it here makes
  // the system's reported state true at boot.
  try {
    const AIBackboneService = require('../../modules/M400_AI_BACKBONE/backend/service');
    const backbone = state.backbone || new AIBackboneService();
    await backbone.initialize(options.backbone || {});
    state.backbone = backbone;
    const health = await backbone.healthCheck();
    const engines = health?.components || {};
    const failed = Object.entries(engines).filter(([, v]) => v !== 'operational').map(([k]) => k);
    record('aiBackbone', failed.length === 0, {
      status: health?.status,
      database: health?.dependencies?.database?.status,
      failedEngines: failed,
    });
  } catch (error) {
    record('aiBackbone', false, { error: error.message });
  }

  // ---- 6. ERP proposal agents (legacy embedded compatibility) ----------
  try {
    const erpAgents = require('../erpAgents');
    record('erpAgents', true, {
      agents: erpAgents.listAgents().length,
      note: 'on-demand embedded proposal rules; execution authority remains outside AI',
    });
  } catch (error) {
    record('erpAgents', false, { error: error.message });
  }

  // ---- 7. isolated hybrid agent/domain backbone -----------------------
  try {
    const completion = require('./aiCompletionRegistry').build();
    record('agentTemplateRegistry', completion.codeComplete, {
      templates: completion.agents.templates,
      streams: completion.agents.streams,
      domains: completion.domains.coveredDomains,
      codeBlockers: completion.codeBlockers,
    });
    const dual = require('./dualBackboneOrchestrator').health();
    record('dualBackbone', dual.status === 'healthy', dual);
    record('memoryRouter', completion.memory.status === 'ready', completion.memory);
    record('evaluationRegistry', completion.evaluation.status === 'ready', completion.evaluation);
  } catch (error) {
    record('agentTemplateRegistry', false, { error: error.message });
  }

  state.started = true;
  state.startedAt = new Date().toISOString();

  const failed = Object.entries(state.components).filter(([, v]) => !v.ok).map(([k]) => k);
  if (failed.length) logger.warn('aiSystem: started with degraded components', { failed });
  else logger.info('aiSystem: all components started');

  return status();
}

/**
 * One answer to "is the AI working?".
 *
 * Deliberately separates what is RUNNING from what merely EXISTS: capability
 * classes report LIVE/BUILT/ABSENT, components report started or not. A
 * platform that conflates the two is how "96% complete" gets published.
 */
function status() {
  let capabilities = null;
  let integration = null;
  try {
    const cc = require('./capabilityClasses');
    capabilities = cc.summary();
    integration = cc.integrationGaps();
  } catch (error) {
    capabilities = { error: error.message };
  }

  const components = state.components;
  const started = Object.entries(components).filter(([, v]) => v.ok).map(([k]) => k);
  const degraded = Object.entries(components).filter(([, v]) => !v.ok).map(([k]) => k);

  let completion = null;
  try { completion = require('./aiCompletionRegistry').build(); } catch (error) { completion = { codeComplete: false, codeBlockers: ['completion_status_error'], error: error.message }; }

  return {
    started: state.started,
    startedAt: state.startedAt,
    healthy: state.started && degraded.length === 0 && completion.codeComplete === true,
    runtimeFullyOperational: completion.runtimeFullyOperational === true,
    components,
    summary: { started, degraded },
    capabilities,
    integration,
    completion,
  };
}

/** The initialised backbone, for callers that need it directly. */
function backbone() {
  return state.backbone || null;
}

module.exports = { start, status, backbone };
