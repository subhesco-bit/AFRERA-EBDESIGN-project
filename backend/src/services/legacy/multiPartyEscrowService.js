/**
 * Multi-party trade escrow — client/farmer/bank requirement patterns.
 *
 * ESCROW TYPES (pick per deal):
 *   buyer_seller   — classic marketplace: buyer pays, farmer/seller receives
 *   farmer_farmer  — peer trade between two farmers
 *   client_client  — B2B between two business clients
 *   fpo_mediated   — buyer funds held; residual to FPO (then FPO payouts members)
 *   bank_recovery  — same as trade but lender_claim_cap taken first on release
 *   bank_bank      — inter-bank / nodal transfer under escrow instructions
 *
 * NOT this module:
 *   - FPO member split (fpoOperationsService)
 *   - Warehouse title/lien on goods (warehouseReceiptService)
 *   - Actual UPI rail (settlement marks payment_ref on release lines)
 *
 * Money rules: amount and funded_amount only from caller/payment ref — never invented.
 */

'use strict';

const crypto = require('crypto');
const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const ESCROW_TYPES = [
  'buyer_seller',
  'farmer_farmer',
  'client_client',
  'fpo_mediated',
  'bank_recovery',
  'bank_bank',
];

/** Default condition templates by type — clients can override on create. */
const DEFAULT_CONDITIONS = {
  buyer_seller: [
    { type: 'payment_received', required: true },
    { type: 'delivery_confirmed', required: true },
    { type: 'no_open_dispute', required: true },
  ],
  farmer_farmer: [
    { type: 'payment_received', required: true },
    { type: 'delivery_confirmed', required: true },
    { type: 'no_open_dispute', required: true },
  ],
  client_client: [
    { type: 'payment_received', required: true },
    { type: 'delivery_confirmed', required: true },
    { type: 'grade_accepted', required: false },
    { type: 'no_open_dispute', required: true },
  ],
  fpo_mediated: [
    { type: 'payment_received', required: true },
    { type: 'delivery_confirmed', required: true },
    { type: 'grade_accepted', required: false },
    { type: 'no_open_dispute', required: true },
  ],
  bank_recovery: [
    { type: 'payment_received', required: true },
    { type: 'delivery_confirmed', required: true },
    { type: 'lender_consent_or_cap', required: true },
    { type: 'no_open_dispute', required: true },
  ],
  bank_bank: [
    { type: 'payment_received', required: true },
    { type: 'both_banks_ack', required: true },
    { type: 'no_open_dispute', required: true },
  ],
};

