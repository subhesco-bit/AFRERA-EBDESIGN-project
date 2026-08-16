// Service for Security & Access Control (M009) - AI Enhanced
// Comprehensive security management with AI-powered threat detection and automated response
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Security event logging
async function createSecurityEvent(eventData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { userId, eventType, severity, ipAddress, userAgent, details, blocked } = eventData;
  
  const res = await pg.query(
    `INSERT INTO security_events (user_id, event_type, severity, ip_address, user_agent, details, blocked, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [userId, eventType, severity, ipAddress, userAgent, details ? JSON.stringify(details) : null, blocked || false]
  );
  
  // Emit signal for security event
  signalBus.emitSignal(SIGNAL.SECURITY_THREAT_DETECTED, {
    eventId: res.rows[0].id,
    eventType,
    severity,
    userId,
    ipAddress,
    blocked
  }, {
    severity: severity === 'critical' ? SEVERITY.CRITICAL : severity === 'high' ? SEVERITY.WARNING : SEVERITY.INFO,
    source: 'security_access_control_service',
    entityId: userId
  });
  
  return res.rows[0];
}

async function getSecurityEvents({ page = 1, limit = 50, userId, eventType, severity, startDate, endDate } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM security_events WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (userId) {
    query += ` AND user_id = $${paramIndex++}`;
    params.push(userId);
  }
  if (eventType) {
    query += ` AND event_type = $${paramIndex++}`;
    params.push(eventType);
  }
  if (severity) {
    query += ` AND severity = $${paramIndex++}`;
    params.push(severity);
  }
  if (startDate) {
    query += ` AND created_at >= $${paramIndex++}`;
    params.push(startDate);
  }
  if (endDate) {
    query += ` AND created_at <= $${paramIndex++}`;
    params.push(endDate);
  }
  
  query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, offset);
  
  const res = await pg.query(query, params);
  const totalRes = await pg.query(query.replace(`SELECT * FROM security_events`, 'SELECT COUNT(*) FROM security_events').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

// IP whitelist/blacklist management
async function addToIpList(listType, ipAddress, description, userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    `INSERT INTO ip_lists (list_type, ip_address, description, added_by, created_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (list_type, ip_address) DO UPDATE SET
       description = COALESCE(EXCLUDED.description, ip_lists.description),
       updated_at = NOW()
     RETURNING *`,
    [listType, ipAddress, description, userId]
  );
  
  // Emit signal for IP list change
  signalBus.emitSignal(SIGNAL.SECURITY_THREAT_DETECTED, {
    listType,
    ipAddress,
    action: 'added',
    addedBy: userId
  }, {
    severity: listType === 'blacklist' ? SEVERITY.WARNING : SEVERITY.INFO,
    source: 'security_access_control_service'
  });
  
  return res.rows[0];
}

async function removeFromIpList(listType, ipAddress) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    'DELETE FROM ip_lists WHERE list_type = $1 AND ip_address = $2 RETURNING *',
    [listType, ipAddress]
  );
  
  return res.rows[0] || null;
}

async function getIpLists(listType) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const res = await pg.query(
    'SELECT * FROM ip_lists WHERE list_type = $1 ORDER BY created_at DESC',
    [listType]
  );
  
  return res.rows;
}

async function checkIpAccess(ipAddress) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Check blacklist first
  const blacklistCheck = await pg.query(
    'SELECT * FROM ip_lists WHERE list_type = $1 AND ip_address = $2',
    ['blacklist', ipAddress]
  );
  
  if (blacklistCheck.rows.length > 0) {
    return { allowed: false, reason: 'IP blacklisted', details: blacklistCheck.rows[0] };
  }
  
  // Check whitelist (if whitelist mode is enabled)
  const whitelistCheck = await pg.query(
    'SELECT * FROM ip_lists WHERE list_type = $1',
    ['whitelist']
  );
  
  if (whitelistCheck.rows.length > 0) {
    const isWhitelisted = whitelistCheck.rows.some(entry => entry.ip_address === ipAddress);
    if (!isWhitelisted) {
      return { allowed: false, reason: 'IP not whitelisted', details: null };
    }
  }
  
  return { allowed: true, reason: 'IP access granted' };
}

// Rate limiting
async function checkRateLimit(identifier, limit, windowMinutes = 15) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  
  // Clean old entries
  await pg.query(
    'DELETE FROM rate_limits WHERE created_at < $1',
    [windowStart]
  );
  
  // Count recent requests
  const countRes = await pg.query(
    `SELECT COUNT(*) as count FROM rate_limits 
     WHERE identifier = $1 AND created_at >= $2`,
    [identifier, windowStart]
  );
  
  const count = parseInt(countRes.rows[0].count || '0');
  
  if (count >= limit) {
    // Log rate limit exceeded
    await createSecurityEvent({
      eventType: 'rate_limit_exceeded',
      severity: 'medium',
      ipAddress: identifier,
      details: { limit, actual: count, windowMinutes },
      blocked: true
    });
    
    return { allowed: false, remaining: 0, resetTime: new Date(Date.now() + windowMinutes * 60 * 1000) };
  }
  
  // Record this request
  await pg.query(
    'INSERT INTO rate_limits (identifier, created_at) VALUES ($1, NOW())',
    [identifier]
  );
  
  return { allowed: true, remaining: limit - count, resetTime: new Date(Date.now() + windowMinutes * 60 * 1000) };
}

// AI-powered threat detection
async function detectThreats() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const threats = [];
  
  // Detect brute force attempts
  const bruteForce = await pg.query(`
    SELECT ip_address, COUNT(*) as failed_attempts
    FROM security_events
    WHERE event_type = 'authentication_failed'
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY ip_address
    HAVING COUNT(*) > 10
  `);
  
  bruteForce.rows.forEach(row => {
    threats.push({
      type: 'brute_force_attack',
      severity: 'critical',
      ipAddress: row.ip_address,
      failedAttempts: row.failed_attempts,
      recommendation: 'Block IP immediately'
    });
  });
  
  // Detect suspicious login patterns
  const suspiciousLogins = await pg.query(`
    SELECT user_id, COUNT(DISTINCT ip_address) as unique_ips
    FROM security_events
    WHERE event_type = 'authentication_success'
    AND created_at > NOW() - INTERVAL '24 hours'
    GROUP BY user_id
    HAVING COUNT(DISTINCT ip_address) > 5
  `);
  
  suspiciousLogins.rows.forEach(row => {
    threats.push({
      type: 'suspicious_login_pattern',
      severity: 'high',
      userId: row.user_id,
      uniqueIps: row.unique_ips,
      recommendation: 'Require additional authentication'
    });
  });
  
  // Detect data access anomalies
  const dataAccessAnomalies = await pg.query(`
    SELECT user_id, COUNT(*) as access_count
    FROM security_events
    WHERE event_type = 'data_access'
    AND created_at > NOW() - INTERVAL '1 hour'
    GROUP BY user_id
    HAVING COUNT(*) > 1000
  `);
  
  dataAccessAnomalies.rows.forEach(row => {
    threats.push({
      type: 'data_access_anomaly',
      severity: 'high',
      userId: row.user_id,
      accessCount: row.access_count,
      recommendation: 'Review access patterns and consider temporary restriction'
    });
  });
  
  // Emit signal for critical threats
  const criticalThreats = threats.filter(t => t.severity === 'critical');
  if (criticalThreats.length > 0) {
    signalBus.emitSignal(SIGNAL.EMERGENCY_RAISED, {
      threats: criticalThreats,
      detectionTime: new Date().toISOString()
    }, {
      severity: SEVERITY.CRITICAL,
      source: 'security_access_control_service'
    });
  }
  
  return threats;
}

// Security score calculation
async function calculateSecurityScore(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let score = 100;
  const factors = [];
  
  // Check for recent security events
  const recentEvents = await pg.query(
    `SELECT severity, COUNT(*) as count FROM security_events
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY severity`,
    [userId]
  );
  
  recentEvents.rows.forEach(row => {
    const deduction = row.severity === 'critical' ? 20 : row.severity === 'high' ? 10 : row.severity === 'medium' ? 5 : 2;
    score -= deduction * row.count;
    factors.push({
      type: 'security_events',
      severity: row.severity,
      count: row.count,
      deduction: deduction * row.count
    });
  });
  
  // Check for IP blacklist hits
  const blacklistHits = await pg.query(
    `SELECT COUNT(*) as count FROM security_events
     WHERE user_id = $1 AND event_type = 'ip_blacklisted'
     AND created_at > NOW() - INTERVAL '30 days'`,
    [userId]
  );
  
  if (parseInt(blacklistHits.rows[0].count) > 0) {
    const deduction = blacklistHits.rows[0].count * 15;
    score -= deduction;
    factors.push({
      type: 'blacklist_hits',
      count: blacklistHits.rows[0].count,
      deduction
    });
  }
  
  // Ensure score doesn't go below 0
  score = Math.max(0, score);
  
  return {
    userId,
    score,
    riskLevel: score >= 80 ? 'low' : score >= 50 ? 'medium' : 'high',
    factors,
    recommendation: score < 50 ? 'Review user security practices and consider additional authentication' : 'Good security posture'
  };
}

// Access control policies
async function createAccessPolicy(policyData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, description, resource, conditions, actions, priority } = policyData;
  
  const res = await pg.query(
    `INSERT INTO access_policies (name, description, resource, conditions, actions, priority, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [name, description, resource, JSON.stringify(conditions), JSON.stringify(actions), priority]
  );
  
  // Emit signal for policy creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'access_policy',
    policyId: res.rows[0].id,
    policyName: name
  }, {
    severity: SEVERITY.INFO,
    source: 'security_access_control_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function evaluateAccessPolicy(userId, resource, action) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const policies = await pg.query(
    `SELECT * FROM access_policies 
     WHERE resource = $1 
     AND is_active = true
     ORDER BY priority DESC`,
    [resource]
  );
  
  for (const policy of policies.rows) {
    const conditions = policy.conditions || {};
    const allowedActions = policy.actions || [];
    
    // Check if action is allowed
    if (!allowedActions.includes(action)) {
      continue;
    }
    
    // Evaluate conditions (simplified)
    let conditionsMet = true;
    
    if (conditions.timeRestriction) {
      const currentHour = new Date().getHours();
      if (conditions.timeRestriction.start && currentHour < conditions.timeRestriction.start) {
        conditionsMet = false;
      }
      if (conditions.timeRestriction.end && currentHour > conditions.timeRestriction.end) {
        conditionsMet = false;
      }
    }
    
    if (conditionsMet) {
      return { allowed: true, policyId: policy.id, policyName: policy.name };
    }
  }
  
  return { allowed: false, reason: 'No matching policy allows this access' };
}

module.exports = {
  // Security event logging
  createSecurityEvent,
  getSecurityEvents,
  
  // IP whitelist/blacklist
  addToIpList,
  removeFromIpList,
  getIpLists,
  checkIpAccess,
  
  // Rate limiting
  checkRateLimit,
  
  // AI-powered threat detection
  detectThreats,
  
  // Security score
  calculateSecurityScore,
  
  // Access control policies
  createAccessPolicy,
  evaluateAccessPolicy,
};