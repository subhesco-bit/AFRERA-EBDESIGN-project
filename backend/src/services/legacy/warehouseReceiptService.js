/**
 * Warehouse Receipt System (WRS-style storage title)
 *
 * Links stored lots to optional cold_storage_facilities and FPO members.
 * Supports pledge (lien) for credit and controlled release.
 *
 * Does NOT invent quantity, lien amounts, or facility capacity.
 * Optional capacity check against cold_storage_facilities.capacity_units when facility_id set.
 */

'use strict';

const crypto = require('crypto');
const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

function genReceiptNumber() {
  return `WR-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function createReceipt({
  facilityId,
  fpoId,
  depositorFarmerId,
  depositorMemberId,
  commodity,
  grade,
  quantity,
  unit = 'kg',
  moisturePct,
  expectedReleaseAt,
  qualityCertificateRef,
  notes,
  actorUserId,
}) {
  if (!commodity) throw new Error('commodity is required');
  if (!(Number(quantity) > 0)) throw new Error('quantity must be > 0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (facilityId) {
      const fac = await client.query(
        `SELECT id, capacity_units, capacity_unit_label FROM cold_storage_facilities WHERE id = $1 FOR UPDATE`,
        [facilityId],
      ).catch(() => ({ rows: [] }));

      if (fac.rows[0] && fac.rows[0].capacity_units != null) {
        const stock = await client.query(
          `SELECT COALESCE(SUM(quantity),0) AS q FROM warehouse_receipts
            WHERE facility_id = $1 AND status IN ('active','pledged','partially_released')`,
          [facilityId],
        );
        const used = Number(stock.rows[0].q);
        const cap = Number(fac.rows[0].capacity_units);
        if (used + Number(quantity) > cap) {
          throw new Error(
            `Facility capacity exceeded: used ${used} + ${quantity} > capacity ${cap} ${fac.rows[0].capacity_unit_label || ''}`,
          );
        }
      }
    }

    const receiptNumber = genReceiptNumber();
    const { rows } = await client.query(
      `INSERT INTO warehouse_receipts
         (receipt_number, facility_id, fpo_id, depositor_farmer_id, depositor_member_id,
          commodity, grade, quantity, unit, moisture_pct, expected_release_at,
          quality_certificate_ref, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,'active')
       RETURNING *`,
      [
        receiptNumber, facilityId || null, fpoId || null, depositorFarmerId || null,
        depositorMemberId || null, commodity, grade || null, Number(quantity), unit,
        moisturePct != null ? Number(moisturePct) : null,
        expectedReleaseAt || null, qualityCertificateRef || null, notes || null,
      ],
    );

    await client.query(
      `INSERT INTO warehouse_receipt_events (receipt_id, event_type, quantity_delta, actor_user_id, detail)
       VALUES ($1,'inward',$2,$3,$4)`,
      [rows[0].id, Number(quantity), actorUserId || null, JSON.stringify({ receiptNumber })],
    );

    await client.query('COMMIT');
    logger.info('Warehouse receipt created', { id: rows[0].id, receiptNumber });
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function getReceipt(idOrNumber) {
  const { rows } = await pool.query(
    `SELECT * FROM warehouse_receipts WHERE id::text = $1 OR receipt_number = $1`,
    [String(idOrNumber)],
  );
  return rows[0] || null;
}

async function listReceipts({ facilityId, fpoId, status, limit = 50 } = {}) {
  const params = [];
  let q = 'SELECT * FROM warehouse_receipts WHERE 1=1';
  if (facilityId) { params.push(facilityId); q += ` AND facility_id = $${params.length}`; }
  if (fpoId) { params.push(fpoId); q += ` AND fpo_id = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  params.push(Math.min(Number(limit) || 50, 200));
  q += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows;
}

