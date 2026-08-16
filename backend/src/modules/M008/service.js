// Service for Audit & Compliance (M008) - AI Enhanced
// Comprehensive audit logging with blockchain-based immutable logging and AI-powered compliance
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');
const crypto = require('crypto');

// Audit logging
async function createAuditLog(logData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { userId, action, entity, entityId, details, ipAddress, userAgent } = logData;
  
  // Generate blockchain hash for immutability
  const previousHash = await getLatestBlockHash();
  const blockData = JSON.stringify({ userId, action, entity, entityId, details, timestamp: new Date().toISOString() });
  const blockHash = crypto.createHash('sha256').update(previousHash + blockData).digest('hex');
  
  const res = await pg.query(
    `INSERT INTO audit_logs (user_id, action, entity, entity_id, details, ip_address, user_agent, block_hash, previous_hash, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
     RETURNING *`,
    [userId, action, entity, entityId, details ? JSON.stringify(details) : null, ipAddress, userAgent, blockHash, previousHash]
  );
  
  // Emit signal for audit log creation
  signalBus.emitSignal(SIGNAL.WORKFLOW_STARTED, {
    auditId: res.rows[0].id,
    userId,
    action,
    entity,
    entityId,
    blockHash
  }, {
    severity: SEVERITY.INFO,
    source: 'audit_compliance_service',
    entityId: userId
  });
  
  return res.rows[0];
}

