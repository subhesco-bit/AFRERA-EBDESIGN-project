/**
 * Decision Engine — cross-module correlation and response.
 *
 * WHY THIS EXISTS
 * AFRERA had 62 services that each made local decisions well and had no way to
 * make a joint one. A cold-chain temperature breach was an IoT event; the fact
 * that the same shipment carried a high-value insured consignment for a
 * first-time buyer lived in three other modules and was never brought
 * together. This engine is where those facts meet.
 *
 * In the platform's body analogy: signalBus is the nervous system, this is the
 * brain. Two distinct response paths, matching real physiology:
 *
 *   REFLEX  — a single signal above a severity threshold triggers an immediate,
 *             pre-wired response. No deliberation. (Spinal reflex arc.)
 *   REASONED — several signals across different modules, correlated over a time
 *             window, produce a judged decision with an explanation.
 *
 * Every decision carries the signals that caused it and a human-readable
 * rationale. A decision that cannot be explained cannot be trusted, audited, or
 * appealed — and several of these decisions affect a farmer's money.
 *
 * The engine NEVER executes side effects itself. It emits a decision; effectors
 * subscribe and act. That keeps it testable and prevents the brain from
 * reaching directly into an organ.
 */

const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');
const stats = require('../utils/statistics');
const { logger } = require('../utils/logger');

const ACTION = Object.freeze({
  HOLD_SHIPMENT: 'hold_shipment',
  BLOCK_TRANSACTION: 'block_transaction',
  ESCALATE_HUMAN: 'escalate_to_human',
  NOTIFY_STAKEHOLDER: 'notify_stakeholder',
  ADJUST_PRICE: 'adjust_price',
  REPRIORITISE_LOGISTICS: 'reprioritise_logistics',
  TRIGGER_INSPECTION: 'trigger_inspection',
  FREEZE_PAYOUT: 'freeze_payout',
  RECOMMEND_RESTOCK: 'recommend_restock',
  OPEN_CLAIM: 'open_claim'
});

/** Correlation window: how far back a rule may look for corroborating signals. */
const WINDOW_MS = 15 * 60 * 1000;

class DecisionEngine {
  constructor(bus = signalBus) {
    this.bus = bus;
    this.rules = [];
    this.decisions = [];
    this.maxDecisions = 200;
    this._wired = false;
    // Defence in depth against cascades: even with DECISION_MADE filtered out,
    // a future rule could emit a signal that re-enters process(). Cap the
    // reentrancy depth so a mistake degrades to a logged warning rather than a
    // stack overflow that takes the process down.
    this._depth = 0;
    this._maxDepth = 4;
    this._registerDefaultRules();
  }

  /**
   * Register a correlation rule.
   * @param {object} rule
   *   id, description, triggers[], evaluate(signal, context) -> decision|null
   */
  addRule(rule) {
    if (!rule?.id || typeof rule.evaluate !== 'function') {
      throw new Error('Rule requires an id and an evaluate() function');
    }
    this.rules.push(rule);
    return this;
  }

  /** Attach to the bus. Idempotent. */
  start() {
    if (this._wired) return this;
    this.bus.onSignal('*', (signal) => this.process(signal));
    this._wired = true;
    logger.info(`DecisionEngine active with ${this.rules.length} rules`);
    return this;
  }

  /**
   * Evaluate every rule whose triggers match this signal.
   * Rule failures are isolated: one bad rule must not silence the others.
   */
  process(signal) {
    // The engine must never reason about its own output. Decisions are
    // re-emitted onto the bus so that effectors can act on them, but they are
    // efferent (outbound) traffic - treating them as fresh sensation creates a
    // feedback loop: decision -> signal -> decision -> ... until the stack
    // overflows. The brain does not re-perceive its own instructions.
    if (signal.type === SIGNAL.DECISION_MADE) return [];

    if (this._depth >= this._maxDepth) {
      logger.warn(
        `DecisionEngine reentrancy depth ${this._depth} reached on ${signal.type}; ` +
        'skipping to prevent a cascade.'
      );
      return [];
    }

    this._depth++;
    const made = [];
    try {
      const context = this._buildContext(signal);
      for (const rule of this.rules) {
        if (rule.triggers?.length && !rule.triggers.includes(signal.type)) continue;
        try {
          const decision = rule.evaluate(signal, context);
          if (decision) made.push(this._record(rule, signal, decision));
        } catch (err) {
          logger.error(`Decision rule "${rule.id}" failed: ${err.message}`);
        }
      }
    } finally {
      this._depth--;
    }
    return made;
  }

  /** The correlated view a rule reasons over. */
  _buildContext(signal) {
    const since = new Date(Date.now() - WINDOW_MS).toISOString();
    const window = this.bus.recent({ since, limit: 300 });
    return {
      window,
      forEntity: (id) => window.filter((s) => s.entityId && s.entityId === id),
      ofType: (type) => window.filter((s) => s.type === type),
      countOfType: (type) => window.filter((s) => s.type === type).length,
      severityPeak: window.length ? Math.max(...window.map((s) => s.severity)) : 0,
      now: Date.now()
    };
  }

