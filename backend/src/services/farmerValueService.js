/**
 * Farmer Value Engine — the decision layer above every other module.
 *
 * Backs migration 991. This is the service the AEOS brief calls for: it answers
 * one question and everything else in the platform is subordinate to it —
 *
 *     Is this farmer better off, by how much, and how sure are we?
 *
 * WHY THE THIRD CLAUSE IS NOT OPTIONAL
 *
 * A farmer shown "you can save ₹18,000" will act on it. They will plant
 * differently, borrow against it, or delay a sale waiting for it. If that
 * figure came from assumed inputs and was presented like a measured one, the
 * platform has not helped them — it has moved their risk without telling them.
 *
 * So every number this service returns carries its provenance, computed by the
 * SAME DATA_QUALITY_WEIGHT the MCDA layer already uses:
 *
 *     real      1.0   measured, recorded, receipted
 *     estimated 0.7   derived from a model or proxy
 *     assumed   0.4   a stated assumption with no backing data
 *
 * An FVI built on farmer-recalled figures is not wrong — it is weaker, and it
 * says so.
 *
 * WHAT THIS SERVICE WILL NOT DO
 * It does not act. It computes, ranks and surfaces. Anything that spends money
 * or commits the farmer goes through ai_proposals and needs a named approver,
 * exactly like the ERP agents.
 */

'use strict';

const express = require('express');
const pool = require('../database/pool');
const { authMiddleware } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { mcda, DATA_QUALITY_WEIGHT } = require('../core/mcda');

const router = express.Router();

function fail(res, error, context) {
  logger.error(`farmerValue:${context}`, { message: error.message });
  return res.status(500).json({ success: false, error: error.message });
}

const num = (v) => (v === null || v === undefined || v === '' ? 0 : Number(v));
const round2 = (v) => Math.round(num(v) * 100) / 100;

/**
 * Map a measurement basis to the provenance grades the MCDA layer understands.
 * yield_actuals.measurement_basis is the honest source of this — a weighbridge
 * reading and a farmer's recollection are not the same evidence.
 */
const BASIS_QUALITY = Object.freeze({
  weighbridge: 'real',
  buyer_receipt: 'real',
  farmer_reported: 'estimated',
  estimated: 'assumed',
});

// ===========================================================================
// 1. THE LEDGER — cost and revenue for one farmer, one season
// ===========================================================================

async function getSeasonLedger(farmerId, season, year) {
  // COST — farm_consumables is the cost ledger, but it has NO farmer_id. It
  // hangs off rural_economic_units, which links to a farmer through user_id.
  //
  // FIXED 2026-08-04: the first version of this query joined REU but never
  // filtered by farmer, so it summed EVERY farmer's costs and reported them
  // as one farmer's. An FVI built on that would have been catastrophically
  // wrong in the direction that matters — telling a farmer they were deeply
  // in loss when they were not.
  const { rows: cost } = await pool.query(
    `SELECT COALESCE(SUM(fc.total_cost), 0)      AS gross_cost,
            COALESCE(SUM(fc.subsidy_amount), 0)  AS subsidy_received,
            COALESCE(SUM(fc.net_cost), 0)        AS net_cost,
            COUNT(*)::int                        AS line_count
       FROM farm_consumables fc
       JOIN rural_economic_units reu ON reu.id = fc.reu_id
       JOIN farmers f ON f.user_id = reu.user_id
      WHERE f.id = $1
        AND ($2::text IS NULL OR fc.season = $2)
        AND ($3::int  IS NULL OR fc.year   = $3)`,
    [farmerId, season ?? null, year ?? null]
  );

  // REVENUE — new in 991. Before this the platform could not see earnings.
  const { rows: rev } = await pool.query(
    `SELECT COALESCE(SUM(net_amount), 0) AS net_revenue,
            COALESCE(SUM(gross_amount), 0) AS gross_revenue,
            COALESCE(SUM(quantity_kg), 0) AS quantity_sold_kg,
            COUNT(*)::int AS sale_count,
            COUNT(*) FILTER (WHERE payment_status = 'pending')::int AS pending_count,
            COALESCE(SUM(gross_amount) FILTER (WHERE payment_status = 'pending'), 0) AS pending_amount
       FROM farmer_revenue
      WHERE farmer_id = $1
        AND ($2::text IS NULL OR season = $2)
        AND ($3::int  IS NULL OR year   = $3)`,
    [farmerId, season ?? null, year ?? null]
  );

  // YIELD — carries the measurement basis, which sets the confidence floor.
  const { rows: yld } = await pool.query(
    `SELECT COALESCE(SUM(quantity_harvested_kg), 0) AS harvested_kg,
            COALESCE(SUM(quantity_lost_kg), 0)      AS lost_kg,
            COALESCE(SUM(area_planted_ha), 0)       AS area_ha,
            mode() WITHIN GROUP (ORDER BY measurement_basis) AS basis
       FROM yield_actuals
      WHERE farmer_id = $1
        AND ($2::text IS NULL OR season = $2)
        AND ($3::int  IS NULL OR year   = $3)`,
    [farmerId, season ?? null, year ?? null]
  );

  return { cost: cost[0], revenue: rev[0], yield: yld[0] };
}

