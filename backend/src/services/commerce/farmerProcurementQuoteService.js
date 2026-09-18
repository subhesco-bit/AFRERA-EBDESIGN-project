'use strict';

const pool = require('../../database/pool');

const CATEGORIES = new Set(['household', 'machine', 'seed', 'fertilizer', 'piping', 'drip', 'pump', 'repair', 'second_life']);
const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
const dateOnly = value => value instanceof Date ? value.toISOString().slice(0, 10) : String(value).slice(0, 10);

function positive(value, name) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${name} must be positive`);
  return n;
}

function compareOffers(offers, { quantity, pooledQuantity, destinationState, asOf = new Date().toISOString().slice(0, 10) }) {
  const own = positive(quantity, 'quantity');
  const pooled = pooledQuantity == null ? own : positive(pooledQuantity, 'pooledQuantity');
  if (pooled < own) throw new Error('pooledQuantity cannot be below quantity');
  if (!destinationState) throw new Error('destinationState is required');
  const alternatives = offers.map(offer => {
    const reasons = [];
    const states = offer.served_states || [];
    const start = dateOnly(offer.effective_from);
    const end = offer.effective_to ? dateOnly(offer.effective_to) : null;
    if (offer.status !== 'approved' || !offer.approved_by || !offer.approved_at || !offer.terms_source) reasons.push('unapproved_terms');
    if (!states.includes(destinationState)) reasons.push('destination_unserved');
    if (start > asOf || (end && end < asOf)) reasons.push('terms_not_effective');
    if (Number(offer.minimum_order_quantity) > pooled) reasons.push('minimum_order_unmet');
    if (Number(offer.available_quantity) < pooled) reasons.push('insufficient_supplier_stock');
    const tiers = Array.isArray(offer.bulk_tiers) ? offer.bulk_tiers : [];
    const validTiers = tiers.filter(t => Number.isFinite(Number(t.min_quantity)) && Number(t.min_quantity) <= pooled && Number(t.min_quantity) > 0 && Number(t.price_per_unit) > 0);
    validTiers.sort((a, b) => Number(b.min_quantity) - Number(a.min_quantity));
    const tier = validTiers[0];
    const unitPrice = tier ? Number(tier.price_per_unit) : Number(offer.list_price_per_unit);
    const freight = Number(offer.freight_per_order);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0 || !Number.isFinite(freight) || freight < 0) reasons.push('invalid_price_terms');
    const ownGoods = round(unitPrice * own);
    // A pooled freight allocation is provisional until the club confirms all members and carrier terms.
    const allocatedFreight = round(freight * own / pooled);
    return {
      offer_id: offer.id,
      supplier_id: offer.supplier_id,
      origin_state: offer.origin_state,
      destination_state: destinationState,
      feasible: reasons.length === 0,
      rejection_reasons: reasons,
      own_quantity: own,
      pooled_quantity: pooled,
      selected_tier_min_quantity: tier ? Number(tier.min_quantity) : null,
      supplier_unit_price: round(unitPrice),
      goods_cost: ownGoods,
      freight_allocation: allocatedFreight,
      provisional_landed_cost_excluding_tax: round(ownGoods + allocatedFreight),
      quoted_delivery_days: Number(offer.quoted_delivery_days),
      terms_source: offer.terms_source,
      effective_from: start,
      effective_to: end,
      pricing_basis: 'supplier_quote',
    };
  });
  alternatives.sort((a, b) => Number(b.feasible) - Number(a.feasible) || a.provisional_landed_cost_excluding_tax - b.provisional_landed_cost_excluding_tax || a.quoted_delivery_days - b.quoted_delivery_days);
  return { alternatives, recommendation: alternatives.find(a => a.feasible) || null, tax_status: 'not_calculated', freight_status: pooled > own ? 'provisional_pooled_allocation' : 'supplier_quoted' };
}

async function quoteForActor({ actorId, farmerId, destinationAddressId, category, quantity, pooledQuantity }) {
  if (!actorId || !farmerId || !destinationAddressId) throw new Error('actor, farmer and address are required');
  if (!CATEGORIES.has(category)) throw new Error('unsupported procurement category');
  positive(quantity, 'quantity');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const access = await client.query(
      `SELECT a.state FROM farmers f JOIN addresses a ON a.id=$2 AND a.user_id=$1
       WHERE f.id=$3 AND (f.user_id=$1 OR EXISTS (
         SELECT 1 FROM farmer_household_buyer_links l WHERE l.farmer_id=f.id AND l.member_user_id=$1 AND l.status='verified'))`,
      [actorId, destinationAddressId, farmerId],
    );
    if (!access.rows.length) throw new Error('farmer buying authority or destination address not verified');
    const destinationState = access.rows[0].state;
    const { rows } = await client.query(
      `SELECT * FROM farmer_procurement_offers WHERE category=$1 AND status='approved'
       AND $2=ANY(served_states) AND effective_from<=CURRENT_DATE
       AND (effective_to IS NULL OR effective_to>=CURRENT_DATE)
       ORDER BY list_price_per_unit ASC, id ASC LIMIT 100`,
      [category, destinationState],
    );
    const decision = compareOffers(rows, { quantity, pooledQuantity, destinationState });
    const run = await client.query(
      `INSERT INTO farmer_procurement_quote_runs
       (actor_id,farmer_id,destination_address_id,category,own_quantity,pooled_quantity,alternatives,recommendation,decision_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id,created_at`,
      [actorId, farmerId, destinationAddressId, category, quantity, pooledQuantity || null,
        JSON.stringify(decision.alternatives), decision.recommendation ? JSON.stringify(decision.recommendation) : null,
        decision.recommendation ? 'provisional' : 'no_feasible_offer'],
    );
    await client.query(
      `INSERT INTO farmer_procurement_events (aggregate_type,aggregate_id,event_type,actor_id,payload)
       VALUES ('quote_run',$1,'quote_compared',$2,$3)`,
      [run.rows[0].id, actorId, JSON.stringify({ offer_count: rows.length, category, destination_state: destinationState })],
    );
    await client.query('COMMIT');
    return { quote_run_id: run.rows[0].id, created_at: run.rows[0].created_at, ...decision, order_status: 'not_placed' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function createSupplierOffer(actorId, input) {
  if (!actorId || !CATEGORIES.has(input.category)) throw new Error('supplier and supported category are required');
  if (!input.product_name || !input.unit || !input.terms_source) throw new Error('product, unit and source terms are required');
  positive(input.list_price_per_unit, 'list_price_per_unit');
  positive(input.minimum_order_quantity, 'minimum_order_quantity');
  if (!Number.isFinite(Number(input.available_quantity)) || Number(input.available_quantity) < 0) throw new Error('available_quantity must be nonnegative');
  if (!Number.isFinite(Number(input.freight_per_order)) || Number(input.freight_per_order) < 0) throw new Error('freight_per_order must be nonnegative');
  if (!Number.isInteger(Number(input.quoted_delivery_days)) || Number(input.quoted_delivery_days) < 0) throw new Error('quoted_delivery_days must be nonnegative');
  if (!Array.isArray(input.served_states) || !input.served_states.length) throw new Error('served_states are required');
  const tiers = input.bulk_tiers || [];
  if (!Array.isArray(tiers) || tiers.some(t => !(Number(t.min_quantity) > 0 && Number(t.price_per_unit) > 0))) throw new Error('bulk_tiers must contain positive quantity and price');
  const pg = await pool.connect();
  try {
    await pg.query('BEGIN');
    const stateRows = await pg.query('SELECT name FROM india_jurisdiction_coverage WHERE name=ANY($1::text[])', [[input.origin_state, ...input.served_states]]);
    if (!input.origin_state || stateRows.rows.length !== new Set([input.origin_state, ...input.served_states]).size) throw new Error('unknown origin or served state');
    const sourceAddress = await pg.query('SELECT 1 FROM addresses WHERE user_id=$1 AND state=$2 LIMIT 1', [actorId, input.origin_state]);
    if (!sourceAddress.rows.length) throw new Error('supplier origin address not verified');
    const result = await pg.query(
      `INSERT INTO farmer_procurement_offers
       (catalog_product_id,supplier_id,category,product_name,unit,origin_state,served_states,list_price_per_unit,
        minimum_order_quantity,available_quantity,bulk_tiers,freight_per_order,quoted_delivery_days,terms_source,effective_from,effective_to,status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,'draft') RETURNING id,status,created_at`,
      [input.catalog_product_id || null, actorId, input.category, input.product_name, input.unit, input.origin_state,
        input.served_states, input.list_price_per_unit, input.minimum_order_quantity, input.available_quantity,
        JSON.stringify(tiers), input.freight_per_order, input.quoted_delivery_days, input.terms_source,
        input.effective_from, input.effective_to || null],
    );
    await pg.query(`INSERT INTO farmer_procurement_events (aggregate_type,aggregate_id,event_type,actor_id,payload)
      VALUES ('offer',$1,'supplier_draft_created',$2,$3)`, [result.rows[0].id, actorId, JSON.stringify({ terms_source: input.terms_source })]);
    await pg.query('COMMIT');
    return result.rows[0];
  } catch (error) { await pg.query('ROLLBACK'); throw error; } finally { pg.release(); }
}

async function approveSupplierOffer(approverId, offerId) {
  const pg = await pool.connect();
  try {
    await pg.query('BEGIN');
    const result = await pg.query(
      `UPDATE farmer_procurement_offers SET status='approved',approved_by=$2,approved_at=NOW(),updated_at=NOW()
       WHERE id=$1 AND status='draft' AND supplier_id<>$2 AND effective_from<=CURRENT_DATE
       AND (effective_to IS NULL OR effective_to>=CURRENT_DATE) RETURNING id,status,approved_by,approved_at`,
      [offerId, approverId],
    );
    if (!result.rows.length) throw new Error('offer cannot be approved by this actor or is not currently valid');
    await pg.query(`INSERT INTO farmer_procurement_events (aggregate_type,aggregate_id,event_type,actor_id,payload)
      VALUES ('offer',$1,'terms_approved',$2,'{}'::jsonb)`, [offerId, approverId]);
    await pg.query('COMMIT');
    return result.rows[0];
  } catch (error) { await pg.query('ROLLBACK'); throw error; } finally { pg.release(); }
}

module.exports = { compareOffers, quoteForActor, createSupplierOffer, approveSupplierOffer, CATEGORIES };
