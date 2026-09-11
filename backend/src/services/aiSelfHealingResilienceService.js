const crypto = require('crypto');
const { getPostgreSQL } = require('../database');

function id() { return crypto.randomUUID(); }
function fingerprint(component, failureClass, evidence = {}) {
  return crypto.createHash('sha256').update(JSON.stringify({ component, failureClass, evidence })).digest('hex');
}

class AISelfHealingResilienceService {
  constructor() { this.db = getPostgreSQL(); }

  classifyFailure({ component, failureClass, evidence = {} }) {
    const critical = /data_loss|security|financial|integrity/i.test(`${failureClass} ${JSON.stringify(evidence)}`);
    const high = /payment|ledger|database|authentication|migration/i.test(`${failureClass} ${JSON.stringify(evidence)}`);
    return critical ? 'critical' : high ? 'high' : 'medium';
  }

  async detectFailure(input) {
    const severity = this.classifyFailure(input);
    const correlationId = input.correlationId || id();
    const fp = fingerprint(input.component, input.failureClass, input.evidence);
    const approvalRequired = severity !== 'low';
    const result = await this.db.query(
      `INSERT INTO ai_self_healing_incidents
       (id, correlation_id, component, failure_class, severity, fingerprint, evidence, approval_required)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id(), correlationId, input.component, input.failureClass, severity, fp, JSON.stringify(input.evidence), approvalRequired]
    );
    return result.rows[0];
  }

  diagnose(incident) {
    const remediation = {
      safe_actions: ['retry_with_backoff', 'refresh_dependency_health', 'reopen_circuit_after_recovery'],
      blocked_actions: ['delete_data', 'modify_financial_ledger', 'release_payment', 'change_authorization'],
      requires_human_for: ['high', 'critical']
    };
    return {
      ...incident,
      diagnosis: { failure_class: incident.failure_class, fingerprint: incident.fingerprint },
      remediation,
      next_status: 'proposed'
    };
  }

  async recordHealth(input) {
    const result = await this.db.query(
      `INSERT INTO platform_health_events
       (id, correlation_id, component, event_type, status, latency_ms, error_rate, metadata)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [id(), input.correlationId || id(), input.component, input.eventType, input.status,
       input.latencyMs ?? null, input.errorRate ?? null, JSON.stringify(input.metadata || {})]
    );
    return result.rows[0];
  }

  async setCircuitState(component, state, metadata = {}) {
    if (!['closed','open','half_open'].includes(state)) throw new Error('Invalid circuit state');
    const result = await this.db.query(
      `INSERT INTO resilience_control_state (component,state,metadata)
       VALUES ($1,$2,$3)
       ON CONFLICT (component) DO UPDATE SET state=EXCLUDED.state, metadata=EXCLUDED.metadata, updated_at=NOW()
       RETURNING *`,
      [component, state, JSON.stringify(metadata)]
    );
    return result.rows[0];
  }
}

module.exports = new AISelfHealingResilienceService();
