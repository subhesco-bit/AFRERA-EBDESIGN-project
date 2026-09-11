/** M041 Village ERP operational sub-service. */
'use strict';
const pool = require('../../database/pool');
const { ValidationError, NotFoundError } = require('../../utils/errors');

function id(value, label = 'id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError(`Valid ${label} is required`);
  return n;
}

async function ensureVillage(villageId) {
  const result = await pool.query('SELECT id FROM villages WHERE id = $1', [id(villageId, 'village id')]);
  if (!result.rows.length) throw new NotFoundError(`Village not found: ${villageId}`);
  return result.rows[0].id;
}

async function listHouseholds(villageId, filters = {}) {
  const vid = await ensureVillage(villageId);
  const params = [vid];
  const conditions = ['village_id = $1'];
  if (filters.search) { params.push(`%${String(filters.search)}%`); conditions.push(`(household_code ILIKE $${params.length} OR head_name ILIKE $${params.length} OR phone ILIKE $${params.length})`); }
  if (filters.category) { params.push(filters.category); conditions.push(`category = $${params.length}`); }
  if (filters.vulnerable !== undefined) { params.push(filters.vulnerable === true || filters.vulnerable === 'true'); conditions.push(`vulnerable = $${params.length}`); }
  const result = await pool.query(`SELECT * FROM village_households WHERE ${conditions.join(' AND ')} ORDER BY household_code`, params);
  return result.rows;
}

async function createHousehold(villageId, data = {}) {
  const vid = await ensureVillage(villageId);
  const code = String(data.household_code || '').trim();
  if (!code) throw new ValidationError('household_code is required');
  const result = await pool.query(`INSERT INTO village_households (village_id,household_code,head_name,phone,address,category,vulnerable,metadata) VALUES ($1,$2,$3,$4,$5,$6,COALESCE($7,FALSE),$8) RETURNING *`, [vid,code,data.head_name || null,data.phone || null,data.address || null,data.category || null,data.vulnerable,data.metadata || {}]);
  return result.rows[0];
}

async function addHouseholdMember(householdId, data = {}) {
  const hid = id(householdId, 'household id');
  const exists = await pool.query('SELECT id FROM village_households WHERE id = $1', [hid]);
  if (!exists.rows.length) throw new NotFoundError(`Household not found: ${hid}`);
  if (!String(data.name || '').trim()) throw new ValidationError('Member name is required');
  const result = await pool.query(`INSERT INTO village_household_members (household_id,name,relationship,gender,date_of_birth,phone,occupation,education,is_primary_contact,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,COALESCE($9,FALSE),$10) RETURNING *`, [hid,data.name.trim(),data.relationship || null,data.gender || null,data.date_of_birth || null,data.phone || null,data.occupation || null,data.education || null,data.is_primary_contact,data.metadata || {}]);
  return result.rows[0];
}

async function listEnterprises(villageId) {
  const vid = await ensureVillage(villageId);
  const result = await pool.query('SELECT * FROM village_enterprises WHERE village_id = $1 ORDER BY enterprise_name', [vid]);
  return result.rows;
}

async function createEnterprise(villageId, data = {}) {
  const vid = await ensureVillage(villageId);
  if (!String(data.enterprise_code || '').trim() || !String(data.enterprise_name || '').trim() || !String(data.enterprise_type || '').trim()) throw new ValidationError('enterprise_code, enterprise_name and enterprise_type are required');
  const revenue = Number(data.annual_revenue || 0);
  const employees = Number(data.employee_count || 0);
  if (!Number.isFinite(revenue) || revenue < 0 || !Number.isInteger(employees) || employees < 0) throw new ValidationError('annual_revenue and employee_count are invalid');
  const result = await pool.query(`INSERT INTO village_enterprises (village_id,enterprise_code,enterprise_name,enterprise_type,owner_household_id,status,annual_revenue,employee_count,metadata) VALUES ($1,$2,$3,$4,$5,COALESCE($6,'active'),$7,$8,$9) RETURNING *`, [vid,data.enterprise_code.trim(),data.enterprise_name.trim(),data.enterprise_type.trim(),data.owner_household_id ? id(data.owner_household_id,'household id') : null,data.status,revenue,employees,data.metadata || {}]);
  return result.rows[0];
}

async function createBudget(villageId, data = {}) {
  const vid = await ensureVillage(villageId);
  if (!String(data.budget_code || '').trim() || !String(data.category || '').trim()) throw new ValidationError('budget_code and category are required');
  const allocated = Number(data.allocated_amount || 0);
  const committed = Number(data.committed_amount || 0);
  const spent = Number(data.spent_amount || 0);
  if (![allocated,committed,spent].every((n) => Number.isFinite(n) && n >= 0)) throw new ValidationError('Budget amounts must be non-negative numbers');
  if (committed > allocated || spent > committed) throw new ValidationError('Budget amounts must satisfy spent <= committed <= allocated');
  if (!data.period_start || !data.period_end) throw new ValidationError('Budget period is required');
  const result = await pool.query(`INSERT INTO village_budgets (village_id,fiscal_year_id,budget_code,category,period_start,period_end,allocated_amount,committed_amount,spent_amount,status,approved_by,approved_at,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,'draft'),$11,$12,$13) RETURNING *`, [vid,data.fiscal_year_id ? id(data.fiscal_year_id,'fiscal year id') : null,data.budget_code.trim(),data.category.trim(),data.period_start,data.period_end,allocated,committed,spent,data.status,data.approved_by || null,data.approved_at || null,data.metadata || {}]);
  return result.rows[0];
}

async function listBudgets(villageId) {
  const vid = await ensureVillage(villageId);
  const result = await pool.query('SELECT * FROM village_budgets WHERE village_id = $1 ORDER BY period_start DESC, budget_code', [vid]);
  return result.rows;
}

async function getERPOverview(villageId) {
  const vid = await ensureVillage(villageId);
  const [households, members, enterprises, budgets, tasks, insights] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE vulnerable)::int AS vulnerable, COUNT(*) FILTER (WHERE active)::int AS active FROM village_households WHERE village_id=$1',[vid]),
    pool.query('SELECT COUNT(*)::int AS total FROM village_household_members m JOIN village_households h ON h.id=m.household_id WHERE h.village_id=$1',[vid]),
    pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COALESCE(SUM(annual_revenue),0)::numeric AS annual_revenue FROM village_enterprises WHERE village_id=$1",[vid]),
    pool.query("SELECT COUNT(*)::int AS total, COALESCE(SUM(allocated_amount),0)::numeric AS allocated, COALESCE(SUM(committed_amount),0)::numeric AS committed, COALESCE(SUM(spent_amount),0)::numeric AS spent FROM village_budgets WHERE village_id=$1 AND status NOT IN ('cancelled')",[vid]),
    pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('open','in_progress'))::int AS open, COUNT(*) FILTER (WHERE priority IN ('high','critical') AND status NOT IN ('completed','cancelled'))::int AS urgent FROM village_workflow_tasks WHERE village_id=$1",[vid]),
    pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='new')::int AS new FROM village_ai_insights WHERE village_id=$1",[vid]),
  ]);
  return { village_id: vid, households: households.rows[0], members: members.rows[0], enterprises: enterprises.rows[0], budgets: budgets.rows[0], workflow: tasks.rows[0], ai: insights.rows[0] };
}

module.exports = { listHouseholds, createHousehold, addHouseholdMember, listEnterprises, createEnterprise, createBudget, listBudgets, getERPOverview };
