'use strict';

/**
 * M041 Village Project Intelligence
 *
 * Enhancement layer connecting Village ERP to the existing engineering project,
 * DPR and enterprise finance stack. It deliberately keeps project, estimate and
 * subsidy intelligence separate from the core ledger while using the same project
 * identity and ERP accounting dimensions.
 */
const crypto = require('crypto');
const pool = require('../../database/pool');
const { ValidationError, NotFoundError } = require('../../utils/errors');

function uuid(value, field = 'id') {
  const v = String(value || '').trim();
  if (!/^[0-9a-fA-F-]{36}$/.test(v)) throw new ValidationError(`Valid ${field} is required`);
  return v;
}

function villageId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) throw new ValidationError('Valid village id is required');
  return n;
}

function money(value, field) {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n) || n < 0) throw new ValidationError(`${field} must be a non-negative number`);
  return Math.round(n * 100) / 100;
}

function json(value, fallback) {
  if (value === undefined || value === null || value === '') return fallback;
  if (typeof value === 'object') return value;
  try { return JSON.parse(value); } catch (_) { throw new ValidationError('Invalid JSON payload'); }
}

function code(prefix = 'VPRJ') {
  return `${prefix}-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function ensureVillage(id) {
  const r = await pool.query('SELECT id, name, state, district, block FROM villages WHERE id = $1 AND status <> \'archived\'', [id]);
  if (!r.rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return r.rows[0];
}

async function createProject(villageIdValue, data, userId) {
  const vid = villageId(villageIdValue);
  await ensureVillage(vid);
  const p = data || {};
  if (!String(p.name || '').trim()) throw new ValidationError('Project name is required');
  if (!String(p.project_type || '').trim()) throw new ValidationError('Project type is required');
  const level = p.project_level || 'village';
  const allowed = ['farmer','household','village','fpo','cluster','block','district','state'];
  if (!allowed.includes(level)) throw new ValidationError('Invalid project level');
  if (level === 'farmer' && !p.farmer_id) throw new ValidationError('farmer_id is required for farmer-level projects');
  const result = await pool.query(`INSERT INTO village_projects
    (village_id, engineering_project_id, farmer_id, fpo_id, project_code, name, project_level, project_type, sector, objective, status, estimated_cost, design_data, implementation_plan, outcomes, created_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'draft',$11,$12,$13,$14,$15) RETURNING *`,
    [vid, p.engineering_project_id ? uuid(p.engineering_project_id, 'engineering_project_id') : null,
      p.farmer_id ? uuid(p.farmer_id, 'farmer_id') : null, p.fpo_id ? uuid(p.fpo_id, 'fpo_id') : null,
      p.project_code || code(), String(p.name).trim(), level, String(p.project_type).trim(), p.sector || null,
      p.objective || null, money(p.estimated_cost, 'estimated_cost'), json(p.design_data, {}),
      json(p.implementation_plan, {}), json(p.outcomes, {}), userId ? uuid(userId, 'user_id') : null]);
  return result.rows[0];
}

async function listProjects(villageIdValue, filters = {}) {
  const vid = villageId(villageIdValue);
  await ensureVillage(vid);
  const params = [vid];
  const where = ['p.village_id = $1'];
  if (filters.status) { params.push(filters.status); where.push(`p.status = $${params.length}`); }
  if (filters.project_level) { params.push(filters.project_level); where.push(`p.project_level = $${params.length}`); }
  if (filters.sector) { params.push(filters.sector); where.push(`p.sector = $${params.length}`); }
  const r = await pool.query(`SELECT p.*, COALESCE((SELECT COUNT(*) FROM village_project_subsidy_matches m WHERE m.project_id=p.id),0)::int AS subsidy_match_count FROM village_projects p WHERE ${where.join(' AND ')} ORDER BY p.created_at DESC`, params);
  return r.rows;
}

async function getProject(projectId) {
  const id = uuid(projectId, 'project_id');
  const project = await pool.query('SELECT * FROM village_projects WHERE id = $1', [id]);
  if (!project.rows.length) throw new NotFoundError(`Village project not found: ${id}`);
  const [estimates, dprs, funding, matches, reviews] = await Promise.all([
    pool.query('SELECT * FROM village_project_estimates WHERE project_id=$1 ORDER BY version DESC', [id]),
    pool.query('SELECT * FROM village_project_dpr_links WHERE project_id=$1 ORDER BY version DESC', [id]),
    pool.query('SELECT * FROM village_project_funding_sources WHERE project_id=$1 ORDER BY created_at DESC', [id]),
    pool.query(`SELECT m.*, s.scheme_code, s.scheme_name, s.government_level, s.state, s.sector, s.verification_status, s.official_source_url FROM village_project_subsidy_matches m JOIN village_scheme_catalogue s ON s.id=m.scheme_id WHERE m.project_id=$1 ORDER BY m.match_score DESC`, [id]),
    pool.query('SELECT * FROM village_project_ai_reviews WHERE project_id=$1 ORDER BY created_at DESC', [id]),
  ]);
  return { ...project.rows[0], estimates: estimates.rows, dprs: dprs.rows, funding_sources: funding.rows, subsidy_matches: matches.rows, ai_reviews: reviews.rows };
}

function calculateEstimate(items = [], contingency = 0, taxes = 0) {
  if (!Array.isArray(items)) throw new ValidationError('boq must be an array');
  const boq = items.map((item, i) => {
    const qty = Number(item.quantity ?? 0); const rate = Number(item.rate ?? 0);
    if (!Number.isFinite(qty) || qty < 0 || !Number.isFinite(rate) || rate < 0) throw new ValidationError(`Invalid BOQ quantity/rate at item ${i + 1}`);
    const amount = Math.round(qty * rate * 100) / 100;
    return { ...item, quantity: qty, rate, amount };
  });
  const subtotal = boq.reduce((s, x) => s + x.amount, 0);
  const c = money(contingency, 'contingency'); const t = money(taxes, 'taxes');
  return { boq, subtotal, contingency: c, taxes: t, total_cost: Math.round((subtotal + c + t) * 100) / 100 };
}

async function createEstimate(projectId, data, userId) {
  const id = uuid(projectId, 'project_id');
  await getProject(id);
  const versionR = await pool.query('SELECT COALESCE(MAX(version),0)+1 AS next FROM village_project_estimates WHERE project_id=$1', [id]);
  const version = Number(versionR.rows[0].next);
  const calc = calculateEstimate(json(data?.boq, []), data?.contingency, data?.taxes);
  const r = await pool.query(`INSERT INTO village_project_estimates
    (project_id,version,estimate_type,boq,subtotal,contingency,taxes,total_cost,assumptions,prepared_by)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
    [id, version, data?.estimate_type || 'detailed', JSON.stringify(calc.boq), calc.subtotal, calc.contingency, calc.taxes, calc.total_cost,
      JSON.stringify(json(data?.assumptions, {})), userId ? uuid(userId, 'user_id') : null]);
  return r.rows[0];
}

