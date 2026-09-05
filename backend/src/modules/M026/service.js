/**
 * Farmer Skill Management Service (M026)
 *
 * Launch-level implementation over the generated JSONB table. The module keeps
 * the scaffold controller contract while exposing richer operations for the
 * Claude/module backbone.
 */

const { getPostgreSQL } = require('../../database/connection');

const MODULE_ID = 'M026';
const MODULE_NAME = 'Farmer Skill Management';
const tableName = 'farmer_m026_items';
const PROFICIENCY = ['novice', 'basic', 'working', 'advanced', 'expert'];

function pg() {
  const client = getPostgreSQL();
  if (!client) throw new Error('Database not initialized');
  return client;
}

function clamp(value, min, max) {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return min;
  return Math.min(max, Math.max(min, numeric));
}

function calculateReadinessScore({ proficiencyScore, evidence, trainingNeeds, yearsExperience }) {
  const proficiencyWeight = proficiencyScore * 16;
  const evidenceWeight = Math.min(evidence.length * 8, 24);
  const experienceWeight = Math.min(yearsExperience * 2, 16);
  const gapPenalty = Math.min(trainingNeeds.length * 6, 24);
  return clamp(Math.round(proficiencyWeight + evidenceWeight + experienceWeight - gapPenalty), 0, 100);
}

function buildSkillSignals(skill) {
  const signals = [];
  if (skill.proficiencyScore >= 4) signals.push('mentor_candidate');
  if (skill.evidence.length >= 2) signals.push('audit_supported');
  if (skill.trainingNeeds.length > 0) signals.push('training_required');
  if (skill.yearsExperience >= 5) signals.push('experienced_operator');
  return signals;
}

function normalizeSkill(payload = {}, existing = {}) {
  const source = existing.data ? { ...existing.data, ...payload } : { ...existing, ...payload };
  const proficiencyScore = clamp(source.proficiencyScore ?? source.proficiency_score ?? 1, 1, 5);
  const evidence = Array.isArray(source.evidence) ? source.evidence : [];
  const trainingNeeds = Array.isArray(source.trainingNeeds) ? source.trainingNeeds : [];
  const yearsExperience = clamp(source.yearsExperience ?? source.years_experience ?? 0, 0, 60);
  const aiReadinessScore = calculateReadinessScore({ proficiencyScore, evidence, trainingNeeds, yearsExperience });

  return {
    moduleId: MODULE_ID,
    farmerId: source.farmerId ?? source.farmer_id ?? null,
    skillName: source.skillName ?? source.skill_name ?? source.name ?? 'Unspecified skill',
    skillCategory: source.skillCategory ?? source.skill_category ?? source.category ?? 'general',
    proficiencyLevel: PROFICIENCY[proficiencyScore - 1],
    proficiencyScore,
    yearsExperience,
    evidence,
    trainingNeeds,
    targetRole: source.targetRole ?? source.target_role ?? null,
    certificationReady: aiReadinessScore >= 72 && evidence.length > 0,
    aiReadinessScore,
    aiSignals: buildSkillSignals({ proficiencyScore, evidence, trainingNeeds, yearsExperience }),
    status: source.status ?? 'active',
    updatedAt: new Date().toISOString()
  };
}

async function listItems({ page = 1, limit = 20, farmerId, category, certificationReady } = {}) {
  let client = pg();
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const filters = [];
  const params = [];

  if (farmerId) {
    params.push(farmerId);
    filters.push(`data->>'farmerId' = $${params.length}`);
  }
  if (category) {
    params.push(category);
    filters.push(`data->>'skillCategory' = $${params.length}`);
  }
  if (certificationReady !== undefined) {
    params.push(String(certificationReady) === 'true');
    filters.push(`(data->>'certificationReady')::boolean = $${params.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const totalRes = await client.query(`SELECT COUNT(*) FROM ${tableName} ${where}`, params);
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  const res = await client.query(
    `SELECT * FROM ${tableName} ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  return {
    items: res.rows.map(row => ({ ...row, data: normalizeSkill(row.data || {}, row) })),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
  };
}

async function getItem(id) {
  let res = await pg().query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  const row = res.rows[0];
  return row ? { ...row, data: normalizeSkill(row.data || {}, row) } : null;
}

async function createItem(payload) {
  const data = normalizeSkill(payload);
  let res = await pg().query(
    `INSERT INTO ${tableName} (data, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *`,
    [data]
  );
  return res.rows[0];
}

async function updateItem(id, payload) {
  const current = await getItem(id);
  if (!current) return null;
  let data = normalizeSkill(payload, current);
  let res = await pg().query(
    `UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [data, id]
  );
  return res.rows[0] || null;
}

async function deleteItem(id) {
  let res = await pg().query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

async function getSkillPassport(farmerId) {
  const records = await listItems({ farmerId, limit: 100 });
  const skills = records.items.map(item => item.data);
  const readiness = skills.length
    ? Math.round(skills.reduce((sum, skill) => sum + skill.aiReadinessScore, 0) / skills.length)
    : 0;

  return {
    farmerId,
    moduleId: MODULE_ID,
    skillCount: skills.length,
    certificationReadyCount: skills.filter(skill => skill.certificationReady).length,
    readiness,
    topSkills: skills.slice().sort((a, b) => b.aiReadinessScore - a.aiReadinessScore).slice(0, 5),
    trainingNeeds: [...new Set(skills.flatMap(skill => skill.trainingNeeds))]
  };
}

async function recommendTraining(farmerId) {
  const passport = await getSkillPassport(farmerId);
  return {
    farmerId,
    recommendations: passport.trainingNeeds.map((need, index) => ({
      priority: index + 1,
      trainingNeed: need,
      reason: 'Listed as a gap in the farmer skill passport',
      action: 'Assign local training provider and collect completion evidence'
    })),
    readyForCertification: passport.topSkills.filter(skill => skill.certificationReady)
  };
}

async function healthCheck() {
  await pg().query('SELECT 1');
  return { status: 'healthy', moduleId: MODULE_ID, moduleName: MODULE_NAME, tableName };
}

async function execute(operation, parameters = {}) {
  switch (operation) {
    case 'list':
      return { success: true, data: await listItems(parameters) };
    case 'get':
      return { success: true, data: await getItem(parameters.id) };
    case 'create':
      return { success: true, data: await createItem(parameters) };
    case 'update':
      return { success: true, data: await updateItem(parameters.id, parameters) };
    case 'delete':
      return { success: true, data: await deleteItem(parameters.id) };
    case 'skillPassport':
    case 'analyze':
      return { success: true, data: await getSkillPassport(parameters.farmerId) };
    case 'recommendTraining':
      return { success: true, data: await recommendTraining(parameters.farmerId) };
    default:
      return { success: false, error: `Unsupported ${MODULE_ID} operation: ${operation}` };
  }
}

module.exports = {
  listItems,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getSkillPassport,
  recommendTraining,
  healthCheck,
  execute
};
