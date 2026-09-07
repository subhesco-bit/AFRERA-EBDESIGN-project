/**
 * RFQ and sealed-bid negotiation, plus the commercial modules named as missing
 * alongside it: staple subscriptions, quote outcomes, farm plots, agri-input
 * traceability, QC holds and FPO cost centres.
 *
 * Backed by migration 056.
 */

'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');
const { signalBus, SIGNAL, SEVERITY } = require('../core/signalBus');

/** Stable pseudonym per bidder per RFQ. Same bidder, same handle, no identity. */
function handleFor(rfqId, bidderId) {
  const h = crypto.createHash('sha256').update(`${rfqId}:${bidderId}`).digest('hex');
  return `Bidder-${h.slice(0, 6).toUpperCase()}`;
  }

async function createRfq(r) {
  const rfqNo = `RFQ-${Date.now().toString(36).toUpperCase()}`;
  const { rows } = await pool.query(
    `INSERT INTO rfq_requests
       (rfq_no, buyer_id, buyer_org, product, grade, quantity_kg, delivery_by,
        delivery_location, target_price_inr_per_kg, bids_sealed_until, closes_at,
        success_fee_pct, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,'open') RETURNING *`,
    [rfqNo, r.buyerId ?? null, r.buyerOrg ?? null, r.product, r.grade ?? null,
      r.quantityKg, r.deliveryBy ?? null, r.deliveryLocation ?? null,
      r.targetPriceInrPerKg ?? null, r.bidsSealedUntil ?? r.closesAt, r.closesAt,
      r.successFeePct ?? 2.0]
  );
  return rows[0];
}

