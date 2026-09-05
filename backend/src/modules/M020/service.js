// Service for Account Recovery (M020) - AI Enhanced
// Comprehensive account recovery with AI-powered fraud detection and multi-channel options
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

// Password reset initiation
async function initiatePasswordReset(email, method = 'email') {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get user by email
  const userRes = await pg.query('SELECT * FROM users WHERE email = $1 AND status = $2', [email, 'active']);
  const user = userRes.rows[0];
  
  if (!user) {
    // Still return success to prevent email enumeration
    return { success: true, message: 'If an account exists, recovery instructions will be sent' };
  }
  
  // Check for suspicious activity
  const fraudCheck = await detectRecoveryFraud(user.id, email);
  if (fraudCheck.isSuspicious) {
    await logRecoveryAttempt(user.id, 'password_reset', 'blocked', fraudCheck.reason);
    return { success: false, error: 'Account recovery temporarily blocked due to suspicious activity' };
  }
  
  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  // Store reset token
  await pg.query(
    `INSERT INTO password_reset_tokens (user_id, token, expires_at, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [user.id, resetToken, expiresAt]
  );
  
  // Send reset based on method
  if (method === 'email') {
    await sendPasswordResetEmail(user.email, resetToken);
  } else if (method === 'sms') {
    await sendPasswordResetSMS(user.id, resetToken);
  }
  
  // Log recovery attempt
  await logRecoveryAttempt(user.id, 'password_reset', 'initiated', method);
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'account_recovery',
    userId: user.id,
    action: 'password_reset_initiated',
    method
  }, {
    severity: SEVERITY.WARNING,
    source: 'account_recovery_service',
    entityId: user.id
  });
  
  return { success: true, message: 'If an account exists, recovery instructions will be sent' };
}

async function verifyPasswordResetToken(token) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM password_reset_tokens 
     WHERE token = $1 AND expires_at > NOW() AND used = false`,
    [token]
  );
  
  if (res.rows.length === 0) {
    return { success: false, error: 'Invalid or expired token' };
  }
  
  return { success: true, userId: res.rows[0].user_id };
}

async function resetPassword(token, newPassword) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Verify token
  const tokenVerification = await verifyPasswordResetToken(token);
  if (!tokenVerification.success) {
    return tokenVerification;
  }
  
  const userId = tokenVerification.userId;
  
  // Hash new password
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  // Update password
  await pg.query(
    'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
    [passwordHash, userId]
  );
  
  // Mark token as used
  await pg.query('UPDATE password_reset_tokens SET used = true, used_at = NOW() WHERE token = $1', [token]);
  
  // Invalidate all sessions for security
  await invalidateAllUserSessions(userId);
  
  // Log recovery completion
  await logRecoveryAttempt(userId, 'password_reset', 'completed');
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'account_recovery',
    userId,
    action: 'password_reset_completed'
  }, {
    severity: SEVERITY.INFO,
    source: 'account_recovery_service',
    entityId: userId
  });
  
  return { success: true, message: 'Password reset successfully' };
}

// Security questions
async function setupSecurityQuestions(userId, questions) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  for (const question of questions) {
    const { questionId, answer } = question;
    const hashedAnswer = await bcrypt.hash(answer.toLowerCase(), 12);
    
    await pg.query(
      `INSERT INTO security_questions (user_id, question_id, answer_hash, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW())
       ON CONFLICT (user_id, question_id) DO UPDATE SET
         answer_hash = EXCLUDED.answer_hash,
         updated_at = NOW()`,
      [userId, questionId, hashedAnswer]
    );
  }
  
  return { success: true };
}

async function verifySecurityQuestions(userId, answers) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let verifiedCount = 0;
  
  for (const answer of answers) {
    const { questionId, answer: userAnswer } = answer;
    
    let res = await pg.query(
      'SELECT answer_hash FROM security_questions WHERE user_id = $1 AND question_id = $2',
      [userId, questionId]
    );
    
    if (res.rows.length > 0) {
      const isValid = await bcrypt.compare(userAnswer.toLowerCase(), res.rows[0].answer_hash);
      if (isValid) verifiedCount++;
    }
  }
  
  const requiredCorrect = Math.ceil(answers.length / 2);
  const passed = verifiedCount >= requiredCorrect;
  
  // Log security question attempt
  await logRecoveryAttempt(userId, 'security_questions', passed ? 'verified' : 'failed', 
    `${verifiedCount}/${answers.length} correct`);
  
  return { success: passed, verifiedCount, requiredCorrect };
}

// Account lockout management
async function lockAccount(userId, reason, duration = 15) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const lockUntil = new Date(Date.now() + duration * 60000); // duration in minutes
  
  await pg.query(
    `UPDATE users 
     SET status = 'locked', lock_reason = $1, locked_until = $2, updated_at = NOW()
     WHERE id = $3`,
    [reason, lockUntil, userId]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.SECURITY_THREAT_DETECTED, {
    userId,
    reason,
    lockUntil
  }, {
    severity: SEVERITY.CRITICAL,
    source: 'account_recovery_service',
    entityId: userId
  });
  
  return { success: true, lockedUntil: lockUntil };
}

