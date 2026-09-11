const { getPostgreSQL } = require('../database/connection');

const TRANSITIONS = {
  pending: ['approved','cancelled'],
  approved: ['queued','cancelled'],
  queued: ['processing','cancelled'],
  processing: ['paid','failed'],
  failed: ['queued','cancelled'],
  paid: ['reversed'],
  reversed: [],
  cancelled: []
};

function db() { const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized'); return pg; }

async function createSettlement({ orderId, beneficiaryType, beneficiaryId, grossAmount, deductions = 0, currency = 'INR', idempotencyKey, actorId = null }) {
  if (!orderId || !beneficiaryType || !beneficiaryId || !idempotencyKey) throw new Error('orderId, beneficiary and idempotencyKey are required');
  if (!(Number(grossAmount) >= 0) || !(Number(deductions) >= 0) || Number(deductions) > Number(grossAmount)) throw new Error('Invalid settlement amounts');
  const pg = db();
  const existing = await pg.query('SELECT * FROM commercial_settlements WHERE idempotency_key=$1', [idempotencyKey]);
  if (existing.rows[0]) return existing.rows[0];
  const result = await pg.query(`INSERT INTO commercial_settlements (order_id,beneficiary_type,beneficiary_id,gross_amount,deductions,currency,idempotency_key,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [orderId, beneficiaryType, beneficiaryId, grossAmount, deductions, currency, idempotencyKey, actorId]);
  await pg.query(`INSERT INTO commercial_settlement_events (settlement_id,to_status,actor_id,reason) VALUES ($1,'pending',$2,'Settlement created')`, [result.rows[0].id, actorId]);
  return result.rows[0];
}

async function transition(settlementId, toStatus, actorId = null, reason = null) {
  const pg = db(); const client = await pg.connect();
  try {
    await client.query('BEGIN');
    const current = await client.query('SELECT * FROM commercial_settlements WHERE id=$1 FOR UPDATE', [settlementId]);
    if (!current.rows[0]) throw new Error('Settlement not found');
    const from = current.rows[0].status;
    if (!(TRANSITIONS[from] || []).includes(toStatus)) throw new Error(`Invalid settlement transition: ${from} -> ${toStatus}`);
    const updated = await client.query(`UPDATE commercial_settlements SET status=$1,approved_by=CASE WHEN $1='approved' THEN $2 ELSE approved_by END,paid_at=CASE WHEN $1='paid' THEN NOW() ELSE paid_at END,updated_at=NOW() WHERE id=$3 RETURNING *`, [toStatus, actorId, settlementId]);
    await client.query(`INSERT INTO commercial_settlement_events (settlement_id,from_status,to_status,actor_id,reason) VALUES ($1,$2,$3,$4,$5)`, [settlementId, from, toStatus, actorId, reason]);
    await client.query('COMMIT');
    return updated.rows[0];
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

async function recordPaymentAttempt({ settlementId, provider, amount, status = 'created', providerReference = null, responseMetadata = {} }) {
  if (!settlementId || !provider || !(Number(amount) > 0)) throw new Error('settlementId, provider and positive amount are required');
  const result = await db().query(`INSERT INTO commercial_payment_attempts (settlement_id,provider,provider_reference,amount,status,response_metadata) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`, [settlementId, provider, providerReference, amount, status, responseMetadata]);
  return result.rows[0];
}

async function getSettlement(id) {
  const pg = db();
  const s = await pg.query('SELECT * FROM commercial_settlements WHERE id=$1', [id]);
  if (!s.rows[0]) return null;
  const [events, attempts] = await Promise.all([
    pg.query('SELECT * FROM commercial_settlement_events WHERE settlement_id=$1 ORDER BY created_at', [id]),
    pg.query('SELECT * FROM commercial_payment_attempts WHERE settlement_id=$1 ORDER BY attempted_at', [id])
  ]);
  return { ...s.rows[0], events: events.rows, paymentAttempts: attempts.rows };
}

module.exports = { TRANSITIONS, createSettlement, transition, recordPaymentAttempt, getSettlement };
