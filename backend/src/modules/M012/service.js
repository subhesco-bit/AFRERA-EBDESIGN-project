// Service for Authentication (M012) - AI Enhanced
// Session management, device fingerprinting, and security-event logging.
// login/register/refreshToken/logout/detectLoginAnomaly were deleted here
// (2026-08-17): they duplicated the canonical authService.js against the
// same users table with a weaker implementation (hardcoded fallback JWT
// secret, no account-lockout). authService.js is the canonical, working
// version - nothing from these functions needed to be merged there. See
// routes.js for the removed route entries.
const bcrypt = require('bcryptjs');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

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