async function getAuditLogs({ page = 1, limit = 50, userId, action, entity, startDate, endDate } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const offset = (page - 1) * limit;
  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  let paramIndex = 1;
  
  if (userId) {
    query += ` AND user_id = $${paramIndex++}`;
    params.push(userId);
  }
  if (action) {
    query += ` AND action = $${paramIndex++}`;
    params.push(action);
  }
  if (entity) {
    query += ` AND entity = $${paramIndex++}`;
    params.push(entity);
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
  const totalRes = await pg.query(query.replace(`SELECT * FROM audit_logs`, 'SELECT COUNT(*) FROM audit_logs').split('LIMIT')[0], params.slice(0, -2));
  const total = parseInt(totalRes.rows[0].count || '0');
  
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function getAuditLog(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM audit_logs WHERE id = $1', [id]);
  return res.rows[0] || null;
}

// Blockchain verification
async function verifyAuditLogIntegrity(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const log = await getAuditLog(id);
  if (!log) return { valid: false, error: 'Log not found' };
  
  // Verify blockchain hash
  const blockData = JSON.stringify({ 
    userId: log.user_id, 
    action: log.action, 
    entity: log.entity, 
    entityId: log.entity_id, 
    details: log.details, 
    timestamp: log.created_at 
  });
  const computedHash = crypto.createHash('sha256').update(log.previous_hash + blockData).digest('hex');
  
  const isValid = computedHash === log.block_hash;
  
  return {
    valid: isValid,
    storedHash: log.block_hash,
    computedHash,
    timestamp: log.created_at
  };
}

async function getLatestBlockHash() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT block_hash FROM audit_logs ORDER BY id DESC LIMIT 1');
  return res.rows[0]?.block_hash || '0000000000000000000000000000000000000000000000000000000000000000';
}

// Compliance rules
async function createComplianceRule(ruleData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const { name, description, ruleType, conditions, actions, severity } = ruleData;
  
  const res = await pg.query(
    `INSERT INTO compliance_rules (name, description, rule_type, conditions, actions, severity, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
     RETURNING *`,
    [name, description, ruleType, JSON.stringify(conditions), JSON.stringify(actions), severity]
  );
  
  // Emit signal for compliance rule creation
  signalBus.emitSignal(SIGNAL.WORKFLOW_STARTED, {
    entityType: 'compliance_rule',
    ruleId: res.rows[0].id,
    ruleName: name
  }, {
    severity: severity === 'critical' ? SEVERITY.CRITICAL : SEVERITY.INFO,
    source: 'audit_compliance_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function listComplianceRules({ activeOnly = true } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  let query = 'SELECT * FROM compliance_rules';
  if (activeOnly) {
    query += ' WHERE is_active = true';
  }
  query += ' ORDER BY severity DESC, name ASC';
  
  const res = await pg.query(query);
  return res.rows;
}

async function evaluateComplianceRules(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const rules = await listComplianceRules({ activeOnly: true });
  const userLogs = await getAuditLogs({ userId, limit: 100 });
  
  const violations = [];
  
  for (const rule of rules) {
    const conditions = rule.conditions || {};
    const actions = rule.actions || [];
    
    // Simple evaluation logic
    let violation = false;
    let violationDetails = [];
    
    if (conditions.actionPattern) {
      const matchingLogs = userLogs.items.filter(log => 
        log.action.includes(conditions.actionPattern)
      );
      
      if (conditions.maxFrequency && matchingLogs.length > conditions.maxFrequency) {
        violation = true;
        violationDetails.push(`Action pattern matched ${matchingLogs.length} times, exceeds limit of ${conditions.maxFrequency}`);
      }
    }
    
    if (conditions.entityPattern) {
      const matchingLogs = userLogs.items.filter(log => 
        log.entity && log.entity.includes(conditions.entityPattern)
      );
      
      if (conditions.maxFrequency && matchingLogs.length > conditions.maxFrequency) {
        violation = true;
        violationDetails.push(`Entity pattern matched ${matchingLogs.length} times, exceeds limit of ${conditions.maxFrequency}`);
      }
    }
    
    if (violation) {
      violations.push({
        ruleId: rule.id,
        ruleName: rule.name,
        severity: rule.severity,
        details: violationDetails,
        actions: actions
      });
      
      // Emit signal for compliance violation
      signalBus.emitSignal(SIGNAL.RISK_CRITICAL, {
        ruleId: rule.id,
        userId,
        violation: violationDetails
      }, {
        severity: rule.severity === 'critical' ? SEVERITY.CRITICAL : SEVERITY.WARNING,
        source: 'audit_compliance_service',
        entityId: userId
      });
    }
  }
  
  return {
    userId,
    violations,
    totalRules: rules.length,
    passedRules: rules.length - violations.length,
    complianceScore: rules.length > 0 ? ((rules.length - violations.length) / rules.length * 100).toFixed(2) : 100
  };
}

// Regulatory reporting
async function generateComplianceReport({ startDate, endDate, reportType = 'summary' }) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const logs = await getAuditLogs({ startDate, endDate, limit: 10000 });
  
  // Generate report based on type
  let report = {};
  
  if (reportType === 'summary') {
    const actionSummary = {};
    logs.items.forEach(log => {
      actionSummary[log.action] = (actionSummary[log.action] || 0) + 1;
    });
    
    report = {
      period: { startDate, endDate },
      totalLogs: logs.pagination.total,
      actionSummary,
      topActions: Object.entries(actionSummary)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([action, count]) => ({ action, count })),
      uniqueUsers: new Set(logs.items.map(l => l.user_id)).size,
      uniqueEntities: new Set(logs.items.map(l => l.entity)).size
    };
  } else if (reportType === 'detailed') {
    report = {
      period: { startDate, endDate },
      logs: logs.items,
      integrity: await verifyBatchIntegrity(logs.items)
    };
  }
  
  return report;
}

async function verifyBatchIntegrity(logs) {
  const verificationResults = [];
  
  for (const log of logs) {
    const verification = await verifyAuditLogIntegrity(log.id);
    verificationResults.push({
      logId: log.id,
      valid: verification.valid
    });
  }
  
  const allValid = verificationResults.every(r => r.valid);
  
  return {
    allValid,
    totalLogs: logs.length,
    validLogs: verificationResults.filter(r => r.valid).length,
    invalidLogs: verificationResults.filter(r => !r.valid).length,
    details: verificationResults
  };
}

// AI-powered anomaly detection
async function detectAuditAnomalies({ timeframe = '24h' } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const timeCondition = timeframe === '24h' 
    ? "created_at > NOW() - INTERVAL '24 hours'"
    : "created_at > NOW() - INTERVAL '7 days'";
  
  // Detect unusual patterns
  const anomalies = [];
  
  // High-frequency actions
  const highFrequency = await pg.query(`
    SELECT user_id, action, COUNT(*) as count
    FROM audit_logs
    WHERE ${timeCondition}
    GROUP BY user_id, action
    HAVING COUNT(*) > 100
    ORDER BY count DESC
  `);
  
  highFrequency.rows.forEach(row => {
    anomalies.push({
      type: 'high_frequency_action',
      severity: row.count > 500 ? 'critical' : 'warning',
      userId: row.user_id,
      action: row.action,
      count: row.count,
      threshold: 100
    });
  });
  
  // Unusual time patterns
  const unusualTime = await pg.query(`
    SELECT user_id, COUNT(*) as count
    FROM audit_logs
    WHERE ${timeCondition}
    AND EXTRACT(HOUR FROM created_at) BETWEEN 0 AND 5
    GROUP BY user_id
    HAVING COUNT(*) > 50
  `);
  
  unusualTime.rows.forEach(row => {
    anomalies.push({
      type: 'unusual_time_activity',
      severity: 'warning',
      userId: row.user_id,
      count: row.count,
      timeRange: 'midnight-5am'
    });
  });
  
  // Emit signal if critical anomalies found
  const criticalAnomalies = anomalies.filter(a => a.severity === 'critical');
  if (criticalAnomalies.length > 0) {
    signalBus.emitSignal(SIGNAL.SECURITY_THREAT_DETECTED, {
      anomalies: criticalAnomalies,
      detectionTime: new Date().toISOString()
    }, {
      severity: SEVERITY.CRITICAL,
      source: 'audit_compliance_service'
    });
  }
  
  return anomalies;
}

module.exports = {
  // Audit logging
  createAuditLog,
  getAuditLogs,
  getAuditLog,
  
  // Blockchain verification
  verifyAuditLogIntegrity,
  getLatestBlockHash,
  
  // Compliance rules
  createComplianceRule,
  listComplianceRules,
  evaluateComplianceRules,
  
  // Regulatory reporting
  generateComplianceReport,
  verifyBatchIntegrity,
  
  // AI-powered anomaly detection
  detectAuditAnomalies,
};