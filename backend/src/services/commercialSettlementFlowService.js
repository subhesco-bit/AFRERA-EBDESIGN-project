const { getPostgreSQL } = require('../database/connection');
const reconciliation = require('./commercialErpReconciliationService');
const settlement = require('./commercialSettlementService');

function db() { const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized'); return pg; }

async function prepareSettlement({ orderId, beneficiaryType, beneficiaryId, grossAmount, deductions = 0, currency = 'INR', idempotencyKey, actorId = null }) {
  const client = await db().connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM commercial_settlements WHERE idempotency_key=$1 FOR UPDATE', [idempotencyKey]);
    if (existing.rows[0]) { await client.query('COMMIT'); return existing.rows[0]; }
    const result = await client.query(`INSERT INTO commercial_settlements (order_id,beneficiary_type,beneficiary_id,gross_amount,deductions,currency,idempotency_key,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [orderId, beneficiaryType, beneficiaryId, grossAmount, deductions, currency, idempotencyKey, actorId]);
    await client.query(`INSERT INTO commercial_settlement_events (settlement_id,to_status,actor_id,reason) VALUES ($1,'pending',$2,'Settlement prepared from reconciled commercial flow')`, [result.rows[0].id, actorId]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (e) { await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}

async function reconcileAndPrepare({ orderId, settlement, actorId = null }) {
  const reconciliationRun = await reconciliation.reconcileOrder(orderId);
  if (reconciliationRun.status !== 'balanced') {
    throw new Error(`Settlement blocked: order reconciliation is ${reconciliationRun.status}`);
  }
  return {
    reconciliation: reconciliationRun,
    settlement: await prepareSettlement({ ...settlement, orderId, actorId })
  };
}

async function approve(orderId, settlementId, actorId) {
  const pg = db();
  const result = await pg.query('SELECT status FROM commercial_reconciliation_runs WHERE order_id=$1 ORDER BY created_at DESC LIMIT 1', [orderId]);
  if (!result.rows[0] || result.rows[0].status !== 'balanced') throw new Error('Settlement approval requires a balanced reconciliation');
  return settlement.transition(settlementId, 'approved', actorId, 'Approved after balanced reconciliation');
}

module.exports = { prepareSettlement, reconcileAndPrepare, approve };
