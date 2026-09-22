/**
 * Lot service — the storage layer lotKernel.js never had.
 *
 * lotKernel.js is pure calculation (mass in grams, money in paise): FIFO
 * allocation, weighted-average cost, settlement math. It does not persist
 * anything. This module is where a living lot actually lives: mint it,
 * settle offtake against it, and always leave the remaining mass on the
 * lot row rather than inventing a number.
 *
 * The companion (AI) may propose a mint or a settlement; a clerk still
 * supplies the kilograms, the paymentRef and any declared loss. This
 * service takes exactly those inputs — it does not decide them.
 */

'use strict';

const pool = require('../database/pool');
const kernel = require('./lotKernel');

async function listCells() {
  const { rows } = await pool.query(`SELECT * FROM lattice_cells ORDER BY created_at DESC`);
  return rows;
}

async function createCell({ name, village }) {
  if (!name) throw new Error('name is required');
  const { rows } = await pool.query(
    `INSERT INTO lattice_cells (name, village) VALUES ($1, $2) RETURNING *`,
    [name, village || null],
  );
  return rows[0];
}

async function listLots({ cellId, status } = {}) {
  const clauses = [];
  const params = [];
  if (cellId) { params.push(cellId); clauses.push(`cell_id = $${params.length}`); }
  if (status) { params.push(status); clauses.push(`status = $${params.length}`); }
  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM lattice_lots ${where} ORDER BY created_at ASC`,
    params,
  );
  return rows;
}

async function getLot(lotId) {
  const { rows } = await pool.query(`SELECT * FROM lattice_lots WHERE id = $1`, [lotId]);
  if (!rows[0]) throw new Error('Lot not found');
  return rows[0];
}

/** Mint a living lot. The clerk declares grams and paisePerKg — never inferred. */
async function mintLot({ cellId, variety, grams, paisePerKg }) {
  if (!cellId) throw new Error('cellId is required');
  if (!variety) throw new Error('variety is required');
  const costPaise = kernel.paiseFromKgPrice(grams, paisePerKg);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const cell = await client.query(`SELECT id FROM lattice_cells WHERE id = $1`, [cellId]);
    if (!cell.rows[0]) throw new Error('Unknown cell');

    const { rows } = await client.query(
      `INSERT INTO lattice_lots (cell_id, variety, minted_grams, remaining_grams, cost_paise, status)
       VALUES ($1,$2,$3,$3,$4,'living') RETURNING *`,
      [cellId, variety, grams, costPaise],
    );
    const lot = rows[0];
    await client.query(
      `INSERT INTO lattice_lot_events (lot_id, event_type, qty_grams, note)
       VALUES ($1,'intake',$2,'Lot minted')`,
      [lot.id, grams],
    );
    await client.query('COMMIT');
    return lot;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Settle offtake against a lot. Requires a real paymentRef — this is the
 * boundary the companion may not cross: AI can propose the settlement
 * inputs, but the clerk supplies paymentRef, confirming rupees actually
 * moved.
 */
async function settleLot(lotId, { qtyGrams, pricePaisePerKg, freightPaisePerKg, paymentRef }) {
  if (!paymentRef) throw new Error('paymentRef is required — a clerk confirms rupees moved, AI cannot write rupees.');
  const lot = await getLot(lotId);
  if (lot.status !== 'living') throw new Error(`Lot is ${lot.status}, not living`);

  const remainingAfter = kernel.remainingAfterCommit(lot.remaining_grams, qtyGrams);
  const { gross, freight, farmgate } = kernel.settlementAmounts(qtyGrams, pricePaisePerKg, freightPaisePerKg);
  const nextStatus = remainingAfter === 0 ? 'settled' : 'living';

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE lattice_lots SET remaining_grams = $1, status = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [remainingAfter, nextStatus, lotId],
    );
    await client.query(
      `INSERT INTO lattice_lot_events
         (lot_id, event_type, qty_grams, gross_paise, freight_paise, farmgate_paise, payment_ref)
       VALUES ($1,'settlement',$2,$3,$4,$5,$6)`,
      [lotId, qtyGrams, gross, freight, farmgate, paymentRef],
    );
    await client.query('COMMIT');
    return { lot: rows[0], gross, freight, farmgate };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Declare spoilage — a clerk names the loss, never inferred by AI. */
async function declareSpoilage(lotId, { lossGrams, note }) {
  if (!(Number(lossGrams) > 0)) throw new Error('lossGrams is required — declared, never inferred.');
  const lot = await getLot(lotId);
  const remainingAfter = kernel.remainingAfterSpoilage(lot.remaining_grams, lossGrams);
  const nextStatus = remainingAfter === 0 ? 'spoiled' : lot.status;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `UPDATE lattice_lots SET remaining_grams = $1, status = $2, updated_at = now()
       WHERE id = $3 RETURNING *`,
      [remainingAfter, nextStatus, lotId],
    );
    await client.query(
      `INSERT INTO lattice_lot_events (lot_id, event_type, qty_grams, note)
       VALUES ($1,'spoilage',$2,$3)`,
      [lotId, lossGrams, note || null],
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function listEvents(lotId) {
  const { rows } = await pool.query(
    `SELECT * FROM lattice_lot_events WHERE lot_id = $1 ORDER BY created_at ASC`,
    [lotId],
  );
  return rows;
}

module.exports = {
  listCells,
  createCell,
  listLots,
  getLot,
  mintLot,
  settleLot,
  declareSpoilage,
  listEvents,
};
