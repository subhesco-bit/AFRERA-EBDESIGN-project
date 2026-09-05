/**
 * v42 Intelligence Service — capabilities recovered from afrera_platform_v42.html.
 *
 * Backs migration 992. Four capabilities the platform did not have:
 *
 *   1. Multilingual crop resolution — "mirchi", "jolokia", "ghost pepper" and
 *      "King Chilli" all resolve to one concept. Without this, a farmer and a
 *      buyer searching for the same thing in different languages never meet.
 *   2. Freight quoting across 7 modes on 4 measured NE->NCR corridors.
 *   3. Full-truck slot booking that HONOURS the FPO capacity reservation.
 *   4. Promotion validation, including the GI-only restriction.
 */

const express = require('express');
const { getPostgreSQL } = require('../../../database/connection');
const { authMiddleware } = require('../../../middleware/auth');
const { adminMiddleware } = require('../../../middleware/admin');
const { logger } = require('../../../utils/logger');

const router = express.Router();

function fail(res, error, context) {
  logger.error(`v42Intelligence:${context}`, { message: error.message });
  return res.status(500).json({ success: false, error: error.message });
}

// ===========================================================================
// 1. MULTILINGUAL CROP RESOLUTION
// ===========================================================================

/**
 * Resolve a free-text query to crop concepts across every indexed language.
 *
 * Match strategy, strongest first — and the strength is REPORTED, not hidden,
 * so the caller can decide whether a fuzzy hit is good enough to act on:
 *   exact   the query is precisely an indexed term
 *   prefix  the query starts an indexed term ("jolo" -> "jolokia")
 *   partial the query appears inside a term
 *
 * @param {string} query      raw user input, any script or language
 * @param {number} limit      max concepts to return
 */