  _record(rule, signal, decision) {
    const record = {
      id: `dec_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      rule: rule.id,
      mode: decision.mode || 'reasoned',
      actions: decision.actions || [],
      confidence: decision.confidence ?? null,
      rationale: decision.rationale,
      causedBy: decision.causedBy || [signal.correlationId],
      entityId: signal.entityId ?? null,
      severity: decision.severity ?? signal.severity,
      requiresHuman: decision.requiresHuman ?? false,
      timestamp: new Date().toISOString()
    };

    this.decisions.push(record);
    if (this.decisions.length > this.maxDecisions) this.decisions.shift();

    logger.info(`Decision [${rule.id}] -> ${record.actions.join(', ')} :: ${record.rationale}`);

    // Announce it. Effectors subscribe; the engine does not act directly.
    this.bus.emitSignal(SIGNAL.DECISION_MADE, record, {
      severity: record.severity,
      source: 'decisionEngine',
      entityId: record.entityId,
      correlationId: record.id
    });

    return record;
  }

  recentDecisions(limit = 50) {
    return this.decisions.slice(-limit).reverse();
  }

  // ------------------------------------------------------------------
  // Default rules — each encodes a cross-module judgement that no single
  // service could previously reach on its own.
  // ------------------------------------------------------------------
  _registerDefaultRules() {
    // REFLEX: an emergency signal bypasses deliberation entirely.
    this.addRule({
      id: 'reflex.emergency_escalation',
      description: 'Any EMERGENCY-severity signal escalates immediately.',
      triggers: [],
      evaluate: (signal) => {
        if (signal.severity < SEVERITY.EMERGENCY) return null;
        return {
          mode: 'reflex',
          actions: [ACTION.ESCALATE_HUMAN, ACTION.NOTIFY_STAKEHOLDER],
          confidence: 1,
          requiresHuman: true,
          rationale: `Emergency signal ${signal.type} from ${signal.source} requires immediate human attention.`
        };
      }
    });

    // Cold chain + value + perishability -> hold, inspect, pre-open a claim.
    this.addRule({
      id: 'coldchain.compound_breach',
      description: 'Temperature breach corroborated by shelf-life or delay signals on the same shipment.',
      triggers: [SIGNAL.TEMPERATURE_BREACH],
      evaluate: (signal, ctx) => {
        const related = signal.entityId ? ctx.forEntity(signal.entityId) : [];
        const delayed = related.some((s) => s.type === SIGNAL.SHIPMENT_DELAYED);
        const perishing = related.some((s) => s.type === SIGNAL.SHELF_LIFE_CRITICAL);
        const breaches = related.filter((s) => s.type === SIGNAL.TEMPERATURE_BREACH).length;

        // A single transient breach is normal operational noise.
        if (breaches < 2 && !delayed && !perishing) return null;

        const actions = [ACTION.HOLD_SHIPMENT, ACTION.TRIGGER_INSPECTION];
        if (perishing) actions.push(ACTION.REPRIORITISE_LOGISTICS);
        if (perishing && delayed) actions.push(ACTION.OPEN_CLAIM);

        const reasons = [`${breaches} temperature breach(es) in the last 15 min`];
        if (delayed) reasons.push('shipment is already delayed');
        if (perishing) reasons.push('shelf life is critical');

        return {
          mode: 'reasoned',
          actions,
          confidence: Math.min(1, 0.4 + breaches * 0.2 + (delayed ? 0.15 : 0) + (perishing ? 0.25 : 0)),
          severity: SEVERITY.CRITICAL,
          requiresHuman: perishing && delayed,
          causedBy: related.map((s) => s.correlationId),
          rationale: `Cold-chain integrity compromised on shipment ${signal.entityId}: ${reasons.join('; ')}.`
        };
      }
    });

    // Fraud signal + an in-flight payment on the same actor -> freeze, don't just flag.
    this.addRule({
      id: 'risk.fraud_with_payment_exposure',
      description: 'Fraud suspicion while a payment for the same entity is in flight.',
      triggers: [SIGNAL.FRAUD_SUSPECTED],
      evaluate: (signal, ctx) => {
        const probability = Number(signal.payload?.probability) || 0;
        if (probability < 0.6) return null;

        let related = signal.entityId ? ctx.forEntity(signal.entityId) : [];
        const payments = related.filter((s) => s.type === SIGNAL.PAYMENT_RECEIVED);

        let actions = [ACTION.BLOCK_TRANSACTION];
        if (payments.length) actions.push(ACTION.FREEZE_PAYOUT);
        if (probability >= 0.8) actions.push(ACTION.ESCALATE_HUMAN);

        return {
          mode: 'reasoned',
          actions,
          confidence: probability,
          severity: probability >= 0.8 ? SEVERITY.CRITICAL : SEVERITY.WARNING,
          requiresHuman: probability >= 0.8,
          causedBy: [signal.correlationId, ...payments.map((p) => p.correlationId)],
          rationale:
            `Fraud probability ${(probability * 100).toFixed(0)}% for ${signal.entityId}` +
            (payments.length
              ? ` with ${payments.length} payment(s) in flight — freezing payout pending review.`
              : ' — blocking transaction.')
        };
      }
    });

    // Quality failure + shipped stock -> recall consideration, not just a log line.
    this.addRule({
      id: 'quality.failure_with_distribution',
      description: 'Quality test failure on a batch that has already shipped.',
      triggers: [SIGNAL.QUALITY_FAILED],
      evaluate: (signal, ctx) => {
        let related = signal.entityId ? ctx.forEntity(signal.entityId) : [];
        const shipped = related.some(
          (s) => s.type === SIGNAL.ORDER_PLACED || s.type === SIGNAL.SHIPMENT_DELAYED
        );
        if (!shipped) return null;

        return {
          mode: 'reasoned',
          actions: [ACTION.HOLD_SHIPMENT, ACTION.ESCALATE_HUMAN, ACTION.NOTIFY_STAKEHOLDER],
          confidence: 0.9,
          severity: SEVERITY.CRITICAL,
          requiresHuman: true,
          causedBy: related.map((s) => s.correlationId),
          rationale:
            `Batch ${signal.entityId} failed quality testing after distribution began — ` +
            'recall assessment required before further movement.'
        };
      }
    });

    // Demand forecast shift -> restock/pricing, but only when the forecast is
    // actually trustworthy. This is why the statistics rewrite mattered: the
    // engine can now read a real accuracy figure instead of a hardcoded 0.94.
    this.addRule({
      id: 'commerce.demand_shift_response',
      description: 'Material demand trend change on a sufficiently accurate forecast.',
      triggers: [SIGNAL.DEMAND_FORECAST_UPDATED],
      evaluate: (signal) => {
        const { accuracy = 0, trend = 0, insufficientData = false, forecast = [] } =
          signal.payload || {};

        if (insufficientData || accuracy < 0.7) return null;

        // Base the comparison on the CURRENT level, not the mean of the
        // forecast. mean(forecast) rises with the extrapolation itself, so
        // using it as the denominator suppresses the trend being measured
        // (a clean +2/period series scored 0.011 and was discarded).
        // Also measure across the whole horizon: 5% PER PERIOD compounds to
        // roughly 4x over 30 periods and would essentially never fire.
        const currentLevel = Number(signal.payload?.currentLevel)
          || (forecast.length ? forecast[0] - trend : 0);
        if (!currentLevel) return null;

        const horizon = forecast.length || 1;
        const projectedChange = (trend * horizon) / currentLevel;
        if (Math.abs(projectedChange) < 0.10) return null; // <10% over horizon is noise

        const rising = projectedChange > 0;
        return {
          mode: 'reasoned',
          actions: rising
            ? [ACTION.RECOMMEND_RESTOCK, ACTION.ADJUST_PRICE]
            : [ACTION.ADJUST_PRICE],
          confidence: accuracy,
          severity: SEVERITY.NOTICE,
          rationale:
            `Demand for ${signal.entityId} is ${rising ? 'rising' : 'falling'} ` +
            `(projected ${(projectedChange * 100).toFixed(0)}% change over ${horizon} periods, ` +
            `forecast accuracy ${(accuracy * 100).toFixed(0)}%) — ` +
            `${rising ? 'restock and review pricing' : 'review pricing to defend volume'}.`
        };
      }
    });

    // Repeated sensor loss on one asset is an integrity problem, not N alerts.
    this.addRule({
      id: 'iot.sensor_reliability_degradation',
      description: 'Repeated sensor dropouts indicate an unreliable monitoring asset.',
      triggers: [SIGNAL.SENSOR_OFFLINE],
      evaluate: (signal, ctx) => {
        const dropouts = signal.entityId
          ? ctx.forEntity(signal.entityId).filter((s) => s.type === SIGNAL.SENSOR_OFFLINE).length
          : 0;
        if (dropouts < 3) return null;

        return {
          mode: 'reasoned',
          actions: [ACTION.TRIGGER_INSPECTION, ACTION.NOTIFY_STAKEHOLDER],
          confidence: Math.min(1, dropouts / 5),
          severity: SEVERITY.WARNING,
          rationale:
            `Sensor ${signal.entityId} dropped out ${dropouts} times in 15 minutes — ` +
            'cold-chain telemetry for this asset should not be trusted until inspected.'
        };
      }
    });
  }
}

const decisionEngine = new DecisionEngine();

module.exports = { decisionEngine, DecisionEngine, ACTION };