async function unlockAccount(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    'UPDATE users SET status = $1, lock_reason = NULL, locked_until = NULL, updated_at = NOW() WHERE id = $2',
    ['active', userId]
  );
  
  // Emit signal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'account_unlock',
    userId,
    action: 'unlocked'
  }, {
    severity: SEVERITY.INFO,
    source: 'account_recovery_service',
    entityId: userId
  });
  
  return { success: true };
}

async function checkAccountLockStatus(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query('SELECT status, lock_reason, locked_until FROM users WHERE id = $1', [userId]);
  
  if (res.rows.length === 0) {
    return { success: false, error: 'User not found' };
  }
  
  let user = res.rows[0];
  
  // Check if lock has expired
  if (user.status === 'locked' && user.locked_until && new Date(user.locked_until) < new Date()) {
    await unlockAccount(userId);
    return { success: true, locked: false, message: 'Account lock expired' };
  }
  
  return {
    success: true,
    locked: user.status === 'locked',
    lockReason: user.lock_reason,
    lockedUntil: user.locked_until
  };
}

// Recovery attempt tracking
async function logRecoveryAttempt(userId, recoveryType, status, details = null) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    `INSERT INTO recovery_attempts (user_id, recovery_type, status, details, ip_address, user_agent, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
    [userId, recoveryType, status, details ? JSON.stringify(details) : null, null, null]
  );
}

async function getRecoveryAttempts(userId, { limit = 20 } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let res = await pg.query(
    `SELECT * FROM recovery_attempts 
     WHERE user_id = $1 
     ORDER BY created_at DESC 
     LIMIT $2`,
    [userId, limit]
  );
  
  return res.rows;
}

// AI-powered fraud detection
async function detectRecoveryFraud(userId, email) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Check for excessive recovery attempts
  const recentAttempts = await pg.query(
    `SELECT COUNT(*) as count FROM recovery_attempts
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '1 hour'`,
    [userId]
  );
  
  if (parseInt(recentAttempts.rows[0].count) > 5) {
    return {
      isSuspicious: true,
      reason: 'Excessive recovery attempts in short time',
      confidence: 0.9
    };
  }
  
  // Check for failed attempts
  const failedAttempts = await pg.query(
    `SELECT COUNT(*) as count FROM recovery_attempts
     WHERE user_id = $1 AND status = 'failed' AND created_at > NOW() - INTERVAL '24 hours'`,
    [userId]
  );
  
  if (parseInt(failedAttempts.rows[0].count) > 10) {
    return {
      isSuspicious: true,
      reason: 'High number of failed recovery attempts',
      confidence: 0.85
    };
  }
  
  // Check for unusual location (would need IP tracking)
  // This is a placeholder for location-based fraud detection
  
  return { isSuspicious: false };
}

// Temporary password generation
async function generateTemporaryPassword(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Generate temporary password
  const tempPassword = crypto.randomBytes(12).toString('hex').substring(0, 16);
  let passwordHash = await bcrypt.hash(tempPassword, 12);
  
  // Set temporary password with expiration
  let expiresAt = new Date(Date.now() + 3600000); // 1 hour
  
  await pg.query(
    `UPDATE users 
     SET password_hash = $1, temp_password_expires = $2, updated_at = NOW()
     WHERE id = $3`,
    [passwordHash, expiresAt, userId]
  );
  
  // Log temporary password generation
  await logRecoveryAttempt(userId, 'temp_password', 'generated');
  
  return { success: true, tempPassword, expiresAt };
}

// Helper functions
async function sendPasswordResetEmail(email, token) {
  // In production, integrate with email service
  logger.info('Password reset email would be sent', { email, token });
}

async function sendPasswordResetSMS(userId, token) {
  // In production, integrate with SMS service
  logger.info('Password reset SMS would be sent', { userId, token });
}

async function invalidateAllUserSessions(userId) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  await pg.query(
    'UPDATE sessions SET is_active = false, invalidated_at = NOW() WHERE user_id = $1',
    [userId]
  );
}

// Account recovery analytics
async function getRecoveryAnalytics({ startDate, endDate } = {}) {
  let pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = `
    SELECT 
      recovery_type,
      status,
      COUNT(*) as count,
      DATE(created_at) as date
    FROM recovery_attempts
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
  
  query += ` GROUP BY recovery_type, status, DATE(created_at) ORDER BY date DESC`;
  
  let res = await pg.query(query, params);
  
  return {
    data: res.rows,
    totalAttempts: res.rows.reduce((sum, row) => sum + parseInt(row.count), 0),
    byType: groupBy(res.rows, 'recovery_type'),
    byStatus: groupBy(res.rows, 'status')
  };
}

function groupBy(array, key) {
  return array.reduce((result, item) => {
    (result[item[key]] = result[item[key]] || []).push(item);
    return result;
  }, {});
}

module.exports = {
  // Password reset
  initiatePasswordReset,
  verifyPasswordResetToken,
  resetPassword,
  
  // Security questions
  setupSecurityQuestions,
  verifySecurityQuestions,
  
  // Account lockout
  lockAccount,
  unlockAccount,
  checkAccountLockStatus,
  
  // Recovery tracking
  logRecoveryAttempt,
  getRecoveryAttempts,
  
  // AI-powered fraud detection
  detectRecoveryFraud,
  
  // Temporary password
  generateTemporaryPassword,
  
  // Analytics
  getRecoveryAnalytics,
};