const crypto = require('crypto');
const { getPostgreSQL } = require('../database/connection');
const handlers = new Map();

function register(eventType, handler) {
  if (!eventType || typeof handler !== 'function') throw new Error('eventType and handler are required');
  handlers.set(eventType, handler);
}

async function publish(event) {
  const eventId = event.eventId || crypto.randomUUID();
  const correlationId = event.correlationId || crypto.randomUUID();
  const db = getPostgreSQL();
  if (db) {
    await db.query(`INSERT INTO ai_domain_events
      (id,event_id,event_type,aggregate_type,aggregate_id,correlation_id,causation_id,payload,status)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'published') ON CONFLICT (event_id) DO NOTHING`, [
      crypto.randomUUID(), eventId, event.eventType, event.aggregateType || 'unknown', String(event.aggregateId || ''),
      correlationId, event.causationId || null, JSON.stringify(event.payload || {})
    ]);
  }
  const handler = handlers.get(event.eventType);
  if (!handler) return { eventId, correlationId, status: 'published', handled: false };
  try {
    const result = await handler({ ...event, eventId, correlationId });
    if (db) await db.query(`UPDATE ai_domain_events SET status='processed', processed_at=NOW(), attempts=attempts+1 WHERE event_id=$1`, [eventId]);
    return { eventId, correlationId, status: 'processed', handled: true, result };
  } catch (error) {
    if (db) await db.query(`UPDATE ai_domain_events SET status='failed', attempts=attempts+1, last_error=$2 WHERE event_id=$1`, [eventId, error.message]);
    return { eventId, correlationId, status: 'failed', handled: true, error: error.message };
  }
}

async function replay(eventId) {
  const db = getPostgreSQL();
  if (!db) throw new Error('Database is required for event replay');
  const { rows } = await db.query('SELECT * FROM ai_domain_events WHERE event_id=$1', [eventId]);
  if (!rows[0]) throw new Error('Event not found');
  return publish({ ...rows[0], eventId: rows[0].event_id, eventType: rows[0].event_type, aggregateType: rows[0].aggregate_type, aggregateId: rows[0].aggregate_id, payload: rows[0].payload, correlationId: rows[0].correlation_id, causationId: rows[0].causation_id });
}

function listHandlers() { return Array.from(handlers.keys()); }

module.exports = { register, publish, replay, listHandlers };
