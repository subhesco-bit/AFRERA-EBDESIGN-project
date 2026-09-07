// Service for User Management (M011) - AI Enhanced
// Implements basic CRUD and authentication helpers with AI-powered user analytics
const bcrypt = require('bcryptjs');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

async function createUser({ name, email, password, role = 'farmer', status = 'active' }) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const client = await pg.connect();
  try {
    await client.query('BEGIN');

    const hashed = password ? await bcrypt.hash(password, 12) : null;

    const insertUserText = `
      INSERT INTO users (name, email, password_hash, role, status, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, name, email, role, status, created_at
    `;
    const res = await client.query(insertUserText, [name, email, hashed, role, status]);

    await client.query('COMMIT');
    
    // Emit signal for user creation
    signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
      entityType: 'user',
      userId: res.rows[0].id,
      userName: name,
      email,
      role
    }, {
      severity: SEVERITY.INFO,
      source: 'user_management_service',
      entityId: res.rows[0].id
    });
    
    return res.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('createUser failed', { error: error.message, stack: error.stack });
    throw error;
  } finally {
    client.release();
  }
}

async function getUserById(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT id, name, email, role, status, created_at, updated_at FROM users WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function getUserByEmail(email) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1', [email]);
  return res.rows[0] || null;
}

async function listUsers({ page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const offset = (page - 1) * limit;
  const totalRes = await pg.query('SELECT COUNT(*) FROM users');
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query('SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2', [limit, offset]);

  return {
    users: res.rows,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) }
  };
}

async function updateUser(id, { name, email, role, status }) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `UPDATE users SET name = COALESCE($1, name), email = COALESCE($2, email), role = COALESCE($3, role), status = COALESCE($4, status), updated_at = NOW() WHERE id = $5 RETURNING id, name, email, role, status, updated_at`,
    [name, email, role, status, id]
  );
  return res.rows[0] || null;
}

async function deleteUser(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  // Soft-delete by setting status to 'deleted'
  const res = await pg.query('UPDATE users SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING id', ['deleted', id]);
  return !!res.rows[0];
}

async function changePassword(id, newPassword) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const hashed = await bcrypt.hash(newPassword, 12);
  await pg.query('UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2', [hashed, id]);
  return true;
}

// AI-powered user analytics
async function getUserAnalytics(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get user activity patterns
  const activityPattern = await pg.query(`
    SELECT 
      DATE(created_at) as date,
      COUNT(*) as actions
    FROM audit_logs
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY DATE(created_at)
    ORDER BY date DESC
  `, [userId]);
  
  // Get user's recent failed logins
  const failedLogins = await pg.query(`
    SELECT COUNT(*) as count
    FROM security_events
    WHERE user_id = $1 
    AND event_type = 'authentication_failed'
    AND created_at > NOW() - INTERVAL '7 days'
  `, [userId]);
  
  // Get user's most common actions
  const commonActions = await pg.query(`
    SELECT action, COUNT(*) as count
    FROM audit_logs
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY action
    ORDER BY count DESC
    LIMIT 5
  `, [userId]);
  
  return {
    activityPattern: activityPattern.rows,
    failedLogins: parseInt(failedLogins.rows[0]?.count || '0'),
    commonActions: commonActions.rows,
    riskLevel: failedLogins.rows[0]?.count > 10 ? 'high' : failedLogins.rows[0]?.count > 5 ? 'medium' : 'low',
    recommendations: generateUserRecommendations(activityPattern.rows, failedLogins.rows[0]?.count)
  };
}

async function getUserActivity(userId, { limit = 50 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `SELECT * FROM audit_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  
  return res.rows;
}

async function getUserEngagementScore(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Calculate engagement score based on activity frequency and recency
  const activityCount = await pg.query(
    `SELECT COUNT(*) as count FROM audit_logs
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'`,
    [userId]
  );
  
  const lastActivity = await pg.query(
    `SELECT created_at FROM audit_logs
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId]
  );
  
  const count = parseInt(activityCount.rows[0]?.count || '0');
  const daysSinceLastActivity = lastActivity.rows[0] 
    ? Math.floor((Date.now() - new Date(lastActivity.rows[0].created_at)) / (1000 * 60 * 60 * 24))
    : 999;
  
  // Simple engagement score calculation
  let score = 0;
  score += Math.min(count / 10, 50); // Up to 50 points for activity
  score += Math.max(0, 50 - daysSinceLastActivity); // Up to 50 points for recency
  
  return {
    userId,
    score: Math.min(score, 100),
    level: score >= 80 ? 'high' : score >= 50 ? 'medium' : 'low',
    activityCount: count,
    daysSinceLastActivity,
    lastActivity: lastActivity.rows[0]?.created_at
  };
}

async function getUserBehaviorProfile(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Analyze user behavior patterns
  const timePattern = await pg.query(`
    SELECT 
      EXTRACT(HOUR FROM created_at) as hour,
      COUNT(*) as count
    FROM audit_logs
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY EXTRACT(HOUR FROM created_at)
    ORDER BY count DESC
  `, [userId]);
  
  const dayPattern = await pg.query(`
    SELECT 
      EXTRACT(DOW FROM created_at) as day_of_week,
      COUNT(*) as count
    FROM audit_logs
    WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
    GROUP BY EXTRACT(DOW FROM created_at)
    ORDER BY count DESC
  `, [userId]);
  
  return {
    userId,
    peakHours: timePattern.rows.slice(0, 3),
    peakDays: dayPattern.rows.slice(0, 3),
    recommendations: generateBehaviorRecommendations(timePattern.rows, dayPattern.rows)
  };
}

function generateUserRecommendations(activityPattern, failedLogins) {
  const recommendations = [];
  
  if (failedLogins > 10) {
    recommendations.push({
      type: 'security',
      message: 'High number of failed login attempts detected. Consider password reset or account review.',
      priority: 'high'
    });
  }
  
  if (activityPattern.length < 5) {
    recommendations.push({
      type: 'engagement',
      message: 'Low user activity detected. Consider engagement campaigns or reactivation emails.',
      priority: 'medium'
    });
  }
  
  return recommendations;
}

function generateBehaviorRecommendations(timePattern, dayPattern) {
  const recommendations = [];
  
  if (timePattern.length > 0) {
    const peakHour = timePattern[0].hour;
    recommendations.push({
      type: 'notification',
      message: `User is most active around ${peakHour}:00. Schedule important notifications during this time.`,
      priority: 'low'
    });
  }
  
  if (dayPattern.length > 0) {
    const peakDay = dayPattern[0].day_of_week;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    recommendations.push({
      type: 'engagement',
      message: `User is most active on ${days[peakDay]}. Schedule important activities for this day.`,
      priority: 'low'
    });
  }
  
  return recommendations;
}

async function bulkCreateUsers(users) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const results = [];
  
  for (const userData of users) {
    try {
      const user = await createUser(userData);
      results.push({ success: true, user });
    } catch (error) {
      results.push({ success: false, error: error.message, userData });
    }
  }
  
  return {
    total: users.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  };
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  listUsers,
  updateUser,
  deleteUser,
  changePassword,
  // AI-powered features
  getUserAnalytics,
  getUserActivity,
  getUserEngagementScore,
  getUserBehaviorProfile,
  bulkCreateUsers,
};

