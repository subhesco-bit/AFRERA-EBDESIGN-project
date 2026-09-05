/**
 * Revenue overview and channel allocation.
 *
 * Replaces a 24-line stub whose getOverview() returned `{ totalRevenue: 0 }`
 * and whose allocateChannels() returned `{ applied: false, note: 'stub' }`.
 *
 * The hard-coded zero was the dangerous part: a dashboard reading it would
 * display "Revenue: 0" rather than "not available", and those are very
 * different things to show someone deciding whether to make payroll.
 */

'use strict';

const pool = require('../../database\/pool');
const { logger } = require('../../utils\/logger');

/** Revenue from contracts, by status. */
async function getOverview({ from, to, buyerId } = {}) {
  const params = [];
  const where = [];
  if (from) { params.push(from); where.push(`start_date >= $${params.length}`); }
  if (to) { params.push(to); where.push(`end_date <= $${params.length}`); }
  if (buyerId) { params.push(Number(buyerId)); where.push(`buyer_id = $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT status,
            COUNT(*)                                        AS contracts,
            SUM(qty_committed)                              AS qty_committed,
            SUM(qty_committed * price_per_unit)             AS contract_value
       FROM revenue_contracts
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      GROUP BY status`,
    params
  );

  if (!rows.length) {
    // Deliberately NOT zero. Nothing recorded is not the same as nothing earned.
    return {
      totalRevenue: null,
      channels: [],
      contracts: 0,
      note: 'No revenue contracts recorded for this filter. Reported as null rather than '
          + '0 — an empty table means unrecorded, not zero revenue, and a dashboard '
          + 'showing 0 would state something the data does not support.',
    };
  }

  const realised = rows.filter((r) => ['active', 'completed'].includes(r.status));
  return {
    totalRevenue: realised.reduce((s, r) => s + Number(r.contract_value || 0), 0),
    pipelineValue: rows.filter((r) => ['draft', 'offered', 'accepted'].includes(r.status))
      .reduce((s, r) => s + Number(r.contract_value || 0), 0),
    byStatus: rows.map((r) => ({
      status: r.status,
      contracts: Number(r.contracts),
      qtyCommitted: r.qty_committed === null ? null : Number(r.qty_committed),
      contractValue: r.contract_value === null ? null : Number(r.contract_value),
    })),
    contracts: rows.reduce((s, r) => s + Number(r.contracts), 0),
    note: 'totalRevenue counts active and completed contracts only. Draft and offered '
        + 'contracts are pipeline, not revenue, and are reported separately.',
  };
}

/**
 * Allocate committed quantity across channels.
 *
 * Proposes an allocation and does NOT apply it. Moving committed volume
 * between channels changes what a farmer has been promised and what a buyer
 * expects; the platform can compute the split, but a person signs it off.
 */
async function allocateChannels({ contractId, channels } = {}) {
  if (!contractId) throw new Error('contractId is required');
  if (!Array.isArray(channels) || !channels.length) {
    throw new Error('channels must be a non-empty array of { channel, sharePct }');
  }
  const totalShare = channels.reduce((s, c) => s + Number(c.sharePct || 0), 0);
  if (Math.abs(totalShare - 100) > 0.01) {
    throw new Error(`Channel shares must sum to 100, got ${totalShare}`);
  }

  const { rows } = await pool.query(
    'SELECT * FROM revenue_contracts WHERE contract_id = $1', [Number(contractId)]
  );
  if (!rows.length) throw new Error(`Contract ${contractId} not found`);
  const c = rows[0];
  const qty = Number(c.qty_committed || 0);

  return {
    contractId,
    status: 'proposed',
    applied: false,
    requiresApproval: true,
    allocation: channels.map((ch) => ({
      channel: ch.channel,
      sharePct: Number(ch.sharePct),
      qty: Math.round(qty * Number(ch.sharePct) / 100 * 100) / 100,
      value: c.price_per_unit
        ? Math.round(qty * Number(ch.sharePct) / 100 * Number(c.price_per_unit) * 100) / 100
        : null,
    })),
    note: 'Proposed only. Reallocating committed volume changes what a farmer was promised '
        + 'and what a buyer expects, so it needs a named human to approve it before it '
        + 'takes effect.',
  };
}

module.exports = { getOverview, allocateChannels };

// Merged from backend/src/modules/M104
{
  const m104 = require("../../modules/M104/service");
  const { ...rest } = m104;
  Object.assign(module.exports, rest);
}



