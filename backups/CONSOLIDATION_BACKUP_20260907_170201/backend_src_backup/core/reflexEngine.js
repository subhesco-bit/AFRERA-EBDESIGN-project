/**
 * Reflex Engine — the platform's spinal reflex arc, not another brain.
 *
 * ADOPTION STATUS (checked 2026-08-29, AI-backbone reconciliation pass):
 * zero callers anywhere in backend/src — core/signalBus.js (~60 importers,
 * the platform's real nervous system) does not dispatch into this file, and
 * nothing has registered a single reflex yet. Real, complete, correctly
 * isolated infrastructure sitting unused, not dead code that should be
 * deleted. Wiring signalBus.js to check registered reflexes before falling
 * through to decisionEngine.js is the natural next step, but that is a
 * signal-flow change affecting every one of signalBus's ~60 callers and
 * belongs in its own reviewed change, not bundled into this pass.
 *
 * WHY THIS IS A SEPARATE FILE FROM decisionEngine.js
 *
 * `decisionEngine.js` already has a rule labelled "reflex.emergency_escalation",
 * and that naming is misleading. That rule still runs inside `process()`: it
 * waits its turn behind every other rule, it is async-capable, and nothing
 * stops a future rule in that file from awaiting a network call. That is a
 * FAST DECISION, not a reflex. A biological reflex arc bypasses the brain
 * entirely — the signal goes in, the muscle moves, and the brain is informed
 * afterwards. AFRERA — MASTER BUILD DIRECTIVE §2.4 names the same distinction
 * and requires a real one: "A reflex that calls an LLM is not a reflex... no
 * network call... implement as core/reflexEngine.js with an enforced timeout
 * budget and a test that fails if any registered reflex exceeds it."
 *
 * WHAT MAKES SOMETHING QUALIFY FOR THIS FILE INSTEAD OF decisionEngine.js
 *
 *   1. `act()` is a plain synchronous function. Registering an async function
 *      is rejected at registration time (see `_assertSynchronous`), not
 *      discovered later in production when it is too late to matter.
 *   2. `act()` touches only in-process state (a Map, a flag, a counter). No
 *      `pool.query`, no `axios`, no `fetch`. This file cannot enforce that
 *      mechanically without a static analyser this repo does not have, so it
 *      is a review-time rule: if a reflex needs the network or the database,
 *      it is a decision, not a reflex, and belongs in decisionEngine.js.
 *   3. Execution is timed on every firing and compared against a declared
 *      budget. JavaScript is single-threaded and cannot pre-empt a slow
 *      synchronous function, so this cannot stop a reflex from running long —
 *      it can only prove, after the fact, whether one did. That measurement
 *      is what the directive's "a test that fails if any registered reflex
 *      exceeds it" is checking.
 *
 * WHAT IS DELIBERATELY NOT REGISTERED HERE YET
 *
 * The directive's own example list — pump overpressure, fire detection,
 * equipment shutdown, emergency valve closure — describes physical actuators
 * this platform does not yet have a wired IoT actuation layer for (see
 * PART 2.2 "Muscular" — IoT Actuation is listed as a target, not something
 * built). Registering a "close the valve" reflex with no valve to close would
 * be exactly the decorative analogy §1.2 forbids. Only one default reflex
 * ships below, chosen because it is the one item on that list this codebase
 * can genuinely execute today with zero network hop: freezing further
 * processing of a near-certain-fraud actor in memory, instantly, without
 * waiting for `fraud.hold_review` in effectors.js to make a database write.
 * Add the physical reflexes here the day an actuator exists to receive them.
 */

'use strict';

const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');
const { logger } = require('../utils/logger');

/** Default budget for a reflex that declares none. Generous on purpose: the
 *  point is to catch a reflex that is orders of magnitude too slow (it made a
 *  network call, it looped over a large collection), not to shave microseconds. */
const DEFAULT_BUDGET_MS = 5;

class ReflexEngine {
  constructor(bus = signalBus) {
    this.bus = bus;
    this.reflexes = new Map();
    this.firings = [];
    this.maxFirings = 200;
    this._wired = false;
    this._registerDefaultReflexes();
  }