// ===========================================================================
// 2. UNCLAIMED SUBSIDY DETECTOR
//
// The highest-return item in the whole gap analysis. subsidy_claims exists,
// eligibility rules exist, ne_organic_schemes carries per-hectare support —
// and nothing ever joined them to say "you qualify for this and have not
// claimed it". Money already allocated to the farmer, sitting unclaimed
// because nobody told them.
// ===========================================================================

async function detectUnclaimedSubsidy(farmerId) {
  const items = [];

  // (a) NE organic scheme support — v_ne_organic_status already computes the
  //     unclaimed figure. It was simply never surfaced anywhere.
  const { rows: organic } = await pool.query(
    `SELECT scheme_code, scheme_name, area_ha, unclaimed_support,
            conversion_status, certificate_expiring, inspection_overdue
       FROM v_ne_organic_status
      WHERE farmer_id = $1 AND unclaimed_support > 0`,
    [farmerId]
  );
  for (const o of organic) {
    items.push({
      source: 'ne_organic_scheme',
      reference: o.scheme_code,
      title: o.scheme_name,
      amount: round2(o.unclaimed_support),
      // A certified farm can claim now; one still in conversion cannot yet.
      // Saying "you can claim ₹X" to someone who cannot is worse than silence.
      claimable_now: o.conversion_status === 'certified',
      blocker: o.conversion_status !== 'certified'
        ? `Enrolment is "${o.conversion_status}" — support is claimable once certified.`
        : o.inspection_overdue
          ? 'Inspection is overdue; clear it before claiming.'
          : null,
      confidence: 'real',   // scheme rate x recorded area, both stored facts
    });
  }

  // (b) Subsidy claims started and never completed. Abandoned paperwork is
  //     the commonest way support is lost.
  //
  // FIXED 2026-08-04: this originally selected scheme_name and claim_amount.
  // subsidy_claims has neither — the columns are `amount` and `scheme_id`,
  // with the name living on `schemes`. Guessing column names would have
  // thrown at runtime on the one query that finds a farmer real money.
  const { rows: stalled } = await pool.query(
    `SELECT sc.id,
            COALESCE(s.name, 'Scheme #' || sc.scheme_id::text) AS scheme_name,
            sc.amount,
            sc.status,
            sc.application_date
       FROM subsidy_claims sc
       LEFT JOIN schemes s ON s.id = sc.scheme_id
      WHERE sc.farmer_id = $1
        AND sc.status IN ('draft','pending','incomplete','submitted')
        AND COALESCE(sc.application_date, sc.created_at) < CURRENT_DATE - INTERVAL '30 days'`,
    [farmerId]
  );
  for (const s of stalled) {
    items.push({
      source: 'stalled_claim',
      reference: String(s.id),
      title: s.scheme_name,
      amount: round2(s.amount),
      claimable_now: true,
      blocker: `Claim has been "${s.status}" since ${new Date(s.application_date).toISOString().slice(0,10)}.`,
      confidence: 'real',
    });
  }

  const total = items.reduce((n, i) => n + (i.claimable_now ? i.amount : 0), 0);
  const blocked = items.reduce((n, i) => n + (i.claimable_now ? 0 : i.amount), 0);

  return {
    farmerId,
    claimable_now_total: round2(total),
    blocked_total: round2(blocked),
    items,
    // Stated plainly: absence of a detection is not proof there is nothing.
    // The detector only sees schemes the platform has data for.
    coverage_note: 'Covers NE organic schemes and started-but-unfinished claims '
      + 'recorded on this platform. It cannot see schemes the farmer is eligible '
      + 'for but has never been enrolled in.',
  };
}

// ===========================================================================
// 3. THE FARMER VALUE INDEX
// ===========================================================================

/**
 * Compute the FVI for one farmer and season.
 *
 * The score is MCDA over four criteria that mirror the AEOS objectives.
 * Confidence comes out of the MCDA layer, derived from each criterion's data
 * provenance — never asserted.
 */