async function submitBid(b) {
  const { rows: rfq } = await pool.query('SELECT * FROM rfq_requests WHERE id = $1', [b.rfqId]);
  if (!rfq.length) throw new Error(`RFQ ${b.rfqId} not found`);
  if (rfq[0].status !== 'open') throw new Error(`RFQ is ${rfq[0].status}, not open`);
  if (new Date(rfq[0].closes_at) < new Date()) throw new Error('RFQ has closed');

  const { rows } = await pool.query(
    `INSERT INTO rfq_bids
       (rfq_id, bidder_id, bidder_type, anonymous_handle, price_inr_per_kg,
        quantity_offered_kg, earliest_delivery, quality_evidence, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
     ON CONFLICT (rfq_id, bidder_id) DO UPDATE SET
       price_inr_per_kg = EXCLUDED.price_inr_per_kg,
       quantity_offered_kg = EXCLUDED.quantity_offered_kg,
       submitted_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [b.rfqId, b.bidderId, b.bidderType ?? 'farmer', handleFor(b.rfqId, b.bidderId),
      b.priceInrPerKg, b.quantityOfferedKg, b.earliestDelivery ?? null,
      b.qualityEvidence ?? null, b.notes ?? null]
  );
  return { ...rows[0], note: 'Bid recorded under an anonymous handle. Other bidders cannot '
    + 'see your price, and you cannot see theirs — visible bids let a later bidder undercut '
    + 'a number they should never have seen.' };
}

/**
 * Bids for an RFQ. Prices are withheld until the seal lifts, even from the
 * buyer — a buyer who watches bids arrive can leak the leading price back to a
 * favoured supplier, and the sealed period is what stops that.
 */
async function bidsFor(rfqId, { asBuyer = false } = {}) {
  const { rows: rfq } = await pool.query('SELECT * FROM rfq_requests WHERE id = $1', [rfqId]);
  if (!rfq.length) throw new Error(`RFQ ${rfqId} not found`);
  const sealed = rfq[0].bids_sealed_until && new Date(rfq[0].bids_sealed_until) > new Date();

  const { rows } = await pool.query(
    `SELECT id, anonymous_handle, bidder_type, price_inr_per_kg, quantity_offered_kg,
            earliest_delivery, quality_evidence, status, submitted_at
       FROM rfq_bids WHERE rfq_id = $1 ORDER BY price_inr_per_kg`,
    [rfqId]
  );

  if (sealed && !asBuyer) {
    return { sealed: true, bidCount: rows.length, bids: [],
      note: 'Bids are sealed until ' + rfq[0].bids_sealed_until };
  }
  if (sealed) {
    return {
      sealed: true, bidCount: rows.length,
      bids: rows.map((r) => ({ handle: r.anonymous_handle, submittedAt: r.submitted_at })),
      note: 'Bid count is visible; prices open at ' + rfq[0].bids_sealed_until,
    };
  }
  return { sealed: false, bidCount: rows.length, bids: rows };
}

// --- Quote outcomes ---------------------------------------------------------

async function recordQuoteOutcome(q) {
  if (q.outcome === 'lost' && !q.lossReason) {
    throw new Error('A lost quote must record why. Conversion rate without a reason tells '
                  + 'you that you are losing and nothing about what to change.');
  }
  const { rows } = await pool.query(
    `INSERT INTO quote_outcomes
       (quote_ref, buyer_id, product, quantity_kg, quoted_price_inr_per_kg,
        quoted_delivery_days, outcome, loss_reason, competitor_price_inr_per_kg,
        loss_detail, decided_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,
             CASE WHEN $7 IN ('won','lost') THEN CURRENT_TIMESTAMP END)
     ON CONFLICT (quote_ref) DO UPDATE SET
       outcome = EXCLUDED.outcome, loss_reason = EXCLUDED.loss_reason,
       decided_at = CURRENT_TIMESTAMP
     RETURNING *`,
    [q.quoteRef, q.buyerId ?? null, q.product ?? null, q.quantityKg ?? null,
      q.quotedPriceInrPerKg ?? null, q.quotedDeliveryDays ?? null, q.outcome,
      q.lossReason ?? null, q.competitorPriceInrPerKg ?? null, q.lossDetail ?? null]
  );
  return rows[0];
}

/** Why quotes are lost — the reason this module exists. */
async function lossAnalysis({ days = 90 } = {}) {
  const { rows } = await pool.query(
    `SELECT loss_reason, COUNT(*) AS losses,
            ROUND(AVG(quoted_price_inr_per_kg)::numeric, 2)        AS mean_quoted,
            ROUND(AVG(competitor_price_inr_per_kg)::numeric, 2)    AS mean_competitor,
            ROUND(AVG(quoted_price_inr_per_kg - competitor_price_inr_per_kg)::numeric, 2) AS mean_gap
       FROM quote_outcomes
      WHERE outcome = 'lost' AND quoted_at >= CURRENT_DATE - ($1 || ' days')::interval
      GROUP BY loss_reason ORDER BY losses DESC`,
    [Number(days)]
  );
  const total = rows.reduce((s, r) => s + Number(r.losses), 0);
  const { rows: won } = await pool.query(
    `SELECT COUNT(*) AS n FROM quote_outcomes
      WHERE outcome = 'won' AND quoted_at >= CURRENT_DATE - ($1 || ' days')::interval`,
    [Number(days)]
  );
  const wonN = Number(won[0].n);
  return {
    windowDays: days,
    lost: total, won: wonN,
    winRatePct: (total + wonN) ? Math.round((wonN / (total + wonN)) * 10000) / 100 : null,
    byReason: rows,
    note: total === 0 && wonN === 0
      ? 'No quotes recorded in this window — win rate is unknown, not 100%.'
      : null,
  };
}

// --- QC holds ---------------------------------------------------------------

async function raiseQcHold(h) {
  const { rows } = await pool.query(
    `INSERT INTO qc_holds
       (lot_code, hold_reason, lab_report_ref, failed_parameter, observed_value, permitted_limit)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [h.lotCode, h.holdReason, h.labReportRef ?? null, h.failedParameter ?? null,
      h.observedValue ?? null, h.permittedLimit ?? null]
  );

  // AFFERENT WIRING: core/effectors.js already has a 'quality.failure_response'
  // reaction on SIGNAL.QUALITY_FAILED (quarantine the lot, trace downstream
  // consignees, assess recall) and core/decisionEngine.js already has a
  // 'quality.failure_with_distribution' rule that escalates a failure on an
  // already-shipped lot — both have been unreachable because a QC hold, which
  // IS a failed quality test blocking a lot from dispatch, never called
  // emitSignal(). Emitted AFTER the insert with the persisted row's own
  // fields, so the signal reflects a durable hold, not a request in flight.
  signalBus.emitSignal(
    SIGNAL.QUALITY_FAILED,
    {
      lotId: rows[0].lot_code ?? null,
      holdReason: rows[0].hold_reason ?? null,
      failedParameter: rows[0].failed_parameter ?? null,
      observedValue: rows[0].observed_value ?? null,
      permittedLimit: rows[0].permitted_limit ?? null,
      labReportRef: rows[0].lab_report_ref ?? null
    },
    { severity: SEVERITY.CRITICAL, source: 'rfqService.raiseQcHold', entityId: rows[0].lot_code ?? null }
  );

  return { ...rows[0], note: 'Lot is blocked from dispatch. Release requires a named QC '
    + 'manager and a signature.' };
}

