/**
 * Signal Bus — the platform's afferent/efferent nervous system.
 *
 * WHY THIS EXISTS
 * Before this, every AFRERA module was a self-contained organ: the fraud
 * service could detect fraud, the insurance service could price a policy, the
 * IoT service could see a cold-chain breach — but none of them could tell each
 * other. There was no pathway between organs, so the platform had no way to
 * react to anything as a whole system.
 *
 * This module is that pathway. Services emit *signals* (afferent — sensation
 * travelling inward); the decision engine correlates them and dispatches
 * *decisions* (efferent — instruction travelling outward to effectors).
 *
 * Design constraints, deliberately chosen:
 *  - In-process EventEmitter, not a broker. AFRERA runs as a single Node
 *    process today; introducing Kafka/RabbitMQ here would add operational
 *    weight with no current benefit. The emit/subscribe surface is
 *    intentionally broker-shaped so it can be swapped later without touching
 *    call sites.
 *  - A subscriber that throws must never break the emitter. Sensation must not
 *    be able to kill the organ that produced it.
 *  - Bounded memory. Signal history is a ring buffer; an always-on process
 *    must not accumulate unbounded state.
 */

const EventEmitter = require('events');
const { logger } = require('../utils/logger');

/** Signal severity, ordered. Used for triage and reflex thresholds. */
const SEVERITY = Object.freeze({
  INFO: 10,
  NOTICE: 20,
  WARNING: 30,
  CRITICAL: 40,
  EMERGENCY: 50
});

/**
 * Canonical signal types. Namespaced by originating domain so subscribers can
 * pattern-match a whole domain (`iot.*`) or one precise event.
 */
const SIGNAL = Object.freeze({
  // Commerce
  ORDER_PLACED: 'commerce.order.placed',
  ORDER_CANCELLED: 'commerce.order.cancelled',
  PAYMENT_RECEIVED: 'commerce.payment.received',
  DEMAND_FORECAST_UPDATED: 'commerce.demand.forecast_updated',
  PRICE_CHANGED: 'commerce.price.changed',

  // Risk
  FRAUD_SUSPECTED: 'risk.fraud.suspected',
  CREDIT_RISK_ASSESSED: 'risk.credit.assessed',
  CLAIM_SUBMITTED: 'risk.claim.submitted',

  // Cold chain / IoT
  TEMPERATURE_BREACH: 'iot.temperature.breach',
  SENSOR_OFFLINE: 'iot.sensor.offline',
  SHIPMENT_DELAYED: 'logistics.shipment.delayed',
  CIVIL_DISRUPTION_REPORTED: 'logistics.disruption.reported',
  CIVIL_DISRUPTION_RESOLVED: 'logistics.disruption.resolved',

  // Geofencing (circular zones, checked against a single GPS point in time —
  // see backend/src/services/geofencingService.js for the honest scope note)
  GEOFENCE_ENTERED: 'logistics.geofence.entered',
  GEOFENCE_EXITED: 'logistics.geofence.exited',

  // Quality & safety
  QUALITY_FAILED: 'quality.test.failed',
  RECALL_ISSUED: 'quality.recall.issued',
  SHELF_LIFE_CRITICAL: 'quality.shelf_life.critical',

  // Agronomy
  SOIL_RESULT_READY: 'agronomy.soil.result_ready',
  CROP_DISEASE_DETECTED: 'agronomy.disease.detected',
  WEATHER_ALERT: 'agronomy.weather.alert',

  // Livestock
  ANIMAL_HEALTH_CHECK: 'livestock.animal.health_check',
  ANIMAL_TREATMENT: 'livestock.animal.treatment',
  DISEASE_OUTBREAK: 'livestock.disease.outbreak',
  QUARANTINE_ESTABLISHED: 'livestock.quarantine.established',
  QUARANTINE_LIFTED: 'livestock.quarantine.lifted',
  MILK_PRODUCTION_RECORDED: 'livestock.milk.production_recorded',
  BREEDING_RECORDED: 'livestock.breeding.recorded',
  VACCINATION_ADMINISTERED: 'livestock.vaccination.administered',
  FEED_CONSUMPTION_RECORDED: 'livestock.feed.consumption_recorded',
  HERD_PERFORMANCE_UPDATED: 'livestock.herd.performance_updated',

  // Platform Foundation
  TENANT_CREATED: 'platform.tenant.created',
  TENANT_UPDATED: 'platform.tenant.updated',
  TENANT_DELETED: 'platform.tenant.deleted',
  ORGANIZATION_CREATED: 'platform.organization.created',
  ORGANIZATION_UPDATED: 'platform.organization.updated',
  CONFIGURATION_CHANGED: 'platform.configuration.changed',
  SYSTEM_HEALTH_CHANGED: 'platform.system.health_changed',
  CAPACITY_FORECAST_UPDATED: 'platform.capacity.forecast_updated',
  SECURITY_THREAT_DETECTED: 'platform.security.threat_detected',

  // Enterprise control layer (993)
  WORKFLOW_STARTED: 'control.workflow.started',
  WORKFLOW_SLA_BREACHED: 'control.workflow.sla_breached',
  LEAD_QUALIFIED: 'control.crm.lead_qualified',
  OBLIGATION_DUE: 'control.legal.obligation_due',
  RISK_CRITICAL: 'control.risk.critical',
  EMERGENCY_RAISED: 'control.emergency.raised',
  EMERGENCY_ESCALATED: 'control.emergency.escalated',

  // Platform
  DECISION_MADE: 'platform.decision.made'
});

