'use strict';

const pool = require('../../database/pool');
const optimization = require('../../core/ai/optimisation');
const aiGateway = require('../aiGatewayService');

const TERMINAL = new Set(['succeeded', 'failed', 'unavailable', 'cancelled']);
const isPrivileged = (actor) => ['admin', 'super_admin'].includes(actor.role);
const canAccess = (job, actor) => isPrivileged(actor) || (job.tenant_id ?
  job.tenant_id === (actor.tenantId || actor.tenant_id) : job.requested_by === actor.id);

class OptimizationJobService {
  constructor() { this.pool = pool; this.quantumConfigured = false; }

  async recordEvent(jobId, eventType, actorId, details = {}) {
    await this.pool.query('INSERT INTO optimization_job_events (job_id,event_type,actor_id,details) VALUES ($1,$2,$3,$4)',
      [jobId, eventType, actorId || null, details]);
  }

  async create({ objectiveId, instance, requestedBackend = 'classical', includeNarrative = false }, actor = {}) {
    const shape = optimization.validateInstance(objectiveId, instance);
    if (!['classical', 'quantum'].includes(requestedBackend)) { const e = new Error('Unsupported backend'); e.statusCode = 400; throw e; }
    const status = requestedBackend === 'quantum' && !this.quantumConfigured ? 'unavailable' : 'queued';
    const unavailableReason = status === 'unavailable' ? 'No quantum solver adapter is configured' : null;
    const { rows } = await this.pool.query(
      `INSERT INTO optimization_jobs (objective_id,requested_backend,status,input,requested_by,tenant_id,include_narrative,provenance,error_message)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [objectiveId, requestedBackend, status, instance, actor.id || null, actor.tenantId || actor.tenant_id || null,
        Boolean(includeNarrative), { engine: 'core/ai/optimisation', ...shape }, unavailableReason]);
    await this.recordEvent(rows[0].id, 'created', actor.id, { requestedBackend, status, unavailableReason });
    return rows[0];
  }

  async execute(jobId, actor = {}) {
    const found = await this.pool.query('SELECT * FROM optimization_jobs WHERE id=$1', [jobId]);
    const job = found.rows[0];
    if (!job) { const e = new Error('Optimization job not found'); e.statusCode = 404; throw e; }
    if (!canAccess(job, actor)) { const e = new Error('Optimization job not found'); e.statusCode = 404; throw e; }
    if (TERMINAL.has(job.status)) return job;
    const claimed = await this.pool.query(
      "UPDATE optimization_jobs SET status='running',started_at=NOW(),updated_at=NOW() WHERE id=$1 AND status='queued' RETURNING *", [jobId]);
    if (!claimed.rows[0]) {
      const current = await this.pool.query('SELECT * FROM optimization_jobs WHERE id=$1', [jobId]);
      return current.rows[0];
    }
    await this.recordEvent(jobId, 'started', actor.id, { backend: job.requested_backend });
    try {
      const baseline = await optimization.solveAsync(job.objective_id, job.input, { backend: 'classical' });
      const result = job.requested_backend === 'classical' ? baseline :
        await optimization.solveAsync(job.objective_id, job.input, { backend: job.requested_backend });
      let narrative = null;
      if (job.include_narrative) {
        narrative = await aiGateway.run({ moduleId: 'EBD-OPTIMIZATION', capability: 'explain_optimization',
          prompt: `Explain this solver result without changing it or claiming optimality: ${JSON.stringify({ objectiveId: job.objective_id, result })}`,
          context: { jobId } });
      }
      const provenance = { engine: 'core/ai/optimisation', baselineBackend: 'classical', executedBackend: job.requested_backend,
        guarantee: result.guarantee, narrativeGenerated: narrative?.success === true };
      const updated = await this.pool.query(
        `UPDATE optimization_jobs SET status='succeeded',baseline_result=$2,result=$3,narrative=$4,provenance=$5,
         completed_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *`, [jobId, baseline, result, narrative, provenance]);
      await this.recordEvent(jobId, 'succeeded', actor.id, { cost: result.cost, feasible: result.feasible, backend: job.requested_backend });
      return updated.rows[0];
    } catch (error) {
      const unavailable = /No quantum backend is configured/i.test(error.message);
      const updated = await this.pool.query(
        `UPDATE optimization_jobs SET status=$2,error_message=$3,completed_at=NOW(),updated_at=NOW() WHERE id=$1 RETURNING *`,
        [jobId, unavailable ? 'unavailable' : 'failed', unavailable ? error.message : 'Solver execution failed']);
      await this.recordEvent(jobId, unavailable ? 'unavailable' : 'failed', actor.id, { backend: job.requested_backend, reason: error.message });
      return updated.rows[0];
    }
  }

  async get(jobId, actor = {}) {
    const { rows } = await this.pool.query('SELECT * FROM optimization_jobs WHERE id=$1', [jobId]);
    const job = rows[0];
    if (!job || !canAccess(job, actor)) { const e = new Error('Optimization job not found'); e.statusCode = 404; throw e; }
    return job;
  }

  listObjectives() { return optimization.listObjectives(); }
  registerQuantumAdapter(adapter) { optimization.registerBackend('quantum', adapter); this.quantumConfigured = true; }
}

module.exports = new OptimizationJobService();
