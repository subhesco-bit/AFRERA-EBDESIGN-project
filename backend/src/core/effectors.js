/**
 * Effectors — the EFFERENT (motor) half of the nervous system.
 *
 * WHY THIS FILE EXISTS
 *
 * A module audit on 2026-08-04 found the nervous system was 5% innervated:
 *
 *     4 modules emitted signals
 *     0 modules subscribed
 *    54 modules had live routes and no bus connection at all
 *
 * Emitters with no subscribers is the worse half of that. A temperature breach
 * was published to an empty room. The reflex arc had a sensory nerve and no
 * motor nerve, so nothing could ever move.
 *
 * THE ROOT CAUSE, for the record
 * signalBus.js was created 2026-08-04 12:09. The services were written
 * 2026-08-03 21:52–22:26 — the nervous system is ~14 hours YOUNGER than the
 * organs it connects. Nobody retrofitted them. This was not neglect of a
 * known rule; the rule did not exist when the modules were written.
 *
 * WHAT AN EFFECTOR IS
 * A subscriber that turns a signal into a consequence. Effectors here obey the
 * same contract as the agents: they RECORD and ESCALATE, they do not decide.
 * Anything that changes money, cancels an order, or overrides a human goes
 * through ai_proposals and needs a named approver.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 * It does not wire all 54 "denervated" modules. Most of them should stay that
 * way — biodiversityService, indigenousKnowledgeService and
 * recipeIntelligenceService are largely reference-data readers with no state
 * change worth broadcasting. Emitting from them would be noise, and noise is
 * how a real alert gets missed. "54 denervated" was a slightly wrong metric:
 * the right question is how many modules have state changes that OTHER modules
 * must react to.
 */

'use strict';

const { signalBus, SIGNAL, SEVERITY } = require('./signalBus');
const { logger } = require('../utils/logger');

/** Effectors registered at boot, kept for teardown in tests. */
const registered = [];

/**
 * Reactions are declared as data, not scattered through service code.
 * Each says: on THIS signal, do THIS, and say WHY it matters.
 *
 * `escalate` marks a reaction that must reach a human rather than only a log.
 */
const REACTIONS = [
  {
    id: 'coldchain.breach_response',
    on: () => SIGNAL.TEMPERATURE_BREACH,
    escalate: true,
    why: 'A temperature excursion starts a clock on both the produce and the '
       + 'insurance claim. Late detection loses the consignment and the cover.',
    handle(signal) {
      return {
        action: 'raise_incident',
        incidentType: 'cold_chain',
        severity: 'high',
        // A breach can arrive from a shipment sensor, a store sensor or a lot
        // reading. Looking only for shipmentId returned a null subject for
        // sensor-sourced breaches — an incident with nothing attached to it.
        subject: signal.payload?.shipmentId ?? signal.payload?.batchId
              ?? signal.payload?.lotId ?? signal.payload?.deviceId
              ?? signal.payload?.sensorId ?? null,
        followUp: ['file_insurance_claim', 'evaluate_reroute', 'notify_consignee'],
      };
    },
  },
  {
    id: 'quality.failure_response',
    on: () => SIGNAL.QUALITY_FAILED,
    escalate: true,
    why: 'A failed quality test on a dispatched lot is a recall decision, not '
       + 'a log entry. It must reach someone who can stop the shipment.',
    handle(signal) {
      return {
        action: 'raise_incident',
        incidentType: 'food_safety',
        severity: 'critical',
        subject: signal.payload?.lotId ?? signal.payload?.batchId ?? null,
        followUp: ['quarantine_lot', 'trace_downstream_consignees', 'assess_recall'],
      };
    },
  },
  {
    id: 'recall.notification',
    on: () => SIGNAL.RECALL_ISSUED,
    escalate: true,
    why: 'A recall must reach every downstream holder of the batch. Anything '
       + 'less is a partial recall, which is worse than none — it creates the '
       + 'appearance of action while product stays on shelves.',
    handle(signal) {
      return {
        action: 'notify_chain',
        scope: 'all_downstream_holders',
        subject: signal.payload?.batchId ?? null,
        followUp: ['notify_regulator', 'suspend_listings', 'record_evidence'],
      };
    },
  },
  {
    id: 'shelflife.markdown_review',
    on: () => SIGNAL.SHELF_LIFE_CRITICAL,
    escalate: false,
    why: 'Approaching expiry is the last point where value can still be '
       + 'recovered — markdown, diversion to processing, or local sale. After '
       + 'expiry the only options cost money.',
    handle(signal) {
      return {
        action: 'propose_disposition',
        options: ['markdown', 'divert_to_processing', 'local_clearance', 'donate'],
        subject: signal.payload?.lotId ?? null,
        // Deliberately a proposal: a markdown is a pricing decision with
        // margin consequences and belongs to a human.
        requiresApproval: true,
      };
    },
  },
  {
    id: 'shipment.delay_response',
    on: () => SIGNAL.SHIPMENT_DELAYED,
    escalate: false,
    why: 'A delay on a perishable lane is a different event from a delay on an '
       + 'ambient one. The handling engine decides which.',
    handle(signal) {
      const perishable = signal.payload?.perishable === true;
      return {
        action: perishable ? 'evaluate_reroute' : 'notify_consignee',
        urgency: perishable ? 'high' : 'normal',
        subject: signal.payload?.shipmentId ?? null,
        followUp: perishable
          ? ['check_alternate_lanes', 'assess_shelf_life_impact', 'notify_consignee']
          : ['update_eta'],
      };
    },
  },
  {
    id: 'fraud.hold_review',
    on: () => SIGNAL.FRAUD_SUSPECTED,
    escalate: true,
    why: 'Suspicion is not proof. This flags for review and never auto-blocks '
       + 'an account — a false positive that freezes a farmer\'s payout at '
       + 'harvest does more damage than the fraud it prevents.',
    handle(signal) {
      return {
        action: 'flag_for_review',
        severity: 'high',
        subject: signal.payload?.transactionId ?? signal.payload?.userId ?? null,
        autoBlock: false,
        followUp: ['manual_review', 'request_documentation'],
      };
    },
  },
  {
    id: 'claim.intake',
    on: () => SIGNAL.CLAIM_SUBMITTED,
    escalate: false,
    why: 'A claim submitted after a logged temperature breach should inherit '
       + 'that evidence automatically rather than asking the farmer to prove '
       + 'something the platform already recorded.',
    handle(signal) {
      return {
        action: 'attach_evidence',
        sources: ['temperature_log', 'shipment_tracking', 'quality_inspection'],
        subject: signal.payload?.claimId ?? null,
      };
    },
  },
  {
    id: 'emergency.escalation_watch',
    on: () => SIGNAL.EMERGENCY_RAISED,
    escalate: true,
    why: 'An incident nobody acknowledges is an incident nobody is handling. '
       + 'This is the backstop for the acknowledgement SLA.',
    handle(signal) {
      const critical = signal.payload?.severity === 'critical'
        || signal.payload?.peopleAtRisk === true;
      return {
        action: critical ? 'page_incident_commander' : 'notify_duty_officer',
        severity: critical ? 'critical' : 'high',
        subject: signal.payload?.incidentCode ?? null,
      };
    },
  },
  {
    id: 'risk.materialisation_watch',
    on: () => SIGNAL.RISK_CRITICAL,
    escalate: true,
    why: 'A risk crossing critical residual score is the register telling you '
       + 'a control has stopped working.',
    handle(signal) {
      return {
        action: 'review_controls',
        subject: signal.payload?.riskCode ?? null,
        followUp: ['test_control_effectiveness', 'reassess_treatment'],
      };
    },
  },
];

