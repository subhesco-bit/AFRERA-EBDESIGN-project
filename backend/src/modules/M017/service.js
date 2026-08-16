// Service for Consent Management (M017) - AI Enhanced
// Comprehensive consent management with GDPR compliance and AI analysis
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Consent management
async function createConsent(consentData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { userId, consentType, consentCategory, consentText, dataCategories, validityPeriod } = consentData;
  
  const res = await pg.query(
    `INSERT INTO consents (user_id, consent_type, consent_category, consent_text, data_categories, valid_from, valid_until, version, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '${validityPeriod || '365 days'}', 1, 'active', NOW(), NOW())
     RETURNING *`,
    [userId, consentType, consentCategory, consentText, JSON.stringify(dataCategories || [])]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'consent',
    consentId: res.rows[0].id,
    userId,
    consentType,
    consentCategory
  }, {
    severity: SEVERITY.INFO,
    source: 'consent_management_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getUserConsents(userId, { category, status } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM consents WHERE user_id = $1';
  const params = [userId];
  let paramIndex = 2;
  
  if (category) {
    query += ` AND consent_category = $${paramIndex++}`;
    params.push(category);
  }
  if (status) {
    query += ` AND status = $${paramIndex++}`;
    params.push(status);
  }
  
  query += ' ORDER BY created_at DESC';
  
  const res = await pg.query(query, params);
  return res.rows;
}

async function getConsent(consentId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT * FROM consents WHERE id = $1', [consentId]);
  return res.rows[0] || null;
}

async function updateConsent(consentId, updates) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { consentText, dataCategories, status } = updates;
  
  const res = await pg.query(
    `UPDATE consents 
     SET consent_text = COALESCE($1, consent_text),
         data_categories = COALESCE($2, data_categories),
         status = COALESCE($3, status),
         updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [consentText, dataCategories ? JSON.stringify(dataCategories) : null, status, consentId]
  );
  
  // Emit signal for consent update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'consent',
    consentId,
    action: 'updated'
  }, {
    severity: SEVERITY.INFO,
    source: 'consent_management_service',
    entityId: consentId
  });
  
  return res.rows[0] || null;
}

async function revokeConsent(consentId, reason) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `UPDATE consents 
     SET status = 'revoked', revoked_at = NOW(), revoked_reason = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [reason, consentId]
  );
  
  // Emit signal for consent revocation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'consent',
    consentId,
    action: 'revoked',
    reason
  }, {
    severity: SEVERITY.WARNING,
    source: 'consent_management_service',
    entityId: consentId
  });
  
  return res.rows[0] || null;
}

// Consent category management
async function createConsentCategory(categoryData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, description, required, dataTypes, retentionPeriod } = categoryData;
  
  const res = await pg.query(
    `INSERT INTO consent_categories (name, description, required, data_types, retention_period, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     RETURNING *`,
    [name, description, required || false, JSON.stringify(dataTypes || []), retentionPeriod]
  );
  
  return res.rows[0];
}

async function getConsentCategories() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT * FROM consent_categories ORDER BY name');
  return res.rows;
}

// Consent template management
async function createConsentTemplate(templateData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, consentType, consentCategory, consentText, dataCategories, validityPeriod } = templateData;
  
  const res = await pg.query(
    `INSERT INTO consent_templates (name, consent_type, consent_category, consent_text, data_categories, validity_period, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
     RETURNING *`,
    [name, consentType, consentCategory, consentText, JSON.stringify(dataCategories || []), validityPeriod]
  );
  
  return res.rows[0];
}

async function getConsentTemplates({ consentType, consentCategory } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM consent_templates WHERE is_active = true';
  const params = [];
  let paramIndex = 1;
  
  if (consentType) {
    query += ` AND consent_type = $${paramIndex++}`;
    params.push(consentType);
  }
  if (consentCategory) {
    query += ` AND consent_category = $${paramIndex++}`;
    params.push(consentCategory);
  }
  
  query += ' ORDER BY name';
  
  const res = await pg.query(query, params);
  return res.rows;
}

async function applyConsentTemplate(userId, templateId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get template
  const templateRes = await pg.query('SELECT * FROM consent_templates WHERE id = $1', [templateId]);
  const template = templateRes.rows[0];
  
  if (!template) {
    return { success: false, error: 'Template not found' };
  }
  
  // Create consent from template
  const consent = await createConsent({
    userId,
    consentType: template.consent_type,
    consentCategory: template.consent_category,
    consentText: template.consent_text,
    dataCategories: template.data_categories,
    validityPeriod: template.validity_period
  });
  
  return { success: true, data: consent };
}

