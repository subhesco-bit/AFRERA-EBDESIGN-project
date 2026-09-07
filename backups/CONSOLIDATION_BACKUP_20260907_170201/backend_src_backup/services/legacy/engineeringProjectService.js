/**
 * Engineering Project Service — Phase 1 of the AI Engineering / Infrastructure
 * platform (project creation + BOQ-driven cost estimation).
 *
 * PRE-BUILD GATE: migration 023_engineering_schema.sql already defines a
 * complete, real schema (engineering_projects, boq_items, cost_estimates,
 * material_prices, labor_rates, equipment_rates, bim_models, cad_files,
 * digital_twin_*, drone_surveys, tender_documents, ...) with zero service or
 * route ever wired to it — confirmed via repo-wide grep before writing this.
 * This file implements the two pieces that are honestly buildable without
 * fabricating engineering knowledge this platform doesn't have: project
 * lifecycle CRUD, and cost estimation computed from BOQ line items the
 * caller supplies (or from material_prices/labor_rates/equipment_rates when
 * those reference tables actually have rows for the requested category —
 * they may be empty on a fresh deployment, which this reports rather than
 * silently pricing at zero).
 *
 * OUT OF SCOPE, DELIBERATELY: structural/CFD/thermal/FEA simulation, BIM/CAD
 * generation, digital twin, drone/IoT ingestion. Those need real engineering
 * calculation libraries or physical sensor integration this codebase does
 * not have — building them as "AI" that returns invented numbers would be
 * exactly the fake-scaffolding pattern already found and removed elsewhere
 * in this repo (see .claude/audits/AUDIT_BUGS.md finding 3, and the 6 fake
 * AI services deleted in a prior session). They stay unbuilt until backed by
 * a real calculation engine or real data source.
 */

'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { withTransaction } = require('../../core/withTransaction');

const PROJECT_TYPES = [
  'greenhouse', 'polyhouse', 'cold_storage', 'warehouse', 'dairy',
  'solar', 'water_infrastructure', 'food_processing', 'grain_storage',
  'fisheries', 'other',
];

function generateProjectNumber() {
  const y = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `ENG-${y}-${rand}`;
}

async function createProject(userId, data) {
  const { name, projectType, projectSubtype, industrySector, description,
    location, capacity, capacityUnit, budget, timeline, fpoId } = data;

  if (!name) throw new Error('name is required');
  if (!projectType || !PROJECT_TYPES.includes(projectType)) {
    throw new Error(`projectType must be one of: ${PROJECT_TYPES.join(', ')}`);
  }
  if (!location || typeof location !== 'object') {
    throw new Error('location is required ({address, latitude, longitude, pincode, state, district})');
  }

  const result = await pool.query(
    `INSERT INTO engineering_projects
       (project_number, user_id, fpo_id, project_type, project_subtype, industry_sector,
        name, description, location, capacity, capacity_unit, budget, timeline, status, phase)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'created', 'requirement')
     RETURNING *`,
    [generateProjectNumber(), userId, fpoId || null, projectType, projectSubtype || null,
      industrySector || null, name, description || null, JSON.stringify(location),
      capacity || null, capacityUnit || null, budget || null, timeline || null]
  );
  return result.rows[0];
}

async function getProject(projectId, userId, isAdmin = false) {
  const params = [projectId];
  let where = 'id = $1 AND deleted_at IS NULL';
  if (!isAdmin) {
    where += ' AND user_id = $2';
    params.push(userId);
  }
  const result = await pool.query(`SELECT * FROM engineering_projects WHERE ${where}`, params);
  if (result.rows.length === 0) throw new Error('Project not found');
  return result.rows[0];
}

