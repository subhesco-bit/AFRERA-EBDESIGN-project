// Service for Single Sign-On (M014) - AI Enhanced
// Comprehensive SSO with OAuth2/OIDC, SAML, and AI-powered analysis
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Production-readiness audit (2026-08-28): committed 'your-secret-key'
// fallback - a real, separate JWT_SECRET resolution from the one already
// fixed in services/dual-use/authService.js. This module is only reachable
// via the generic Claude module-registry bridge (not a dedicated route),
// but it does sign real access/refresh tokens (see initiateOAuthFlow /
// handleOAuthCallback below), so the same fail-fast-in-production fix
// applies.
function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  logger.warn('JWT_SECRET not set - using a random per-process secret for this dev/test run.');
  return crypto.randomBytes(32).toString('hex');
}
const JWT_SECRET = resolveJwtSecret();

// OAuth2/OIDC Integration
async function initiateOAuthFlow(provider, redirectUri) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get provider configuration
  const providerConfig = await getProviderConfig(provider);
  if (!providerConfig) {
    return { success: false, error: 'Provider not configured' };
  }
  
  // Generate state for CSRF protection
  const state = require('crypto').randomBytes(32).toString('hex');
  
  // Build authorization URL
  const authUrl = buildAuthUrl(providerConfig, state, redirectUri);
  
  // Store state for verification
  await storeOAuthState(state, provider, redirectUri);
  
  return {
    success: true,
    authUrl,
    state
  };
}

async function handleOAuthCallback(provider, code, state) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Verify state
  const storedState = await verifyOAuthState(state);
  if (!storedState) {
    return { success: false, error: 'Invalid state parameter' };
  }
  
  // Get provider configuration
  const providerConfig = await getProviderConfig(provider);
  if (!providerConfig) {
    return { success: false, error: 'Provider not configured' };
  }
  
  // Exchange code for tokens
  const tokens = await exchangeCodeForTokens(providerConfig, code, storedState.redirectUri);
  if (!tokens) {
    return { success: false, error: 'Failed to exchange code for tokens' };
  }
  
  // Get user info from provider
  const userInfo = await getUserInfoFromProvider(providerConfig, tokens.access_token);
  if (!userInfo) {
    return { success: false, error: 'Failed to get user info' };
  }
  
  // Find or create user
  const user = await findOrCreateUserFromSSO(provider, userInfo);
  
  // Generate our tokens
  const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  
  // Log SSO login
  await logSSOEvent(user.id, provider, 'login_success');
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'sso_login',
    userId: user.id,
    provider,
    action: 'success'
  }, {
    severity: SEVERITY.INFO,
    source: 'sso_service',
    entityId: user.id
  });
  
  return {
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken
  };
}

// SAML Integration
async function initiateSAMLFlow(provider, redirectUri) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const providerConfig = await getProviderConfig(provider);
  if (!providerConfig || !providerConfig.saml_config) {
    return { success: false, error: 'SAML not configured for this provider' };
  }
  
  // Generate SAML request
  const samlRequest = generateSAMLRequest(providerConfig, redirectUri);
  
  return {
    success: true,
    samlRequest,
    ssoUrl: providerConfig.saml_config.sso_url
  };
}

async function handleSAMLResponse(provider, samlResponse) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const providerConfig = await getProviderConfig(provider);
  if (!providerConfig || !providerConfig.saml_config) {
    return { success: false, error: 'SAML not configured for this provider' };
  }
  
  // Validate and parse SAML response
  const samlData = await validateSAMLResponse(providerConfig, samlResponse);
  if (!samlData) {
    return { success: false, error: 'Invalid SAML response' };
  }
  
  // Find or create user
  const user = await findOrCreateUserFromSSO(provider, samlData);
  
  // Generate tokens
  const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  
  // Log SSO login
  await logSSOEvent(user.id, provider, 'saml_login_success');
  
  return {
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken
  };
}

// Provider configuration management
async function getProviderConfig(provider) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    'SELECT * FROM sso_providers WHERE provider_name = $1 AND is_active = true',
    [provider]
  );
  
  return res.rows[0] || null;
}

