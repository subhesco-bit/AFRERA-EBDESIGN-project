/**
 * FPO / Cooperative Operations Hub
 *
 * Real domain operations (not a catalog):
 *   - Organization + member registry + share capital
 *   - Pool lots + member contributions (qty-weighted)
 *   - Payout ledger entries when lot is sold (deterministic math)
 *
 * Money is never invented: sale_price_per_unit must be supplied on close/sell.
 * Payout status starts as pending — settlement rail is separate.
 *
 * See migrations/20260921_fpo_and_warehouse_receipt.sql
 */

'use strict';

const crypto = require('crypto');
const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const nowIso = () => new Date().toISOString();

function genCode(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

async function createFpo({ code, name, registrationNumber, state, district, village }) {
  if (!name) throw new Error('name is required');
  const c = code || genCode('FPO');
  const { rows } = await pool.query(
    `INSERT INTO fpo_organizations (code, name, registration_number, state, district, village)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [c, name, registrationNumber || null, state || null, district || null, village || null],
  );
  logger.info('FPO created', { id: rows[0].id, code: rows[0].code });
  return rows[0];
}

async function getFpo(fpoId) {
  const { rows } = await pool.query('SELECT * FROM fpo_organizations WHERE id = $1', [fpoId]);
  return rows[0] || null;
}

async function listFpos({ state, status = 'active', limit = 50 } = {}) {
  const params = [];
  let q = 'SELECT * FROM fpo_organizations WHERE 1=1';
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (state) { params.push(state); q += ` AND state = $${params.length}`; }
  params.push(Math.min(Number(limit) || 50, 200));
  q += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows;
}

async function addMember(fpoId, {
  farmerId, userId, memberCode, fullName, phone, shareUnits = 0, shareCapitalPaid = 0,
}) {
  if (!fullName) throw new Error('fullName is required');
  const code = memberCode || genCode('M');
  const { rows } = await pool.query(
    `INSERT INTO fpo_members
       (fpo_id, farmer_id, user_id, member_code, full_name, phone, share_units, share_capital_paid)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [fpoId, farmerId || null, userId || null, code, fullName, phone || null,
      Number(shareUnits) || 0, Number(shareCapitalPaid) || 0],
  );
  return rows[0];
}

async function listMembers(fpoId, { status = 'active' } = {}) {
  const { rows } = await pool.query(
    `SELECT * FROM fpo_members WHERE fpo_id = $1 AND ($2::text IS NULL OR status = $2)
     ORDER BY full_name`,
    [fpoId, status || null],
  );
  return rows;
}

async function openPoolLot(fpoId, {
  commodity, grade, unit = 'kg', targetQty, pricingRule = 'qty_weighted', lotCode,
}) {
  if (!commodity) throw new Error('commodity is required');
  const code = lotCode || genCode('LOT');
  const { rows } = await pool.query(
    `INSERT INTO fpo_pool_lots
       (fpo_id, lot_code, commodity, grade, unit, target_qty, pricing_rule)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
    [fpoId, code, commodity, grade || null, unit, targetQty != null ? Number(targetQty) : null, pricingRule],
  );
  return rows[0];
}

async function contributeToLot(lotId, memberId, { qty, grade, notes }) {
  if (!(Number(qty) > 0)) throw new Error('qty must be > 0');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lotRes = await client.query(
      `SELECT * FROM fpo_pool_lots WHERE id = $1 FOR UPDATE`,
      [lotId],
    );
    if (!lotRes.rows[0]) throw new Error('Lot not found');
    if (lotRes.rows[0].status !== 'open') throw new Error('Lot is not open for contributions');

    const mem = await client.query(
      `SELECT * FROM fpo_members WHERE id = $1 AND fpo_id = $2 AND status = 'active'`,
      [memberId, lotRes.rows[0].fpo_id],
    );
    if (!mem.rows[0]) throw new Error('Member not found or inactive in this FPO');

    const q = Number(qty);
    const { rows: contrib } = await client.query(
      `INSERT INTO fpo_pool_contributions (lot_id, member_id, qty, grade, notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [lotId, memberId, q, grade || null, notes || null],
    );

    const { rows: updated } = await client.query(
      `UPDATE fpo_pool_lots SET pooled_qty = pooled_qty + $2 WHERE id = $1 RETURNING *`,
      [lotId, q],
    );

    await client.query('COMMIT');
    return { contribution: contrib[0], lot: updated[0] };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Mark lot sold and create pending payout rows.
 * amount_i = salePricePerUnit * qty_i  (qty_weighted)
 * equal_share: total / n members who contributed (only if pricing_rule says so)
 */
async function sellPoolLot(lotId, { salePricePerUnit, saleReference }) {
  if (!(Number(salePricePerUnit) > 0)) throw new Error('salePricePerUnit must be > 0 (not invented)');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const lotRes = await client.query(`SELECT * FROM fpo_pool_lots WHERE id = $1 FOR UPDATE`, [lotId]);
    const lot = lotRes.rows[0];
    if (!lot) throw new Error('Lot not found');
    if (lot.status === 'sold') throw new Error('Lot already sold');
    if (!(Number(lot.pooled_qty) > 0)) throw new Error('Lot has zero pooled qty');

    const { rows: contribs } = await client.query(
      `SELECT member_id, SUM(qty) AS qty FROM fpo_pool_contributions WHERE lot_id = $1 GROUP BY member_id`,
      [lotId],
    );
    if (!contribs.length) throw new Error('No contributions on lot');

    const price = Number(salePricePerUnit);
    const totalQty = contribs.reduce((s, c) => s + Number(c.qty), 0);
    const totalValue = price * totalQty;
    const payouts = [];

    for (const c of contribs) {
      let amount;
      if (lot.pricing_rule === 'equal_share') {
        amount = Math.round((totalValue / contribs.length) * 100) / 100;
      } else {
        // qty_weighted (default) and grade_weighted fallback to qty until grade weights exist
        amount = Math.round(price * Number(c.qty) * 100) / 100;
      }
      const { rows } = await client.query(
        `INSERT INTO fpo_payout_entries (fpo_id, member_id, lot_id, amount, status, notes)
         VALUES ($1,$2,$3,$4,'pending',$5) RETURNING *`,
        [lot.fpo_id, c.member_id, lotId, amount, `Auto from lot sale @ ${price}/${lot.unit}`],
      );
      payouts.push(rows[0]);
    }

    const { rows: sold } = await client.query(
      `UPDATE fpo_pool_lots
          SET status = 'sold', sale_price_per_unit = $2, sale_reference = $3, closed_at = now()
        WHERE id = $1 RETURNING *`,
      [lotId, price, saleReference || null],
    );

    await client.query('COMMIT');
    return {
      lot: sold[0],
      totalQty,
      totalValue: Math.round(totalValue * 100) / 100,
      payouts,
      note: 'Payouts are pending — mark paid when settlement rail confirms',
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function listPayouts(fpoId, { status, limit = 100 } = {}) {
  const params = [fpoId];
  let q = 'SELECT * FROM fpo_payout_entries WHERE fpo_id = $1';
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  params.push(Math.min(Number(limit) || 100, 500));
  q += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows;
}

async function markPayoutPaid(payoutId, { paymentRef }) {
  if (!paymentRef) throw new Error('paymentRef is required when marking paid');
  const { rows } = await pool.query(
    `UPDATE fpo_payout_entries
        SET status = 'paid', payment_ref = $2, updated_at = now()
      WHERE id = $1 AND status IN ('pending','approved')
      RETURNING *`,
    [payoutId, paymentRef],
  );
  if (!rows[0]) throw new Error('Payout not found or not in payable status');
  return rows[0];
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    module: 'FPO Operations Hub',
    operations: [
      'createFpo', 'listFpos', 'addMember', 'listMembers',
      'openPoolLot', 'contributeToLot', 'sellPoolLot', 'listPayouts', 'markPayoutPaid',
    ],
    rules: [
      'Contributions only on open lots; row locked',
      'salePricePerUnit required on sell — never invented',
      'Payouts start pending; paid only with paymentRef',
    ],
  };
}

module.exports = {
  createFpo,
  getFpo,
  listFpos,
  addMember,
  listMembers,
  openPoolLot,
  contributeToLot,
  sellPoolLot,
  listPayouts,
  markPayoutPaid,
  getCapabilities,
};