async function upsertScheme(data) {
  const p = data || {};
  if (!p.scheme_code || !p.scheme_name) throw new ValidationError('scheme_code and scheme_name are required');
  if (!['central','state'].includes(p.government_level)) throw new ValidationError('government_level must be central or state');
  if (p.government_level === 'state' && !p.state) throw new ValidationError('state is required for state schemes');
  const r = await pool.query(`INSERT INTO village_scheme_catalogue
    (scheme_code,scheme_name,government_level,state,ministry_department,sector,beneficiary_types,geography,eligibility_rules,assistance_rules,eligible_cost_heads,required_documents,official_source_url,notification_reference,effective_from,effective_to,verification_status,last_verified_at,metadata)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
    ON CONFLICT (scheme_code) DO UPDATE SET scheme_name=EXCLUDED.scheme_name,government_level=EXCLUDED.government_level,state=EXCLUDED.state,ministry_department=EXCLUDED.ministry_department,sector=EXCLUDED.sector,beneficiary_types=EXCLUDED.beneficiary_types,geography=EXCLUDED.geography,eligibility_rules=EXCLUDED.eligibility_rules,assistance_rules=EXCLUDED.assistance_rules,eligible_cost_heads=EXCLUDED.eligible_cost_heads,required_documents=EXCLUDED.required_documents,official_source_url=EXCLUDED.official_source_url,notification_reference=EXCLUDED.notification_reference,effective_from=EXCLUDED.effective_from,effective_to=EXCLUDED.effective_to,verification_status=EXCLUDED.verification_status,last_verified_at=EXCLUDED.last_verified_at,metadata=EXCLUDED.metadata,updated_at=NOW() RETURNING *`,
    [p.scheme_code,p.scheme_name,p.government_level,p.state || null,p.ministry_department || null,p.sector || null,p.beneficiary_types || [],json(p.geography,{}),json(p.eligibility_rules,{}),json(p.assistance_rules,{}),p.eligible_cost_heads || [],p.required_documents || [],p.official_source_url || null,p.notification_reference || null,p.effective_from || null,p.effective_to || null,p.verification_status || 'unverified',p.last_verified_at || null,json(p.metadata,{})]);
  return r.rows[0];
}