/** Pledge receipt as loan collateral */
async function pledgeReceipt(receiptId, { lienHolder, lienAmount, lienRef, actorUserId }) {
  if (!lienHolder) throw new Error('lienHolder is required');
  if (!(Number(lienAmount) > 0)) throw new Error('lienAmount must be > 0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM warehouse_receipts WHERE id = $1 FOR UPDATE`,
      [receiptId],
    );
    if (!rows[0]) throw new Error('Receipt not found');
    if (!['active', 'partially_released'].includes(rows[0].status)) {
      throw new Error(`Cannot pledge receipt in status ${rows[0].status}`);
    }

    const { rows: updated } = await client.query(
      `UPDATE warehouse_receipts
          SET status = 'pledged', lien_holder = $2, lien_amount = $3, lien_ref = $4, updated_at = now()
        WHERE id = $1 RETURNING *`,
      [receiptId, lienHolder, Number(lienAmount), lienRef || null],
    );

    await client.query(
      `INSERT INTO warehouse_receipt_events (receipt_id, event_type, actor_user_id, detail)
       VALUES ($1,'pledge',$2,$3)`,
      [receiptId, actorUserId || null, JSON.stringify({ lienHolder, lienAmount, lienRef })],
    );

    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function releaseLien(receiptId, { actorUserId, note }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM warehouse_receipts WHERE id = $1 FOR UPDATE`,
      [receiptId],
    );
    if (!rows[0]) throw new Error('Receipt not found');
    if (rows[0].status !== 'pledged') throw new Error('Receipt is not pledged');

    const { rows: updated } = await client.query(
      `UPDATE warehouse_receipts
          SET status = 'active', lien_holder = NULL, lien_amount = NULL, lien_ref = NULL, updated_at = now()
        WHERE id = $1 RETURNING *`,
      [receiptId],
    );

    await client.query(
      `INSERT INTO warehouse_receipt_events (receipt_id, event_type, actor_user_id, detail)
       VALUES ($1,'lien_release',$2,$3)`,
      [receiptId, actorUserId || null, JSON.stringify({ note: note || null })],
    );

    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Physical release of goods. Blocked while pledged unless force with lien clear first.
 */
async function releaseStock(receiptId, { quantity, actorUserId, note }) {
  if (!(Number(quantity) > 0)) throw new Error('quantity must be > 0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM warehouse_receipts WHERE id = $1 FOR UPDATE`,
      [receiptId],
    );
    const wr = rows[0];
    if (!wr) throw new Error('Receipt not found');
    if (wr.status === 'pledged') {
      throw new Error('Receipt is pledged — release lien before stock release');
    }
    if (wr.status === 'released' || wr.status === 'cancelled') {
      throw new Error(`Cannot release stock in status ${wr.status}`);
    }

    const q = Number(quantity);
    if (q > Number(wr.quantity)) throw new Error(`Release qty ${q} exceeds remaining ${wr.quantity}`);

    const remaining = Math.round((Number(wr.quantity) - q) * 1000) / 1000;
    const newStatus = remaining === 0 ? 'released' : 'partially_released';

    const { rows: updated } = await client.query(
      `UPDATE warehouse_receipts SET quantity = $2, status = $3, updated_at = now() WHERE id = $1 RETURNING *`,
      [receiptId, remaining, newStatus],
    );

    await client.query(
      `INSERT INTO warehouse_receipt_events (receipt_id, event_type, quantity_delta, actor_user_id, detail)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        receiptId,
        remaining === 0 ? 'full_release' : 'partial_release',
        -q,
        actorUserId || null,
        JSON.stringify({ note: note || null, remaining }),
      ],
    );

    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function listEvents(receiptId) {
  const { rows } = await pool.query(
    `SELECT * FROM warehouse_receipt_events WHERE receipt_id = $1 ORDER BY created_at`,
    [receiptId],
  );
  return rows;
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    module: 'Warehouse Receipt System',
    operations: ['createReceipt', 'getReceipt', 'listReceipts', 'pledgeReceipt', 'releaseLien', 'releaseStock', 'listEvents'],
    rules: [
      'Quantity never invented — must be supplied on inward',
      'Capacity check when facility_id points to cold_storage_facilities',
      'Pledged receipts cannot release stock until lien cleared',
      'All state changes append warehouse_receipt_events',
    ],
  };
}

module.exports = {
  createReceipt,
  getReceipt,
  listReceipts,
  pledgeReceipt,
  releaseLien,
  releaseStock,
  listEvents,
  getCapabilities,
};
