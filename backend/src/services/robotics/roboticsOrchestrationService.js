'use strict';

const crypto = require('crypto');
const db = require('../../database/pool');
const aiGateway = require('../aiGatewayService');
const { AppError, ValidationError, NotFoundError, ConflictError } = require('../../utils/errors');

const DEVICE_TYPES = new Set(['humanoid', 'field_robot', 'warehouse_robot', 'autonomous_tractor', 'drone', 'simulator']);
const HAZARD_LEVELS = new Set(['low', 'medium', 'high', 'critical']);
const HAZARDOUS_ACTIONS = new Set(['move', 'lift', 'cut', 'spray', 'harvest', 'excavate', 'operate_machinery']);
const TRANSITIONS = Object.freeze({
  draft: new Set(['pending_approval', 'approved', 'cancelled']),
  pending_approval: new Set(['approved', 'rejected', 'cancelled']),
  approved: new Set(['running', 'cancelled']),
  running: new Set(['paused', 'completed', 'aborted']),
  paused: new Set(['running', 'aborted']),
  completed: new Set(),
  aborted: new Set(),
  cancelled: new Set(),
  rejected: new Set(),
});

function requiredText(value, field, max = 255) {
  const text = String(value || '').trim();
  if (!text) throw new ValidationError(`${field} is required`, field);
  if (text.length > max) throw new ValidationError(`${field} exceeds ${max} characters`, field);
  return text;
}

function json(value, fallback) {
  return JSON.stringify(value === undefined ? fallback : value);
}

function missionNeedsApproval(mission) {
  if (['high', 'critical'].includes(mission.hazard_level)) return true;
  return (mission.steps || []).some(step => HAZARDOUS_ACTIONS.has(String(step.action || '').toLowerCase()));
}

class SimulatorAdapter {
  constructor() { this.name = 'simulator'; }

  async dispatch({ device, mission, command }) {
    return {
      accepted: true,
      adapter: this.name,
      externalCommandId: `sim-${crypto.randomUUID()}`,
      deviceId: device.id,
      missionId: mission.id,
      command,
      simulated: true,
      acceptedAt: new Date().toISOString(),
    };
  }

  async emergencyStop({ device }) {
    return { accepted: true, adapter: this.name, deviceId: device.id, simulated: true };
  }
}

class RoboticsOrchestrationService {
  constructor({ database = db, gateway = aiGateway, adapters } = {}) {
    this.db = database;
    this.gateway = gateway;
    this.adapters = adapters || new Map([['simulator', new SimulatorAdapter()]]);
  }

  registerAdapter(name, adapter) {
    const key = requiredText(name, 'adapter', 80).toLowerCase();
    if (!adapter || typeof adapter.dispatch !== 'function' || typeof adapter.emergencyStop !== 'function') {
      throw new ValidationError('Adapter must implement dispatch and emergencyStop', 'adapter');
    }
    this.adapters.set(key, adapter);
  }

  async assertDeviceOrganization(deviceId, organizationId) {
    const result = await this.db.query(
      'SELECT 1 FROM robotics_devices WHERE id=$1 AND organization_id IS NOT DISTINCT FROM $2::uuid',
      [deviceId, organizationId || null],
    );
    if (!result.rows[0]) throw new AppError('Device is outside the authorized organization', 403, 'ORGANIZATION_SCOPE_DENIED');
  }

  async assertMissionOrganization(missionId, organizationId) {
    const result = await this.db.query(
      'SELECT 1 FROM robotics_missions WHERE id=$1 AND organization_id IS NOT DISTINCT FROM $2::uuid',
      [missionId, organizationId || null],
    );
    if (!result.rows[0]) throw new AppError('Mission is outside the authorized organization', 403, 'ORGANIZATION_SCOPE_DENIED');
  }