/** Release a hold. Requires a named person, a signature and a justification. */
async function releaseQcHold({ holdId, releasedBy, signature, justification }) {
  if (!releasedBy || !signature || !justification || !justification.trim()) {
    throw new Error('Releasing a QC hold requires the releasing person, their signature and '
                  + 'a justification. The hold exists precisely because somebody must take '
                  + 'responsibility for overriding it.');
  }
  const { rows } = await pool.query(
    `UPDATE qc_holds
        SET status='released', released_by=$2, release_signature=$3,
            release_justification=$4, released_at=CURRENT_TIMESTAMP
      WHERE id=$1 AND status='held' RETURNING *`,
    [holdId, releasedBy, signature, justification]
  );
  if (!rows.length) throw new Error(`Hold ${holdId} not found or not currently held`);
  return rows[0];
}

async function activeHolds() {
  const { rows } = await pool.query(
    "SELECT * FROM qc_holds WHERE status='held' ORDER BY held_at"
  );
  return { holds: rows, count: rows.length };
}

// --- FPO cost centres -------------------------------------------------------

async function centrePnl(fpoId) {
  const { rows } = await pool.query(
    `SELECT p.* FROM v_fpo_centre_pnl p
       JOIN fpo_cost_centres c ON c.id = p.centre_id
      WHERE ($1::uuid IS NULL OR c.fpo_id = $1)
      ORDER BY p.net_inr DESC NULLS LAST`,
    [fpoId ?? null]
  );
  const wastages = rows.map((r) => r.wastage_pct_of_procurement).filter((w) => w !== null).map(Number);
  const meanWastage = wastages.length ? wastages.reduce((a, b) => a + b, 0) / wastages.length : null;
  return {
    centres: rows,
    count: rows.length,
    meanWastagePct: meanWastage === null ? null : Math.round(meanWastage * 100) / 100,
    // The comparison is the control. An FPO-level total hides a centre being robbed.
    outliers: meanWastage === null ? [] : rows
      .filter((r) => r.wastage_pct_of_procurement !== null
                  && Number(r.wastage_pct_of_procurement) > meanWastage * 1.5)
      .map((r) => ({ centre: r.centre_name, wastagePct: Number(r.wastage_pct_of_procurement),
        finding: 'Wastage more than 50% above the peer mean — badly run, or being robbed.' })),
  };
}

module.exports = {
  createRfq, submitBid, bidsFor,
  recordQuoteOutcome, lossAnalysis,
  raiseQcHold, releaseQcHold, activeHolds,
  centrePnl,
};
