'use strict';

/**
 * Village Initiatives Service
 *
 * One operational layer for village projects, government schemes, other
 * schemes and NGO works. village_profiles remains the authoritative village
 * master and government_schemes remains the authoritative verified government
 * scheme registry.
 */

const pool = require('../../database/pool');

const TYPES = ['project', 'government_scheme', 'other_scheme', 'ngo_work', 'mixed'];
const SOURCES = ['government', 'ngo', 'other_scheme', 'village', 'private', 'mixed'];
const STATUSES = ['proposed', 'planned', 'submitted', 'approved', 'active', 'on_hold', 'completed', 'cancelled', 'rejected'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

function error(message, statusCode = 400) {
  const e = new Error(message);
  e.statusCode = statusCode;
  return e;
}

function clean(v) { return typeof v === 'string' ? v.trim() : v; }
function num(v, field) {
  if (v === undefined || v === null || v === '') return null;
  const n = Number(v);
  if (!Number.isFinite(n)) throw error(`${field} must be a valid number`);
  return n;
}

function validate(input, partial = false) {
  if (!partial && !input.village_id) throw error('village_id is required');
  if (!partial && !clean(input.name)) throw error('name is required');
  if (input.initiative_type && !TYPES.includes(input.initiative_type)) throw error('Invalid initiative_type');
  if (input.source_type && !SOURCES.includes(input.source_type)) throw error('Invalid source_type');
  if (input.status && !STATUSES.includes(input.status)) throw error('Invalid status');
  if (input.priority && !PRIORITIES.includes(input.priority)) throw error('Invalid priority');
  for (const field of ['estimated_cost', 'approved_amount', 'spent_amount']) {
    const n = num(input[field], field);
    if (n !== null && n < 0) throw error(`${field} must be non-negative`);
  }
  for (const field of ['beneficiaries_target', 'beneficiaries_reached']) {
    const n = num(input[field], field);
    if (n !== null && (!Number.isInteger(n) || n < 0)) throw error(`${field} must be a non-negative integer`);
  }
}

async function ensureVillage(client, villageId) {
  const r = await client.query('SELECT village_id FROM village_profiles WHERE village_id = $1 FOR SHARE', [villageId]);
  if (!r.rows.length) throw error(`Village not found: ${villageId}`, 404);
}

async function createInitiative(input) {
  validate(input);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await ensureVillage(client, input.village_id);

    if (input.government_scheme_id) {
      const s = await client.query('SELECT id FROM government_schemes WHERE id = $1', [input.government_scheme_id]);
      if (!s.rows.length) throw error(`Government scheme not found: ${input.government_scheme_id}`, 404);
    }

    const code = clean(input.initiative_code) || `VIL-${input.village_id}-${Date.now()}`;
    const { rows } = await client.query(
      `INSERT INTO village_initiatives
       (village_id, initiative_code, name, description, initiative_type, source_type,
        government_scheme_id, implementing_partner, funding_source, department_or_sponsor,
        sector, status, priority, start_date, expected_end_date, estimated_cost,
        approved_amount, spent_amount, beneficiaries_target, beneficiaries_reached,
        objectives, metadata, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
       RETURNING *`, [
        input.village_id, code, clean(input.name), clean(input.description) || null,
        input.initiative_type || 'project', input.source_type || 'village', input.government_scheme_id || null,
        clean(input.implementing_partner) || null, clean(input.funding_source) || null,
        clean(input.department_or_sponsor) || null, clean(input.sector) || null,
        input.status || 'proposed', input.priority || 'medium', input.start_date || null,
        input.expected_end_date || null, num(input.estimated_cost, 'estimated_cost'),
        num(input.approved_amount, 'approved_amount'), num(input.spent_amount, 'spent_amount') || 0,
        num(input.beneficiaries_target, 'beneficiaries_target'), num(input.beneficiaries_reached, 'beneficiaries_reached') || 0,
        input.objectives || [], input.metadata || {}, input.created_by || null,
      ],
    );
    await client.query(
      `INSERT INTO village_initiative_updates (initiative_id, status, progress_percent, note, actor_id, actor_role)
       VALUES ($1,$2,0,$3,$4,$5)`,
      [rows[0].initiative_id, rows[0].status, 'Initiative created', input.created_by || null, 'creator'],
    );
    await client.query('COMMIT');
    return rows[0];
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally { client.release(); }
}

async function listInitiatives(filters = {}) {
  const params = [];
  const where = [];
  const add = (sql, value) => { params.push(value); where.push(sql.replace('?', `$${params.length}`)); };
  if (filters.village_id) add('vi.village_id = ?', filters.village_id);
  if (filters.initiative_type) add('vi.initiative_type = ?', filters.initiative_type);
  if (filters.source_type) add('vi.source_type = ?', filters.source_type);
  if (filters.status) add('vi.status = ?', filters.status);
  if (filters.priority) add('vi.priority = ?', filters.priority);
  if (filters.sector) add('vi.sector = ?', filters.sector);
  if (filters.government_scheme_id) add('vi.government_scheme_id = ?', filters.government_scheme_id);
  if (filters.state) add('vp.state = ?', filters.state);
  if (filters.district) add('vp.district = ?', filters.district);
  if (filters.block) add('vp.block = ?', filters.block);
  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);
  const offset = Math.max(Number(filters.offset) || 0, 0);
  params.push(limit, offset);
  const { rows } = await pool.query(
    `SELECT vi.*, vp.village_name, vp.name AS village_master_name, vp.state, vp.district, vp.block,
            gs.code AS government_scheme_code, gs.name AS government_scheme_name
       FROM village_initiatives vi
       JOIN village_profiles vp ON vp.village_id = vi.village_id
       LEFT JOIN government_schemes gs ON gs.id = vi.government_scheme_id
      ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
      ORDER BY CASE vi.priority WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
               vi.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
  return rows;
}

async function getInitiative(id) {
  const { rows } = await pool.query(
    `SELECT vi.*, vp.village_name, vp.name AS village_master_name, vp.state, vp.district, vp.block,
            gs.code AS government_scheme_code, gs.name AS government_scheme_name
       FROM village_initiatives vi
       JOIN village_profiles vp ON vp.village_id = vi.village_id
       LEFT JOIN government_schemes gs ON gs.id = vi.government_scheme_id
      WHERE vi.initiative_id = $1`, [id]);
  if (!rows.length) throw error(`Village initiative not found: ${id}`, 404);
  return rows[0];
}

async function getUpdates(id) {
  await getInitiative(id);
  const { rows } = await pool.query(
    'SELECT * FROM village_initiative_updates WHERE initiative_id = $1 ORDER BY created_at ASC, update_id ASC', [id]);
  return rows;
}

async function updateInitiative(id, input, actor = {}) {
  validate(input, true);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const existing = await client.query('SELECT * FROM village_initiatives WHERE initiative_id = $1 FOR UPDATE', [id]);
    if (!existing.rows.length) throw error(`Village initiative not found: ${id}`, 404);

    if (input.government_scheme_id) {
      const s = await client.query('SELECT id FROM government_schemes WHERE id = $1', [input.government_scheme_id]);
      if (!s.rows.length) throw error(`Government scheme not found: ${input.government_scheme_id}`, 404);
    }

    const fields = ['name','description','initiative_type','source_type','government_scheme_id','implementing_partner','funding_source','department_or_sponsor','sector','status','priority','start_date','expected_end_date','actual_end_date','estimated_cost','approved_amount','spent_amount','beneficiaries_target','beneficiaries_reached','objectives','metadata'];
    const sets = []; const params = [];
    for (const f of fields) {
      if (input[f] === undefined) continue;
      let value = input[f];
      if (['name','description','implementing_partner','funding_source','department_or_sponsor','sector'].includes(f)) value = clean(value) || null;
      if (['estimated_cost','approved_amount','spent_amount','beneficiaries_target','beneficiaries_reached'].includes(f)) value = num(value, f);
      params.push(value); sets.push(`${f} = $${params.length}`);
    }
    if (!sets.length) { await client.query('COMMIT'); return existing.rows[0]; }
    sets.push('updated_at = now()');
    params.push(id);
    const { rows } = await client.query(`UPDATE village_initiatives SET ${sets.join(', ')} WHERE initiative_id = $${params.length} RETURNING *`, params);

    if (input.status || input.note || input.progress_percent !== undefined) {
      const progress = input.progress_percent === undefined ? null : num(input.progress_percent, 'progress_percent');
      if (progress !== null && (progress < 0 || progress > 100)) throw error('progress_percent must be between 0 and 100');
      await client.query(
        `INSERT INTO village_initiative_updates (initiative_id,status,progress_percent,note,actor_id,actor_role,attachment_refs,metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, input.status || rows[0].status, progress, clean(input.note) || 'Initiative updated', actor.id || null, actor.role || null, input.attachment_refs || [], input.metadata || {}]);
    }
    await client.query('COMMIT');
    return rows[0];
  } catch (e) { await client.query('ROLLBACK'); throw e; }
  finally { client.release(); }
}

