// Service for Identity Federation (M016) - AI Enhanced
// Comprehensive identity federation with cross-platform management and AI analysis
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TRUST_LEVELS = new Set(['trusted', 'verified', 'unknown', 'revoked']);

function validationError(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  error.statusCode = 400;
  return error;
}

function requireIdentityId(identityId) {
  if (!/^[1-9][0-9]*$/.test(String(identityId))) throw validationError('identityId must be a positive integer');
  return Number(identityId);
}

function requireProvider(provider) {
  if (typeof provider !== 'string' || provider.trim().length === 0 || provider.length > 100) {
    throw validationError('provider is required and must be at most 100 characters');
  }
  return provider.trim();
}

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw validationError(`${name} must be an object`);
}

// Federated identity management
async function createFederatedIdentity(identityData) {
  requireObject(identityData, 'identity payload');
  const { userId, provider, providerUserId, attributes, trustLevel } = identityData;
  if (typeof userId !== 'string' || !UUID_RE.test(userId)) throw validationError('userId must be a valid UUID');
  requireProvider(provider);
  if (typeof providerUserId !== 'string' || providerUserId.trim().length === 0 || providerUserId.length > 255) throw validationError('providerUserId is required and must be at most 255 characters');
  if (attributes !== undefined) requireObject(attributes, 'attributes');
  if (trustLevel !== undefined && !TRUST_LEVELS.has(trustLevel)) throw validationError('trustLevel is invalid');
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `INSERT INTO federated_identities (user_id, provider, provider_user_id, attributes, trust_level, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (user_id, provider) DO UPDATE SET
       provider_user_id = EXCLUDED.provider_user_id,
       attributes = EXCLUDED.attributes,
       trust_level = COALESCE(EXCLUDED.trust_level, federated_identities.trust_level),
       updated_at = NOW()
     RETURNING *`,
    [userId, provider, providerUserId, JSON.stringify(attributes), trustLevel || 'trusted']
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'federated_identity',
    identityId: res.rows[0].id,
    userId,
    provider
  }, {
    severity: SEVERITY.INFO,
    source: 'identity_federation_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function getFederatedIdentities(userId) {
  if (typeof userId !== 'string' || !UUID_RE.test(userId)) throw validationError('userId must be a valid UUID');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    'SELECT * FROM federated_identities WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  
  return res.rows;
}

async function getFederatedIdentity(identityId) {
  identityId = requireIdentityId(identityId);
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    'SELECT * FROM federated_identities WHERE id = $1',
    [identityId]
  );
  
  return res.rows[0] || null;
}

