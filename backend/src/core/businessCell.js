/**
 * Business Cell — the composable base for AFRERA — MASTER BUILD DIRECTIVE §1.4.
 *
 * ADOPTION STATUS (checked 2026-08-29, as part of the AI-backbone
 * reconciliation pass): zero modules currently `extends BusinessCell` or
 * `require()` this file anywhere in backend/src or root modules/. It is
 * real, complete infrastructure built ahead of adoption, not dead code in
 * the "nobody needs this" sense — the 112+ modules this was designed to
 * standardize still each hand-roll their own shape. Left as-is rather than
 * force-wiring a module to use it just to make it "used": that would be
 * exactly the kind of fabricated integration this file's own §1.4 AI
 * Intelligence default explicitly refuses to do (see below - "never a
 * fabricated confident answer"). Adopt it deliberately, module by module,
 * when doing real module work - not as a side effect of an audit.
 *
 * WHY THIS FILE HAS TO EXIST BEFORE MODULE WORK SCALES
 *
 * §1.4 requires every Business Cell — the smallest independently executable
 * intelligent unit, one level below Module in the Software Biology Hierarchy —
 * to contain all 24 concerns: Input, Validation, Context Builder, Knowledge
 * Retrieval, Rule Engine, Business Logic, AI Intelligence, Decision Engine,
 * Optimization, Simulation, Recommendation, Workflow, Automation, Storage,
 * Events, Notifications, Security, Monitoring, Logging, Audit, Explainability,
 * Learning, Recovery, Performance Metrics. The directive's own implementation
 * note is explicit about the trap: "Hand-writing 24 concerns per cell across
 * 112 modules guarantees drift — the same drift that put 13 wrong column
 * mappings in the test mock (§4.1)." That drift is not hypothetical here; it
 * already happened once in this exact codebase (`backend/src/database/pool.js`,
 * fixed 2026-08-06 — see the directive §8.1). This file is what stops it
 * happening 150 more times: a cell declares only what differs from the
 * default, and the default is real infrastructure this repo already has,
 * not a placeholder.
 *
 * WHERE EACH CONCERN'S DEFAULT ACTUALLY COMES FROM (no concern below is a
 * decorative no-op dressed up as coverage — each either does real work or is
 * an honest, clearly-labelled pass-through):
 *
 *   Events          -> core/signalBus.js            (already the platform's nervous system)
 *   Decision/Optim.  -> core/mcda.js (gatedMcda)     (already weights confidence by data provenance + agent track record)
 *   Learning         -> core/outcomeSink.js          (already the persisted feedback loop)
 *   Automation       -> emits WORKFLOW_STARTED and lets core/effectors.js react, matching the existing reflex/decision/effector split
 *   Logging/Monitor  -> utils/logger.js + per-stage timing recorded in every result envelope
 *   Validation       -> Joi (already a backend dependency, package.json)
 *   Security         -> a hook a cell can override; real enforcement stays in middleware/auth.js — this is for RESOURCE-level checks a cell alone can know about (e.g. "is this farmer's own record"), not authentication
 *   AI Intelligence  -> a hook that defaults to returning { skipped: true, reason }, never a fabricated confident answer. The backend audit (2026-08-07) found real production code returning `// For now, return a mock response` behind a normal-looking success path — this file makes the honest default the PATH OF LEAST RESISTANCE instead.
 *   Explainability   -> enforced structurally: `recommend()` throws if called without a rationale string, the same discipline decisionEngine.js already holds itself to
 *   Recovery         -> `run()` never throws past its own boundary; every call returns an envelope with `success` so a caller cannot forget to handle failure (mirrors the frontend's "absence must render as absence, never as zero" rule from directive §4.6, applied on the backend side)
 *
 * WHAT A CONCRETE CELL MUST STILL WRITE ITSELF
 *
 * Business Logic has no sane universal default — `execute()` throws if not
 * overridden. Everything else is a toolbox method (`this.validateInput`,
 * `this.buildContext`, `this.retrieveKnowledge`, `this.assessWithAI`,
 * `this.score`, `this.optimize`, `this.simulate`, `this.recommend`,
 * `this.automate`, `this.persist`, `this.notify`) that `execute()` calls in
 * whatever order the specific cell's domain actually needs — this file does
 * not force one fixed pipeline order onto every domain, only guarantees every
 * concern has a real, callable, honestly-labelled implementation available.
 */