function genCode() {
  return `ESC-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
}

function assertType(escrowType) {
  if (!ESCROW_TYPES.includes(escrowType)) {
    throw new Error(`escrowType must be one of: ${ESCROW_TYPES.join(', ')}`);
  }
}

function validateParties(escrowType, body) {
  switch (escrowType) {
    case 'buyer_seller':
    case 'farmer_farmer':
    case 'client_client':
      if (!body.payerId || !body.payeeId) throw new Error('payerId and payeeId are required');
      break;
    case 'fpo_mediated':
      if (!body.payerId || !body.fpoId) throw new Error('payerId and fpoId are required for fpo_mediated');
      break;
    case 'bank_recovery':
      if (!body.payerId || !body.payeeId || !body.lenderId) {
        throw new Error('payerId, payeeId and lenderId are required for bank_recovery');
      }
      break;
    case 'bank_bank':
      if (!body.bankFromId || !body.bankToId) throw new Error('bankFromId and bankToId are required for bank_bank');
      break;
    default:
      break;
  }
}

async function appendEvent(client, escrowId, eventType, actorUserId, detail) {
  await client.query(
    `INSERT INTO trade_escrow_events (escrow_id, event_type, actor_user_id, detail)
     VALUES ($1,$2,$3,$4)`,
    [escrowId, eventType, actorUserId || null, detail ? JSON.stringify(detail) : null],
  );
}

/**
 * Create escrow in draft / awaiting_funds.
 */
async function createEscrow({
  escrowType,
  payerId,
  payeeId,
  fpoId,
  lenderId,
  bankFromId,
  bankToId,
  orderId,
  contractId,
  warehouseReceiptId,
  amount,
  currency = 'INR',
  lenderClaimCap,
  platformFeeAmount,
  platformFeePct,
  releaseConditions,
  metadata,
  actorUserId,
}) {
  assertType(escrowType);
  validateParties(escrowType, {
    payerId, payeeId, fpoId, lenderId, bankFromId, bankToId,
  });
  if (!(Number(amount) > 0)) throw new Error('amount must be > 0');

  const conditions = releaseConditions || DEFAULT_CONDITIONS[escrowType] || [];
  const code = genCode();

  const { rows } = await pool.query(
    `INSERT INTO trade_escrows (
       escrow_code, escrow_type, payer_id, payee_id, fpo_id, lender_id,
       bank_from_id, bank_to_id, order_id, contract_id, warehouse_receipt_id,
       amount, currency, lender_claim_cap, platform_fee_amount, platform_fee_pct,
       status, release_conditions, metadata
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,
       'awaiting_funds',$17,$18
     ) RETURNING *`,
    [
      code, escrowType, payerId || null, payeeId || null, fpoId || null, lenderId || null,
      bankFromId || null, bankToId || null, orderId || null, contractId || null,
      warehouseReceiptId || null, Number(amount), currency,
      lenderClaimCap != null ? Number(lenderClaimCap) : null,
      platformFeeAmount != null ? Number(platformFeeAmount) : null,
      platformFeePct != null ? Number(platformFeePct) : null,
      JSON.stringify(conditions),
      metadata ? JSON.stringify(metadata) : '{}',
    ],
  );

  const client = await pool.connect();
  try {
    await appendEvent(client, rows[0].id, 'created', actorUserId, { escrowType, amount });
  } finally {
    client.release();
  }

  logger.info('Trade escrow created', { id: rows[0].id, code, escrowType });
  return rows[0];
}

/**
 * Fund escrow — paymentReference required; funded amount cannot exceed amount.
 */
async function fundEscrow(escrowId, { paymentReference, fundedAmount, actorUserId }) {
  if (!paymentReference) throw new Error('paymentReference is required (no invented funding)');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      `SELECT * FROM trade_escrows WHERE id = $1 FOR UPDATE`,
      [escrowId],
    );
    if (!rows[0]) throw new Error('Escrow not found');
    const esc = rows[0];
    if (!['awaiting_funds', 'draft'].includes(esc.status)) {
      throw new Error(`Cannot fund escrow in status ${esc.status}`);
    }

    const funded = fundedAmount != null ? Number(fundedAmount) : Number(esc.amount);
    if (!(funded > 0)) throw new Error('fundedAmount must be > 0');
    if (funded > Number(esc.amount)) throw new Error('fundedAmount cannot exceed escrow amount');

    const { rows: updated } = await client.query(
      `UPDATE trade_escrows
          SET status = 'funded', funded_amount = $2, payment_reference = $3,
              funded_at = now(), updated_at = now(),
              condition_state = jsonb_set(COALESCE(condition_state,'{}'), '{payment_received}', 'true')
        WHERE id = $1 RETURNING *`,
      [escrowId, funded, paymentReference],
    );

    await appendEvent(client, escrowId, 'funded', actorUserId, { paymentReference, funded });
    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function freezeEscrow(escrowId, { reason, actorUserId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM trade_escrows WHERE id = $1 FOR UPDATE`, [escrowId]);
    if (!rows[0]) throw new Error('Escrow not found');
    if (!['funded', 'awaiting_funds'].includes(rows[0].status)) {
      throw new Error(`Cannot freeze escrow in status ${rows[0].status}`);
    }
    const { rows: updated } = await client.query(
      `UPDATE trade_escrows SET status = 'frozen', updated_at = now() WHERE id = $1 RETURNING *`,
      [escrowId],
    );
    await appendEvent(client, escrowId, 'frozen', actorUserId, { reason: reason || null });
    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function unfreezeEscrow(escrowId, { actorUserId }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM trade_escrows WHERE id = $1 FOR UPDATE`, [escrowId]);
    if (!rows[0]) throw new Error('Escrow not found');
    if (rows[0].status !== 'frozen') throw new Error('Escrow is not frozen');
    const next = Number(rows[0].funded_amount) > 0 ? 'funded' : 'awaiting_funds';
    const { rows: updated } = await client.query(
      `UPDATE trade_escrows SET status = $2, updated_at = now() WHERE id = $1 RETURNING *`,
      [escrowId, next],
    );
    await appendEvent(client, escrowId, 'unfrozen', actorUserId, {});
    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

/** Mark a named condition true/false (delivery, grade, dispute, banks_ack, etc.) */
async function setCondition(escrowId, { conditionType, satisfied, actorUserId, evidence }) {
  if (!conditionType) throw new Error('conditionType is required');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM trade_escrows WHERE id = $1 FOR UPDATE`, [escrowId]);
    if (!rows[0]) throw new Error('Escrow not found');

    const { rows: updated } = await client.query(
      `UPDATE trade_escrows
          SET condition_state = jsonb_set(
                COALESCE(condition_state, '{}'::jsonb),
                ARRAY[$2::text],
                $3::jsonb
              ),
              updated_at = now()
        WHERE id = $1 RETURNING *`,
      [escrowId, conditionType, JSON.stringify(Boolean(satisfied))],
    );

    await appendEvent(client, escrowId, 'condition_set', actorUserId, {
      conditionType, satisfied: Boolean(satisfied), evidence: evidence || null,
    });
    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