async function resolveCrop(query, limit = 10) {
  const q = String(query || '').trim().toLowerCase();
  if (q.length < 2) return { query, matches: [], note: 'Query too short to resolve.' };

  const db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT c.concept_key, c.label, c.scientific_name,
            t.lang, t.term,
            CASE WHEN t.term_norm = $1 THEN 'exact'
                 WHEN t.term_norm LIKE $1 || '%' THEN 'prefix'
                 ELSE 'partial' END AS match_type
       FROM crop_concept_terms t
       JOIN crop_concepts c ON c.concept_key = t.concept_key
      WHERE t.term_norm = $1
         OR t.term_norm LIKE $1 || '%'
         OR t.term_norm LIKE '%' || $1 || '%'
      ORDER BY CASE WHEN t.term_norm = $1 THEN 1
                    WHEN t.term_norm LIKE $1 || '%' THEN 2
                    ELSE 3 END,
               length(t.term)
      LIMIT 200`,
    [q]
  );

  // Collapse to one entry per concept, keeping the strongest match and every
  // term that matched — showing WHICH word matched is what makes the result
  // trustworthy to someone searching in their own language.
  const byConcept = new Map();
  for (const r of rows) {
    if (!byConcept.has(r.concept_key)) {
      byConcept.set(r.concept_key, {
        conceptKey: r.concept_key,
        label: r.label,
        scientificName: r.scientific_name,
        matchType: r.match_type,
        matchedVia: []
      });
    }
    const e = byConcept.get(r.concept_key);
    if (e.matchedVia.length < 5) e.matchedVia.push({ lang: r.lang, term: r.term });
  }

  return { query, matches: [...byConcept.values()].slice(0, limit) };
}

/** Every term the platform knows for one concept — used to expand a search. */
async function getConceptTerms(conceptKey) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    `SELECT c.label, c.scientific_name, t.lang, t.term
       FROM crop_concepts c
       LEFT JOIN crop_concept_terms t ON t.concept_key = c.concept_key
      WHERE c.concept_key = $1
      ORDER BY t.lang, t.term`,
    [conceptKey]
  );
  if (rows.length === 0) throw new Error(`Unknown crop concept "${conceptKey}"`);

  const byLang = {};
  rows.forEach((r) => {
    if (!r.term) return;
    (byLang[r.lang] = byLang[r.lang] || []).push(r.term);
  });
  return {
    conceptKey,
    label: rows[0].label,
    scientificName: rows[0].scientific_name,
    termsByLanguage: byLang,
    totalTerms: rows.filter((r) => r.term).length
  };
}

// ===========================================================================
// 2. FREIGHT QUOTING
// ===========================================================================

/**
 * Quote every viable mode on a lane, cheapest first.
 *
 * Cost model: rate_per_kg_factor scales with distance; speed_factor is
 * relative transit speed. Both are relative indices from v42, NOT rupee
 * tariffs — so the response says so explicitly. Presenting an index as a
 * price is how a farmer ends up budgeting against a number that was never
 * money.
 */
async function quoteFreight({ laneCode, weightKg, perishable }) {
  const w = Number(weightKg);
  if (!Number.isFinite(w) || w <= 0) throw new Error('weightKg must be a positive number');

  let db = getPostgreSQL();
  const { rows: lanes } = await db.query(
    'SELECT * FROM freight_lanes WHERE lane_code = $1 AND is_active = TRUE', [laneCode]
  );
  if (lanes.length === 0) throw new Error(`Unknown or inactive lane "${laneCode}"`);
  const lane = lanes[0];

  const { rows: modes } = await db.query(
    `SELECT * FROM transport_modes WHERE is_active = TRUE AND mode_code = ANY($1)`,
    [lane.modes]
  );

  const quotes = modes.map((m) => {
    const rate = Number(m.rate_per_kg_factor);
    const speed = Number(m.speed_factor);
    // Index scales with distance in 1000-km units so the numbers stay readable.
    const costIndex = Number((rate * w * (lane.distance_km / 1000)).toFixed(2));
    // Higher speed_factor = faster. Guarded against divide-by-zero by the
    // CHECK constraint on the column (speed_factor > 0).
    const transitDays = Number((lane.distance_km / (500 * speed)).toFixed(1));
    return {
      mode: m.mode_code,
      name: m.name,
      useCase: m.use_case,
      costIndex,
      estimatedTransitDays: transitDays,
      // Perishables cannot sit on a slow mode however cheap it is.
      suitableForPerishable: speed >= 1.0
    };
  });

  const viable = perishable ? quotes.filter((q) => q.suitableForPerishable) : quotes;
  viable.sort((a, b) => a.costIndex - b.costIndex);

  const excluded = perishable ? quotes.filter((q) => !q.suitableForPerishable).map((q) => q.mode) : [];

  return {
    lane: {
      code: lane.lane_code, origin: lane.origin,
      destination: lane.destination, distanceKm: lane.distance_km
    },
    weightKg: w,
    quotes: viable,
    cheapest: viable[0] || null,
    fastest: [...viable].sort((a, b) => a.estimatedTransitDays - b.estimatedTransitDays)[0] || null,
    excludedForPerishability: excluded,
    basis: 'costIndex is a relative comparison index recovered from v42 rate factors, not a rupee tariff. Use it to rank modes, not to quote a customer.'
  };
}

// ===========================================================================
// 3. FREIGHT SLOT BOOKING — with the FPO reservation honoured
// ===========================================================================

/**
 * Book space on a full-truck slot.
 *
 * The rule that matters: an FPO books against the reserved pool first and may
 * overflow into general space; a general shipper may NEVER take reserved FPO
 * space until the slot is released. That asymmetry is the reservation. Without
 * it the reservation is decorative, because larger traders book faster.
 *
 * Runs as a single conditional UPDATE so two concurrent bookings cannot both
 * observe the same free capacity and both succeed.
 */
async function bookFreightSlot({ slotCode, weightKg, isFpo, bookedBy }) {
  let w = Number(weightKg);
  if (!Number.isFinite(w) || w <= 0) throw new Error('weightKg must be a positive number');

  let db = getPostgreSQL();
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(
      'SELECT * FROM freight_slots WHERE slot_code = $1 FOR UPDATE', [slotCode]
    );
    if (rows.length === 0) throw new Error(`Slot ${slotCode} not found`);
    const s = rows[0];
    if (!['open', 'closing'].includes(s.status)) {
      throw new Error(`Slot ${slotCode} is ${s.status} and cannot accept bookings`);
    }

    const fpoFree = s.fpo_capacity_kg - s.fpo_used_kg;
    const genFree = s.general_capacity_kg - s.general_used_kg;

    let fpoTake = 0;
    let genTake = 0;

    if (isFpo) {
      fpoTake = Math.min(w, fpoFree);
      genTake = w - fpoTake;
      if (genTake > genFree) {
        throw new Error(
          `Slot ${slotCode} has ${fpoFree} kg reserved + ${genFree} kg general free; ${w} kg requested`
        );
      }
    } else {
      // General shippers see reserved space only once it is released.
      const availableToGeneral = s.released ? genFree + fpoFree : genFree;
      if (w > availableToGeneral) {
        throw new Error(
          s.released
            ? `Slot ${slotCode} has ${availableToGeneral} kg free; ${w} kg requested`
            : `Slot ${slotCode} has ${genFree} kg in the general pool; ${w} kg requested. ` +
              `A further ${fpoFree} kg is reserved for FPOs and is not yet released.`
        );
      }
      genTake = Math.min(w, genFree);
      fpoTake = w - genTake; // only reachable when released
    }

    await client.query(
      `UPDATE freight_slots
          SET fpo_used_kg = fpo_used_kg + $2,
              general_used_kg = general_used_kg + $3
        WHERE slot_code = $1`,
      [slotCode, fpoTake, genTake]
    );
    await client.query('COMMIT');

    logger.info('freight slot booked', { slotCode, weightKg: w, isFpo: Boolean(isFpo), bookedBy });
    return {
      slotCode,
      bookedKg: w,
      fromFpoReservation: fpoTake,
      fromGeneralPool: genTake,
      remainingFpoKg: fpoFree - fpoTake,
      remainingGeneralKg: genFree - genTake
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function listSlotAvailability(laneCode) {
  let db = getPostgreSQL();
  const params = [];
  let where = '';
  if (laneCode) { params.push(laneCode); where = 'WHERE lane_code = $1'; }
  const { rows } = await db.query(
    `SELECT * FROM v_freight_slot_availability ${where} ORDER BY departure_at ASC NULLS LAST`, params
  );
  return rows;
}

// ===========================================================================
// 4. PROMOTIONS
// ===========================================================================

/**
 * Validate a promo code against an order. Returns why it does not apply
 * rather than a bare false — a customer told "invalid code" when they were
 * ₹40 short of the minimum will simply abandon the order.
 */
async function validatePromo({ code, orderValue, hasGiItems }) {
  let db = getPostgreSQL();
  const { rows } = await db.query(
    'SELECT * FROM promo_codes WHERE upper(code) = upper($1) AND is_active = TRUE', [code]
  );
  if (rows.length === 0) return { valid: false, reason: 'No such promotion code.' };
  const p = rows[0];

  const value = Number(orderValue) || 0;
  const today = new Date();

  if (p.valid_from && new Date(p.valid_from) > today) {
    return { valid: false, reason: 'This promotion has not started yet.' };
  }
  if (p.valid_to && new Date(p.valid_to) < today) {
    return { valid: false, reason: 'This promotion has expired.' };
  }
  if (p.max_uses != null && p.times_used >= p.max_uses) {
    return { valid: false, reason: 'This promotion has reached its usage limit.' };
  }
  if (value < Number(p.min_order_value)) {
    const short = Number(p.min_order_value) - value;
    return {
      valid: false,
      reason: `Minimum order value is ₹${p.min_order_value}. Add ₹${short.toFixed(2)} to qualify.`,
      shortfall: short
    };
  }
  if (p.gi_only && !hasGiItems) {
    return { valid: false, reason: 'This promotion applies only to GI-registered products.' };
  }

  const discount = p.discount_type === 'pct'
    ? Number((value * Number(p.value)).toFixed(2))
    : Number(p.value);

  // A flat discount must never exceed the order itself.
  const applied = Math.min(discount, value);

  return {
    valid: true,
    code: p.code,
    label: p.label,
    discountType: p.discount_type,
    discount: applied,
    payable: Number((value - applied).toFixed(2))
  };
}

// ===========================================================================
// 5. HANDLING ENGINE RULES
// ===========================================================================

async function getEngineRules(engineCode) {
  let db = getPostgreSQL();
  let params = [];
  let where = '';
  if (engineCode) { params.push(engineCode); where = 'WHERE e.engine_code = $1'; }
  const { rows } = await db.query(
    `SELECT e.engine_code, e.name, r.rule_order, r.rule_text
       FROM handling_engines e
       LEFT JOIN handling_engine_rules r ON r.engine_code = e.engine_code
       ${where}
      ORDER BY e.engine_code, r.rule_order`,
    params
  );
  const out = {};
  rows.forEach((r) => {
    out[r.engine_code] = out[r.engine_code] || { name: r.name, rules: [] };
    if (r.rule_text) out[r.engine_code].rules.push(r.rule_text);
  });
  return out;
}

// ===========================================================================
// ROUTES
// ===========================================================================

// Crop resolution is deliberately public: search must work before login, and
// a farmer should not have to register to discover the platform knows their word.
router.get('/crops/resolve', async (req, res) => {
  try {
    res.json({ success: true, data: await resolveCrop(req.query.q, Number(req.query.limit) || 10) });
  } catch (e) { return fail(res, e, 'resolveCrop'); }
});

router.get('/crops/:conceptKey/terms', async (req, res) => {
  try {
    res.json({ success: true, data: await getConceptTerms(req.params.conceptKey) });
  } catch (e) { return fail(res, e, 'getConceptTerms'); }
});

router.get('/freight/quote', async (req, res) => {
  try {
    const data = await quoteFreight({
      laneCode: req.query.lane,
      weightKg: req.query.weightKg,
      perishable: req.query.perishable === 'true'
    });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'quoteFreight'); }
});

router.get('/freight/slots', async (req, res) => {
  try {
    res.json({ success: true, data: await listSlotAvailability(req.query.lane) });
  } catch (e) { return fail(res, e, 'listSlotAvailability'); }
});

router.post('/freight/slots/:slotCode/book', authMiddleware, async (req, res) => {
  try {
    let data = await bookFreightSlot({
      slotCode: req.params.slotCode, ...req.body, bookedBy: req.user?.id
    });
    res.json({ success: true, data });
  } catch (e) { return fail(res, e, 'bookFreightSlot'); }
});

router.post('/promos/validate', async (req, res) => {
  try {
    res.json({ success: true, data: await validatePromo(req.body) });
  } catch (e) { return fail(res, e, 'validatePromo'); }
});

router.get('/engines', async (req, res) => {
  try {
    res.json({ success: true, data: await getEngineRules(req.query.engine) });
  } catch (e) { return fail(res, e, 'getEngineRules'); }
});

router.get('/organic-inputs', async (req, res) => {
  try {
    let db = getPostgreSQL();
    const { rows } = await db.query('SELECT * FROM organic_input_rates ORDER BY input_name');
    res.json({ success: true, data: rows });
  } catch (e) { return fail(res, e, 'organicInputs'); }
});

router.get('/insurance-plans', async (req, res) => {
  try {
    let db = getPostgreSQL();
    const { rows } = await db.query(
      'SELECT * FROM insurance_plan_catalog WHERE is_active = TRUE ORDER BY plan_name'
    );
    res.json({ success: true, data: rows });
  } catch (e) { return fail(res, e, 'insurancePlans'); }
});

router.get('/accessibility-modes', async (req, res) => {
  try {
    let db = getPostgreSQL();
    const { rows } = await db.query('SELECT * FROM accessibility_modes ORDER BY mode_code');
    res.json({ success: true, data: rows });
  } catch (e) { return fail(res, e, 'accessibilityModes'); }
});

router.post('/freight/slots/:slotCode/release', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let db = getPostgreSQL();
    const { rows } = await db.query(
      'UPDATE freight_slots SET released = TRUE WHERE slot_code = $1 RETURNING *',
      [req.params.slotCode]
    );
    if (rows.length === 0) throw new Error(`Slot ${req.params.slotCode} not found`);
    res.json({ success: true, data: rows[0] });
  } catch (e) { return fail(res, e, 'releaseSlot'); }
});

module.exports = {
  router,
  resolveCrop,
  getConceptTerms,
  quoteFreight,
  bookFreightSlot,
  listSlotAvailability,
  validatePromo,
  getEngineRules
};