  /**
   * Register a reflex.
   * @param {object} reflex
   * @param {string}   reflex.id
   * @param {string}   reflex.description
   * @param {string[]} reflex.signalTypes   exact SIGNAL.* types this reflex watches
   * @param {(signal:object)=>boolean} reflex.test   pure predicate: should this fire?
   * @param {(signal:object)=>object}  reflex.act    pure effect: do it, return a record of what happened
   * @param {number}   [reflex.budgetMs]   overrides DEFAULT_BUDGET_MS
   */
  register(reflex) {
    if (!reflex?.id || typeof reflex.id !== 'string') {
      throw new Error('A reflex requires a string id');
    }
    if (this.reflexes.has(reflex.id)) {
      throw new Error(`Reflex "${reflex.id}" is already registered`);
    }
    if (!Array.isArray(reflex.signalTypes) || reflex.signalTypes.length === 0) {
      throw new Error(`Reflex "${reflex.id}" must declare at least one signalType`);
    }
    this._assertSynchronous(reflex.id, 'test', reflex.test);
    this._assertSynchronous(reflex.id, 'act', reflex.act);

    this.reflexes.set(reflex.id, {
      budgetMs: DEFAULT_BUDGET_MS,
      ...reflex,
    });
    return this;
  }

  /**
   * Reject anything that could turn a reflex into a hidden network call.
   * An `async function` or a plain function returning a thenable both fail —
   * checked by constructor name (cheap, catches the common case) and, for
   * `act`, by inspecting the actual return value the first time it fires
   * (see `fire`), because a function can return a Promise without being
   * declared `async`.
   */
  _assertSynchronous(id, field, fn) {
    if (typeof fn !== 'function') {
      throw new Error(`Reflex "${id}".${field} must be a function`);
    }
    if (fn.constructor?.name === 'AsyncFunction') {
      throw new Error(
        `Reflex "${id}".${field} is declared async — a reflex must be synchronous. ` +
        'If this needs to await anything (a database call, an HTTP call), it is a ' +
        'decision, not a reflex: register it in decisionEngine.js instead.'
      );
    }
  }

  /** Attach to the bus. Idempotent. */
  start() {
    if (this._wired) return this;
    for (const reflex of this.reflexes.values()) {
      for (const type of reflex.signalTypes) {
        this.bus.onSignal(type, (signal) => this.fire(reflex.id, signal));
      }
    }
    this._wired = true;
    logger.info(`ReflexEngine active with ${this.reflexes.size} reflex(es)`);
    return this;
  }