function conditionsMet(esc) {
  let conditions = esc.release_conditions;
  if (typeof conditions === 'string') {
    try { conditions = JSON.parse(conditions); } catch { conditions = []; }
  }
  if (!Array.isArray(conditions)) conditions = [];
  const state = esc.condition_state || {};
  const missing = [];
  for (const c of conditions) {
    if (c.required === false) continue;
    const key = c.type;
    if (!state[key]) missing.push(key);
  }
  return { ok: missing.length === 0, missing };
}

/**
 * Build release waterfall lines (deterministic math only).
 */
function buildWaterfall(esc) {
  let remaining = Number(esc.funded_amount);
  if (!(remaining > 0)) throw new Error('No funded amount to release');

  const lines = [];

  // 1) Lender recovery
  if (esc.lender_id && Number(esc.lender_claim_cap) > 0) {
    const lenderAmt = Math.min(Number(esc.lender_claim_cap), remaining);
    if (lenderAmt > 0) {
      lines.push({
        beneficiary_role: 'lender',
        beneficiary_id: esc.lender_id,
        amount: Math.round(lenderAmt * 100) / 100,
      });
      remaining = Math.round((remaining - lenderAmt) * 100) / 100;
    }
  }

  // 2) Platform fee
  let fee = 0;
  if (Number(esc.platform_fee_amount) > 0) fee = Number(esc.platform_fee_amount);
  else if (Number(esc.platform_fee_pct) > 0) {
    fee = (Number(esc.funded_amount) * Number(esc.platform_fee_pct)) / 100;
  }
  fee = Math.min(fee, remaining);
  if (fee > 0) {
    lines.push({
      beneficiary_role: 'platform',
      beneficiary_id: null,
      amount: Math.round(fee * 100) / 100,
    });
    remaining = Math.round((remaining - fee) * 100) / 100;
  }

  // 3) Residual by type
  if (esc.escrow_type === 'fpo_mediated' && esc.fpo_id) {
    lines.push({
      beneficiary_role: 'fpo',
      beneficiary_id: esc.fpo_id,
      amount: remaining,
    });
  } else if (esc.escrow_type === 'bank_bank') {
    lines.push({
      beneficiary_role: 'counterparty_bank',
      beneficiary_id: esc.bank_to_id,
      amount: remaining,
    });
  } else if (esc.payee_id) {
    lines.push({
      beneficiary_role: 'payee',
      beneficiary_id: esc.payee_id,
      amount: remaining,
    });
  } else if (esc.fpo_id) {
    lines.push({
      beneficiary_role: 'fpo',
      beneficiary_id: esc.fpo_id,
      amount: remaining,
    });
  } else {
    throw new Error('No residual beneficiary (payee/fpo/bank_to)');
  }

  return lines;
}

/**
 * Release escrow when conditions met (or force with admin + reason).
 * Creates pending release lines — settlement rail later sets payment_ref + paid.
 */
