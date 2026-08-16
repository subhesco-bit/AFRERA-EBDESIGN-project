// Service for Authentication (M012) - AI Enhanced
// Comprehensive authentication with AI-powered security features
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Login with AI-powered fraud detection
async function login(email, password, ipAddress, userAgent) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get user by email
  const userRes = await pg.query('SELECT * FROM users WHERE email = $1 AND status = $2', [email, 'active']);
  const user = userRes.rows[0];
  
  if (!user) {
    // Log failed login attempt
    await logSecurityEvent(email, ipAddress, 'login_failed', 'user_not_found');
    return { success: false, error: 'Invalid credentials' };
  }
  
  // Verify password
  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    // Log failed login attempt
    await logSecurityEvent(user.id, ipAddress, 'login_failed', 'invalid_password');
    return { success: false, error: 'Invalid credentials' };
  }
  
  // AI-powered fraud detection
  const fraudCheck = await detectLoginAnomaly(user.id, ipAddress, userAgent);
  if (fraudCheck.isSuspicious) {
    await logSecurityEvent(user.id, ipAddress, 'login_blocked', fraudCheck.reason);
    return { success: false, error: 'Login blocked due to suspicious activity', requiresVerification: true };
  }
  
  // Generate tokens
  const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
  const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  
  // Update last login
  await pg.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [user.id]);
  
  // Emit signal for successful login
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'user_session',
    userId: user.id,
    action: 'login_success',
    ipAddress
  }, {
    severity: SEVERITY.INFO,
    source: 'authentication_service',
    entityId: user.id
  });
  
  return {
    success: true,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
    accessToken,
    refreshToken
  };
}

// Register new user
async function register(userData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, email, password, role = 'farmer' } = userData;
  
  // Check if user exists
  const existing = await pg.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length > 0) {
    return { success: false, error: 'User already exists' };
  }
  
  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);
  
  // Create user
  const res = await pg.query(
    `INSERT INTO users (name, email, password_hash, role, status, created_at)
     VALUES ($1, $2, $3, $4, 'active', NOW())
     RETURNING id, name, email, role, status, created_at`,
    [name, email, passwordHash, role]
  );
  
  const user = res.rows[0];
  
  // Emit signal for user registration
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'user',
    userId: user.id,
    userName: name,
    email,
    role
  }, {
    severity: SEVERITY.INFO,
    source: 'authentication_service',
    entityId: user.id
  });
  
  return { success: true, user };
}

// Refresh token
async function refreshToken(refreshToken) {
  try {
    const decoded = jwt.verify(refreshToken, JWT_SECRET);
    const pg = getPostgreSQL();
    if (!pg) throw new Error('Database not initialized');
    
    // Get user
    const userRes = await pg.query('SELECT * FROM users WHERE id = $1 AND status = $2', [decoded.userId, 'active']);
    const user = userRes.rows[0];
    
    if (!user) {
      return { success: false, error: 'User not found or inactive' };
    }
    
    // Generate new access token
    const accessToken = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    
    return { success: true, accessToken };
  } catch (error) {
    return { success: false, error: 'Invalid refresh token' };
  }
}

// Logout
async function logout(userId) {
  // In a real implementation, you would invalidate the token in a token blacklist
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'user_session',
    userId,
    action: 'logout'
  }, {
    severity: SEVERITY.INFO,
    source: 'authentication_service',
    entityId: userId
  });
  
  return { success: true };
}