'use strict';

const Joi = require('joi');
const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');
const { mcda, rankOptions, gatedMcda } = require('./mcda');
const { logger } = require('../utils/logger');

class BusinessCell {
  /**
   * @param {object} config
   * @param {string} config.id                 unique cell id, e.g. "M067.recordSowing"
   * @param {string} config.moduleId            owning module, e.g. "M067"
   * @param {import('joi').Schema} [config.inputSchema]
   * @param {(input:object, context:object)=>object} [config.authorize]  return {allowed, reason}
   * @param {(input:object, context:object)=>(object|null)} [config.assessWithAI]
   * @param {(result:object, client:any)=>Promise<any>} [config.persist]
   * @param {(event:object)=>Promise<void>|void} [config.notify]
   */
  constructor(config) {
    if (!config?.id) throw new Error('BusinessCell requires a config.id');
    if (!config?.moduleId) throw new Error('BusinessCell requires a config.moduleId');

    this.id = config.id;
    this.moduleId = config.moduleId;
    this.inputSchema = config.inputSchema ?? null;
    this._authorize = config.authorize ?? null;
    this._assessWithAI = config.assessWithAI ?? null;
    this._persist = config.persist ?? null;
    this._notify = config.notify ?? null;
    this.rules = [];
  }

  // ---- Input & Validation --------------------------------------------
  /** Concern: Input + Validation. Throws a structured error listing every violation, not just the first. */
  validateInput(input) {
    if (!this.inputSchema) return input; // a cell with no declared schema accepts input as-is — document why in the cell, not here
    const { error, value } = this.inputSchema.validate(input, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => d.message).join('; ');
      const err = new Error(`${this.id}: input validation failed — ${details}`);
      err.validationDetails = error.details;
      throw err;
    }
    return value;
  }

  // ---- Context Builder --------------------------------------------------
  /** Concern: Context Builder. Same pattern decisionEngine.js uses: recent related signals, windowed. */
  buildContext(input, { windowMs = 15 * 60 * 1000 } = {}) {
    const since = new Date(Date.now() - windowMs).toISOString();
    const window = signalBus.recent({ since, entityId: input?.entityId ?? null, limit: 200 });
    return {
      window,
      forType: (type) => window.filter((s) => s.type === type),
      now: Date.now(),
    };
  }

  // ---- Knowledge Retrieval -----------------------------------------------
  /**
   * Concern: Knowledge Retrieval. Default is an honest no-op: a cell that
   * needs the knowledge graph or a reference dataset overrides this rather
   * than this file inventing a fake lookup that always returns something.
   */
  async retrieveKnowledge(_input, _context) {
    return { available: false, reason: 'no knowledge source configured for this cell' };
  }

  // ---- Rule Engine ---------------------------------------------------
  /** Concern: Rule Engine. Same shape as decisionEngine.addRule — id + evaluate(input, context). */
  addRule(rule) {
    if (!rule?.id || typeof rule.evaluate !== 'function') {
      throw new Error(`${this.id}: rule requires an id and an evaluate() function`);
    }
    this.rules.push(rule);
    return this;
  }

  /** Runs every registered rule; one bad rule must not silence the others (same isolation as decisionEngine.js). */
  applyRules(input, context) {
    const results = [];
    for (const rule of this.rules) {
      try {
        const outcome = rule.evaluate(input, context);
        if (outcome) results.push({ ruleId: rule.id, ...outcome });
      } catch (err) {
        logger.error(`${this.id}:rule_failed`, { ruleId: rule.id, message: err.message });
      }
    }
    return results;
  }

  // ---- Business Logic -----------------------------------------------
  /**
   * Concern: Business Logic. THE ONE CONCERN WITH NO DEFAULT. A cell that
   * does not override this has no reason to exist — throwing here is the
   * correct behaviour, not a gap to silently paper over.
   */
  // eslint-disable-next-line class-methods-use-this
  async execute(_input, _context) {
    throw new Error(`${this.id}: execute() was not overridden — a BusinessCell must implement its own business logic`);
  }

  // ---- AI Intelligence -----------------------------------------------
  /**
   * Concern: AI Intelligence. Default returns an explicit "no AI ran" marker.
   * This exists specifically because the backend audit (2026-08-07) found
   * services returning a plausible-looking object from a code comment
   * reading "For now, return a mock response" — indistinguishable from a
   * real answer to the caller. `{ skipped: true }` cannot be mistaken for one.
   */
  async assessWithAI(input, context) {
    if (this._assessWithAI) return this._assessWithAI(input, context);
    return { skipped: true, reason: 'no AI assessor configured for this cell' };
  }

  // ---- Decision Engine & Optimization ---------------------------------
  /** Concern: Decision Engine (local scoring). Delegates to the platform's real MCDA + calibration-gated scoring — does not reimplement scoring per cell. */
  async score(actorId, criteria) {
    if (actorId) return gatedMcda(actorId, criteria);
    return mcda(criteria); // no actor to gate against — caller accepts an ungated score
  }

  /** Concern: Optimization. Ranks mutually-comparable options; flags a close call as close rather than picking a fake winner. */
  optimize(options) {
    return rankOptions(options);
  }

  // ---- Simulation -----------------------------------------------------
  /** Concern: Simulation. Default no-op — most cells act on the present, not a projected future; override where it matters (e.g. "what if this loan defaults"). */
  async simulate(_input, _context) {
    return { simulated: false, reason: 'no simulation configured for this cell' };
  }

  // ---- Recommendation ---------------------------------------------------
  /**
   * Concern: Recommendation + Explainability. Structurally enforces the same
   * rule decisionEngine.js already holds itself to: a recommendation with no
   * rationale is rejected here, not shipped and discovered later by a farmer
   * asking "why did the platform tell me this?" with no answer available.
   */
  recommend({ action, confidence = null, rationale, alternatives = [] }) {
    if (!rationale || typeof rationale !== 'string' || !rationale.trim()) {
      throw new Error(`${this.id}: recommend() requires a non-empty rationale — an unexplained recommendation is not a recommendation`);
    }
    return { action, confidence, rationale, alternatives, cellId: this.id };
  }

  // ---- Workflow & Automation ---------------------------------------------
  /** Concern: Workflow. Announces work starting so the rest of the organism (effectors, other cells) can react — does not itself own a workflow engine. */
  startWorkflow(name, payload = {}, meta = {}) {
    return signalBus.emitSignal(SIGNAL.WORKFLOW_STARTED, { name, ...payload }, {
      source: this.id, severity: SEVERITY.INFO, ...meta,
    });
  }

  /** Concern: Automation. A cell-local action list, run with the same per-action isolation as core/effectors.js. */
  async automate(actions = []) {
    const results = [];
    for (const action of actions) {
      try {
        const outcome = await action.run();
        results.push({ id: action.id, ok: true, outcome });
      } catch (err) {
        logger.error(`${this.id}:automation_failed`, { actionId: action.id, message: err.message });
        results.push({ id: action.id, ok: false, error: err.message });
      }
    }
    return results;
  }

  // ---- Storage ------------------------------------------------------
  /** Concern: Storage. A cell does not own the database — it is handed a persist function (often core/withTransaction.js) so the boundary decision stays with a human, per directive §8.3. */
  async persist(result, client) {
    if (!this._persist) return { persisted: false, reason: 'no persist function configured for this cell' };
    return this._persist(result, client);
  }

  // ---- Security -------------------------------------------------------
  /** Concern: Security (resource-level, not authentication — that stays in middleware/auth.js). Default allows, matching how most cells are reached only after middleware has already authenticated the caller. */
  authorize(input, context) {
    if (!this._authorize) return { allowed: true, reason: 'no cell-level resource check configured' };
    return this._authorize(input, context);
  }

  // ---- Notifications ----------------------------------------------------
  /** Concern: Notifications. Default logs rather than silently dropping — makes a missing notifier visible in logs instead of a farmer never finding out their claim moved. */
  async notify(event) {
    if (!this._notify) {
      logger.warn(`${this.id}:notify_not_configured`, { event: event?.type ?? 'unknown' });
      return { sent: false, reason: 'no notifier configured for this cell' };
    }
    return this._notify(event);
  }

  // ---- Audit & Learning ---------------------------------------------------
  /** Concern: Audit + Learning. Emits onto the bus (cheap, always available) and, if the caller wired outcomeSink, records a scoreable prediction too. */
  async recordOutcome({ predictionType, subjectId, predictedValue, confidence, recordPrediction }) {
    signalBus.emitSignal(SIGNAL.DECISION_MADE, {
      mode: 'cell', cellId: this.id, predictionType, subjectId, predictedValue, confidence,
    }, { source: this.id, severity: SEVERITY.INFO, entityId: subjectId ?? null });

    if (typeof recordPrediction === 'function') {
      try {
        return await recordPrediction({
          actorId: this.id, predictionType, subjectType: this.moduleId,
          subjectId, predictedValue, statedConfidence: confidence,
        });
      } catch (err) {
        logger.error(`${this.id}:record_outcome_failed`, { message: err.message });
      }
    }
    return null;
  }

  // ---- Orchestration: Monitoring, Logging, Recovery, Performance Metrics ----
  /**
   * Runs `execute()` with every other concern wired around it, and NEVER
   * throws past this boundary — every call returns an envelope with
   * `success`, so a caller cannot forget to check it (the backend equivalent
   * of directive §4.6's "absence must render as absence, never as zero").
   * Callers that genuinely need the exception to propagate (e.g. to trigger
   * an outer withTransaction rollback) should inspect `envelope.success` and
   * throw `envelope.error` themselves — an explicit re-throw, not an implicit one.
   */
  async run(rawInput, { actorId = null, recordPrediction = null } = {}) {
    const timings = {};
    const stage = (name, fn) => {
      const t0 = process.hrtime.bigint();
      return Promise.resolve()
        .then(fn)
        .finally(() => { timings[name] = Number(process.hrtime.bigint() - t0) / 1e6; });
    };

    try {
      const input = await stage('validate', () => this.validateInput(rawInput));
      const context = await stage('context', () => this.buildContext(input));

      const auth = await stage('authorize', () => this.authorize(input, context));
      if (!auth.allowed) {
        return this._envelope(false, null, timings, { stage: 'authorize', error: auth.reason || 'not authorized' });
      }

      const result = await stage('execute', () => this.execute(input, context));

      if (this._persist) await stage('persist', () => this.persist(result, context.client));

      return this._envelope(true, result, timings, null);
    } catch (err) {
      logger.error(`${this.id}:run_failed`, { message: err.message });
      return this._envelope(false, null, timings, { stage: 'execute', error: err.message });
    }
  }

  _envelope(success, result, timings, failure) {
    return {
      success,
      cellId: this.id,
      moduleId: this.moduleId,
      result: success ? result : null,
      failure: success ? null : failure,
      timings,
      totalMs: Math.round(Object.values(timings).reduce((a, b) => a + b, 0) * 1000) / 1000,
      at: new Date().toISOString(),
    };
  }
}

module.exports = { BusinessCell, Joi };