async function releaseEscrow(escrowId, { force = false, forceReason, actorUserId } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM trade_escrows WHERE id = $1 FOR UPDATE`, [escrowId]);
    if (!rows[0]) throw new Error('Escrow not found');
    const esc = rows[0];

    if (esc.status === 'frozen') throw new Error('Escrow is frozen — resolve dispute / unfreeze first');
    if (esc.status !== 'funded') throw new Error(`Cannot release from status ${esc.status}`);

    const check = conditionsMet(esc);
    if (!check.ok && !force) {
      const err = new Error(`Release conditions not met: ${check.missing.join(', ')}`);
      err.code = 'CONDITIONS_UNMET';
      err.missing = check.missing;
      throw err;
    }
    if (force && !forceReason) throw new Error('forceReason required when force=true');

    const lines = buildWaterfall(esc);
    const releaseRows = [];
    for (const line of lines) {
      const { rows: r } = await client.query(
        `INSERT INTO trade_escrow_releases
           (escrow_id, beneficiary_role, beneficiary_id, amount, status)
         VALUES ($1,$2,$3,$4,'pending') RETURNING *`,
        [escrowId, line.beneficiary_role, line.beneficiary_id, line.amount],
      );
      releaseRows.push(r[0]);
    }

    const { rows: updated } = await client.query(
      `UPDATE trade_escrows
          SET status = 'released', released_at = now(), updated_at = now(),
              waterfall_result = $2
        WHERE id = $1 RETURNING *`,
      [escrowId, JSON.stringify(lines)],
    );

    await appendEvent(client, escrowId, 'released', actorUserId, {
      force: Boolean(force), forceReason: forceReason || null, lines,
    });

    await client.query('COMMIT');
    return {
      escrow: updated[0],
      releases: releaseRows,
      note: 'Release lines are pending — settlement rail must set payment_ref and mark paid',
    };
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function refundEscrow(escrowId, { reason, actorUserId }) {
  if (!reason) throw new Error('reason is required for refund');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM trade_escrows WHERE id = $1 FOR UPDATE`, [escrowId]);
    if (!rows[0]) throw new Error('Escrow not found');
    if (!['funded', 'frozen', 'awaiting_funds'].includes(rows[0].status)) {
      throw new Error(`Cannot refund from status ${rows[0].status}`);
    }

    const amt = Number(rows[0].funded_amount) || 0;
    if (amt > 0) {
      await client.query(
        `INSERT INTO trade_escrow_releases
           (escrow_id, beneficiary_role, beneficiary_id, amount, status)
         VALUES ($1,'payer_refund',$2,$3,'pending')`,
        [escrowId, rows[0].payer_id, amt],
      );
    }

    const { rows: updated } = await client.query(
      `UPDATE trade_escrows SET status = 'refunded', refunded_at = now(), updated_at = now() WHERE id = $1 RETURNING *`,
      [escrowId],
    );
    await appendEvent(client, escrowId, 'refunded', actorUserId, { reason, amount: amt });
    await client.query('COMMIT');
    return updated[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

async function markReleasePaid(releaseId, { paymentRef }) {
  if (!paymentRef) throw new Error('paymentRef is required');
  const { rows } = await pool.query(
    `UPDATE trade_escrow_releases
        SET status = 'paid', payment_ref = $2
      WHERE id = $1 AND status IN ('pending','instructed')
      RETURNING *`,
    [releaseId, paymentRef],
  );
  if (!rows[0]) throw new Error('Release line not found or not payable');
  return rows[0];
}

async function getEscrow(idOrCode) {
  const { rows } = await pool.query(
    `SELECT * FROM trade_escrows WHERE id::text = $1 OR escrow_code = $1`,
    [String(idOrCode)],
  );
  return rows[0] || null;
}

async function listEscrows({ escrowType, status, payerId, payeeId, limit = 50 } = {}) {
  const params = [];
  let q = 'SELECT * FROM trade_escrows WHERE 1=1';
  if (escrowType) { params.push(escrowType); q += ` AND escrow_type = $${params.length}`; }
  if (status) { params.push(status); q += ` AND status = $${params.length}`; }
  if (payerId) { params.push(payerId); q += ` AND payer_id = $${params.length}`; }
  if (payeeId) { params.push(payeeId); q += ` AND payee_id = $${params.length}`; }
  params.push(Math.min(Number(limit) || 50, 200));
  q += ` ORDER BY created_at DESC LIMIT $${params.length}`;
  const { rows } = await pool.query(q, params);
  return rows;
}

async function listEvents(escrowId) {
  const { rows } = await pool.query(
    `SELECT * FROM trade_escrow_events WHERE escrow_id = $1 ORDER BY created_at`,
    [escrowId],
  );
  return rows;
}

async function listReleases(escrowId) {
  const { rows } = await pool.query(
    `SELECT * FROM trade_escrow_releases WHERE escrow_id = $1 ORDER BY created_at`,
    [escrowId],
  );
  return rows;
}

function getCapabilities() {
  return {
    planVersion: '1.0',
    module: 'Multi-party trade escrow',
    escrowTypes: ESCROW_TYPES,
    defaultConditions: DEFAULT_CONDITIONS,
    statusFlow: ['draft/awaiting_funds', 'funded', 'frozen?', 'released|refunded'],
    waterfallOrder: ['lender', 'platform', 'fpo|payee|counterparty_bank'],
    rules: [
      'Funding requires paymentReference — never invent funded_amount',
      'Release blocked if frozen or required conditions unmet (unless force+reason)',
      'Release lines start pending; settlement sets paymentRef',
      'Separate from FPO member payouts and WRS goods title',
    ],
    endpoints: {
      base: '/api/v1/trade-escrow',
    },
  };
}

module.exports = {
  ESCROW_TYPES,
  DEFAULT_CONDITIONS,
  createEscrow,
  fundEscrow,
  freezeEscrow,
  unfreezeEscrow,
  setCondition,
  releaseEscrow,
  refundEscrow,
  markReleasePaid,
  getEscrow,
  listEscrows,
  listEvents,
  listReleases,
  getCapabilities,
  buildWaterfall,
  conditionsMet,
};