const MAX_HISTORY = 500;

class SignalBus extends EventEmitter {
  constructor() {
    super();
    // Many modules legitimately observe the same signal; the default limit of
    // 10 would emit spurious leak warnings.
    this.setMaxListeners(100);
    this._history = [];
    this._counts = new Map();
    this._paused = false;
  }

  /**
   * Emit a signal.
   * @param {string} type  one of SIGNAL.*
   * @param {object} payload  domain data
   * @param {object} meta  { severity, source, correlationId, entityId }
   * @returns {object} the recorded signal
   */
  emitSignal(type, payload = {}, meta = {}) {
    const signal = {
      type,
      payload,
      severity: meta.severity ?? SEVERITY.INFO,
      source: meta.source || 'unknown',
      entityId: meta.entityId ?? null,
      correlationId: meta.correlationId || `sig_${Date.now()}_${Math.round(Math.random() * 1e6)}`,
      timestamp: new Date().toISOString()
    };

    this._record(signal);

    if (this._paused) return signal;

    // Emit to exact-type subscribers, domain wildcard subscribers, and firehose.
    const domain = type.split('.')[0];
    for (const channel of [type, `${domain}.*`, '*']) {
      this._safeEmit(channel, signal);
    }

    return signal;
  }

  /**
   * A throwing subscriber must not propagate back into the emitting service.
   * A failed downstream reaction is a logged fault, not an outage.
   */
  _safeEmit(channel, signal) {
    const listeners = this.listeners(channel);
    for (const fn of listeners) {
      try {
        const out = fn(signal);
        if (out && typeof out.catch === 'function') {
          out.catch((err) =>
            logger.error(`Signal subscriber failed (async) on ${channel}: ${err.message}`)
          );
        }
      } catch (err) {
        logger.error(`Signal subscriber failed on ${channel}: ${err.message}`);
      }
    }
  }

  _record(signal) {
    this._history.push(signal);
    if (this._history.length > MAX_HISTORY) {
      this._history.shift();
    }
    this._counts.set(signal.type, (this._counts.get(signal.type) || 0) + 1);
  }

  /** Subscribe to an exact type, a domain wildcard (`iot.*`), or `*`. */
  onSignal(type, handler) {
    this.on(type, handler);
    return () => this.off(type, handler);
  }

  /**
   * Recent signals, newest first — the substrate the decision engine
   * correlates over.
   */
  recent({ type = null, since = null, entityId = null, minSeverity = 0, limit = 100 } = {}) {
    const sinceMs = since ? new Date(since).getTime() : null;
    return this._history
      .filter((s) => {
        if (type && s.type !== type) return false;
        if (entityId && s.entityId !== entityId) return false;
        if (s.severity < minSeverity) return false;
        if (sinceMs && new Date(s.timestamp).getTime() < sinceMs) return false;
        return true;
      })
      .slice(-limit)
      .reverse();
  }

  /** Observability: what is this platform actually feeling? */
  stats() {
    return {
      buffered: this._history.length,
      capacity: MAX_HISTORY,
      totals: Object.fromEntries(this._counts),
      subscribers: this.eventNames().map((n) => ({
        channel: String(n),
        count: this.listenerCount(n)
      }))
    };
  }

  /** Test/maintenance helpers. */
  pause() { this._paused = true; }
  resume() { this._paused = false; }
  reset() {
    this._history = [];
    this._counts.clear();
    this.removeAllListeners();
    this.setMaxListeners(100);
  }
}

module.exports = {
  signalBus: new SignalBus(),
  SIGNAL,
  SEVERITY,
  SignalBus
};