function schemeScore(project, scheme, village) {
  let score = 0; const reasons = []; const conflicts = [];
  if (scheme.government_level === 'state') {
    if (String(scheme.state || '').toLowerCase() === String(village.state || '').toLowerCase()) { score += 30; reasons.push('State matches project village'); }
    else { conflicts.push('State does not match project village'); }
  } else { score += 15; reasons.push('Central scheme available across eligible geographies'); }
  if (scheme.sector && project.sector && String(scheme.sector).toLowerCase() === String(project.sector).toLowerCase()) { score += 30; reasons.push('Sector matches'); }
  if (Array.isArray(scheme.beneficiary_types) && scheme.beneficiary_types.length) {
    if (scheme.beneficiary_types.includes(project.project_level)) { score += 20; reasons.push('Beneficiary/project level matches'); }
    else conflicts.push('Beneficiary/project level not explicitly listed');
  } else score += 5;
  if (scheme.verification_status === 'verified') { score += 15; reasons.push('Scheme record is officially verified in catalogue'); }
  else reasons.push('Scheme record requires official-source verification');
  const rules = scheme.eligibility_rules || {};
  if (rules.project_types?.length && rules.project_types.includes(project.project_type)) { score += 10; reasons.push('Project type matches scheme rule'); }
  if (rules.project_types?.length && !rules.project_types.includes(project.project_type)) conflicts.push('Project type is outside configured scheme rule');
  return { score: Math.min(score,100), reasons, conflicts };
}