async function computeFVI({ farmerId, season, year, persist = false }) {
  if (!farmerId) throw new Error('farmerId is required');

  const { cost, revenue, yield: y } = await getSeasonLedger(farmerId, season, year);
  const unclaimed = await detectUnclaimedSubsidy(farmerId);

  const totalCost = round2(cost.net_cost);
  const totalRevenue = round2(revenue.net_revenue);
  const netMargin = round2(totalRevenue - totalCost);
  const marginPct = totalRevenue > 0 ? (netMargin / totalRevenue) * 100 : null;

  const harvested = num(y.harvested_kg);
  const lost = num(y.lost_kg);
  const lossPct = harvested + lost > 0 ? (lost / (harvested + lost)) * 100 : 0;

  // Provenance. Yield basis drives it, because yield is the figure most often
  // recalled rather than measured.
  const yieldQuality = BASIS_QUALITY[y.basis] ?? 'assumed';
  const revenueQuality = num(revenue.sale_count) > 0 ? 'real' : 'assumed';
  const costQuality = num(cost.line_count) > 0 ? 'real' : 'assumed';

  const criteria = [
    {
      name: 'Margin',
      weight: 0.40,
      // 30% margin maps to a full score. Above that is capped, not extrapolated.
      score: marginPct === null ? 0 : Math.max(0, Math.min(100, (marginPct / 30) * 100)),
      dataQuality: totalRevenue > 0 && totalCost > 0 ? 'real' : 'assumed',
    },
    {
      name: 'Post-harvest loss avoided',
      weight: 0.20,
      score: Math.max(0, 100 - lossPct * 4),   // 25% loss => 0
      dataQuality: yieldQuality,
    },
    {
      name: 'Cash received vs outstanding',
      weight: 0.20,
      score: num(revenue.gross_revenue) > 0
        ? Math.max(0, 100 - (num(revenue.pending_amount) / num(revenue.gross_revenue)) * 100)
        : 0,
      dataQuality: revenueQuality,
    },
    {
      name: 'Entitlements captured',
      weight: 0.20,
      // Unclaimed money the farmer is owed pulls the score DOWN — the index
      // measures value realised, not value theoretically available.
      score: unclaimed.claimable_now_total > 0
        ? Math.max(0, 100 - Math.min(100, (unclaimed.claimable_now_total / Math.max(totalCost, 1)) * 100))
        : 100,
      dataQuality: 'real',
    },
  ];

  const result = mcda(criteria);

  const breakdown = {
    cost: { net: totalCost, gross: round2(cost.gross_cost), subsidy_received: round2(cost.subsidy_received), lines: num(cost.line_count), quality: costQuality },
    revenue: { net: totalRevenue, gross: round2(revenue.gross_revenue), sales: num(revenue.sale_count), pending: round2(revenue.pending_amount), quality: revenueQuality },
    yield: { harvested_kg: harvested, lost_kg: lost, loss_pct: round2(lossPct), area_ha: num(y.area_ha), basis: y.basis ?? 'none', quality: yieldQuality },
    unclaimed: { claimable_now: unclaimed.claimable_now_total, blocked: unclaimed.blocked_total, items: unclaimed.items.length },
    mcda: result,
  };

  const fvi = {
    farmerId, season: season ?? null, year: year ?? null,
    total_cost: totalCost,
    total_revenue: totalRevenue,
    net_margin: netMargin,
    margin_pct: marginPct === null ? null : round2(marginPct),
    unclaimed_subsidy: unclaimed.claimable_now_total,
    fvi_score: result.total,
    data_confidence: result.confidence,
    confidence_label: result.confidenceLabel,
    most_sensitive_to: result.mostSensitiveTo,
    breakdown,
    // The sentence a farmer should actually be shown.
    statement: buildStatement(netMargin, result, unclaimed, lossPct),
  };

  if (persist && season && year) {
    await pool.query(
      `INSERT INTO farmer_value_index
         (farmer_id, season, year, total_cost, total_revenue,
          unclaimed_subsidy, fvi_score, data_confidence, inputs_breakdown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (farmer_id, season, year) DO UPDATE SET
         total_cost = EXCLUDED.total_cost,
         total_revenue = EXCLUDED.total_revenue,
         unclaimed_subsidy = EXCLUDED.unclaimed_subsidy,
         fvi_score = EXCLUDED.fvi_score,
         data_confidence = EXCLUDED.data_confidence,
         inputs_breakdown = EXCLUDED.inputs_breakdown,
         computed_at = CURRENT_TIMESTAMP`,
      [farmerId, season, year, totalCost, totalRevenue,
        unclaimed.claimable_now_total, result.total, result.confidence,
        JSON.stringify(breakdown)]
    );
  }

  return fvi;
}

