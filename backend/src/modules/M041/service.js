/**
 * M041 — Village ERP / Village Operating System
 *
 * Canonical village domain service. All state is persisted in PostgreSQL and
 * village finance is dimensioned into the platform's single ERP/ledger.
 */
'use strict';

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { ValidationError, NotFoundError } = require('../../utils/errors');

let claudeAICoordinator = null;
try { claudeAICoordinator = require('../../core/claudeAICoordinator'); } catch (_) { /* AI is optional at runtime */ }

function normalizeVillageId(value) {
  const id = String(value ?? '').trim();
  if (!/^\d+$/.test(id)) throw new ValidationError('Valid village id is required');
  return Number(id);
}

function normalizePayload(data = {}) {
  const payload = { ...data };
  for (const field of ['population','households','area_sq_km','elevation','agricultural_land_area','ai_development_index','avg_income','literacy_rate','irrigation_coverage','electrified_households','market_distance_km','financial_institutions_count','schools_count','health_centers_count','cooperative_societies_count']) {
    if (payload[field] !== undefined && payload[field] !== null && payload[field] !== '') payload[field] = Number(payload[field]);
  }
  for (const field of ['water_sources','infrastructure','major_crops','livestock_count','demographics']) {
    if (typeof payload[field] === 'string') {
      try { payload[field] = JSON.parse(payload[field]); } catch (_) { throw new ValidationError(`${field} must contain valid JSON`); }
    }
  }
  return payload;
}

function validateVillage(payload, partial = false) {
  const errors = {};
  if (!partial && !String(payload.name || '').trim()) errors.name = 'Village name is required';
  if (!partial && !String(payload.district || '').trim()) errors.district = 'District is required';
  if (!partial && !String(payload.state || '').trim()) errors.state = 'State is required';
  for (const field of ['population','households','area_sq_km','elevation','agricultural_land_area','avg_income','market_distance_km','financial_institutions_count','schools_count','health_centers_count','cooperative_societies_count']) {
    if (payload[field] !== undefined && payload[field] !== null && (!Number.isFinite(payload[field]) || payload[field] < 0)) errors[field] = `${field} must be a non-negative number`;
  }
  for (const field of ['ai_development_index','literacy_rate','irrigation_coverage']) {
    if (payload[field] !== undefined && payload[field] !== null && (!Number.isFinite(payload[field]) || payload[field] < 0 || payload[field] > 100)) errors[field] = `${field} must be between 0 and 100`;
  }
  if (payload.electrified_households !== undefined && payload.electrified_households !== null && (!Number.isInteger(payload.electrified_households) || payload.electrified_households < 0)) errors.electrified_households = 'electrified_households must be a non-negative integer';
  if (payload.status !== undefined && !['active','inactive','archived'].includes(payload.status)) errors.status = 'Invalid village status';
  if (payload.pincode !== undefined && payload.pincode !== null && payload.pincode !== '' && !/^\d{4,10}$/.test(String(payload.pincode))) errors.pincode = 'Invalid pincode';
  if (Object.keys(errors).length) throw new ValidationError('Village validation failed', errors);
}

function calculateDevelopmentIndex(village, resources) {
  const infrastructure = village.infrastructure || {};
  const infrastructureKeys = ['roads','electricity','water_supply','healthcare','education','internet'];
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
  return { village_id: village.id, village: { ...village, computed_development_index: developmentIndex }, resource_summary: { total_resources: rows.length, by_type: byType, average_utilization: Math.round(averageUtilization * 100) / 100, needs_maintenance: rows.filter((r) => r.condition === 'poor').length, well_maintained: rows.filter((r) => r.condition === 'good').length }, development_metrics: { development_index: developmentIndex, population: Number(village.population || 0), households: Number(village.households || 0), agricultural_land_area: Number(village.agricultural_land_area || 0), schools: Number(village.schools_count || 0), health_centers: Number(village.health_centers_count || 0), financial_institutions: Number(village.financial_institutions_count || 0) } };
}

async function getDistrictEconomicSummary(district) {
  const { rows } = await pool.query(`SELECT district, COUNT(*)::int AS total_villages, COALESCE(SUM(population),0)::int AS total_population, COALESCE(SUM(households),0)::int AS total_households, AVG(avg_income)::numeric AS avg_income_per_household, AVG(literacy_rate)::numeric AS avg_literacy_rate FROM villages WHERE district = $1 GROUP BY district`, [district]);
  if (!rows.length) throw new NotFoundError(`No villages found in district: ${district}`);
  return rows[0];
}