async function matchSubsidies(projectId) {
  const project = (await getProject(projectId));
  const village = await ensureVillage(project.village_id);
  const schemes = await pool.query(`SELECT * FROM village_scheme_catalogue WHERE active=TRUE AND (effective_from IS NULL OR effective_from <= CURRENT_DATE) AND (effective_to IS NULL OR effective_to >= CURRENT_DATE) ORDER BY government_level, scheme_name`);
  const matches = [];
  for (const scheme of schemes.rows) {
    const s = schemeScore(project, scheme, village);
    if (s.score < 25) continue;
    const assistance = scheme.assistance_rules || {};
    const base = Math.max(Number(project.estimated_cost || 0), 0);
    let eligibleBase = base;
    if (Number.isFinite(Number(assistance.max_eligible_cost))) eligibleBase = Math.min(base, Number(assistance.max_eligible_cost));
    let potential = Number(assistance.fixed_amount || 0);
    if (Number.isFinite(Number(assistance.rate_percent))) potential = eligibleBase * Number(assistance.rate_percent) / 100;
    if (Number.isFinite(Number(assistance.max_amount))) potential = Math.min(potential, Number(assistance.max_amount));
    potential = Math.max(0, Math.round(potential * 100) / 100);
    const missing = Array.isArray(scheme.required_documents) ? scheme.required_documents : [];
    const r = await pool.query(`INSERT INTO village_project_subsidy_matches
      (project_id,scheme_id,match_score,eligibility_status,potential_assistance,eligible_cost_base,applicant_contribution,reasons,missing_documents,conflicts,ai_explanation)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      ON CONFLICT (project_id,scheme_id) DO UPDATE SET match_score=EXCLUDED.match_score,eligibility_status=EXCLUDED.eligibility_status,potential_assistance=EXCLUDED.potential_assistance,eligible_cost_base=EXCLUDED.eligible_cost_base,applicant_contribution=EXCLUDED.applicant_contribution,reasons=EXCLUDED.reasons,missing_documents=EXCLUDED.missing_documents,conflicts=EXCLUDED.conflicts,ai_explanation=EXCLUDED.ai_explanation RETURNING *`,
      [project.id, scheme.id, s.score, s.conflicts.length ? 'potential' : 'eligible_pending_verification', potential, eligibleBase, Math.max(base - potential,0), JSON.stringify(s.reasons), JSON.stringify(missing), JSON.stringify(s.conflicts), `AI-assisted screening: ${s.reasons.join('; ')}${s.conflicts.length ? `. Verify: ${s.conflicts.join('; ')}` : ''}.`]);
    matches.push({ ...r.rows[0], scheme_code: scheme.scheme_code, scheme_name: scheme.scheme_name, government_level: scheme.government_level, state: scheme.state, official_source_url: scheme.official_source_url });
  }
  return matches.sort((a,b) => Number(b.match_score) - Number(a.match_score));
}

async function addFundingSource(projectId, data) {
  const id = uuid(projectId, 'project_id'); await getProject(id);
  const amount = money(data?.committed_amount, 'committed_amount');
  const approved = money(data?.approved_amount, 'approved_amount');
  const received = money(data?.received_amount, 'received_amount');
  if (approved > amount && amount > 0) throw new ValidationError('approved_amount cannot exceed committed_amount');
  if (received > approved && approved > 0) throw new ValidationError('received_amount cannot exceed approved_amount');
  const scheme = data?.scheme_id ? uuid(data.scheme_id, 'scheme_id') : null;
  const r = await pool.query(`INSERT INTO village_project_funding_sources
    (project_id,source_type,scheme_id,committed_amount,approved_amount,received_amount,status,application_reference,notes)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
    [id,data?.source_type || 'other',scheme,amount,approved,received,data?.status || 'planned',data?.application_reference || null,data?.notes || null]);
  return r.rows[0];
}

async function buildSubsidyAIContext(projectId) {
  const p = await getProject(projectId);
  const village = await ensureVillage(p.village_id);
  const latest = p.estimates[0] || null;
  return {
    task: 'village_project_subsidy_analysis',
    project: { id:p.id, code:p.project_code, name:p.name, level:p.project_level, type:p.project_type, sector:p.sector, objective:p.objective, estimated_cost:p.estimated_cost, approved_cost:p.approved_cost, actual_cost:p.actual_cost },
    village: { id:village.id, name:village.name, state:village.state, district:village.district, block:village.block },
    estimate: latest ? { version:latest.version, boq:latest.boq, total_cost:latest.total_cost, assumptions:latest.assumptions } : null,
    dpr: p.dprs[0] || null,
    funding: p.funding_sources,
    current_matches: p.subsidy_matches,
    instructions: ['Identify potential central/state scheme matches from the supplied catalogue only','Never invent eligibility or subsidy rates','Flag missing evidence','Separate verified facts from AI recommendations','Return recommended next actions for human review']
  };
}

module.exports = { createProject, listProjects, getProject, createEstimate, upsertScheme, matchSubsidies, addFundingSource, buildSubsidyAIContext, calculateEstimate };