// AI-powered login anomaly detection
async function detectLoginAnomaly(userId, ipAddress, userAgent) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database');
  
  // Check for suspicious patterns
  const recentLogins = await pg.query(
    `SELECT ip_address, COUNT(*) as count
     FROM security_events
     WHERE user_id = $1 AND event_type = 'login_success'
     AND created_at > NOW() - INTERVAL '1 hour'
     GROUP BY ip_address
     HAVING COUNT(*) > 5`,
    [userId]
  );
  
  if (recentLogins.rows.length > 0) {
    const differentIps = recentLogins.rows.length;
    if (differentIps > 3) {
      return {
        isSuspicious: true,
        reason: 'Unusual login pattern: multiple IP addresses in short time',
        confidence: 0.85
      };
    }
  }
  
  // Check for unusual location
  const userLogins = await pg.query(
    `SELECT ip_address, COUNT(*) as count
     FROM security_events
     WHERE user_id = $1 AND event_type = 'login_success'
     AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY ip_address
     ORDER BY count DESC
     LIMIT 1`,
    [userId]
  );
  
  if (userLogins.rows.length > 0) {
    const usualIp = userLogins.rows[0].ip_address;
    if (usualIp !== ipAddress) {
      return {
        isSuspicious: true,
        reason: 'Login from unusual location',
        confidence: 0.7
      };
    }
  }
  
  return { isSuspicious: false };
}

// Session management
async function createSession(userId, deviceInfo) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const sessionToken = require('crypto').randomBytes(32).toString('hex');
  
  const res = await pg.query(
    `INSERT INTO sessions (user_id, session_token, device_info, ip_address, user_agent, created_at, expires_at)
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW() + INTERVAL '7 days')
     RETURNING *`,
    [userId, sessionToken, JSON.stringify(deviceInfo), deviceInfo.ipAddress, deviceInfo.userAgent]
  );
  
  return res.rows[0];
}

async function validateSession(sessionToken) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM sessions 
     WHERE session_token = $1 
     AND expires_at > NOW()
     AND is_active = true`,
    [sessionToken]
  );
  
  return res.rows[0] || null;
}

async function invalidateSession(sessionToken) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    'UPDATE sessions SET is_active = false, invalidated_at = NOW() WHERE session_token = $1',
    [sessionToken]
  );
  
  return { success: true };
}

async function invalidateAllUserSessions(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database non initialized');
  
  await pg.query(
    'UPDATE sessions SET is_active = false, invalidated_at = NOW() WHERE user_id = $1',
    [userId]
  );
  
  return { success: true };
}

// Device fingerprinting
async function recordDeviceFingerprint(userId, fingerprint) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `INSERT INTO device_fingerprints (user_id, fingerprint, user_agent, ip_address, first_seen, last_seen, created_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
     ON CONFLICT (user_id, fingerprint) DO UPDATE SET
       last_seen = NOW(), seen_count = seen_count + 1
     RETURNING *`,
    [userId, fingerprint, fingerprint.userAgent, fingerprint.ipAddress]
  );
  
  return res.rows[0];
}

async function getUserDevices(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM device_fingerprints WHERE user_id = $1 ORDER BY last_seen DESC`,
    [userId]
  );
  
  return res.rows;
}

// Security event logging
async function logSecurityEvent(userId, ipAddress, eventType, reason) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    `INSERT INTO security_events (user_id, event_type, ip_address, details, created_at)
     VALUES ($1, $2, $3, $4, NOW())`,
    [userId, eventType, ipAddress, JSON.stringify({ reason })]
  );
}

// Get user's recent security events
async function getUserSecurityEvents(userId, { limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM security_events 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  
  return res.rows;
}

// Change password
async function changePassword(userId, currentPassword, newPassword) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Verify current password
  const userRes = await pg.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  const user = userRes.rows[0];
  
  if (!user) {
    return { success: false, error: 'User not found' };
  }
  
  const validPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!validPassword) {
    return { success: false, error: 'Current password is incorrect' };
  }
  
  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 12);
  
  await pg.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [newPasswordHash, userId]
  );
  
  // Emit signal for password change
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'user_security',
    userId,
    action: 'password_changed'
  }, {
    severity: SEVERITY.INFO,
    source: 'authentication_service',
    entityId: userId
  });
  
  return { success: true };
}

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  detectLoginAnomaly,
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  recordDeviceFingerprint,
  getUserDevices,
  logSecurityEvent,
  getUserSecurityEvents,
  changePassword,
};