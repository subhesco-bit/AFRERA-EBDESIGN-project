'use strict';

const { getPostgreSQL } = require('../database/connection');

const STATUS = new Set(['planned','available','aggregating','listed','allocated','sold','cancelled']);
const LINK_TYPES = new Set(['aggregation','listing','buyer_allocation','logistics','settlement']);

function db() {
  const pool = getPostgreSQL();
  if (!pool) throw new Error('PostgreSQL is not initialized');
  return pool;
}

function positive(value, field) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`${field} must be greater than zero`);
  return n;
}

async function createLot(input, client = null) {
  if (!input.farmerId) throw new Error('farmerId is required');
  if (!input.productName) throw new Error('productName is required');
  const quantity = positive(input.quantity, 'quantity');
  if (input.status && !STATUS.has(input.status)) throw new Error('Invalid lot status');

  const executor = client || db();
  const result = await executor.query(
    `INSERT INTO production_supply_lots
      (farmer_id, land_record_id, crop_plan_id, harvest_plan_id, fpo_id,
       product_name, variety, harvest_date, quantity, unit, quality_grade,
       traceability, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12::jsonb,$13)
     RETURNING *`,
    [
      input.farmerId,
      input.landRecordId || null,
      input.cropPlanId || null,
      input.harvestPlanId || null,
      input.fpoId || null,
      input.productName,
      input.variety || null,
      input.harvestDate || null,
      quantity,
      input.unit || 'kg',
      input.qualityGrade || null,
      JSON.stringify(input.traceability || {}),
      input.status || 'available',
    ]
  );
  return result.rows[0];
}

async function getLot(id, client = null) {
  const result = await (client || db()).query(
    `SELECT * FROM production_supply_lots WHERE id = $1`, [id]
  );
  return result.rows[0] || null;
}

async function listLots({ farmerId, fpoId, status, limit = 50, offset = 0 } = {}, client = null) {
  if (status && !STATUS.has(status)) throw new Error('Invalid lot status');
  const result = await (client || db()).query(
    `SELECT * FROM production_supply_lots
     WHERE ($1::uuid IS NULL OR farmer_id = $1)
       AND ($2::uuid IS NULL OR fpo_id = $2)
       AND ($3::varchar IS NULL OR status = $3)
     ORDER BY created_at DESC LIMIT $4 OFFSET $5`,
    [farmerId || null, fpoId || null, status || null,
      Math.min(Math.max(Number(limit) || 50, 1), 200), Math.max(Number(offset) || 0, 0)]
  );
  return result.rows;
}

async function linkLot({ lotId, linkedQuantity, linkType, aggregationEntityId = null,
  marketplaceEntityId = null, buyerEntityId = null, logisticsEntityId = null, metadata = {} }, client = null) {
  if (!lotId) throw new Error('lotId is required');
  if (!LINK_TYPES.has(linkType)) throw new Error('Invalid link type');
  const quantity = positive(linkedQuantity, 'linkedQuantity');
  const executor = client || db();
  const result = await executor.query(
    `INSERT INTO production_supply_links
      (lot_id, aggregation_entity_id, marketplace_entity_id, buyer_entity_id,
       logistics_entity_id, linked_quantity, link_type, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
     RETURNING *`,
    [lotId, aggregationEntityId, marketplaceEntityId, buyerEntityId,
      logisticsEntityId, quantity, linkType, JSON.stringify(metadata)]
  );
  return result.rows[0];
}

async function createMarketplaceListing({ lotId, quantity, listingPayload = {} }) {
  return withTransaction(async (client) => {
    const lot = await getLot(lotId, client);
    if (!lot) throw new Error('Production lot not found');
    if (!['available','aggregating'].includes(lot.status)) {
      throw new Error(`Lot cannot be listed from status ${lot.status}`);
    }
    const listing = await createEntity('marketplace_listing', {
      lotId,
      productName: lot.product_name,
      quantity: quantity || lot.quantity,
      unit: lot.unit,
      qualityGrade: lot.quality_grade,
      ...listingPayload,
    }, client);
    await linkLot({
      lotId,
      linkedQuantity: quantity || lot.quantity,
      linkType: 'listing',
      marketplaceEntityId: listing.id,
      metadata: { source: 'production_supply_bridge' },
    }, client);
    await client.query(`UPDATE production_supply_lots SET status = 'listed', updated_at = NOW() WHERE id = $1`, [lotId]);
    return { lot: await getLot(lotId, client), listing };
  });
}

async function createEntity(moduleKey, payload, client) {
  const result = await client.query(
    `INSERT INTO operational_module_entities (module_key, payload)
     VALUES ($1,$2::jsonb) RETURNING *`,
    [moduleKey, JSON.stringify(payload)]
  );
  return result.rows[0];
}

async function withTransaction(work) {
  const pool = db();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await work(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { createLot, getLot, listLots, linkLot, createMarketplaceListing, withTransaction };