async function listProjects(userId, { status, projectType, page = 1, limit = 20 } = {}) {
  const conditions = ['user_id = $1', 'deleted_at IS NULL'];
  const params = [userId];
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  if (projectType) { params.push(projectType); conditions.push(`project_type = $${params.length}`); }

  const offset = (Math.max(1, Number(page)) - 1) * Math.max(1, Number(limit));
  params.push(Math.max(1, Number(limit)), offset);

  const result = await pool.query(
    `SELECT * FROM engineering_projects
     WHERE ${conditions.join(' AND ')}
     ORDER BY created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );
  return result.rows;
}

async function updateProjectPhase(projectId, userId, isAdmin, { phase, phaseProgress, status }) {
  await getProject(projectId, userId, isAdmin); // ownership check, 404s if not found/owned

  const sets = [];
  const params = [];
  if (phase !== undefined) { params.push(phase); sets.push(`phase = $${params.length}`); }
  if (phaseProgress !== undefined) {
    if (phaseProgress < 0 || phaseProgress > 100) throw new Error('phaseProgress must be 0-100');
    params.push(phaseProgress); sets.push(`phase_progress = $${params.length}`);
  }
  if (status !== undefined) { params.push(status); sets.push(`status = $${params.length}`); }
  if (sets.length === 0) throw new Error('Nothing to update');

  sets.push('updated_at = CURRENT_TIMESTAMP');
  params.push(projectId);
  const result = await pool.query(
    `UPDATE engineering_projects SET ${sets.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return result.rows[0];
}

/**
 * Looks up a reference rate for one BOQ line. Returns null (not a fabricated
 * number) when no reference row exists — the caller decides whether to
 * proceed with a manually supplied unit_rate or report the gap.
 */
async function lookupReferenceRate(client, { rateSource, code, region }) {
  if (!code) return null;
  const table = rateSource === 'labor' ? 'labor_rates'
    : rateSource === 'equipment' ? 'equipment_rates'
    : 'material_prices';

  if (table === 'material_prices') {
    const r = await client.query(
      `SELECT base_price, regional_prices FROM material_prices WHERE material_code = $1`,
      [code]
    );
    if (r.rows.length === 0) return null;
    const row = r.rows[0];
    const regional = region && row.regional_prices ? row.regional_prices[region] : undefined;
    return regional !== undefined ? Number(regional) : Number(row.base_price);
  }
  if (table === 'labor_rates') {
    const r = await client.query(
      `SELECT daily_rate FROM labor_rates WHERE skill_category = $1 AND ($2::text IS NULL OR region = $2)
       ORDER BY (region = $2) DESC LIMIT 1`,
      [code, region || null]
    );
    return r.rows.length ? Number(r.rows[0].daily_rate) : null;
  }
  const r = await client.query(`SELECT daily_rate FROM equipment_rates WHERE equipment_code = $1`, [code]);
  return r.rows.length ? Number(r.rows[0].daily_rate) : null;
}

/**
 * Builds a cost estimate from caller-supplied BOQ line items.
 *
 * Each item: { category, subcategory, description, unit, quantity, unitRate,
 *   rateSource?: 'material'|'labor'|'equipment', rateCode?, region? }
 *
 * If unitRate is omitted, looks up rateCode against the reference tables.
 * A line with neither a supplied rate nor a resolvable reference rate is
 * REJECTED (throws), rather than silently costed at zero — an estimate that
 * quietly drops a line item is worse than one that fails loudly and says
 * which line needs a rate.
 */
async function createCostEstimate(projectId, userId, isAdmin, { estimateType = 'preliminary', region, items, contingencyPercentage = 10 }) {
  if (!Array.isArray(items) || items.length === 0) throw new Error('items must be a non-empty array of BOQ lines');

  return withTransaction(async (client) => {
    const projectResult = await client.query(
      `SELECT * FROM engineering_projects WHERE id = $1 AND deleted_at IS NULL ${isAdmin ? '' : 'AND user_id = $2'}`,
      isAdmin ? [projectId] : [projectId, userId]
    );
    if (projectResult.rows.length === 0) throw new Error('Project not found');

    const boqId = require('crypto').randomUUID();
    const resolvedItems = [];
    const breakdown = {}; // { civil: total, structural: total, ... }
    const unresolvedLines = [];

    for (const [idx, item] of items.entries()) {
      if (!item.category || !item.description || !item.unit || !(Number(item.quantity) > 0)) {
        throw new Error(`Line ${idx}: category, description, unit and quantity (>0) are required`);
      }

      let unitRate = item.unitRate !== undefined ? Number(item.unitRate) : null;
      if (unitRate === null && item.rateCode) {
        unitRate = await lookupReferenceRate(client, {
          rateSource: item.rateSource, code: item.rateCode, region: region || item.region,
        });
      }
      if (unitRate === null || Number.isNaN(unitRate)) {
        unresolvedLines.push({ line: idx, description: item.description, reason: 'no unitRate supplied and no matching reference rate on file' });
        continue;
      }

      const totalAmount = Number(item.quantity) * unitRate;
      breakdown[item.category] = (breakdown[item.category] || 0) + totalAmount;

      const inserted = await client.query(
        `INSERT INTO boq_items
           (project_id, boq_id, category, subcategory, item_code, description, specifications,
            brand, model, unit, quantity, unit_rate, total_amount)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
        [projectId, boqId, item.category, item.subcategory || null, item.itemCode || null,
          item.description, item.specifications ? JSON.stringify(item.specifications) : null,
          item.brand || null, item.model || null, item.unit, item.quantity, unitRate, totalAmount]
      );
      resolvedItems.push(inserted.rows[0]);
    }

    if (unresolvedLines.length > 0) {
      // Fail the whole estimate rather than persist a partial BOQ silently
      // missing lines — the caller needs to supply the missing rates.
      const err = new Error('Cannot resolve a unit rate for one or more BOQ lines');
      err.code = 'UNRESOLVED_RATES';
      err.unresolvedLines = unresolvedLines;
      throw err;
    }

    const totalCapex = Object.values(breakdown).reduce((a, b) => a + b, 0);
    const contingencyAmount = totalCapex * (Number(contingencyPercentage) / 100);

    const estimateResult = await client.query(
      `INSERT INTO cost_estimates
         (project_id, estimate_type, region, total_capex, total_opex, breakdown,
          assumptions, contingency_percentage, contingency_amount)
       VALUES ($1,$2,$3,$4,0,$5,$6,$7,$8) RETURNING *`,
      [projectId, estimateType, region || null, totalCapex, JSON.stringify(breakdown),
        JSON.stringify({ boqId, lineCount: resolvedItems.length }), contingencyPercentage, contingencyAmount]
    );

    logger.info('Cost estimate created', { projectId, estimateId: estimateResult.rows[0].id, totalCapex });
    return { estimate: estimateResult.rows[0], boqItems: resolvedItems };
  }, { name: 'engineeringProject.createCostEstimate' });
}

async function getCostEstimates(projectId, userId, isAdmin = false) {
  await getProject(projectId, userId, isAdmin);
  const result = await pool.query(
    `SELECT * FROM cost_estimates WHERE project_id = $1 ORDER BY created_at DESC`,
    [projectId]
  );
  return result.rows;
}

module.exports = {
  PROJECT_TYPES,
  createProject,
  getProject,
  listProjects,
  updateProjectPhase,
  createCostEstimate,
  getCostEstimates,
};