/**
 * A reaction produced an outcome. Recording it is what allows the system to
 * later ask "did reacting this way help?" — the feedback loop the audit found
 * missing (AI learning loop: 0%).
 *
 * Persistence is intentionally injected rather than imported: effectors must
 * remain testable without a database, and must not fail a request path if the
 * database is unavailable.
 */
let sink = null;

/** @param {(record: object) => Promise<void>} fn */
function setOutcomeSink(fn) { sink = fn; }

async function record(reaction, signal, outcome) {
  const entry = {
    reactionId: reaction.id,
    signalType: signal.type,
    severity: signal.severity ?? null,
    source: signal.source ?? null,
    outcome,
    escalated: Boolean(reaction.escalate),
    rationale: reaction.why,
    at: new Date().toISOString(),
  };

  const level = reaction.escalate ? 'warn' : 'info';
  logger[level](`effector:${reaction.id}`, {
    signal: signal.type, action: outcome.action, subject: outcome.subject,
  });

  if (sink) {
    try {
      await sink(entry);
    } catch (err) {
      // An effector must never break the emitting request path. A failure to
      // persist the record is logged and swallowed deliberately.
      logger.error('effector:sink_failed', { reactionId: reaction.id, message: err.message });
    }
  }
  return entry;
}

/**
 * Register every effector on the bus. Idempotent — calling twice does not
 * double-subscribe, which matters because index.js may be required by tests.
 */
function registerEffectors() {
  if (registered.length) return registered.length;

  for (const reaction of REACTIONS) {
    const type = reaction.on();
    if (!type) {
      logger.warn('effector:unknown_signal', { reactionId: reaction.id });
      continue;
    }
    const off = signalBus.onSignal(type, async (signal) => {
      try {
        const outcome = reaction.handle(signal);
        await record(reaction, signal, outcome);
      } catch (err) {
        logger.error('effector:handler_failed', {
          reactionId: reaction.id, message: err.message,
        });
      }
    });
    registered.push({ id: reaction.id, type, off });
  }

  logger.info('effectors registered', { count: registered.length });
  return registered.length;
}

function unregisterEffectors() {
  registered.forEach((r) => { try { r.off(); } catch { /* already gone */ } });
  registered.length = 0;
}

module.exports = {
  registerEffectors,
  unregisterEffectors,
  setOutcomeSink,
  REACTIONS,
  registered,
  SEVERITY,
};