/**
 * The plain-language version. A score of 62 tells a farmer nothing; "you are
 * ₹40,000 up, and ₹12,000 you are owed is still unclaimed" tells them what to do.
 *
 * Low-confidence results say so FIRST, before the number, so the caveat is not
 * something the reader has to go looking for.
 */
function buildStatement(netMargin, mcdaResult, unclaimed, lossPct) {
  const parts = [];

  if (mcdaResult.confidence < 60) {
    parts.push(
      `These figures are based mostly on estimated or recalled data `
      + `(confidence ${mcdaResult.confidence}%). Treat them as indicative, not final.`
    );
  }

  parts.push(netMargin >= 0
    ? `Net position this season: ₹${Math.round(netMargin).toLocaleString('en-IN')} ahead.`
    : `Net position this season: ₹${Math.round(Math.abs(netMargin)).toLocaleString('en-IN')} behind.`);

  if (unclaimed.claimable_now_total > 0) {
    parts.push(
      `₹${Math.round(unclaimed.claimable_now_total).toLocaleString('en-IN')} of support `
      + `you are entitled to has not been claimed.`
    );
  }
  if (unclaimed.blocked_total > 0) {
    parts.push(
      `A further ₹${Math.round(unclaimed.blocked_total).toLocaleString('en-IN')} becomes `
      + `claimable once the blockers listed are cleared.`
    );
  }
  if (lossPct > 10) {
    parts.push(`Post-harvest loss is ${Math.round(lossPct)}% — the largest recoverable cost here.`);
  }

  parts.push(`Most sensitive to: ${mcdaResult.mostSensitiveTo}.`);
  return parts.join(' ');
}

// ===========================================================================
// 4. CASH FLOW
// ===========================================================================

async function getCashFlow(farmerId, fromDate, toDate) {
  const { rows } = await pool.query(
    `SELECT flow_date, direction, category, amount, is_actual, confidence
       FROM farmer_cash_flow
      WHERE farmer_id = $1
        AND ($2::date IS NULL OR flow_date >= $2)
        AND ($3::date IS NULL OR flow_date <= $3)
      ORDER BY flow_date ASC`,
    [farmerId, fromDate ?? null, toDate ?? null]
  );

  let running = 0;
  const series = rows.map((r) => {
    running += r.direction === 'inflow' ? num(r.amount) : -num(r.amount);
    return { ...r, amount: round2(r.amount), running_balance: round2(running) };
  });

  // The moment that matters: when does the balance first go negative?
  const firstShortfall = series.find((s) => s.running_balance < 0) ?? null;

  return {
    farmerId,
    series,
    closing_balance: round2(running),
    actual_rows: series.filter((s) => s.is_actual).length,
    projected_rows: series.filter((s) => !s.is_actual).length,
    first_shortfall: firstShortfall
      ? { date: firstShortfall.flow_date, balance: firstShortfall.running_balance }
      : null,
    note: firstShortfall
      ? 'A projected shortfall is not a certainty — check which rows are projections.'
      : null,
  };
}

// ===========================================================================
// ROUTES
// ===========================================================================

router.get('/farmers/:farmerId/value-index', authMiddleware, async (req, res) => {
  try {
    const data = await computeFVI({
      farmerId: req.params.farmerId,
      season: req.query.season,
      year: req.query.year ? Number(req.query.year) : undefined,
    });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'computeFVI'); }
});

router.post('/farmers/:farmerId/value-index/compute', authMiddleware, async (req, res) => {
  try {
    const data = await computeFVI({
      farmerId: req.params.farmerId,
      season: req.body.season,
      year: req.body.year,
      persist: true,
    });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'persistFVI'); }
});

router.get('/farmers/:farmerId/unclaimed-support', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await detectUnclaimedSubsidy(req.params.farmerId) });
  } catch (e) { return fail(res, e, 'detectUnclaimedSubsidy'); }
});

router.get('/farmers/:farmerId/cash-flow', authMiddleware, async (req, res) => {
  try {
    const data = await getCashFlow(req.params.farmerId, req.query.from, req.query.to);
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'getCashFlow'); }
});

router.get('/farmers/:farmerId/ledger', authMiddleware, async (req, res) => {
  try {
    const data = await getSeasonLedger(
      req.params.farmerId, req.query.season, req.query.year ? Number(req.query.year) : undefined
    );
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'getSeasonLedger'); }
});

module.exports = {
  router,
  computeFVI,
  detectUnclaimedSubsidy,
  getSeasonLedger,
  getCashFlow,
  buildStatement,
  BASIS_QUALITY,
  DATA_QUALITY_WEIGHT,
};
