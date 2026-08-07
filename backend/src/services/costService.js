/**
 * Cost break-up.
 *
 * Replaces a 15-line stub that returned `{ components: [], note: 'stub' }`.
 *
 * Two sources, kept distinct:
 *
 *   cost_breakups (052)             per-product, per-region actuals
 *   landed_cost_components (055)    the corridor model from the business plan
 *
 * They answer different questions. The first is what a specific consignment
 * cost; the second is what the corridor is expected to cost. Merging them
 * would let a planning assumption be reported as an observed figure.
 */

'use strict';

const pool = require('../database/pool');

async function getCostBreakup({ productId, regionId, from, to } = {}) {
  const params = [];
  const where = [];
  if (productId) { params.push(Number(productId)); where.push(`product_id = $${params.length}`); }
  if (regionId) { params.push(Number(regionId)); where.push(`region_id = $${params.length}`); }
  if (from) { params.push(from); where.push(`period_start >= $${params.length}`); }
  if (to) { params.push(to); where.push(`period_end <= $${params.length}`); }

  const { rows } = await pool.query(
    `SELECT id, product_id, region_id, period_start, period_end, components, total_cost, created_at
       FROM cost_breakups
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY period_start DESC NULLS LAST
      LIMIT 200`,
    params
  );

  return {
    productId: productId ?? null,
    regionId: regionId ?? null,
    breakups: rows,
    count: rows.length,
    totalCost: rows.reduce((s, r) => s + Number(r.total_cost || 0), 0) || null,
    basis: rows.length ? 'recorded_actuals' : 'none',
    note: rows.length ? null
      : 'No recorded cost break-ups for this filter. Use getCorridorModel() for the '
      + 'planned landed-cost model, but do not present that as an actual.',
  };
}

/**
 * The NE->NCR landed cost model, component by component.
 *
 * Explicitly labelled as a plan. Every row carries data_provenance and the
 * document it came from.
 */
async function getCorridorModel(corridor = 'NE->NCR') {
  const [{ rows: comps }, { rows: totals }] = await Promise.all([
    pool.query(
      `SELECT sequence_no, component, min_inr_per_kg, optimised_inr_per_kg, max_inr_per_kg,
              controllable, subsidy_scheme, notes, data_provenance
         FROM landed_cost_components WHERE corridor = $1 ORDER BY sequence_no`,
      [corridor]
    ),
    pool.query('SELECT * FROM v_landed_cost_total WHERE corridor = $1', [corridor]),
  ]);
  if (!comps.length) throw new Error(`No landed-cost model for corridor: ${corridor}`);

  const t = totals[0] || {};
  const optimisedTotal = Number(t.optimised_total_inr_per_kg || 0);
  return {
    corridor,
    components: comps.map((c) => ({
      ...c,
      pctOfOptimisedTotal: optimisedTotal
        ? Math.round((Number(c.optimised_inr_per_kg) / optimisedTotal) * 10000) / 100
        : null,
    })),
    totals: {
      min: Number(t.min_total_inr_per_kg || 0),
      optimised: optimisedTotal,
      max: Number(t.max_total_inr_per_kg || 0),
    },
    subsidisedComponents: comps.filter((c) => c.subsidy_scheme).map((c) => c.subsidy_scheme),
    caveat: 'PLANNING MODEL, not observed cost. Figures are from a business plan and are '
          + 'flagged estimated/assumed. Compare against getCostBreakup() actuals before '
          + 'quoting either to a buyer or a farmer.',
  };
}

module.exports = { getCostBreakup, getCorridorModel };
