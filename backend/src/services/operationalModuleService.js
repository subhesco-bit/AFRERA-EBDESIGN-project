'use strict';

const db = require('../database');

const ALLOWED_MODULES = new Set([
  'supply_chain','supplier_management','logistics','procurement','inventory','quality_control',
  'warehouse','cold_chain','returns','sustainability','fleet','driver','route_optimization',
  'delivery','last_mile','visibility','proof_of_delivery','logistics_exception','carrier',
  'operational_analytics','soil_health','crop_disease','pest_management','fertilizer_management',
  'yield_prediction','weather','crop_insurance','agri_finance','input_supply','livestock_health',
  'dairy','poultry','fishery','apiary','organic_certification','land_records','water_rights',
  'carbon_credits','training','market_intelligence','price_forecast','supply_visibility',
  'blockchain_traceability','climate_risk','cooperative','credit','government_schemes',
  'equipment_rental','agri_tourism','rural_employment','education','community',
  'sustainability_goals','health_safety','water_management','soil_conservation','biodiversity',
  'renewable_energy','waste_management','social_impact','gender_empowerment','youth_engagement',
  'mentorship','rural_finance','microfinance','insurance','pensions','savings','investments',
  'erp_integration','advanced_analytics','business_intelligence','compliance'
]);

function assertModule(moduleKey) {
  if (!ALLOWED_MODULES.has(moduleKey)) throw new Error(`Unsupported operational module: ${moduleKey}`);
}

async function createEntity({ moduleKey, ownerUserId = null, status = 'active', payload = {}, client = db }) {
  assertModule(moduleKey);
  const result = await client.query(
    `INSERT INTO operational_module_entities (module_key, owner_user_id, status, payload)
     VALUES ($1, $2, $3, $4::jsonb)
     RETURNING *`,
    [moduleKey, ownerUserId, status, JSON.stringify(payload)]
  );
  return result.rows[0];
}

async function getEntity(id, client = db) {
  const result = await client.query(
    `SELECT * FROM operational_module_entities WHERE id = $1 AND deleted_at IS NULL`, [id]
  );
  return result.rows[0] || null;
}

async function listEntities({ moduleKey, status, ownerUserId, limit = 100, offset = 0 }, client = db) {
  if (moduleKey) assertModule(moduleKey);
  const result = await client.query(
    `SELECT * FROM operational_module_entities
     WHERE deleted_at IS NULL
       AND ($1::varchar IS NULL OR module_key = $1)
       AND ($2::varchar IS NULL OR status = $2)
       AND ($3::uuid IS NULL OR owner_user_id = $3)
     ORDER BY created_at DESC
     LIMIT $4 OFFSET $5`,
    [moduleKey || null, status || null, ownerUserId || null, Math.min(Number(limit) || 100, 500), Math.max(Number(offset) || 0, 0)]
  );
  return result.rows;
}

async function updateEntity(id, { status, payload }, client = db) {
  if (status === undefined && payload === undefined) throw new Error('At least one update field is required');
  const result = await client.query(
    `UPDATE operational_module_entities
     SET status = COALESCE($2, status),
         payload = CASE WHEN $3::jsonb IS NULL THEN payload ELSE $3::jsonb END,
         updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING *`,
    [id, status ?? null, payload === undefined ? null : JSON.stringify(payload)]
  );
  return result.rows[0] || null;
}

async function softDeleteEntity(id, client = db) {
  const result = await client.query(
    `UPDATE operational_module_entities SET deleted_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND deleted_at IS NULL RETURNING id`, [id]
  );
  return result.rowCount === 1;
}

async function withTransaction(work) {
  const client = await db.connect();
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

module.exports = {
  ALLOWED_MODULES: Object.freeze([...ALLOWED_MODULES]),
  createEntity,
  getEntity,
  listEntities,
  updateEntity,
  softDeleteEntity,
  withTransaction,
};
