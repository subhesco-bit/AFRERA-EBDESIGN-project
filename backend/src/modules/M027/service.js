/**
 * Farmer Certification Service (M027)
 *
 * Domain implementation over farmer_m027_items. It stores certification
 * records as structured JSONB and provides deterministic status/compliance
 * assessment without fabricating external verification.
 */

const { getPostgreSQL } = require('../../database/connection');

const MODULE_ID = 'M027';
const MODULE_NAME = 'Farmer Certification';
const tableName = 'farmer_m027_items';

function pg() {
  const client = getPostgreSQL();
  if (!client) throw new Error('Database not initialized');
  return client;
}

function daysUntil(dateValue) {
  if (!dateValue) return null;
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function calculateComplianceScore({ verificationStatus, documents, daysToExpiry, auditFindings }) {
  let score = 40;
  if (verificationStatus === 'verified') score += 30;
  if (verificationStatus === 'pending') score += 10;
  score += Math.min((documents || []).length * 8, 24);
  if (daysToExpiry !== null && daysToExpiry < 0) score = Math.min(score, 30);
  if (daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0) score -= 15;
  score -= Math.min((auditFindings || []).length * 10, 30);
  return Math.min(100, Math.max(0, Math.round(score)));
}

function inferStatus(source, daysToExpiry) {
  if (source.status) return source.status;
  if (daysToExpiry !== null && daysToExpiry < 0) return 'expired';
  if (daysToExpiry !== null && daysToExpiry <= 30) return 'renewal_due';
  if (source.verificationStatus === 'verified' || source.verification_status === 'verified') return 'active';
  return 'pending_verification';
}

function normalizeCertification(payload = {}, existing = {}) {
  const source = existing.data ? { ...existing.data, ...payload } : { ...existing, ...payload };
  const documents = Array.isArray(source.documents) ? source.documents : [];
  const auditFindings = Array.isArray(source.auditFindings) ? source.auditFindings : [];
  const verificationStatus = source.verificationStatus ?? source.verification_status ?? 'pending';
  const expiryDate = source.expiryDate ?? source.expiry_date ?? null;
  const daysToExpiry = daysUntil(expiryDate);
  const complianceScore = calculateComplianceScore({ verificationStatus, documents, daysToExpiry, auditFindings });

  return {
    moduleId: MODULE_ID,
    farmerId: source.farmerId ?? source.farmer_id ?? null,
    certificationType: source.certificationType ?? source.certification_type ?? source.type ?? 'general',
    certificateNumber: source.certificateNumber ?? source.certificate_number ?? null,
    issuer: source.issuer ?? null,
    issueDate: source.issueDate ?? source.issue_date ?? null,
    expiryDate,
    daysToExpiry,
    scope: source.scope ?? {},
    crops: Array.isArray(source.crops) ? source.crops : [],
    documents,
    auditFindings,
    verificationStatus,
    status: inferStatus(source, daysToExpiry),
    complianceScore,
    aiSignals: buildCertificationSignals({ daysToExpiry, complianceScore, auditFindings }),
    updatedAt: new Date().toISOString()
  };
}

function buildCertificationSignals({ daysToExpiry, complianceScore, auditFindings }) {
  const signals = [];
  if (complianceScore >= 80) signals.push('market_ready');
  if (daysToExpiry !== null && daysToExpiry <= 30 && daysToExpiry >= 0) signals.push('renewal_due');
  if (daysToExpiry !== null && daysToExpiry < 0) signals.push('expired');
  if (auditFindings.length > 0) signals.push('audit_remediation_required');
  return signals;
}

async function listItems({ page = 1, limit = 20, farmerId, type, status } = {}) {
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
  if (type) {
    params.push(type);
    filters.push(`data->>'certificationType' = $${params.length}`);
  }
  if (status) {
    params.push(status);
    filters.push(`data->>'status' = $${params.length}`);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
  const totalRes = await client.query(`SELECT COUNT(*) FROM ${tableName} ${where}`, params);
  const total = parseInt(totalRes.rows[0].count || '0', 10);
  const res = await client.query(
    `SELECT * FROM ${tableName} ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, safeLimit, offset]
  );

  return {
    items: res.rows.map(row => ({ ...row, data: normalizeCertification(row.data || {}, row) })),
    pagination: { page: safePage, limit: safeLimit, total, totalPages: Math.ceil(total / safeLimit) }
  };
}

async function getItem(id) {
  let res = await pg().query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  const row = res.rows[0];
  return row ? { ...row, data: normalizeCertification(row.data || {}, row) } : null;
}

async function createItem(payload) {
  const data = normalizeCertification(payload);
  let res = await pg().query(
    `INSERT INTO ${tableName} (data, created_at, updated_at) VALUES ($1, NOW(), NOW()) RETURNING *`,
    [data]
  );
  return res.rows[0];
}

async function updateItem(id, payload) {
  const current = await getItem(id);
  if (!current) return null;
  let data = normalizeCertification(payload, current);
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

async function getCertificationPortfolio(farmerId) {
  const records = await listItems({ farmerId, limit: 100 });
  const certifications = records.items.map(item => item.data);

  return {
    farmerId,
    moduleId: MODULE_ID,
    certificationCount: certifications.length,
    activeCount: certifications.filter(item => item.status === 'active').length,
    renewalDueCount: certifications.filter(item => item.status === 'renewal_due').length,
    expiredCount: certifications.filter(item => item.status === 'expired').length,
    averageComplianceScore: certifications.length
      ? Math.round(certifications.reduce((sum, item) => sum + item.complianceScore, 0) / certifications.length)
      : 0,
    certifications
  };
}

async function recommendCertificationPath(farmerId, targetMarket = 'premium_marketplace') {
  const portfolio = await getCertificationPortfolio(farmerId);
  const activeTypes = new Set(portfolio.certifications.filter(item => item.status === 'active').map(item => item.certificationType));
  const baseline = ['organic', 'food_safety', 'traceability'];
  const missing = baseline.filter(type => !activeTypes.has(type));

  return {
    farmerId,
    targetMarket,
    missingCertifications: missing,
    renewalActions: portfolio.certifications
      .filter(item => item.status === 'renewal_due' || item.status === 'expired')
      .map(item => ({
        certificationType: item.certificationType,
        certificateNumber: item.certificateNumber,
        action: item.status === 'expired' ? 'Reapply or restore certification' : 'Submit renewal before expiry'
      })),
    marketReadiness: missing.length === 0 && portfolio.expiredCount === 0 ? 'ready' : 'action_required'
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
    case 'portfolio':
    case 'analyze':
      return { success: true, data: await getCertificationPortfolio(parameters.farmerId) };
    case 'recommendPath':
      return { success: true, data: await recommendCertificationPath(parameters.farmerId, parameters.targetMarket) };
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
  getCertificationPortfolio,
  recommendCertificationPath,
  healthCheck,
  execute
};