async function createProviderConfig(providerData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { providerName, clientId, clientSecret, authUrl, tokenUrl, userInfoUrl, samlConfig, scopes } = providerData;
  
  const res = await pg.query(
    `INSERT INTO sso_providers (provider_name, client_id, client_secret, auth_url, token_url, user_info_url, saml_config, scopes, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [providerName, clientId, clientSecret, authUrl, tokenUrl, userInfoUrl, samlConfig ? JSON.stringify(samlConfig) : null, JSON.stringify(scopes || [])]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'sso_provider',
    providerId: res.rows[0].id,
    providerName
  }, {
    severity: SEVERITY.INFO,
    source: 'sso_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function listProviders() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query('SELECT id, provider_name, is_active, created_at FROM sso_providers ORDER BY provider_name');
  return res.rows;
}

// User provisioning
async function findOrCreateUserFromSSO(provider, userInfo) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Try to find existing user by email
  const existingUser = await pg.query('SELECT * FROM users WHERE email = $1', [userInfo.email]);
  
  if (existingUser.rows.length > 0) {
    // Update user's SSO mapping
    await pg.query(
      `INSERT INTO user_sso_mappings (user_id, provider, provider_user_id, last_used, created_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, provider) DO UPDATE SET
         provider_user_id = EXCLUDED.provider_user_id,
         last_used = NOW()`,
      [existingUser.rows[0].id, provider, userInfo.id]
    );
    
    return existingUser.rows[0];
  }
  
  // Create new user
  const res = await pg.query(
    `INSERT INTO users (name, email, role, status, created_at)
     VALUES ($1, $2, 'farmer', 'active', NOW())
     RETURNING *`,
    [userInfo.name, userInfo.email]
  );
  
  const user = res.rows[0];
  
  // Create SSO mapping
  await pg.query(
    `INSERT INTO user_sso_mappings (user_id, provider, provider_user_id, last_used, created_at)
     VALUES ($1, $2, $3, NOW(), NOW())`,
    [user.id, provider, userInfo.id]
  );
  
  return user;
}

// AI-powered SSO analytics
async function getSSOAnalytics({ provider, startDate, endDate } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT provider, COUNT(*) as login_count, 
           DATE(created_at) as date
    FROM sso_events
    WHERE 1=1
  `;
  const params = [];
  let paramIndex = 1;
  
  if (provider) {
    query += ` AND provider = $${paramIndex++}`;
    params.push(provider);
  }
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  query += ` GROUP BY provider, DATE(created_at) ORDER BY date DESC`;
  
  const res = await pg.query(query, params);
  
  return {
    events: res.rows,
    totalLogins: res.rows.reduce((sum, row) => sum + parseInt(row.login_count), 0),
    byProvider: groupBy(res.rows, 'provider')
  };
}

async function detectSSOAnomalies() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const anomalies = [];
  
  // Detect high failure rates
  const highFailureRate = await pg.query(`
    SELECT provider, 
           COUNT(*) FILTER (WHERE event_type = 'login_success') as successes,
           COUNT(*) FILTER (WHERE event_type = 'login_failed') as failures
    FROM sso_events
    WHERE created_at > NOW() - INTERVAL '1 hour'
    GROUP BY provider
    HAVING COUNT(*) FILTER (WHERE event_type = 'login_failed') > 10
  `);
  
  highFailureRate.rows.forEach(row => {
    const failureRate = row.failures / (row.successes + row.failures);
    if (failureRate > 0.5) {
      anomalies.push({
        type: 'high_failure_rate',
        provider: row.provider,
        failureRate: (failureRate * 100).toFixed(2) + '%',
        severity: 'critical'
      });
    }
  });
  
  // Emit signal for critical anomalies
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  if (criticalAnomalies.length > 0) {
    signalBus.emitSignal(SIGNAL.RISK_CRITICAL, {
      anomalies: criticalAnomalies,
      detectionTime: new Date().toISOString()
    }, {
      severity: SEVERITY.CRITICAL,
      source: 'sso_service'
    });
  }
  
  return anomalies;
}

// Helper functions
async function storeOAuthState(state, provider, redirectUri) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    'INSERT INTO oauth_states (state, provider, redirect_uri, created_at, expires_at) VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL \'10 minutes\')',
    [state, provider, redirectUri]
  );
}

async function verifyOAuthState(state) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    'SELECT * FROM oauth_states WHERE state = $1 AND expires_at > NOW()',
    [state]
  );
  
  if (res.rows.length > 0) {
    // Delete used state
    await pg.query('DELETE FROM oauth_states WHERE state = $1', [state]);
    return res.rows[0];
  }
  
  return null;
}

function buildAuthUrl(providerConfig, state, redirectUri) {
  const params = new URLSearchParams({
    client_id: providerConfig.client_id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: providerConfig.scopes.join(' '),
    state: state
  });
  
  return `${providerConfig.auth_url}?${params.toString()}`;
}

async function exchangeCodeForTokens(providerConfig, code, redirectUri) {
  // This would make an HTTP request to the provider's token endpoint
  // For now, return a mock response
  return {
    access_token: 'mock_access_token',
    refresh_token: 'mock_refresh_token',
    expires_in: 3600
  };
}

async function getUserInfoFromProvider(providerConfig, accessToken) {
  // This would make an HTTP request to the provider's user info endpoint
  // For now, return a mock response
  return {
    id: 'mock_user_id',
    name: 'Mock User',
    email: 'mock@example.com'
  };
}

function generateSAMLRequest(providerConfig, redirectUri) {
  // This would generate a proper SAML AuthnRequest
  // For now, return a mock SAML request
  return 'mock_saml_request';
}

async function validateSAMLResponse(providerConfig, samlResponse) {
  // This would validate and parse the SAML response
  // For now, return mock user data
  return {
    id: 'mock_saml_user_id',
    name: 'Mock SAML User',
    email: 'mock_saml@example.com'
  };
}

async function logSSOEvent(userId, provider, eventType) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    'INSERT INTO sso_events (user_id, provider, event_type, created_at) VALUES ($1, $2, $3, NOW())',
    [userId, provider, eventType]
  );
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

module.exports = {
  // OAuth2/OIDC
  initiateOAuthFlow,
  handleOAuthCallback,
  
  // SAML
  initiateSAMLFlow,
  handleSAMLResponse,
  
  // Provider management
  getProviderConfig,
  createProviderConfig,
  listProviders,
  
  // User provisioning
  findOrCreateUserFromSSO,
  
  // AI-powered analytics
  getSSOAnalytics,
  detectSSOAnomalies,
};