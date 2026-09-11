const { getPostgreSQL } = require('../database/connection');

function db() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  return pg;
}

async function recordInventory({ supplyLotId = null, orderId = null, shipmentId = null, eventType, quantity, unit = 'kg', referenceNo = null, metadata = {}, createdBy = null }) {
  if (!eventType || !Number.isFinite(Number(quantity)) || Number(quantity) === 0) throw new Error('eventType and non-zero quantity are required');
  const result = await db().query(`INSERT INTO commercial_inventory_ledger (supply_lot_id,order_id,shipment_id,event_type,quantity,unit,reference_no,metadata,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [supplyLotId, orderId, shipmentId, eventType, quantity, unit, referenceNo, metadata, createdBy]);
  return result.rows[0];
}

async function recordAccounting({ orderId = null, settlementId = null, entryType, debit = 0, credit = 0, currency = 'INR', referenceNo = null, metadata = {}, createdBy = null }) {
  if (!entryType || Number(debit) < 0 || Number(credit) < 0 || Number(debit) + Number(credit) <= 0) throw new Error('Valid accounting entry is required');
  const result = await db().query(`INSERT INTO commercial_accounting_ledger (order_id,settlement_id,entry_type,debit,credit,currency,reference_no,metadata,created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [orderId, settlementId, entryType, debit, credit, currency, referenceNo, metadata, createdBy]);
  return result.rows[0];
}

async function reconcileOrder(orderId) {
  if (!orderId) throw new Error('orderId is required');
  const pg = db();
  const client = await pg.connect();
  try {
    await client.query('BEGIN');
    const inventory = await client.query(`SELECT COALESCE(SUM(ABS(quantity)),0) AS total FROM commercial_inventory_ledger WHERE order_id=$1`, [orderId]);
    const accounting = await client.query(`SELECT COALESCE(SUM(debit),0) AS debit, COALESCE(SUM(credit),0) AS credit FROM commercial_accounting_ledger WHERE order_id=$1`, [orderId]);
    const debit = Number(accounting.rows[0].debit);
    const credit = Number(accounting.rows[0].credit);
    const variance = Number((debit - credit).toFixed(2));
    const status = variance === 0 ? 'balanced' : 'exception';
    const findings = variance === 0 ? [] : [{ type: 'accounting_variance', amount: variance }];
    const result = await client.query(`INSERT INTO commercial_reconciliation_runs (order_id,inventory_total,accounting_debit,accounting_credit,variance_amount,status,findings) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`, [orderId, inventory.rows[0].total, debit, credit, variance, status, JSON.stringify(findings)]);
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

module.exports = { recordInventory, recordAccounting, reconcileOrder };
