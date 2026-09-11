/**
 * M041 — Village Registry Service
 *
 * Canonical implementation for village registration, search, updates,
 * community resources and village analytics. Uses the existing `villages`
 * and `village_resources` tables; no in-memory business state is used.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

function normalizeVillageId(value) {
  const id = String(value ?? '').trim();
  if (!id || !/^\d+$/.test(id)) throw new ValidationError('Valid village id is required');
  return Number(id);
}

function normalizePayload(data = {}) {
  const payload = { ...data };
  for (const field of ['population', 'households', 'area_sq_km', 'elevation', 'agricultural_land_area', 'ai_development_index', 'avg_income', 'literacy_rate', 'irrigation_coverage', 'electrified_households', 'market_distance_km', 'financial_institutions_count', 'schools_count', 'health_centers_count', 'cooperative_societies_count']) {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') payload[field] = Number(payload[field]);
  }
  for (const field of ['water_sources', 'infrastructure', 'major_crops', 'livestock_count']) {
    if (typeof payload[field] === 'string') payload[field] = JSON.parse(payload[field]);
  }
  return payload;
}

function validateVillage(payload, partial = false) {
  const errors = {};
  if (!partial && !String(payload.name || '').trim()) errors.name = 'Village name is required';
  if (!partial && !String(payload.district || '').trim()) errors.district = 'District is required';
  if (!partial && !String(payload.state || '').trim()) errors.state = 'State is required';
  for (const field of ['population', 'households', 'area_sq_km', 'elevation', 'agricultural_land_area', 'avg_income', 'market_distance_km', 'financial_institutions_count', 'schools_count', 'health_centers_count', 'cooperative_societies_count']) {
    if (payload[field] !== undefined && payload[field] !== null && (!Number.isFinite(payload[field]) || payload[field] < 0)) errors[field] = `${field} must be a non-negative number`;
  }
  for (const field of ['ai_development_index', 'literacy_rate', 'irrigation_coverage']) {
    if (payload[field] !== undefined && payload[field] !== null && (!Number.isFinite(payload[field]) || payload[field] < 0 || payload[field] > 100)) errors[field] = `${field} must be between 0 and 100`;
  }
  if (payload.electrified_households !== undefined && payload.electrified_households !== null && (!Number.isInteger(payload.electrified_households) || payload.electrified_households < 0)) errors.electrified_households = 'electrified_households must be a non-negative integer';
  if (payload.status !== undefined && !['active', 'inactive', 'archived'].includes(payload.status)) errors.status = 'Invalid village status';
  if (payload.pincode !== undefined && payload.pincode !== null && payload.pincode !== '' && !/^\d{4,10}$/.test(String(payload.pincode))) errors.pincode = 'Invalid pincode';
  if (Object.keys(errors).length) throw new ValidationError('Village validation failed', errors);
}

function calculateDevelopmentIndex(village, resources) {
  const infrastructure = village.infrastructure || {};
  const infrastructureKeys = ['roads', 'electricity', 'water_supply', 'healthcare', 'education', 'internet'];
  const infrastructureScore = (infrastructureKeys.filter((key) => Boolean(infrastructure[key])).length / infrastructureKeys.length) * 40;
  const resourceScore = Math.min(resources.length * 5, 20);
  const householdScore = village.households > 0 && village.population > 0 ? Math.min((village.population / village.households) * 3, 15) : 0;
  const agricultureScore = village.agricultural_land_area > 0 ? 15 : 0;
  const serviceScore = Math.min(Number(village.schools_count || 0) * 1.5 + Number(village.health_centers_count || 0) * 2 + Number(village.financial_institutions_count || 0), 10);
  return Math.round(Math.min(infrastructureScore + resourceScore + householdScore + agricultureScore + serviceScore, 100) * 100) / 100;
}

async function getVillageProfile(villageId) {
  const id = normalizeVillageId(villageId);
  const { rows } = await pool.query('SELECT * FROM villages WHERE id = $1', [id]);
  if (!rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return rows[0];
}

async function getVillages(filters = {}) {
  const { search, district, state, block, status = 'active', page = 1, limit = 50 } = filters;
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
  const params = [];
  const conditions = [];
  if (status && status !== 'all') { params.push(status); conditions.push(`status = $${params.length}`); }
  if (district) { params.push(district); conditions.push(`district ILIKE $${params.length}`); }
  if (state) { params.push(state); conditions.push(`state ILIKE $${params.length}`); }
  if (block) { params.push(block); conditions.push(`block ILIKE $${params.length}`); }
  if (search) { params.push(`%${search}%`); conditions.push(`(name ILIKE $${params.length} OR district ILIKE $${params.length} OR state ILIKE $${params.length} OR block ILIKE $${params.length} OR village_code ILIKE $${params.length})`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM villages ${where}`, params);
  const offset = (safePage - 1) * safeLimit;
  const dataParams = [...params, safeLimit, offset];
  const data = await pool.query(`SELECT * FROM villages ${where} ORDER BY name ASC LIMIT $${dataParams.length - 1} OFFSET $${dataParams.length}`, dataParams);
  return { data: data.rows, pagination: { page: safePage, limit: safeLimit, total: count.rows[0].total, pages: Math.ceil(count.rows[0].total / safeLimit) } };
}

async function createVillage(data) {
  const payload = normalizePayload(data);
  validateVillage(payload);
  const result = await pool.query(
    `INSERT INTO villages
      (name, village_code, district, state, block, tehsil, gram_panchayat, pincode, population, households,
       coordinates, demographics, area_sq_km, elevation, climate_zone, soil_type, water_sources, infrastructure,
       agricultural_land_area, major_crops, livestock_count, ai_development_index, notes, avg_income, literacy_rate,
       irrigation_coverage, electrified_households, road_access, market_distance_km, financial_institutions_count,
       schools_count, health_centers_count, cooperative_societies_count, status)
     VALUES ($1, COALESCE(NULLIF($2, ''), CONCAT('VIL-', (SELECT COALESCE(MAX(id),0)+1 FROM villages))), $3, $4, $5, $6, $7, $8,
       $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, COALESCE($34, 'active'))
     RETURNING *`,
    [payload.name.trim(), payload.village_code || null, payload.district.trim(), payload.state.trim(), payload.block || null, payload.tehsil || null,
      payload.gram_panchayat || null, payload.pincode || null, payload.population ?? null, payload.households ?? null, payload.coordinates || null,
      payload.demographics || null, payload.area_sq_km ?? null, payload.elevation ?? null, payload.climate_zone || null, payload.soil_type || null,
      payload.water_sources || [], payload.infrastructure || {}, payload.agricultural_land_area ?? null, payload.major_crops || [], payload.livestock_count || {},
      payload.ai_development_index ?? null, payload.notes || null, payload.avg_income ?? null, payload.literacy_rate ?? null, payload.irrigation_coverage ?? null,
      payload.electrified_households ?? null, payload.road_access ?? null, payload.market_distance_km ?? null, payload.financial_institutions_count ?? 0,
      payload.schools_count ?? 0, payload.health_centers_count ?? 0, payload.cooperative_societies_count ?? 0, payload.status],
  );
  logger.info(`Village created: ${result.rows[0].id}`);
  return result.rows[0];
}

async function updateVillage(villageId, data) {
  const id = normalizeVillageId(villageId);
  const payload = normalizePayload(data);
  validateVillage(payload, true);
  const fields = ['name','village_code','district','state','block','tehsil','gram_panchayat','pincode','population','households','coordinates','demographics','area_sq_km','elevation','climate_zone','soil_type','water_sources','infrastructure','agricultural_land_area','major_crops','livestock_count','ai_development_index','notes','avg_income','literacy_rate','irrigation_coverage','electrified_households','road_access','market_distance_km','financial_institutions_count','schools_count','health_centers_count','cooperative_societies_count','status'];
  const entries = Object.entries(payload).filter(([key, value]) => fields.includes(key) && value !== undefined);
  if (!entries.length) throw new ValidationError('No updatable village fields supplied');
  const values = entries.map(([, value]) => value);
  const setClause = entries.map(([key], index) => `${key} = $${index + 1}`).join(', ');
  values.push(id);
  const result = await pool.query(`UPDATE villages SET ${setClause}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`, values);
  if (!result.rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return result.rows[0];
}

async function deleteVillage(villageId) {
  const id = normalizeVillageId(villageId);
  const result = await pool.query(`UPDATE villages SET status = 'archived', updated_at = NOW() WHERE id = $1 RETURNING *`, [id]);
  if (!result.rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return result.rows[0];
}

async function addVillageResource(villageId, resourceData) {
  const village = await getVillageProfile(villageId);
  const data = resourceData || {};
  if (!String(data.resource_type || '').trim() || !String(data.resource_name || '').trim()) throw new ValidationError('resource_type and resource_name are required');
  const resourceId = `RES-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const result = await pool.query(
    `INSERT INTO village_resources (resource_id, village_id, resource_type, resource_name, capacity, current_utilization, condition, last_maintenance_date, next_maintenance_date, responsible_person)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [resourceId, String(village.id), data.resource_type, data.resource_name, data.capacity ?? null, data.current_utilization ?? null, data.condition || null, data.last_maintenance_date || null, data.next_maintenance_date || null, data.responsible_person || null],
  );
  return result.rows[0];
}

async function getVillageAnalytics(villageId) {
  const village = await getVillageProfile(villageId);
  const resources = await pool.query('SELECT * FROM village_resources WHERE village_id = $1 ORDER BY resource_type, resource_name', [String(village.id)]);
  const rows = resources.rows;
  const byType = {};
  rows.forEach((r) => { const key = r.resource_type || 'other'; byType[key] = (byType[key] || 0) + 1; });
  const averageUtilization = rows.length ? rows.reduce((sum, r) => sum + Number(r.current_utilization || 0), 0) / rows.length : 0;
  const developmentIndex = village.ai_development_index ?? calculateDevelopmentIndex(village, rows);
  return {
    village_id: village.id,
    village: { ...village, computed_development_index: developmentIndex },
    resource_summary: { total_resources: rows.length, by_type: byType, average_utilization: Math.round(averageUtilization * 100) / 100, needs_maintenance: rows.filter((r) => r.condition === 'poor').length, well_maintained: rows.filter((r) => r.condition === 'good').length },
    development_metrics: { development_index: developmentIndex, population: Number(village.population || 0), households: Number(village.households || 0), agricultural_land_area: Number(village.agricultural_land_area || 0), schools: Number(village.schools_count || 0), health_centers: Number(village.health_centers_count || 0), financial_institutions: Number(village.financial_institutions_count || 0) },
  };
}

async function getDistrictEconomicSummary(district) {
  const { rows } = await pool.query(`SELECT district, COUNT(*)::int AS total_villages, COALESCE(SUM(population),0)::int AS total_population, COALESCE(SUM(households),0)::int AS total_households, AVG(avg_income)::numeric AS avg_income_per_household, AVG(literacy_rate)::numeric AS avg_literacy_rate FROM villages WHERE district = $1 GROUP BY district`, [district]);
  if (!rows.length) throw new NotFoundError(`No villages found in district: ${district}`);
  return rows[0];
}

async function searchVillages(filters) { return (await getVillages({ ...filters, status: filters?.status || 'all', limit: filters?.limit || 100 })).data; }

module.exports = { getVillageProfile, getVillages, createVillage, updateVillage, deleteVillage, addVillageResource, getVillageAnalytics, getDistrictEconomicSummary, searchVillages };