async function searchVillages(filters) { return (await getVillages({ ...filters, status: filters?.status || 'all', limit: filters?.limit || 100 })).data; }

async function ensureVillageFinance(villageId) {
  const id = normalizeVillageId(villageId);
  await getVillageProfile(id);
  const existing = await pool.query('SELECT * FROM village_finance_dimensions WHERE village_id = $1', [id]);
  if (existing.rows.length) return existing.rows[0];

  const company = await pool.query("SELECT id FROM companies WHERE code = 'AFRERA' AND is_active = TRUE LIMIT 1");
  if (!company.rows.length) throw new ValidationError('ERP company AFRERA is not initialized; run ERP foundation seed first');
  const companyId = company.rows[0].id;
  const codes = await pool.query("SELECT id, account_code FROM chart_of_accounts WHERE company_id = $1 AND account_code IN ('1110','4100','5200','1200','2100')", [companyId]);
  const accounts = Object.fromEntries(codes.rows.map((r) => [r.account_code, r.id]));
  const missing = ['1110','4100','5200','1200','2100'].filter((c) => !accounts[c]);
  if (missing.length) throw new ValidationError(`ERP chart of accounts missing required accounts: ${missing.join(', ')}`);

  const costCode = `VIL-${id}`;
  const profitCode = `VIL-${id}`;
  const cost = await pool.query("INSERT INTO cost_centers (company_id, code, name) VALUES ($1,$2,$3) ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name RETURNING id", [companyId, costCode, `Village ${id}`]);
  const profit = await pool.query("INSERT INTO profit_centers (company_id, code, name) VALUES ($1,$2,$3) ON CONFLICT (company_id, code) DO UPDATE SET name = EXCLUDED.name RETURNING id", [companyId, profitCode, `Village ${id} Profit Centre`]);
  const result = await pool.query(`INSERT INTO village_finance_dimensions (village_id, company_id, cost_center_id, profit_center_id, cash_account_id, revenue_account_id, expense_account_id, receivable_account_id, payable_account_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (village_id) DO UPDATE SET updated_at = NOW() RETURNING *`, [id, companyId, cost.rows[0].id, profit.rows[0].id, accounts['1110'], accounts['4100'], accounts['5200'], accounts['1200'], accounts['2100']]);
  return result.rows[0];
}

async function getVillageFinance(villageId) {
  const id = normalizeVillageId(villageId);
  const finance = await ensureVillageFinance(id);
  const [village, ledger, ar, ap, budgets] = await Promise.all([
    getVillageProfile(id),
    pool.query(`SELECT COUNT(*)::int AS journal_count, COALESCE(SUM(jl.debit),0)::numeric AS debits, COALESCE(SUM(jl.credit),0)::numeric AS credits FROM journal_lines jl JOIN journal_entries je ON je.id = jl.journal_entry_id WHERE je.status = 'posted' AND jl.cost_center_id = $1`, [finance.cost_center_id]),
    pool.query(`SELECT COUNT(*)::int AS invoices, COALESCE(SUM(total_amount),0)::numeric AS billed, COALESCE(SUM(amount_received),0)::numeric AS received FROM ar_invoices WHERE company_id = $1 AND status NOT IN ('cancelled','written_off')`, [finance.company_id]),
    pool.query(`SELECT COUNT(*)::int AS invoices, COALESCE(SUM(total_amount),0)::numeric AS billed, COALESCE(SUM(amount_paid),0)::numeric AS paid FROM ap_invoices WHERE company_id = $1 AND status NOT IN ('cancelled')`, [finance.company_id]),
    pool.query(`SELECT COUNT(*)::int AS budgets, COALESCE(SUM(allocated_amount),0)::numeric AS allocated, COALESCE(SUM(committed_amount),0)::numeric AS committed, COALESCE(SUM(spent_amount),0)::numeric AS spent FROM village_budgets WHERE village_id = $1 AND status IN ('approved','active','closed')`, [id]),
  ]);
  return { village_id: village.id, finance_dimensions: finance, ledger: ledger.rows[0], accounts_receivable: ar.rows[0], accounts_payable: ap.rows[0], budgets: budgets.rows[0] };
}