async function updateFederatedIdentity(identityId, updates) {
  identityId = requireIdentityId(identityId);
  requireObject(updates, 'update payload');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { attributes, trustLevel } = updates;
  if (attributes !== undefined) requireObject(attributes, 'attributes');
  if (trustLevel !== undefined && !TRUST_LEVELS.has(trustLevel)) throw validationError('trustLevel is invalid');
  
  let res = await pg.query(
    `UPDATE federated_identities 
     SET attributes = COALESCE($1, attributes),
         trust_level = COALESCE($2, trust_level),
         updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [attributes ? JSON.stringify(attributes) : null, trustLevel, identityId]
  );
  
  return res.rows[0] || null;
}

async function revokeFederatedIdentity(identityId) {
  identityId = requireIdentityId(identityId);
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    'UPDATE federated_identities SET trust_level = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    ['revoked', identityId]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'federated_identity',
    identityId,
    action: 'revoked'
  }, {
    severity: SEVERITY.WARNING,
    source: 'identity_federation_service',
    entityId: identityId
  });
  
  return res.rows[0] || null;
}

// Identity attribute mapping
async function createAttributeMapping(mappingData) {
  requireObject(mappingData, 'mapping payload');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { provider, sourceAttribute, targetAttribute, transformation, isRequired } = mappingData;
  requireProvider(provider);
  if (typeof sourceAttribute !== 'string' || sourceAttribute.trim().length === 0 || typeof targetAttribute !== 'string' || targetAttribute.trim().length === 0) throw validationError('sourceAttribute and targetAttribute are required');
  if (transformation !== undefined) requireObject(transformation, 'transformation');
  if (isRequired !== undefined && typeof isRequired !== 'boolean') throw validationError('isRequired must be boolean');
  
  let res = await pg.query(
    `INSERT INTO identity_attribute_mappings (provider, source_attribute, target_attribute, transformation, is_required, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
     ON CONFLICT (provider, source_attribute) DO UPDATE SET
       target_attribute = EXCLUDED.target_attribute,
       transformation = EXCLUDED.transformation,
       is_required = EXCLUDED.is_required,
       updated_at = NOW()
     RETURNING *`,
    [provider, sourceAttribute, targetAttribute, transformation, isRequired || false]
  );
  
  return res.rows[0];
}

async function getAttributeMappings(provider) {
  requireProvider(provider);
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    'SELECT * FROM identity_attribute_mappings WHERE provider = $1 ORDER BY source_attribute',
    [provider]
  );
  
  return res.rows;
}

async function applyAttributeMapping(provider, sourceAttributes) {
  requireProvider(provider);
  requireObject(sourceAttributes, 'sourceAttributes');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const mappings = await getAttributeMappings(provider);
  const mappedAttributes = {};
  
  for (const mapping of mappings) {
    const sourceValue = sourceAttributes[mapping.source_attribute];
    
    if (sourceValue !== undefined) {
      let targetValue = sourceValue;
      
      // Apply transformation if specified
      if (mapping.transformation) {
        targetValue = applyTransformation(sourceValue, mapping.transformation);
      }
      
      mappedAttributes[mapping.target_attribute] = targetValue;
    } else if (mapping.is_required) {
      throw new Error(`Required attribute ${mapping.source_attribute} not provided`);
    }
  }
  
  return mappedAttributes;
}

function applyTransformation(value, transformation) {
  switch (transformation.type) {
    case 'lowercase':
      return value.toLowerCase();
    case 'uppercase':
      return value.toUpperCase();
    case 'trim':
      return value.trim();
    case 'date_format':
      return new Date(value).toISOString();
    case 'custom':
      // Apply custom transformation logic
      if (transformation.function) {
        // In production, this would use a safe transformation function
        return value;
      }
      return value;
    default:
      return value;
  }
}

// Federation trust management
async function createTrustRelationship(trustData) {
  requireObject(trustData, 'trust payload');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { provider, trustLevel, trustScore, metadata } = trustData;
  requireProvider(provider);
  if (!TRUST_LEVELS.has(trustLevel)) throw validationError('trustLevel is invalid');
  if (trustScore !== undefined && (!Number.isInteger(trustScore) || trustScore < 0 || trustScore > 100)) throw validationError('trustScore must be an integer between 0 and 100');
  if (metadata !== undefined) requireObject(metadata, 'metadata');
  
  let res = await pg.query(
    `INSERT INTO federation_trust (provider, trust_level, trust_score, metadata, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     ON CONFLICT (provider) DO UPDATE SET
       trust_level = EXCLUDED.trust_level,
       trust_score = EXCLUDED.trust_score,
       metadata = EXCLUDED.metadata,
       updated_at = NOW()
     RETURNING *`,
    [provider, trustLevel, trustScore, JSON.stringify(metadata)]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'federation_trust',
    provider,
    trustLevel
  }, {
    severity: SEVERITY.INFO,
    source: 'identity_federation_service'
  });
  
  return res.rows[0];
}

async function getTrustRelationships() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query('SELECT * FROM federation_trust ORDER BY trust_score DESC');
  return res.rows;
}

async function updateTrustScore(provider, delta, reason) {
  requireProvider(provider);
  if (!Number.isInteger(delta) || delta < -100 || delta > 100) throw validationError('delta must be an integer between -100 and 100');
  if (reason !== undefined && (typeof reason !== 'string' || reason.length > 1000)) throw validationError('reason must be at most 1000 characters');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    `UPDATE federation_trust 
     SET trust_score = GREATEST(0, LEAST(100, trust_score + $1)),
         updated_at = NOW()
     WHERE provider = $2
     RETURNING *`,
    [delta, provider]
  );
  
  if (res.rows.length > 0) {
    // Log trust score change
    await pg.query(
      `INSERT INTO trust_score_history (provider, score_change, reason, created_at)
       VALUES ($1, $2, $3, NOW())`,
      [provider, delta, reason]
    );
    
    // Emit signal if trust score drops significantly
    if (delta < -10) {
      signalBus.emitSignal(SIGNAL.RISK_CRITICAL, {
        provider,
        newScore: res.rows[0].trust_score,
        reason
      }, {
        severity: SEVERITY.WARNING,
        source: 'identity_federation_service'
      });
    }
  }
  
  return res.rows[0] || null;
}

// Centralized identity directory
async function searchIdentities(searchCriteria) {
  requireObject(searchCriteria, 'search criteria');
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { provider, userId, email, name, limit = 20 } = searchCriteria;
  if (provider !== undefined) requireProvider(provider);
  if (userId !== undefined && !UUID_RE.test(String(userId))) throw validationError('userId must be a valid UUID');
  if (!Number.isInteger(Number(limit)) || Number(limit) < 1 || Number(limit) > 100) throw validationError('limit must be between 1 and 100');
  
  let query = `
    SELECT fi.*, u.name, u.email 
    FROM federated_identities fi
    JOIN users u ON fi.user_id = u.id
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (provider) {
    query += ` AND fi.provider = $${paramIndex++}`;
    params.push(provider);
  }
  if (userId) {
    query += ` AND fi.user_id = $${paramIndex++}`;
    params.push(userId);
  }
  if (email) {
    query += ` AND u.email ILIKE $${paramIndex++}`;
    params.push(`%${email}%`);
  }
  if (name) {
    query += ` AND u.name ILIKE $${paramIndex++}`;
    params.push(`%${name}%`);
  }
  
  query += ` ORDER BY fi.created_at DESC LIMIT $${paramIndex++}`;
  params.push(limit);
  
  let res = await pg.query(query, params);
  return res.rows;
}

// AI-powered identity pattern analysis
async function analyzeIdentityPatterns() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Analyze provider distribution
  const providerDistribution = await pg.query(`
    SELECT provider, COUNT(*) as count, 
           AVG(CASE WHEN trust_level = 'trusted' THEN 1 ELSE 0 END) as trust_ratio
    FROM federated_identities
    GROUP BY provider
    ORDER BY count DESC
  `);
  
  // Analyze attribute usage patterns
  const attributeUsage = await pg.query(`
    SELECT 
      jsonb_object_keys(attributes) as attribute,
      COUNT(*) as usage_count
    FROM federated_identities
    GROUP BY jsonb_object_keys(attributes)
    ORDER BY usage_count DESC
    LIMIT 10
  `);
  
  // Analyze trust level trends
  const trustTrends = await pg.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as new_identities,
      AVG(CASE WHEN trust_level = 'trusted' THEN 1 ELSE 0 END) as trust_ratio
    FROM federated_identities
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `);
  
  return {
    providerDistribution: providerDistribution.rows,
    attributeUsage: attributeUsage.rows,
    trustTrends: trustTrends.rows,
    recommendations: generateIdentityRecommendations(providerDistribution.rows, attributeUsage.rows)
  };
}

function generateIdentityRecommendations(providerDistribution, attributeUsage) {
  const recommendations = [];
  
  // Check for provider concentration risk
  if (providerDistribution.length > 0) {
    const topProvider = providerDistribution[0];
    const totalIdentities = providerDistribution.reduce((sum, p) => sum + parseInt(p.count), 0);
    const concentration = parseInt(topProvider.count) / totalIdentities;
    
    if (concentration > 0.7) {
      recommendations.push({
        type: 'risk',
        message: `High provider concentration: ${topProvider.provider} accounts for ${(concentration * 100).toFixed(1)}% of federated identities. Consider diversifying identity providers.`,
        priority: 'high'
      });
    }
  }
  
  // Check for missing common attributes
  const commonAttributes = ['email', 'name', 'phone'];
  const usedAttributes = attributeUsage.map(a => a.attribute);
  
  commonAttributes.forEach(attr => {
    if (!usedAttributes.includes(attr)) {
      recommendations.push({
        type: 'improvement',
        message: `Common attribute '${attr}' not being mapped. Consider adding attribute mapping for better identity resolution.`,
        priority: 'medium'
      });
    }
  });
  
  return recommendations;
}

// Federation health monitoring
async function getFederationHealth() {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get overall statistics
  const stats = await pg.query(`
    SELECT 
      COUNT(*) as total_identities,
      COUNT(CASE WHEN trust_level = 'trusted' THEN 1 END) as trusted_count,
      COUNT(CASE WHEN trust_level = 'revoked' THEN 1 END) as revoked_count,
      COUNT(DISTINCT provider) as provider_count
    FROM federated_identities
  `);
  
  // Get recent activity
  const recentActivity = await pg.query(`
    SELECT provider, COUNT(*) as activity_count
    FROM federated_identities
    WHERE created_at > NOW() - INTERVAL '24 hours'
    GROUP BY provider
    ORDER BY activity_count DESC
  `);
  
  // Get trust relationship status
  const trustStatus = await getTrustRelationships();
  
  return {
    overall: stats.rows[0],
    recentActivity: recentActivity.rows,
    trustRelationships: trustStatus,
    healthScore: calculateFederationHealthScore(stats.rows[0], trustStatus)
  };
}

function calculateFederationHealthScore(stats, trustRelationships) {
  let score = 100;
  
  // Deduct for revoked identities
  if (stats.revoked_count > 0) {
    const revokeRatio = parseInt(stats.revoked_count) / parseInt(stats.total_identities);
    score -= revokeRatio * 20;
  }
  
  // Deduct for low trust scores
  const avgTrustScore = trustRelationships.reduce((sum, t) => sum + parseInt(t.trust_score), 0) / trustRelationships.length;
  if (avgTrustScore < 70) {
    score -= (70 - avgTrustScore) * 0.5;
  }
  
  return Math.max(0, Math.min(100, score));
}

module.exports = {
  // Federated identity management
  createFederatedIdentity,
  getFederatedIdentities,
  getFederatedIdentity,
  updateFederatedIdentity,
  revokeFederatedIdentity,
  
  // Identity attribute mapping
  createAttributeMapping,
  getAttributeMappings,
  applyAttributeMapping,
  
  // Federation trust management
  createTrustRelationship,
  getTrustRelationships,
  updateTrustScore,
  
  // Centralized identity directory
  searchIdentities,
  
  // AI-powered analysis
  analyzeIdentityPatterns,
  
  // Health monitoring
  getFederationHealth,
};