// AI-powered consent analysis
async function analyzeConsentCompliance(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get user's consents
  const userConsents = await getUserConsents(userId);
  
  // Get required consent categories
  const requiredCategories = await pg.query(
    'SELECT * FROM consent_categories WHERE required = true'
  );
  
  // Check for missing required consents
  const missingConsents = [];
  requiredCategories.rows.forEach(category => {
    const hasConsent = userConsents.some(c => 
      c.consent_category === category.name && c.status === 'active'
    );
    if (!hasConsent) {
      missingConsents.push(category);
    }
  });
  
  // Check for expired consents
  const expiredConsents = userConsents.filter(c => 
    c.status === 'active' && new Date(c.valid_until) < new Date()
  );
  
  // Calculate compliance score
  const totalRequired = requiredCategories.rows.length;
  const compliantRequired = totalRequired - missingConsents.length;
  const complianceScore = totalRequired > 0 ? (compliantRequired / totalRequired) * 100 : 100;
  
  return {
    userId,
    complianceScore: Math.round(complianceScore),
    missingConsents,
    expiredConsents,
    totalConsents: userConsents.length,
    activeConsents: userConsents.filter(c => c.status === 'active').length,
    recommendations: generateConsentRecommendations(missingConsents, expiredConsents)
  };
}

function generateConsentRecommendations(missingConsents, expiredConsents) {
  const recommendations = [];
  
  if (missingConsents.length > 0) {
    recommendations.push({
      type: 'compliance',
      message: `${missingConsents.length} required consent(s) missing. User should be prompted to give consent.`,
      priority: 'high',
      categories: missingConsents.map(c => c.name)
    });
  }
  
  if (expiredConsents.length > 0) {
    recommendations.push({
      type: 'renewal',
      message: `${expiredConsents.length} consent(s) expired. User should be prompted to renew.`,
      priority: 'medium',
      consentIds: expiredConsents.map(c => c.id)
    });
  }
  
  return recommendations;
}

// Consent history and audit
async function getConsentHistory(consentId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM consent_history 
     WHERE consent_id = $1 
     ORDER BY created_at DESC`,
    [consentId]
  );
  
  return res.rows;
}

async function logConsentEvent(consentId, eventType, details) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    `INSERT INTO consent_history (consent_id, event_type, details, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [consentId, eventType, JSON.stringify(details)]
  );
}

// Automated consent expiration
async function checkExpiredConsents() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `UPDATE consents 
     SET status = 'expired', updated_at = NOW()
     WHERE status = 'active' AND valid_until < NOW()
     RETURNING *`
  );
  
  // Emit signal for each expired consent
  res.rows.forEach(consent => {
    signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
      entityType: 'consent',
      consentId: consent.id,
      userId: consent.user_id,
      action: 'expired'
    }, {
      severity: SEVERITY.WARNING,
      source: 'consent_management_service',
      entityId: consent.id
    });
  });
  
  return {
    expiredCount: res.rows.length,
    expiredConsents: res.rows
  };
}

// Consent analytics
async function getConsentAnalytics({ startDate, endDate, consentCategory } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      consent_category,
      status,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM consents
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  if (consentCategory) {
    query += ` AND consent_category = $${paramIndex++}`;
    params.push(consentCategory);
  }
  
  query += ` GROUP BY consent_category, status, DATE(created_at) ORDER BY date DESC`;
  
  const res = await pg.query(query, params);
  
  return {
    data: res.rows,
    totalConsents: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    byCategory: groupBy(res.rows, 'consent_category'),
    byStatus: groupBy(res.rows, 'status')
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

// Bulk consent operations
async function bulkCreateConsents(consents) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const results = [];
  
  for (const consentData of consents) {
    try {
      const consent = await createConsent(consentData);
      results.push({ success: true, consent });
    } catch (error) {
      results.push({ success: false, error: error.message, consentData });
    }
  }
  
  return {
    total: consents.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

module.exports = {
  // Consent management
  createConsent,
  getUserConsents,
  getConsent,
  updateConsent,
  revokeConsent,
  
  // Consent category management
  createConsentCategory,
  getConsentCategories,
  
  // Consent template management
  createConsentTemplate,
  getConsentTemplates,
  applyConsentTemplate,
  
  // AI-powered analysis
  analyzeConsentCompliance,
  
  // Consent history and audit
  getConsentHistory,
  logConsentEvent,
  
  // Automated expiration
  checkExpiredConsents,
  
  // Analytics
  getConsentAnalytics,
  
  // Bulk operations
  bulkCreateConsents,
};