async function postVillageJournal(villageId, data = {}) {
  const id = normalizeVillageId(villageId);
  const amount = Number(data.amount);
  if (!Number.isFinite(amount) || amount <= 0) throw new ValidationError('A positive journal amount is required');
  const description = String(data.description || '').trim();
  if (!description) throw new ValidationError('Journal description is required');
  const debitCode = String(data.debit_account_code || '5200');
  const creditCode = String(data.credit_account_code || '1110');
  const allowedCodes = new Set(['1110','4100','5200','1200','2100']);
  if (!allowedCodes.has(debitCode) || !allowedCodes.has(creditCode) || debitCode === creditCode) throw new ValidationError('Unsupported village journal account pair');
  const finance = await ensureVillageFinance(id);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const accounts = await client.query('SELECT id, account_code FROM chart_of_accounts WHERE company_id = $1 AND account_code IN ($2,$3)', [finance.company_id, debitCode, creditCode]);
    const accountMap = Object.fromEntries(accounts.rows.map((r) => [r.account_code, r.id]));
    if (!accountMap[debitCode] || !accountMap[creditCode]) throw new ValidationError('Village journal accounts are not configured');
    const date = data.entry_date || new Date().toISOString().slice(0,10);
    const number = `VIL-${id}-${Date.now()}`;
    const entry = await client.query(`INSERT INTO journal_entries (company_id, entry_number, entry_date, journal_type, description, reference_type, reference_id, currency, status) VALUES ($1,$2,$3,'general',$4,'village',$5,'INR','posted') RETURNING id`, [finance.company_id, number, date, description, String(id)]);
    const entryId = entry.rows[0].id;
    await client.query(`INSERT INTO journal_lines (journal_entry_id,line_number,account_id,debit,credit,base_debit,base_credit,cost_center_id,profit_center_id,description) VALUES ($1,1,$2,$3,0,$3,0,$4,$5,$6),($1,2,$7,0,$8,0,$8,$4,$5,$6)`, [entryId, accountMap[debitCode], amount, finance.cost_center_id, finance.profit_center_id, description, accountMap[creditCode], amount]);
    await client.query('COMMIT');
    return { entry_id: entryId, entry_number: number, village_id: id, amount, debit_account_code: debitCode, credit_account_code: creditCode, status: 'posted' };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}

async function upsertVillageKPI(villageId, data = {}) {
  const id = normalizeVillageId(villageId);
  await getVillageProfile(id);
  const metricDate = data.metric_date || new Date().toISOString().slice(0,10);
  const fields = ['households','active_farmers','active_fishers','enterprises','production_value','procurement_value','sales_value','employment_count'];
  const values = fields.map((f) => data[f] === undefined ? 0 : Number(data[f]));
  if (values.some((v) => !Number.isFinite(v) || v < 0)) throw new ValidationError('KPI values must be non-negative numbers');
  const result = await pool.query(`INSERT INTO village_operational_kpis (village_id,metric_date,households,active_farmers,active_fishers,enterprises,production_value,procurement_value,sales_value,employment_count,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) ON CONFLICT (village_id,metric_date) DO UPDATE SET households=EXCLUDED.households,active_farmers=EXCLUDED.active_farmers,active_fishers=EXCLUDED.active_fishers,enterprises=EXCLUDED.enterprises,production_value=EXCLUDED.production_value,procurement_value=EXCLUDED.procurement_value,sales_value=EXCLUDED.sales_value,employment_count=EXCLUDED.employment_count,metadata=EXCLUDED.metadata RETURNING *`, [id, metricDate, ...values, data.metadata || {}]);
  return result.rows[0];
}

async function getVillageDashboard(villageId) {
  const id = normalizeVillageId(villageId);
  const [village, analytics, finance, households, enterprises, tasks, kpis] = await Promise.all([
    getVillageProfile(id), getVillageAnalytics(id), getVillageFinance(id),
    pool.query('SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE vulnerable)::int AS vulnerable, COUNT(*) FILTER (WHERE active)::int AS active FROM village_households WHERE village_id = $1', [id]),
    pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status='active')::int AS active, COALESCE(SUM(annual_revenue),0)::numeric AS annual_revenue FROM village_enterprises WHERE village_id = $1", [id]),
    pool.query("SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('open','in_progress'))::int AS open, COUNT(*) FILTER (WHERE priority IN ('high','critical') AND status NOT IN ('completed','cancelled'))::int AS urgent FROM village_workflow_tasks WHERE village_id = $1", [id]),
    pool.query('SELECT * FROM village_operational_kpis WHERE village_id = $1 ORDER BY metric_date DESC LIMIT 12', [id]),
  ]);
  return { village, analytics, finance, households: households.rows[0], enterprises: enterprises.rows[0], workflow: tasks.rows[0], kpis: kpis.rows };
}

