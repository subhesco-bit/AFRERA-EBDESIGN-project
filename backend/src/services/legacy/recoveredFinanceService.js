/**
 * Finance and compliance logic recovered from afrera_platform_v42/v44.html.
 *
 * Each function below existed only as browser JavaScript with its reference
 * data hard-coded. Verified absent from this backend before porting.
 *
 *   trialBalance            derived from the ledger, not a stored figure
 *   verifyLedger            hash-chain integrity over the GL
 *   matchSchemes            government scheme eligibility scoring
 *   issueEnwr               warehouse receipt with collateral haircut
 *   freightRate             lane + class rate card
 *   equipmentSubsidy        indicative subsidy bands
 *   partyRisk               counterparty risk from recorded events
 *
 * gstFor()/buildInvoice()/appendLedgerEntry() were deleted here (2026-08-17):
 * gstFor/buildInvoice were a second, independent GST-rate authority alongside
 * the canonical gstService.resolveGSTRate(), and appendLedgerEntry() was the
 * write path into a second, disconnected hash-chained ledger (gl_ledger_chain)
 * alongside the canonical journal_entries/journal_lines ledger — a real
 * double-booking risk. None had a live caller (see routes.js). trialBalance()
 * and verifyLedger() below still read gl_ledger_chain — that data stays valid
 * without new writes, and verifyLedger()'s tamper-evidence check has no
 * equivalent elsewhere in the codebase, so those two were kept.
 *
 * Backed by migration 053.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');

const r2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------------------
// Ledger
// ---------------------------------------------------------------------------

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

/**
 * Real eNWR receipts for a farmer — added 2026-08-15 as part of the "Bank
 * Passport" gap fix. issueEnwr() existed with zero way to list what had
 * been issued; a lender-facing passport view is meaningless without this.
 */
async function listMyEnwrReceipts(farmerId) {
  const { rows } = await pool.query(
    `SELECT * FROM enwr_receipts WHERE farmer_id = $1 ORDER BY issued_at DESC`,
    [farmerId]
  );
  return rows.map((r) => ({ ...r, max_collateral_inr: Number(r.max_collateral_inr) }));
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
  let c = cls[0];

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
  let r = rows[0];
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
  trialBalance, verifyLedger,
  matchSchemes,
  issueEnwr,
  listMyEnwrReceipts,
  freightRate,
  equipmentSubsidy, recordRiskEvent, partyRisk, certExpiryAlerts,
};
