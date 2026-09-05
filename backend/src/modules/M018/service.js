// Service for Privacy Controls (M018) - AI Enhanced
// Comprehensive privacy controls with data masking, risk assessment, and AI analysis
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const crypto = require('crypto');

// Data access management
async function createDataAccessPolicy(policyData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { resourceName, accessLevel, allowedRoles, dataFields, retentionPeriod, maskingRules } = policyData;
  
  const res = await pg.query(
    `INSERT INTO data_access_policies (resource_name, access_level, allowed_roles, data_fields, retention_period, masking_rules, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
     RETURNING *`,
    [resourceName, accessLevel, JSON.stringify(allowedRoles || []), JSON.stringify(dataFields || []), retentionPeriod, JSON.stringify(maskingRules || [])]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'data_access_policy',
    policyId: res.rows[0].id,
    resourceName,
    accessLevel
  }, {
    severity: SEVERITY.INFO,
    source: 'privacy_controls_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getDataAccessPolicies({ resourceName, accessLevel } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM data_access_policies WHERE is_active = true';
  const params = [];
  let paramIndex = 1;
  
  if (resourceName) {
    query += ` AND resource_name = $${paramIndex++}`;
    params.push(resourceName);
  }
  if (accessLevel) {
    query += ` AND access_level = $${paramIndex++}`;
    params.push(accessLevel);
  }
  
  query += ' ORDER BY resource_name';
  
  let res = await pg.query(query, params);
  return res.rows;
}

async function checkDataAccess(userId, resourceName, accessLevel) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get user's roles
  const userRoles = await pg.query(
    `SELECT r.name FROM roles r
     JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  
  const roleNames = userRoles.rows.map(r => r.name);
  
  // Get policy for resource
  const policyRes = await pg.query(
    'SELECT * FROM data_access_policies WHERE resource_name = $1 AND is_active = true',
    [resourceName]
  );
  
  if (policyRes.rows.length === 0) {
    return { allowed: false, reason: 'No policy found for resource' };
  }
  
  const policy = policyRes.rows[0];
  
  // Check if user's role is allowed
  const allowedRoles = policy.allowed_roles || [];
  const hasAllowedRole = roleNames.some(role => allowedRoles.includes(role));
  
  if (!hasAllowedRole) {
    return { allowed: false, reason: 'User does not have required role' };
  }
  
  // Check access level
  const accessLevels = ['read', 'write', 'admin'];
  const userAccessLevel = accessLevels.indexOf(accessLevel);
  const policyAccessLevel = accessLevels.indexOf(policy.access_level);
  
  if (userAccessLevel > policyAccessLevel) {
    return { allowed: false, reason: 'Insufficient access level' };
  }
  
  return { allowed: true, policy, maskingRules: policy.masking_rules };
}

// Data masking and redaction
async function applyDataMasking(data, maskingRules) {
  const maskedData = { ...data };
  
  for (const rule of maskingRules) {
    const { field, maskType, maskChar = '*', visibleChars = 0 } = rule;
    
    if (maskedData[field]) {
      switch (maskType) {
        case 'full':
          maskedData[field] = maskChar.repeat(maskedData[field].length);
          break;
        case 'partial': {
          const value = maskedData[field].toString();
          if (value.length > visibleChars) {
            maskedData[field] = value.substring(0, visibleChars) + maskChar.repeat(value.length - visibleChars);
          }
          break;
        }
        case 'email': {
          const email = maskedData[field];
          const [local, domain] = email.split('@');
          maskedData[field] = local.substring(0, 2) + maskChar.repeat(local.length - 2) + '@' + domain;
          break;
        }
        case 'phone': {
          const phone = maskedData[field];
          maskedData[field] = phone.substring(0, 3) + maskChar.repeat(phone.length - 3);
          break;
        }
        case 'hash':
          maskedData[field] = crypto.createHash('sha256').update(maskedData[field]).digest('hex');
          break;
        default:
          break;
      }
    }
  }
  
  return maskedData;
}

async function createMaskingRule(ruleData) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { field, maskType, maskChar, visibleChars, appliesToResources } = ruleData;
  
  let res = await pg.query(
    `INSERT INTO masking_rules (field, mask_type, mask_char, visible_chars, applies_to_resources, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING *`,
    [field, maskType, maskChar, visibleChars, JSON.stringify(appliesToResources || [])]
  );
  
  return res.rows[0];
}

async function getMaskingRules({ resource } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM masking_rules WHERE is_active = true';
  let params = [];
  let paramIndex = 1;
  
  if (resource) {
    query += ` AND $${paramIndex++} = ANY(applies_to_resources)`;
    params.push(resource);
  }
  
  query += ' ORDER BY field';
  
  let res = await pg.query(query, params);
  return res.rows;
}

// Privacy policy management
async function createPrivacyPolicy(policyData) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, description, policyText, effectiveDate, categories } = policyData;
  
  let res = await pg.query(
    `INSERT INTO privacy_policies (name, description, policy_text, effective_date, categories, is_active, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     RETURNING *`,
    [name, description, policyText, effectiveDate, JSON.stringify(categories || [])]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'privacy_policy',
    policyId: res.rows[0].id,
    policyName: name
  }, {
    severity: SEVERITY.INFO,
    source: 'privacy_controls_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getPrivacyPolicies({ activeOnly = true } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM privacy_policies';
  if (activeOnly) {
    query += ' WHERE is_active = true';
  }
  query += ' ORDER BY effective_date DESC';
  
  let res = await pg.query(query);
  return res.rows;
}

async function acceptPrivacyPolicy(userId, policyId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    `INSERT INTO privacy_policy_acceptances (user_id, policy_id, accepted_at, created_at)
     VALUES ($1, $2, NOW(), NOW())
     ON CONFLICT (user_id, policy_id) DO UPDATE SET
       accepted_at = NOW()
     RETURNING *`,
    [userId, policyId]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'privacy_policy_acceptance',
    userId,
    policyId,
    action: 'accepted'
  }, {
    severity: SEVERITY.INFO,
    source: 'privacy_controls_service',
    entityId: userId
  });
  
  return res.rows[0];
}

// AI-powered privacy risk assessment
async function assessPrivacyRisk(userId, dataOperation) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { operationType, dataCategories, dataVolume, destination } = dataOperation;
  
  let riskScore = 0;
  const riskFactors = [];
  
  // Assess based on data categories
  const sensitiveCategories = ['personal', 'financial', 'health', 'biometric'];
  const hasSensitiveData = dataCategories.some(cat => sensitiveCategories.includes(cat));
  
  if (hasSensitiveData) {
    riskScore += 30;
    riskFactors.push({ type: 'sensitive_data', impact: 30, description: 'Contains sensitive data categories' });
  }
  
  // Assess based on operation type
  const highRiskOperations = ['export', 'share', 'transfer'];
  if (highRiskOperations.includes(operationType)) {
    riskScore += 25;
    riskFactors.push({ type: 'high_risk_operation', impact: 25, description: 'High-risk operation type' });
  }
  
  // Assess based on data volume
  if (dataVolume > 1000) {
    riskScore += 20;
    riskFactors.push({ type: 'large_volume', impact: 20, description: 'Large data volume' });
  }
  
  // Assess based on destination
  if (destination && destination.type === 'external') {
    riskScore += 25;
    riskFactors.push({ type: 'external_destination', impact: 25, description: 'External data destination' });
  }
  
  // Calculate final risk level
  const riskLevel = riskScore >= 70 ? 'critical' : riskScore >= 50 ? 'high' : riskScore >= 30 ? 'medium' : 'low';
  
  // Emit signal for critical risks
  if (riskLevel === 'critical') {
    signalBus.emitSignal(SIGNAL.RISK_CRITICAL, {
      userId,
      operation: dataOperation,
      riskScore,
      riskFactors
    }, {
      severity: SEVERITY.CRITICAL,
      source: 'privacy_controls_service',
      entityId: userId
    });
  }
  
  return {
    userId,
    riskScore,
    riskLevel,
    riskFactors,
    recommendations: generatePrivacyRecommendations(riskLevel, riskFactors)
  };
}

function generatePrivacyRecommendations(riskLevel, riskFactors) {
  const recommendations = [];
  
  if (riskLevel === 'critical') {
    recommendations.push({
      type: 'require_approval',
      message: 'Critical risk: Requires manual approval before proceeding',
      priority: 'critical'
    });
  }
  
  if (riskLevel === 'high' || riskLevel === 'critical') {
    recommendations.push({
      type: 'apply_masking',
      message: 'Apply data masking to sensitive fields',
      priority: 'high'
    });
    
    recommendations.push({
      type: 'log_activity',
      message: 'Log this operation for audit trail',
      priority: 'high'
    });
  }
  
  if (riskFactors.some(f => f.type === 'external_destination')) {
    recommendations.push({
      type: 'encrypt_data',
      message: 'Encrypt data before external transfer',
      priority: 'high'
    });
  }
  
  return recommendations;
}

// Privacy impact analysis
async function performPrivacyImpactAnalysis(userId, proposedChange) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { changeType, affectedResources, dataCategories, affectedUsers } = proposedChange;
  
  const impacts = [];
  
  // Analyze impact on existing policies
  const existingPolicies = await getDataAccessPolicies();
  const affectedPolicies = existingPolicies.filter(policy => 
    affectedResources.includes(policy.resource_name)
  );
  
  if (affectedPolicies.length > 0) {
    impacts.push({
      type: 'policy_impact',
      description: `${affectedPolicies.length} data access policies will be affected`,
      affectedPolicies: affectedPolicies.map(p => p.resource_name)
    });
  }
  
  // Analyze impact on consent requirements
  const consentCategories = await pg.query('SELECT name FROM consent_categories WHERE required = true');
  const affectedConsents = consentCategories.rows.filter(cat => 
    dataCategories.includes(cat.name)
  );
  
  if (affectedConsents.length > 0) {
    impacts.push({
      type: 'consent_impact',
      description: `${affectedConsents.length} consent categories require user consent`,
      affectedConsents: affectedConsents.map(c => c.name)
    });
  }
  
  // Calculate overall impact score
  const impactScore = impacts.length * 20 + (affectedUsers ? affectedUsers.length * 5 : 0);
  const impactLevel = impactScore >= 80 ? 'high' : impactScore >= 50 ? 'medium' : 'low';
  
  return {
    userId,
    changeType,
    impactScore,
    impactLevel,
    impacts,
    recommendations: generateImpactRecommendations(impactLevel, impacts)
  };
}

function generateImpactRecommendations(impactLevel, impacts) {
  let recommendations = [];
  
  if (impactLevel === 'high') {
    recommendations.push({
      type: 'privacy_review',
      message: 'Requires formal privacy review before implementation',
      priority: 'high'
    });
    
    recommendations.push({
      type: 'user_notification',
      message: 'Notify affected users about privacy changes',
      priority: 'high'
    });
  }
  
  if (impacts.some(i => i.type === 'consent_impact')) {
    recommendations.push({
      type: 'consent_collection',
      message: 'Collect updated consent from affected users',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

// Privacy compliance monitoring
async function getPrivacyComplianceStatus() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get policy compliance
  const activePolicies = await pg.query('SELECT COUNT(*) as count FROM privacy_policies WHERE is_active = true');
  const expiredPolicies = await pg.query('SELECT COUNT(*) as count FROM privacy_policies WHERE effective_date < NOW() - INTERVAL \'1 year\'');
  
  // Get consent compliance
  const requiredConsents = await pg.query('SELECT COUNT(*) as count FROM consent_categories WHERE required = true');
  const userConsentCompliance = await pg.query(`
    SELECT 
      u.id,
      COUNT(DISTINCT cc.name) as total_required,
      COUNT(DISTINCT c.id) as user_consents
    FROM users u
    CROSS JOIN consent_categories cc ON cc.required = true
    LEFT JOIN consents c ON c.user_id = u.id AND c.consent_category = cc.name AND c.status = 'active'
    GROUP BY u.id
  `);
  
  const nonCompliantUsers = userConsentCompliance.rows.filter(u => u.user_consents < u.total_required);
  
  // Calculate overall compliance score
  const policyScore = activePolicies.rows[0].count > 0 ? 100 : 0;
  const consentScore = userConsentCompliance.rows.length > 0 
    ? ((userConsentCompliance.rows.length - nonCompliantUsers.length) / userConsentCompliance.rows.length) * 100 
    : 100;
  const overallScore = (policyScore + consentScore) / 2;
  
  return {
    policyCompliance: {
      activePolicies: parseInt(activePolicies.rows[0].count),
      expiredPolicies: parseInt(expiredPolicies.rows[0].count),
      score: policyScore
    },
    consentCompliance: {
      totalUsers: userConsentCompliance.rows.length,
      compliantUsers: userConsentCompliance.rows.length - nonCompliantUsers.length,
      nonCompliantUsers: nonCompliantUsers.length,
      score: consentScore
    },
    overallScore: Math.round(overallScore),
    complianceLevel: overallScore >= 80 ? 'compliant' : overallScore >= 60 ? 'partially_compliant' : 'non_compliant'
  };
}

// Data retention management
async function enforceDataRetention() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const policies = await getDataAccessPolicies();
  const expiredData = [];
  
  for (const policy of policies) {
    if (policy.retention_period) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(policy.retention_period));
      
      // This would be implemented with actual data deletion logic
      // For now, we'll just log the action
      logger.info('Data retention check', {
        resource: policy.resource_name,
        retentionPeriod: policy.retention_period,
        cutoffDate: cutoffDate.toISOString()
      });
      
      expiredData.push({
        resource: policy.resource_name,
        retentionPeriod: policy.retention_period,
        cutoffDate: cutoffDate.toISOString()
      });
    }
  }
  
  return {
    checkedPolicies: policies.length,
    expiredData
  };
}

module.exports = {
  // Data access management
  createDataAccessPolicy,
  getDataAccessPolicies,
  checkDataAccess,
  
  // Data masking
  applyDataMasking,
  createMaskingRule,
  getMaskingRules,
  
  // Privacy policy management
  createPrivacyPolicy,
  getPrivacyPolicies,
  acceptPrivacyPolicy,
  
  // AI-powered risk assessment
  assessPrivacyRisk,
  
  // Privacy impact analysis
  performPrivacyImpactAnalysis,
  
  // Compliance monitoring
  getPrivacyComplianceStatus,
  
  // Data retention
  enforceDataRetention,
};