  async transaction(work) {
    const client = await this.db.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async audit(client, aggregateType, aggregateId, eventType, actorId, payload = {}) {
    await client.query(
      `INSERT INTO robotics_audit_events
       (aggregate_type, aggregate_id, event_type, actor_id, payload)
       VALUES ($1, $2, $3, $4, $5::jsonb)`,
      [aggregateType, aggregateId, eventType, actorId, json(payload, {})],
    );
  }

  async registerDevice(input, actorId) {
    const type = requiredText(input.deviceType, 'deviceType', 50).toLowerCase();
    if (!DEVICE_TYPES.has(type)) throw new ValidationError('Unsupported deviceType', 'deviceType');
    const adapter = requiredText(input.adapter || 'simulator', 'adapter', 80).toLowerCase();
    if (!this.adapters.has(adapter)) throw new ValidationError('Adapter is not registered', 'adapter');
    return this.transaction(async client => {
      const result = await client.query(
        `INSERT INTO robotics_devices
         (organization_id, external_id, name, device_type, adapter, capabilities, safety_profile,
          certification_status, operational_status, created_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, 'pending', 'offline', $8)
         RETURNING *`,
        [input.organizationId || null, requiredText(input.externalId, 'externalId'), requiredText(input.name, 'name'),
          type, adapter, json(input.capabilities, []), json(input.safetyProfile, {}), actorId],
      );
      await this.audit(client, 'device', result.rows[0].id, 'device.registered', actorId, { type, adapter });
      return result.rows[0];
    });
  }

  async certifyDevice(deviceId, input, actorId) {
    const status = input.approved === true ? 'certified' : 'rejected';
    return this.transaction(async client => {
      const result = await client.query(
        `UPDATE robotics_devices SET certification_status=$2, certification_notes=$3,
         certified_by=$4, certified_at=NOW(), updated_at=NOW() WHERE id=$1 RETURNING *`,
        [deviceId, status, input.notes || null, actorId],
      );
      if (!result.rows[0]) throw new NotFoundError('Robotics device');
      await this.audit(client, 'device', deviceId, `device.${status}`, actorId, { notes: input.notes || null });
      return result.rows[0];
    });
  }

  async createMission(input, actorId) {
    const hazardLevel = String(input.hazardLevel || 'low').toLowerCase();
    if (!HAZARD_LEVELS.has(hazardLevel)) throw new ValidationError('Unsupported hazardLevel', 'hazardLevel');
    if (!Array.isArray(input.steps) || input.steps.length === 0) throw new ValidationError('steps must be a non-empty array', 'steps');
    const requested = { hazard_level: hazardLevel, steps: input.steps };
    const status = missionNeedsApproval(requested) ? 'pending_approval' : 'approved';
    return this.transaction(async client => {
      const result = await client.query(
        `INSERT INTO robotics_missions
         (device_id, organization_id, name, description, hazard_level, requires_human_approval, steps, constraints,
          status, created_by, approved_by, approved_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8::jsonb,$9,$10,$11,$12) RETURNING *`,
        [input.deviceId, input.organizationId || null, requiredText(input.name, 'name'), input.description || null,
          hazardLevel, status === 'pending_approval', json(input.steps, []), json(input.constraints, {}), status, actorId,
          status === 'approved' ? actorId : null, status === 'approved' ? new Date() : null],
      );
      await this.audit(client, 'mission', result.rows[0].id, 'mission.created', actorId, { status, hazardLevel });
      return result.rows[0];
    });
  }

  async approveMission(missionId, input, actorId) {
    return this.transaction(async client => {
      const current = await client.query('SELECT * FROM robotics_missions WHERE id=$1 FOR UPDATE', [missionId]);
      const mission = current.rows[0];
      if (!mission) throw new NotFoundError('Robotics mission');
      if (mission.status !== 'pending_approval') throw new ConflictError('Only pending missions can be approved');
      if (mission.created_by === actorId) throw new AppError('Hazardous missions require an independent approver', 403, 'TWO_PERSON_RULE');
      const next = input.approved === true ? 'approved' : 'rejected';
      const result = await client.query(
        `UPDATE robotics_missions SET status=$2, approved_by=$3, approved_at=NOW(),
         approval_notes=$4, updated_at=NOW() WHERE id=$1 RETURNING *`,
        [missionId, next, actorId, input.notes || null],
      );
      await this.audit(client, 'mission', missionId, `mission.${next}`, actorId, { notes: input.notes || null });
      return result.rows[0];
    });
  }

  assertReady(device, mission) {
    if (device.certification_status !== 'certified') throw new ConflictError('Device is not certified');
    if (device.operational_status !== 'online') throw new ConflictError('Device is not online');
    if (device.emergency_stop_active) throw new ConflictError('Emergency stop is active');
    if (mission.status !== 'approved' && mission.status !== 'paused') throw new ConflictError('Mission is not approved for execution');
    const telemetry = device.last_telemetry || {};
    if (telemetry.safetyInterlock === false) throw new ConflictError('Device safety interlock is not healthy');
  }

  async startMission(missionId, actorId) {
    return this.transaction(async client => {
      const query = await client.query(
        `SELECT m.*, row_to_json(d.*) AS device FROM robotics_missions m
         JOIN robotics_devices d ON d.id=m.device_id WHERE m.id=$1 FOR UPDATE OF m, d`, [missionId],
      );
      const mission = query.rows[0];
      if (!mission) throw new NotFoundError('Robotics mission');
      this.assertReady(mission.device, mission);
      const adapter = this.adapters.get(mission.device.adapter);
      if (!adapter) throw new ConflictError('Device adapter is unavailable');
      const command = { type: mission.status === 'paused' ? 'resume_mission' : 'start_mission', steps: mission.steps, constraints: mission.constraints };
      const receipt = await adapter.dispatch({ device: mission.device, mission, command });
      if (!receipt?.accepted) throw new AppError('Device adapter rejected the mission', 502, 'ADAPTER_REJECTED');
      const result = await client.query(
        `UPDATE robotics_missions SET status='running', started_at=COALESCE(started_at,NOW()),
         adapter_receipt=$2::jsonb, updated_at=NOW() WHERE id=$1 RETURNING *`, [missionId, json(receipt, {})],
      );
      await this.audit(client, 'mission', missionId, 'mission.started', actorId, { receipt });
      return result.rows[0];
    });
  }

  async transitionMission(missionId, nextStatus, actorId, reason) {
    return this.transaction(async client => {
      const current = await client.query('SELECT * FROM robotics_missions WHERE id=$1 FOR UPDATE', [missionId]);
      const mission = current.rows[0];
      if (!mission) throw new NotFoundError('Robotics mission');
      if (!TRANSITIONS[mission.status]?.has(nextStatus)) throw new ConflictError(`Invalid mission transition: ${mission.status} -> ${nextStatus}`);
      if (nextStatus === 'running') throw new ValidationError('Use startMission to execute or resume a mission');
      const result = await client.query(
        `UPDATE robotics_missions SET status=$2, completion_reason=$3,
         completed_at=CASE WHEN $2 IN ('completed','aborted','cancelled','rejected') THEN NOW() ELSE completed_at END,
         updated_at=NOW() WHERE id=$1 RETURNING *`, [missionId, nextStatus, reason || null],
      );
      await this.audit(client, 'mission', missionId, `mission.${nextStatus}`, actorId, { reason: reason || null });
      return result.rows[0];
    });
  }

  async recordTelemetry(deviceId, input, actorId) {
    const occurredAt = input.occurredAt ? new Date(input.occurredAt) : new Date();
    if (Number.isNaN(occurredAt.getTime())) throw new ValidationError('occurredAt must be a valid timestamp', 'occurredAt');
    return this.transaction(async client => {
      const device = await client.query('SELECT * FROM robotics_devices WHERE id=$1 FOR UPDATE', [deviceId]);
      if (!device.rows[0]) throw new NotFoundError('Robotics device');
      const event = await client.query(
        `INSERT INTO robotics_telemetry (device_id, mission_id, event_type, severity, data, occurred_at, received_by)
         VALUES ($1,$2,$3,$4,$5::jsonb,$6,$7) RETURNING *`,
        [deviceId, input.missionId || null, requiredText(input.eventType, 'eventType', 100),
          input.severity || 'info', json(input.data, {}), occurredAt, actorId],
      );
      const status = input.operationalStatus || 'online';
      await client.query(
        `UPDATE robotics_devices SET operational_status=$2, last_seen_at=$3,
         last_telemetry=$4::jsonb, updated_at=NOW() WHERE id=$1`,
        [deviceId, status, occurredAt, json(input.data, {})],
      );
      await this.audit(client, 'device', deviceId, 'telemetry.recorded', actorId, { telemetryId: event.rows[0].id });
      return event.rows[0];
    });
  }

  async emergencyStop(deviceId, actorId, reason) {
    const stopReason = requiredText(reason, 'reason', 1000);
    return this.transaction(async client => {
      const found = await client.query('SELECT * FROM robotics_devices WHERE id=$1 FOR UPDATE', [deviceId]);
      const device = found.rows[0];
      if (!device) throw new NotFoundError('Robotics device');
      const adapter = this.adapters.get(device.adapter);
      if (adapter) await adapter.emergencyStop({ device, reason: stopReason });
      await client.query(
        `UPDATE robotics_devices SET emergency_stop_active=TRUE, operational_status='emergency_stopped', updated_at=NOW() WHERE id=$1`, [deviceId],
      );
      await client.query(
        `UPDATE robotics_missions SET status='aborted', completion_reason=$2, completed_at=NOW(), updated_at=NOW()
         WHERE device_id=$1 AND status IN ('running','paused','approved')`, [deviceId, stopReason],
      );
      await this.audit(client, 'device', deviceId, 'device.emergency_stopped', actorId, { reason: stopReason });
      return { deviceId, emergencyStopActive: true, reason: stopReason };
    });
  }

  async clearEmergencyStop(deviceId, actorId, inspection) {
    const evidence = requiredText(inspection, 'inspection', 2000);
    return this.transaction(async client => {
      const result = await client.query(
        `UPDATE robotics_devices SET emergency_stop_active=FALSE, operational_status='offline',
         last_safety_inspection=$2, updated_at=NOW() WHERE id=$1 AND emergency_stop_active=TRUE RETURNING *`,
        [deviceId, evidence],
      );
      if (!result.rows[0]) throw new ConflictError('Device does not have an active emergency stop');
      await this.audit(client, 'device', deviceId, 'device.emergency_stop_cleared', actorId, { inspection: evidence });
      return result.rows[0];
    });
  }

  async planWithAI(input, actorId) {
    const result = await this.gateway.run({
      moduleId: 'robotics-orchestration',
      capability: 'advisory-mission-planning',
      prompt: requiredText(input.objective, 'objective', 5000),
      context: { actorId, deviceId: input.deviceId, environment: input.environment || {}, constraints: input.constraints || {} },
      provider: input.provider,
      maxTokens: input.maxTokens,
    });
    return { ...result, executionAuthorized: false, persistedMission: false, humanApprovalRequired: true };
  }

  async getMission(missionId) {
    const result = await this.db.query(
      `SELECT m.*, row_to_json(d.*) AS device FROM robotics_missions m
       JOIN robotics_devices d ON d.id=m.device_id WHERE m.id=$1`, [missionId],
    );
    if (!result.rows[0]) throw new NotFoundError('Robotics mission');
    return result.rows[0];
  }

  async listTelemetry(deviceId, limit = 100) {
    const safeLimit = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const result = await this.db.query(
      'SELECT * FROM robotics_telemetry WHERE device_id=$1 ORDER BY occurred_at DESC LIMIT $2', [deviceId, safeLimit],
    );
    return result.rows;
  }
}

const service = new RoboticsOrchestrationService();
module.exports = service;
module.exports.RoboticsOrchestrationService = RoboticsOrchestrationService;
module.exports.SimulatorAdapter = SimulatorAdapter;
module.exports.missionNeedsApproval = missionNeedsApproval;
module.exports.TRANSITIONS = TRANSITIONS;