  /**
   * Run one reflex against one signal, synchronously, and record whether it
   * stayed inside its timing budget. Called directly by tests as well as by
   * the bus subscription installed in `start()`.
   */
  fire(reflexId, signal) {
    const reflex = this.reflexes.get(reflexId);
    if (!reflex) throw new Error(`No reflex registered as "${reflexId}"`);

    const startedAt = process.hrtime.bigint();
    let outcome = null;
    let error = null;
    let shouldFire = false;

    try {
      shouldFire = Boolean(reflex.test(signal));
      if (shouldFire) {
        outcome = reflex.act(signal);
        if (outcome && typeof outcome.then === 'function') {
          // A synchronously-declared function that still returned a Promise —
          // e.g. it called an async helper without awaiting it. The reflex has
          // already "fired" from the caller's perspective by the time we can
          // detect this, so this is a hard failure, not a soft warning: the
          // budget measured below is meaningless if work is still in flight.
          throw new Error(
            `Reflex "${reflexId}" returned a thenable from act() — it is not ` +
            'actually synchronous. Move it to decisionEngine.js.'
          );
        }
      }
    } catch (err) {
      error = err.message;
      logger.error(`reflex:${reflexId}:failed`, { signal: signal.type, message: err.message });
    }

    const elapsedMs = Number(process.hrtime.bigint() - startedAt) / 1e6;
    const budgetExceeded = elapsedMs > reflex.budgetMs;

    const record = {
      reflexId,
      signalType: signal.type,
      entityId: signal.entityId ?? null,
      fired: shouldFire,
      outcome,
      error,
      elapsedMs: Math.round(elapsedMs * 1000) / 1000,
      budgetMs: reflex.budgetMs,
      budgetExceeded,
      at: new Date().toISOString(),
    };

    if (shouldFire) {
      this._record(record);
      const level = error ? 'error' : budgetExceeded ? 'warn' : 'info';
      logger[level](`reflex:${reflexId}:fired`, {
        elapsedMs: record.elapsedMs, budgetMs: reflex.budgetMs, budgetExceeded, error,
      });
      if (budgetExceeded) {
        // This does not undo the reflex — it already ran. It is the signal
        // that this reflex has drifted from "instant" and needs to be pulled
        // out of this file before it causes a real stall somewhere hot.
        logger.warn(`reflex:${reflexId}:budget_exceeded`, {
          elapsedMs: record.elapsedMs, budgetMs: reflex.budgetMs,
        });
      }
      // A reflex still announces itself, afferent-style, so the decision
      // engine and audit trail see that it happened — it just does not WAIT
      // for anything downstream before acting.
      this.bus.emitSignal(SIGNAL.DECISION_MADE, {
        mode: 'reflex', reflexId, outcome, elapsedMs: record.elapsedMs,
      }, {
        severity: signal.severity ?? SEVERITY.WARNING,
        source: `reflex:${reflexId}`,
        entityId: signal.entityId,
        correlationId: signal.correlationId,
      });
    }

    return record;
  }

  _record(record) {
    this.firings.push(record);
    if (this.firings.length > this.maxFirings) this.firings.shift();
  }

  recentFirings(limit = 50) {
    return this.firings.slice(-limit).reverse();
  }

  /** Every registered reflex that has fired at least once over budget. Tests assert this is empty. */
  budgetViolations() {
    return this.firings.filter((f) => f.budgetExceeded);
  }

  // ------------------------------------------------------------------
  _registerDefaultReflexes() {
    // In-process freeze set. Deliberately not the database: a reflex that
    // waited on `pool.query` before blocking the next request from the same
    // actor would let several fraudulent actions through in the time it took
    // to write the row. The durable record — and the human-reviewable
    // unfreeze — is still `fraud.hold_review` in effectors.js; this only
    // stops the bleeding in the meantime, in memory, for this process.
    this._frozenActors = new Set();

    this.register({
      id: 'fraud.instant_freeze',
      description:
        'Near-certain fraud (>=0.95 probability) freezes the actor in memory ' +
        'immediately, before the reasoned pipeline in decisionEngine.js or the ' +
        'durable record in effectors.js has had a chance to run.',
      signalTypes: [SIGNAL.FRAUD_SUSPECTED],
      budgetMs: DEFAULT_BUDGET_MS,
      test: (signal) => (Number(signal.payload?.probability) || 0) >= 0.95,
      act: (signal) => {
        const actorId = signal.payload?.userId ?? signal.entityId ?? null;
        if (actorId != null) this._frozenActors.add(actorId);
        return { action: 'instant_freeze', actorId, reason: 'probability>=0.95' };
      },
    });
  }

  /** Read-side check other code can call before letting an action proceed. */
  isFrozen(actorId) {
    return this._frozenActors.has(actorId);
  }

  /** Release path — deliberately requires a caller, mirrors outcomeSink.judgeOutcome's
   *  "an unattributed judgement cannot be questioned later" rule. No default caller
   *  gets to unfreeze silently. */
  unfreeze(actorId, releasedBy) {
    if (!releasedBy) {
      throw new Error('Releasing an instant-freeze requires naming who authorised it');
    }
    const was = this._frozenActors.delete(actorId);
    if (was) logger.info('reflex:fraud.instant_freeze:released', { actorId, releasedBy });
    return was;
  }
}

const reflexEngine = new ReflexEngine();

module.exports = { reflexEngine, ReflexEngine, DEFAULT_BUDGET_MS };