async function createVillageTask(villageId, data = {}) {
  const id = normalizeVillageId(villageId);
  await getVillageProfile(id);
  if (!String(data.task_type || '').trim() || !String(data.title || '').trim()) throw new ValidationError('task_type and title are required');
  const result = await pool.query(`INSERT INTO village_workflow_tasks (village_id,task_type,title,description,priority,assigned_user_id,due_at,source_type,source_id,metadata) VALUES ($1,$2,$3,$4,COALESCE($5,'medium'),$6,$7,$8,$9,$10) RETURNING *`, [id,data.task_type,data.title,data.description || null,data.priority || 'medium',data.assigned_user_id || null,data.due_at || null,data.source_type || null,data.source_id || null,data.metadata || {}]);
  return result.rows[0];
}

async function updateVillageTask(taskId, data = {}) {
  const id = Number(taskId);
  if (!Number.isInteger(id) || id <= 0) throw new ValidationError('Valid task id is required');
  const allowed = ['status','priority','assigned_user_id','due_at','title','description'];
  const entries = Object.entries(data).filter(([k,v]) => allowed.includes(k) && v !== undefined);
  if (!entries.length) throw new ValidationError('No task fields supplied');
  if (data.status === 'completed') entries.push(['completed_at', new Date()]);
  const values = entries.map(([,v]) => v);
  const set = entries.map(([k],i) => `${k} = $${i+1}`).join(', ');
  values.push(id);
  const result = await pool.query(`UPDATE village_workflow_tasks SET ${set}, updated_at=NOW() WHERE id=$${values.length} RETURNING *`, values);
  if (!result.rows.length) throw new NotFoundError(`Village task not found: ${id}`);
  return result.rows[0];
}

async function generateVillageAIInsights(villageId, options = {}) {
  const id = normalizeVillageId(villageId);
  const dashboard = await getVillageDashboard(id);
  const snapshot = { village: dashboard.village, analytics: dashboard.analytics, finance: dashboard.finance, households: dashboard.households, enterprises: dashboard.enterprises, workflow: dashboard.workflow, kpis: dashboard.kpis.slice(0,3) };
  const enabled = process.env.CLAUDE_AI_ENABLED === 'true' && claudeAICoordinator;
  let result;
  if (enabled) {
    result = await claudeAICoordinator.coordinateAIRequest({
      requestType: 'village-erp-analysis',
      query: options.query || 'Analyze this village operating snapshot. Identify financial, agricultural, infrastructure, household, enterprise and workflow risks; prioritize actionable interventions; do not invent facts.',
      context: snapshot,
      agentPreference: 'operations-manager',
    });
  } else {
    const actions = [];
    if (Number(dashboard.workflow?.urgent || 0) > 0) actions.push('Review high/critical village workflow tasks immediately.');
    if (Number(dashboard.analytics?.resource_summary?.needs_maintenance || 0) > 0) actions.push('Schedule maintenance for resources in poor condition.');
    if (Number(dashboard.finance?.budgets?.spent || 0) > Number(dashboard.finance?.budgets?.allocated || 0)) actions.push('Investigate budget overspend before approving additional commitments.');
    if (!actions.length) actions.push('Continue KPI collection and monitor village finance, resources and operational trends.');
    result = { mode: 'deterministic-fallback', recommendations: actions };
  }
  const text = typeof result === 'string' ? result : JSON.stringify(result);
  const insight = await pool.query(`INSERT INTO village_ai_insights (village_id,insight_type,severity,title,insight,recommendation,confidence,model_provider,model_name,source_snapshot) VALUES ($1,'operational_review','info',$2,$3,$4,$5,$6,$7,$8) RETURNING *`, [id, 'Village ERP AI Review', text.slice(0,12000), enabled ? text.slice(0,8000) : text.slice(0,8000), enabled ? 80 : 65, enabled ? 'anthropic' : 'system', enabled ? 'claude-coordinator' : 'deterministic-rules', snapshot]);
  return insight.rows[0];
}

module.exports = {
  getVillageProfile, getVillages, createVillage, updateVillage, deleteVillage, addVillageResource,
  getVillageAnalytics, getDistrictEconomicSummary, searchVillages, ensureVillageFinance, getVillageFinance,
  postVillageJournal, upsertVillageKPI, getVillageDashboard, createVillageTask, updateVillageTask,
  generateVillageAIInsights,
};
