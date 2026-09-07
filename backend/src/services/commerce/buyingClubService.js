/**
 * Buying Club Service — REOS Missing Layer 1.10-1.11 (Group / Community Buying).
 *
 * Backs `buying_clubs` (042_rural_procurement_logistics_mobility_schema.sql),
 * the village/FPO/district/regional aggregation tiers that let households and
 * farms pool demand before ordering (`procurement_orders.buying_club_id` and
 * `procurement_subscriptions.buying_club_id` both link back here). The real
 * work this module does that a bare CRUD scaffold cannot: turn a club's
 * membership and demand volume into an actual discount tier, and roll up
 * savings from the orders placed through it.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Progressive volume-discount schedule. Each band's rate applies only to the
 * slice of monthly demand within that band (marginal, not flat), same
 * mechanic as an income tax slab — a club doesn't lose its lower-band
 * discount by crossing into a higher one.
 */
const DISCOUNT_BANDS = [
  { upTo: 25000, ratePct: 3 },
  { upTo: 100000, ratePct: 6 },
  { upTo: 500000, ratePct: 9 },
  { upTo: Infinity, ratePct: 12 },
];

// club_type carries its own baseline multiplier: a regional club aggregates
// across many village clubs and gets a floor discount even at low absolute
// volume, since it already represents pooled demand upstream.
const CLUB_TYPE_FLOOR_PCT = { village: 0, fpo: 1, district: 2, regional: 3 };

function marginalDiscount(demandValue) {
  let remaining = demandValue;
  let prevCap = 0;
  let discountAmount = 0;
  const breakdown = [];
  for (const band of DISCOUNT_BANDS) {
    if (remaining <= 0) break;
    const bandWidth = band.upTo - prevCap;
    const slice = Math.min(remaining, bandWidth);
    const sliceDiscount = r2(slice * band.ratePct / 100);
    if (slice > 0) breakdown.push({ band: `${prevCap}-${band.upTo === Infinity ? '∞' : band.upTo}`, rate_pct: band.ratePct, slice_value: r2(slice), discount: sliceDiscount });
    discountAmount += sliceDiscount;
    remaining -= slice;
    prevCap = band.upTo;
  }
  return { discountAmount: r2(discountAmount), breakdown };
}

/**
 * Compute the effective discount tier for a club given its current demand
 * plus an optional hypothetical order being considered.
 */
function computeDiscountTier(club, additionalOrderValue = 0) {
  const baseline = Number(club.monthly_demand_value || 0);
  const projected = baseline + Math.max(0, additionalOrderValue);
  const { discountAmount, breakdown } = marginalDiscount(projected);
  const floorPct = CLUB_TYPE_FLOOR_PCT[club.club_type] ?? 0;
  const floorAmount = r2(projected * floorPct / 100);
  const effectiveDiscount = r2(Math.max(discountAmount, floorAmount));
  const effectiveRatePct = projected > 0 ? r2((effectiveDiscount / projected) * 100) : 0;

  return {
    club_id: club.id,
    club_type: club.club_type,
    member_count: club.member_count,
    baseline_monthly_demand: r2(baseline),
    projected_monthly_demand: r2(projected),
    volume_discount_amount: discountAmount,
    club_type_floor_pct: floorPct,
    effective_discount_amount: effectiveDiscount,
    effective_discount_pct: effectiveRatePct,
    breakdown,
    reasoning: {
      note: floorAmount > discountAmount
        ? `${club.club_type} club floor (${floorPct}%) exceeds the marginal volume-band discount at this demand level`
        : 'Marginal volume-band discount exceeds the club-type floor',
      bands_applied: breakdown.length,
    },
  };
}

async function createClub(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { club_name, club_type, village_id, fpo_id, district_id, region_id, location, committee_members } = payload;
  if (!club_name) throw new Error('club_name is required');
  if (!['village', 'fpo', 'district', 'regional'].includes(club_type)) {
    throw new Error("club_type must be one of: village, fpo, district, regional");
  }
  if (!location) throw new Error('location is required');

  const { rows } = await pg.query(
    `INSERT INTO buying_clubs (club_name, club_type, village_id, fpo_id, district_id, region_id, location, committee_members)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
    [club_name, club_type, village_id || null, fpo_id || null, district_id || null, region_id || null,
      JSON.stringify(location), committee_members ? JSON.stringify(committee_members) : null]
  );
  return rows[0];
}

async function listClubs({ club_type, page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const conditions = [];
  const params = [];
  if (club_type) { params.push(club_type); conditions.push(`club_type = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const totalRes = await pg.query(`SELECT COUNT(*) FROM buying_clubs ${where}`, params);
  const { rows } = await pg.query(
    `SELECT * FROM buying_clubs ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { items: rows, pagination: { page, limit, total: parseInt(totalRes.rows[0].count, 10), totalPages: Math.ceil(totalRes.rows[0].count / limit) } };
}

async function getClub(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { rows } = await pg.query('SELECT * FROM buying_clubs WHERE id = $1', [id]);
  return rows[0] || null;
}

async function getDiscountTier(id, additionalOrderValue = 0) {
  const club = await getClub(id);
  if (!club) throw new Error('Buying club not found');
  return computeDiscountTier(club, Number(additionalOrderValue) || 0);
}

/**
 * Refresh a club's rolled-up savings from the procurement orders actually
 * placed through it — real aggregation over `procurement_orders`, not a
 * cached/guessed figure.
 */
async function refreshSavings(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const club = await getClub(id);
  if (!club) throw new Error('Buying club not found');

  const { rows: agg } = await pg.query(
    `SELECT COALESCE(SUM(total_savings), 0) AS total_savings, COUNT(*)::int AS order_count
       FROM procurement_orders WHERE buying_club_id = $1`,
    [id]
  );
  const totalSavings = r2(Number(agg[0].total_savings));
  const activeMembers = Number(club.active_members || club.member_count || 0);
  const avgPerMember = activeMembers > 0 ? r2(totalSavings / activeMembers) : 0;

  const { rows } = await pg.query(
    `UPDATE buying_clubs SET total_savings = $2, average_savings_per_member = $3 WHERE id = $1 RETURNING *`,
    [id, totalSavings, avgPerMember]
  );
  logger.info(`Buying club savings refreshed: ${id}`, { totalSavings, orderCount: agg[0].order_count });
  return { club: rows[0], order_count: agg[0].order_count };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const result = await listClubs({ club_type: req.query.club_type, page: parseInt(req.query.page, 10) || 1, limit: parseInt(req.query.limit, 10) || 20 });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.warn('buyingClubService list failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const club = await getClub(req.params.id);
    if (!club) return res.status(404).json({ success: false, error: 'Not found' });
    res.json({ success: true, data: club });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const club = await createClub(req.body || {});
    res.status(201).json({ success: true, data: club });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/:id/discount-tier', async (req, res) => {
  try {
    const tier = await getDiscountTier(req.params.id, Number(req.query.order_value) || 0);
    res.json({ success: true, data: tier });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/:id/refresh-savings', authMiddleware, async (req, res) => {
  try {
    const result = await refreshSavings(req.params.id);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

function setupRoutes(app) {
  app.use('/api/v1/buying-club', router);
}

module.exports = { router, setupRoutes, computeDiscountTier, createClub, listClubs, getClub, getDiscountTier, refreshSavings };
