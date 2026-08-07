/**
 * Finance and compliance logic recovered from afrera_platform_v42/v44.html.
 *
 * Each function below existed only as browser JavaScript with its reference
 * data hard-coded. Verified absent from this backend before porting.
 *
 *   gstFor / buildInvoice   GST classification and invoice assembly
 *   trialBalance            derived from the ledger, not a stored figure
 *   verifyLedger            hash-chain integrity over the GL
 *   matchSchemes            government scheme eligibility scoring
 *   issueEnwr               warehouse receipt with collateral haircut
 *   freightRate             lane + class rate card
 *   equipmentSubsidy        indicative subsidy bands
 *   partyRisk               counterparty risk from recorded events
 *
 * Backed by migration 053.
 */

'use strict';

const crypto = require('crypto');
const pool = require('../database/pool');
const { logger } = require('../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// GST
// ---------------------------------------------------------------------------

/**
 * Classify a product category to an HSN code and GST rate.
 *
 * The branded/unbranded split is not a detail: fresh produce is nil-rated only
 * when it is NOT put up in a unit container under a registered brand. Get that
 * wrong and an invoice is either short-paying tax or over-charging a farmer.
 */
async function gstFor(category, branded = true) {
  const { rows } = await pool.query(
    `SELECT * FROM gst_category_rules
      WHERE effective_to IS NULL
        AND $1 ~* match_pattern
        AND (requires_unbranded = FALSE OR $2 = FALSE)
      ORDER BY priority
      LIMIT 1`,
    [String(category || ''), Boolean(branded)]
  );
  if (!rows.length) {
    throw new Error(`No GST rule matched category "${category}" — the fallback rule is missing`);
  }
  const r = rows[0];
  return {
    hsn: r.hsn_code,
    rate: Number(r.gst_rate),
    description: r.description,
    isFallback: r.priority >= 999,
    notificationRef: r.notification_ref,
  };
}

/**
 * Build a GST invoice.
 *
 * Two rules carried over from v42 that are easy to get wrong:
 *
 *   Inter-state vs intra-state decides IGST against CGST+SGST. It is one
 *   comparison and getting it backwards makes every invoice wrong in a way
 *   the totals will not reveal, because the total is identical either way.
 *
 *   CGST and SGST must sum EXACTLY to the total tax. Rounding each to half
 *   independently loses a paisa on odd amounts, so one half is rounded and the
 *   other is the remainder.
 */
async function buildInvoice(order) {
  const items = [];
  for (const it of order.items || []) {
    const g = await gstFor(it.category, it.branded !== false);
    const taxable = r2((it.qty || 1) * (it.price || 0));
    const tax = r2(taxable * g.rate / 100);
    items.push({
      name: it.name, hsn: g.hsn, qty: it.qty || 1, price: it.price || 0,
      taxableValue: taxable, gstRate: g.rate, taxAmount: tax,
      rateIsFallback: g.isFallback,
    });
  }

  const interState = String(order.fromState || '') !== String(order.toState || '');
  const taxable = r2(items.reduce((s, i) => s + i.taxableValue, 0));
  const tax = r2(items.reduce((s, i) => s + i.taxAmount, 0));
  const cgst = interState ? 0 : r2(Math.round(tax * 50) / 100);
  const sgst = interState ? 0 : r2(tax - cgst);
  const total = r2(taxable + tax);

  return {
    invoiceDate: new Date().toISOString().slice(0, 10),
    items,
    taxableValue: taxable,
    totalTax: tax,
    cgst, sgst,
    igst: interState ? tax : 0,
    total,
    supplyType: interState ? 'inter-state' : 'intra-state',
    fromState: order.fromState, toState: order.toState,
    // E-way bill threshold. Consignment value above Rs 50,000 moving between
    // states requires one; below it, generally not.
    ewayBillRequired: interState && total > 50000,
    ewayBillNote: interState && total > 50000
      ? 'Consignment exceeds Rs 50,000 inter-state — an e-way bill is required before movement.'
      : null,
    caveat: items.some((i) => i.rateIsFallback)
      ? 'One or more line items fell through to the default rate. Verify the HSN before filing.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

/**
 * Append a hash-chained ledger entry.
 *
 * Each entry's hash covers the previous hash, so altering any historical row
 * breaks every link after it. That is the whole tamper-evidence property, and
 * it only holds if entries are appended in sequence — hence the row lock.
 */
async function appendLedgerEntry({ debitAccount, creditAccount, amount, narration, journalEntryId, recordedBy }) {
  if (debitAccount === creditAccount) {
    throw new Error('Debit and credit accounts must differ — an entry to and from the same '
                  + 'account moves nothing and still balances');
  }
  if (!(amount > 0)) throw new Error('Ledger amount must be positive');

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Serialise appenders. Two concurrent writers computing prev_hash from the
    // same tail would fork the chain, and the fork would look like tampering.
    await client.query('LOCK TABLE gl_ledger_chain IN SHARE ROW EXCLUSIVE MODE');

    const { rows: tail } = await client.query(
      'SELECT entry_hash, sequence_no FROM gl_ledger_chain ORDER BY sequence_no DESC LIMIT 1'
    );
    const prevHash = tail.length ? tail[0].entry_hash : 'genesis';
    const seq = tail.length ? Number(tail[0].sequence_no) + 1 : 1;
    const entryRef = `GL-${Date.now().toString(36).toUpperCase()}-${seq}`;

    const payload = [prevHash, seq, debitAccount, creditAccount, r2(amount), narration].join('|');
    const entryHash = crypto.createHash('sha256').update(payload).digest('hex');

    const { rows } = await client.query(
      `INSERT INTO gl_ledger_chain
         (entry_ref, journal_entry_id, debit_account, credit_account, amount,
          narration, prev_hash, entry_hash, sequence_no, recorded_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [entryRef, journalEntryId ?? null, debitAccount, creditAccount, r2(amount),
        narration, prevHash, entryHash, seq, recordedBy ?? null]
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Trial balance, computed from the ledger so it cannot disagree with it. */
async function trialBalance() {
  const [{ rows: lines }, { rows: check }] = await Promise.all([
    pool.query('SELECT * FROM v_ledger_trial_balance'),
    pool.query('SELECT * FROM v_ledger_trial_balance_check'),
  ]);
  const c = check[0] || {};
  return {
    lines,
    totalDebit: Number(c.total_debit || 0),
    totalCredit: Number(c.total_credit || 0),
    difference: Number(c.difference || 0),
    balanced: Boolean(c.balanced),
    note: c.balanced === false
      ? 'Debits do not equal credits. With a chained ledger this means an entry was '
      + 'inserted outside appendLedgerEntry(), not that arithmetic drifted.'
      : null,
  };
}

/** Verify the hash chain. An empty `broken` array is the only good answer. */
async function verifyLedger() {
  const { rows: broken } = await pool.query('SELECT * FROM v_ledger_integrity');
  const { rows: len } = await pool.query('SELECT COUNT(*)::int AS n FROM gl_ledger_chain');
  return {
    ok: broken.length === 0,
    length: len[0].n,
    broken,
    note: broken.length
      ? 'The chain is broken. Every entry after the first break is unverifiable, '
      + 'so the earliest sequence_no listed is where to look.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Government schemes
// ---------------------------------------------------------------------------

const NE_STATES = ['Nagaland', 'Meghalaya', 'Manipur', 'Assam', 'Mizoram',
  'Tripura', 'Sikkim', 'Arunachal Pradesh'];

/**
 * Score schemes against a project. Every point carries its reason, so a farmer
 * or a consultant can see WHY a scheme ranked where it did rather than being
 * handed an ordering to trust.
 */
async function matchSchemes(projectType, state) {
  const { rows } = await pool.query(
    "SELECT * FROM dpr_schemes WHERE status <> 'lapsed'"
  );
  const isNE = NE_STATES.includes(state);

  return rows.map((s) => {
    let score = 0;
    const why = [];

    if ((s.project_types || []).includes(projectType)) {
      score += 50; why.push('project type matches scheme scope (+50)');
    }
    if (s.ne_states_only) {
      if (isNE) { score += 30; why.push(`${state} is an NE state and this scheme is NE-only (+30)`); }
      // Disqualifying, not merely unfavourable. Applying costs a consultant fee
      // and months, and the answer was always going to be no.
      else { score -= 100; why.push(`${state} is not an NE state — this scheme cannot apply`); }
    }
    if (s.status === 'verify') {
      score -= 15;
      why.push('scheme window is unverified (−15) — confirm before relying on it');
    }
    if (s.scheme_code === 'OPGREENS' && projectType === 'coldchain') {
      score += 10; why.push('transport and storage subsidy fits cold chain (+10)');
    }
    return {
      schemeCode: s.scheme_code,
      schemeName: s.scheme_name,
      ministry: s.ministry,
      subsidyPct: s.subsidy_pct === null ? null : Number(s.subsidy_pct),
      status: s.status,
      lastVerifiedOn: s.last_verified_on,
      score, why,
    };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

// ---------------------------------------------------------------------------
// eNWR
// ---------------------------------------------------------------------------

/**
 * Issue a warehouse receipt.
 *
 * The 30% haircut (70% pledgeable) is the standard agri-collateral discount.
 * It is the entire safety margin between a stored crop and a loan that cannot
 * be repaid if prices fall, so it is enforced by a generated column and a
 * CHECK rather than by whoever calls this.
 */
async function issueEnwr({ bookingId, facilityId, farmerId, commodity, quantityQtl, estimatedValueInr, haircutPct = 30, validUntil, issuedBy }) {
  if (!(estimatedValueInr > 0)) throw new Error('An estimated stored value is required');
  if (!(quantityQtl > 0)) throw new Error('Quantity must be positive');

  const receiptNo = `eNWR-${Date.now().toString(36).toUpperCase()}`;
  const { rows } = await pool.query(
    `INSERT INTO enwr_receipts
       (receipt_no, booking_id, facility_id, farmer_id, commodity, quantity_qtl,
        estimated_value_inr, haircut_pct, valid_until, issued_by)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     RETURNING *`,
    [receiptNo, bookingId ?? null, facilityId ?? null, farmerId ?? null, commodity ?? null,
      quantityQtl, estimatedValueInr, haircutPct, validUntil ?? null, issuedBy ?? null]
  );
  const r = rows[0];
  return {
    ...r,
    max_collateral_inr: Number(r.max_collateral_inr),
    note: `Up to Rs ${Number(r.max_collateral_inr).toLocaleString('en-IN')} is pledgeable — `
        + `${100 - haircutPct}% of estimated value, the standard agri-collateral haircut. `
        + 'The margin exists so a price fall does not leave the farmer owing more than the crop is worth.',
  };
}

// ---------------------------------------------------------------------------
// Freight
// ---------------------------------------------------------------------------

/** Rate per kg for a lane and transport class. */
async function freightRate({ laneKm, classKey, utilisationPct }) {
  const { rows: cls } = await pool.query(
    'SELECT * FROM transport_classes WHERE class_key = $1', [classKey]
  );
  if (!cls.length) throw new Error(`Unknown transport class: ${classKey}`);
  const c = cls[0];

  // v42: km * 0.0055 * class multiplier.
  const base = Number(laneKm) * 0.0055;
  const ratePerKg = r2(base * Number(c.rate_multiplier));

  let slab = null;
  if (utilisationPct !== undefined && utilisationPct !== null) {
    const { rows: s } = await pool.query(
      `SELECT * FROM freight_utilisation_slabs
        WHERE min_utilisation_pct <= $1
        ORDER BY min_utilisation_pct DESC LIMIT 1`,
      [utilisationPct]
    );
    slab = s[0] || null;
  }

  return {
    laneKm: Number(laneKm),
    transportClass: c.display_name,
    ratePerKg,
    temperatureControlled: c.temperature_controlled,
    utilisationSlab: slab && {
      minUtilisationPct: Number(slab.min_utilisation_pct),
      ratePerKg: Number(slab.rate_per_kg),
      note: slab.notes,
    },
    caveat: c.temperature_controlled
      ? 'Cold chain costs more and is not optional for perishables. Comparing it '
      + 'against economy freight is not like-for-like — the cheap option delivers spoiled goods.'
      : null,
  };
}

// ---------------------------------------------------------------------------
// Subsidy + risk
// ---------------------------------------------------------------------------

async function equipmentSubsidy(priceInr, tier = 'general') {
  const { rows } = await pool.query(
    'SELECT * FROM equipment_subsidy_bands WHERE tier = $1', [tier]
  );
  if (!rows.length) throw new Error(`Unknown subsidy tier: ${tier}`);
  const b = rows[0];
  const amount = Math.round(priceInr * Number(b.subsidy_pct) / 100);
  const capped = b.ceiling_inr ? Math.min(amount, Number(b.ceiling_inr)) : amount;
  return {
    tier: b.tier,
    subsidyPct: Number(b.subsidy_pct),
    estimatedAmountInr: capped,
    cappedByCeiling: capped !== amount,
    farmerPaysInr: Math.round(priceInr - capped),
    note: b.note,
    disclaimer: 'Indicative estimate only. Actual sanction depends on the state '
              + 'agency, scheme window and applicant category — this is not a commitment.',
  };
}

async function recordRiskEvent({ partyId, partyType = 'user', eventType, weight, reference, detail }) {
  const DEFAULT_WEIGHT = {
    dispute: 15, grade_mismatch: 15, media_rejected: 8, late_delivery: 10,
    payment_default: 40, quality_failure: 25, resolved_favourably: -10,
  };
  const w = weight !== undefined ? weight : (DEFAULT_WEIGHT[eventType] ?? 10);
  const { rows } = await pool.query(
    `INSERT INTO party_risk_events (party_id, party_type, event_type, weight, reference, detail)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
    [partyId, partyType, eventType, w, reference ?? null, detail ?? null]
  );
  return rows[0];
}

async function partyRisk(partyId) {
  const { rows } = await pool.query('SELECT * FROM v_party_risk WHERE party_id = $1', [partyId]);
  if (!rows.length) {
    return {
      partyId, riskScore: 0, riskLevel: 'unknown', events: 0,
      note: 'No recorded events. That is an absence of evidence, not a clean record — '
          + 'a party nobody has transacted with has an unknown risk, not a low one.',
    };
  }
  const r = rows[0];
  return {
    partyId,
    riskScore: Number(r.risk_score),
    riskLevel: r.risk_level,
    events: Number(r.events),
    disputes: Number(r.disputes),
    gradeMismatches: Number(r.grade_mismatches),
    paymentDefaults: Number(r.payment_defaults),
    lastEventAt: r.last_event_at,
  };
}

/** Certificates expiring within `days`. Default 120 matches v42. */
async function certExpiryAlerts(days = 120) {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM organic_certificates
        WHERE valid_until IS NOT NULL
          AND valid_until <= CURRENT_DATE + ($1 || ' days')::interval
        ORDER BY valid_until`,
      [days]
    );
    return rows.map((c) => ({
      ...c,
      daysRemaining: Math.round((new Date(c.valid_until) - Date.now()) / 86400000),
    }));
  } catch (err) {
    logger.warn('certExpiryAlerts: certificate table unavailable', { error: err.message });
    return [];
  }
}

module.exports = {
  gstFor, buildInvoice,
  appendLedgerEntry, trialBalance, verifyLedger,
  matchSchemes,
  issueEnwr,
  freightRate,
  equipmentSubsidy, recordRiskEvent, partyRisk, certExpiryAlerts,
};
