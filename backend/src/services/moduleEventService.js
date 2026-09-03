'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

async function record(event) {
  const payload = event.payload && typeof event.payload === 'object' ? event.payload : {};
  const result = await pool.query(
    `INSERT INTO module_events
      (module_id, operation, event_type, actor_user_id, entity_id, correlation_id, payload, error_code)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [event.moduleId, event.operation, event.eventType, event.actorUserId || null,
      event.entityId || null, event.correlationId, JSON.stringify(payload), event.errorCode || null]
  );
  return result.rows[0];
}

async function recordBestEffort(event) {
  try {
    return await record(event);
  } catch (error) {
    logger.error('Module event persistence failed', { moduleId: event.moduleId, operation: event.operation, error: error.message });
    return null;
  }
}

module.exports = { record, recordBestEffort };
