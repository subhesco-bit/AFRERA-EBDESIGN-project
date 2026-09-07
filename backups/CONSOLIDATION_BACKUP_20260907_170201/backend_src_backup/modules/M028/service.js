/**
 * Farmer Advisory Service (M028)
 *
 * Structured advisory work-plan module. It converts caller-provided farm,
 * weather, market, compliance, and sensor signals into auditable advice without
 * pretending an external prediction model is connected.
 */

const { getPostgreSQL } = require('../../database/connection');

const MODULE_ID = 'M028';
const MODULE_NAME = 'Farmer Advisory';
const tableName = 'farmer_m028_items';

function pg() {
  const client = getPostgreSQL();
  if (!client) throw new Error('Database not initialized');
  return client;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizePriority(priority) {
  const allowed = ['low', 'medium', 'high', 'critical'];
  return allowed.includes(priority) ? priority : 'medium';
}

function buildAdvisoryActions(source) {
  const signals = asArray(source.signals);
  const actions = [];

  if (signals.includes('low_soil_moisture')) {
    actions.push({
      area: 'irrigation',
      priority: 'high',
      action: 'Schedule irrigation and verify water-source availability',
      evidence: 'low_soil_moisture signal'
    });
  }
  if (signals.includes('price_drop')) {
    actions.push({
      area: 'market',
      priority: 'high',
      action: 'Review sell timing and evaluate storage or forward contract options',
      evidence: 'price_drop signal'
    });
  }
  if (signals.includes('pest_pressure')) {
    actions.push({
      area: 'crop_health',
      priority: 'critical',
      action: 'Create field scouting task and record observed pest evidence',
      evidence: 'pest_pressure signal'
    });
  }
  if (signals.includes('certification_renewal_due')) {
    actions.push({
      area: 'compliance',
      priority: 'high',
      action: 'Prepare renewal documents and schedule inspection',
      evidence: 'certification_renewal_due signal'
    });
  }

  if (actions.length === 0) {
    actions.push({
      area: source.advisoryType ?? 'general',
      priority: normalizePriority(source.priority),
      action: source.recommendedAction ?? 'Review farmer context and create a local follow-up task',
      evidence: 'manual_or_contextual_advisory'
    });
  }

  return actions;
}

function derivePriority(actions) {
  if (actions.some(action => action.priority === 'critical')) return 'critical';
  if (actions.some(action => action.priority === 'high')) return 'high';
  if (actions.some(action => action.priority === 'medium')) return 'medium';
  return 'low';
}

function normalizeAdvisory(payload = {}, existing = {}) {
  const source = existing.data ? { ...existing.data, ...payload } : { ...existing, ...payload };
  const actions = buildAdvisoryActions(source);
  const priority = derivePriority(actions);

  return {
    moduleId: MODULE_ID,
    farmerId: source.farmerId ?? source.farmer_id ?? null,
    advisoryType: source.advisoryType ?? source.advisory_type ?? 'general',
    title: source.title ?? `${MODULE_NAME}: ${source.advisoryType ?? 'general'}`,
    context: source.context ?? {},
    signals: asArray(source.signals),
    actions,
    priority,
    status: source.status ?? 'open',
    dueDate: source.dueDate ?? source.due_date ?? null,
    assignedTo: source.assignedTo ?? source.assigned_to ?? null,
    aiCompatibility: {
      canEnrichWithClaude: true,
      requiresExternalData: false,
      inputContract: ['farmerId', 'advisoryType', 'context', 'signals']
    },
    updatedAt: new Date().toISOString()
  };
}

async function listItems({ page = 1, limit = 20, farmerId, advisoryType, status, priority } = {}) {
  const client = pg();
  const safePage = Math.max(parseInt(page, 10) || 1, 1);
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  const offset = (safePage - 1) * safeLimit;
  const filters = [];
  const params = [];

  if (farmerId) {
    params.push(farmerId);
    filters.push(`data->>'farmerId' = $${params.length}`);
  }
  if (advisoryType) {
    params.push(advisoryType);
    filters.push(`data->>'advisoryType' = $${params.length}`);
  }
  if (status) {
    params.push(status);
    filters.push(`data->>'status' = $${params.length}`);
  }
  if (priority) {
    params.push(priority);
    filters.push(`data->>'priority' = $${params.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const totalRes = await client.query(`SELECT COUNT(*) FROM ${tableName} ${where}`, params);
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  const res = await client.query(
    `SELECT * FROM ${tableName} ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  return {
    items: res.rows.map(row => ({ ...row, data: normalizeAdvisory(row.data || {}, row) })),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
  };
}

async function getItem(id) {
  const res = await pg().query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  const row = res.rows[0];
  return row ? { ...row, data: normalizeAdvisory(row.data || {}, row) } : null;
}

async function createItem(payload) {
  const data = normalizeAdvisory(payload);
  const res = await pg().query(
    `INSERT INTO ${tableName} (data, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *`,
    [data]
  );
  return res.rows[0];
}

async function updateItem(id, payload) {
  const current = await getItem(id);
  if (!current) return null;
  const data = normalizeAdvisory(payload, current);
  const res = await pg().query(
    `UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
    [data, id]
  );
  return res.rows[0] || null;
}

async function deleteItem(id) {
  const res = await pg().query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

async function generateAdvisoryPlan(parameters = {}) {
  const advisory = normalizeAdvisory(parameters);
  return {
    farmerId: advisory.farmerId,
    moduleId: MODULE_ID,
    advisoryType: advisory.advisoryType,
    priority: advisory.priority,
    actions: advisory.actions,
    escalationRequired: advisory.priority === 'critical',
    claudePromptContext: {
      title: advisory.title,
      context: advisory.context,
      signals: advisory.signals,
      actions: advisory.actions
    }
  };
}

async function getOpenActionSummary(farmerId) {
  const records = await listItems({ farmerId, status: 'open', limit: 100 });
  const advisories = records.items.map(item => item.data);

  return {
    farmerId,
    openAdvisories: advisories.length,
    criticalCount: advisories.filter(item => item.priority === 'critical').length,
    highCount: advisories.filter(item => item.priority === 'high').length,
    actions: advisories.flatMap(item => item.actions.map(action => ({
      advisoryType: item.advisoryType,
      dueDate: item.dueDate,
      ...action
    })))
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
    case 'generatePlan':
      return { success: true, data: await generateAdvisoryPlan(parameters) };
    case 'summary':
    case 'analyze':
      return { success: true, data: await getOpenActionSummary(parameters.farmerId) };
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
  generateAdvisoryPlan,
  getOpenActionSummary,
  healthCheck,
  execute
};