async function addBeneficiary(id, input) {
  if (!input.beneficiary_type) throw error('beneficiary_type is required');
  const { rows } = await pool.query(
    `INSERT INTO village_initiative_beneficiaries
      (initiative_id, beneficiary_type, beneficiary_ref, beneficiary_name, target_flag, status, benefit_type, benefit_value, notes)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, input.beneficiary_type, input.beneficiary_ref || null, clean(input.beneficiary_name) || null,
      input.target_flag !== false, input.status || 'identified', clean(input.benefit_type) || null,
      num(input.benefit_value, 'benefit_value'), clean(input.notes) || null]);
  return rows[0];
}

async function getBeneficiaries(id) {
  await getInitiative(id);
  const { rows } = await pool.query('SELECT * FROM village_initiative_beneficiaries WHERE initiative_id = $1 ORDER BY created_at ASC, beneficiary_id ASC', [id]);
  return rows;
}

async function addMilestone(id, input) {
  if (!clean(input.milestone_code) || !clean(input.name)) throw error('milestone_code and name are required');
  const { rows } = await pool.query(
    `INSERT INTO village_initiative_milestones
      (initiative_id,milestone_code,name,description,due_date,status,planned_amount,actual_amount,evidence_refs)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id, clean(input.milestone_code), clean(input.name), clean(input.description) || null, input.due_date || null,
      input.status || 'pending', num(input.planned_amount, 'planned_amount'), num(input.actual_amount, 'actual_amount'), input.evidence_refs || []]);
  return rows[0];
}

async function getMilestones(id) {
  await getInitiative(id);
  const { rows } = await pool.query('SELECT * FROM village_initiative_milestones WHERE initiative_id = $1 ORDER BY due_date NULLS LAST, milestone_id', [id]);
  return rows;
}

async function getVillageSummary(villageId) {
  const { rows } = await pool.query(
    `SELECT initiative_type, source_type, status, COUNT(*)::int AS count,
            COALESCE(SUM(approved_amount),0) AS approved_amount,
            COALESCE(SUM(spent_amount),0) AS spent_amount,
            COALESCE(SUM(beneficiaries_reached),0)::int AS beneficiaries_reached
       FROM village_initiatives WHERE village_id = $1 GROUP BY initiative_type, source_type, status ORDER BY initiative_type, source_type, status`, [villageId]);
  return rows;
}

module.exports = { TYPES, SOURCES, STATUSES, PRIORITIES, createInitiative, listInitiatives, getInitiative, getUpdates, updateInitiative, addBeneficiary, getBeneficiaries, addMilestone, getMilestones, getVillageSummary };
