/**
 * Database Security Enhancements
 * Production-ready security with row-level security, encryption, and access control
 */

const { Pool } = require('pg');
const crypto = require('crypto');
const { logger } = require('../../utils/logger');

class DatabaseSecurity {
  constructor(config = {}) {
    this.config = {
      // Encryption configuration
      enableColumnEncryption: config.enableColumnEncryption !== false,
      encryptionKey: config.encryptionKey || process.env.DB_ENCRYPTION_KEY,
      encryptionAlgorithm: config.encryptionAlgorithm || 'aes-256-gcm',
      
      // Row-level security
      enableRowLevelSecurity: config.enableRowLevelSecurity !== false,
      
      // Audit logging
      enableAuditLogging: config.enableAuditLogging !== false,
      auditSensitiveOperations: config.auditSensitiveOperations !== false,
      
      // SQL injection protection
      enableSqlInjectionProtection: config.enableSqlInjectionProtection !== false,
      maxQueryLength: config.maxQueryLength || 10000,
      
      // Rate limiting
      enableRateLimiting: config.enableRateLimiting !== false,
      maxQueriesPerMinute: config.maxQueriesPerMinute || 1000,
      maxConcurrentQueries: config.maxConcurrentQueries || 100,
      
      // Data masking
      enableDataMasking: config.enableDataMasking !== false,
      maskSensitiveFields: config.maskSensitiveFields !== false,
      
      // Connection security
      requireSSL: config.requireSSL || process.env.PG_SSL === 'true',
      allowedIPs: config.allowedIPs || [],
      
      // Database connection
      databaseUrl: config.databaseUrl || process.env.DATABASE_URL,
      
      ...config
    };

    this.pool = null;
    this.queryCounter = new Map(); // For rate limiting
    this.encryptionKey = null;
    this.isInitialized = false;
  }

  /**
   * Initialize security system
   */
  async initialize() {
    try {
      this.pool = new Pool({
        connectionString: this.config.databaseUrl,
        ssl: this.config.requireSSL ? { rejectUnauthorized: true } : undefined
      });

      // Initialize encryption key
      if (this.config.enableColumnEncryption) {
        this.initializeEncryptionKey();
      }

      // Enable security features
      await this.enableRowLevelSecurity();
      await this.createAuditTables();
      await this.createSecurityPolicies();
      await this.enableSecurityExtensions();

      this.isInitialized = true;
      logger.info('Database security system initialized');
    } catch (error) {
      logger.error('Failed to initialize security system', { error: error.message });
      throw error;
    }
  }

  /**
   * Initialize encryption key
   */
  initializeEncryptionKey() {
    if (!this.config.encryptionKey) {
      throw new Error('Encryption key not configured');
    }

    // Derive a proper key from the provided key
    this.encryptionKey = crypto.scryptSync(
      this.config.encryptionKey,
      'database-encryption-salt',
      32
    );

    logger.info('Encryption key initialized');
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(plaintext) {
    if (!this.config.enableColumnEncryption || !plaintext) {
      return plaintext;
    }

    try {
      const iv = crypto.randomBytes(12);
      const cipher = crypto.createCipheriv(
        this.config.encryptionAlgorithm,
        this.encryptionKey,
        iv
      );

      let encrypted = cipher.update(plaintext, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and encrypted data
      const result = Buffer.concat([
        iv,
        authTag,
        Buffer.from(encrypted, 'hex')
      ]).toString('base64');

      return result;
    } catch (error) {
      logger.error('Encryption failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(ciphertext) {
    if (!this.config.enableColumnEncryption || !ciphertext) {
      return ciphertext;
    }

    try {
      const buffer = Buffer.from(ciphertext, 'base64');
      
      // Extract IV (12 bytes), auth tag (16 bytes), and encrypted data
      const iv = buffer.slice(0, 12);
      const authTag = buffer.slice(12, 28);
      const encrypted = buffer.slice(28);

      const decipher = crypto.createDecipheriv(
        this.config.encryptionAlgorithm,
        this.encryptionKey,
        iv
      );

      decipher.setAuthTag(authTag);

      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      logger.error('Decryption failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Enable row-level security
   */
  async enableRowLevelSecurity() {
    if (!this.config.enableRowLevelSecurity) {
      return;
    }

    try {
      // Enable RLS on sensitive tables
      const sensitiveTables = [
        'users',
        'user_profiles',
        'farmers',
        'fpos',
        'loans',
        'policies',
        'contracts',
        'financial_transactions'
      ];

      for (const table of sensitiveTables) {
        try {
          await this.pool.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY`);
          logger.debug(`Row-level security enabled on ${table}`);
        } catch (error) {
          // Table might not exist or RLS already enabled
          logger.debug(`Could not enable RLS on ${table}`, { error: error.message });
        }
      }

      // Create RLS policies
      await this.createRLSPolicies();
    } catch (error) {
      logger.error('Failed to enable row-level security', { error: error.message });
    }
  }

  /**
   * Create row-level security policies
   */
  async createRLSPolicies() {
    const policies = [
      // Users can only see their own data
      `CREATE POLICY user_isolation ON users
       FOR ALL USING (id = current_setting('app.user_id')::uuid)`,

      // Farmers can only see their own data
      `CREATE POLICY farmer_isolation ON farmers
       FOR ALL USING (user_id = current_setting('app.user_id')::uuid)`,

      // FPO members can see their FPO's data
      `CREATE POLICY fpo_member_isolation ON fpos
       FOR SELECT USING (id IN (
         SELECT fpo_id FROM farmers WHERE user_id = current_setting('app.user_id')::uuid
       ))`,

      // Admins can see all data
      `CREATE POLICY admin_access ON users
       FOR ALL USING (
         EXISTS (
           SELECT 1 FROM user_roles ur
           JOIN roles r ON ur.role_id = r.id
           WHERE ur.user_id = current_setting('app.user_id')::uuid
           AND r.name = 'admin'
         )
       )`
    ];

    for (const policy of policies) {
      try {
        await this.pool.query(policy.replace('CREATE POLICY', 'CREATE POLICY IF NOT EXISTS'));
      } catch (error) {
        logger.debug('Could not create RLS policy', { error: error.message });
      }
    }
  }

  /**
   * Create audit tables
   */
  async createAuditTables() {
    if (!this.config.enableAuditLogging) {
      return;
    }

    const tables = [
      `CREATE TABLE IF NOT EXISTS security_audit_log (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        operation VARCHAR(50) NOT NULL,
        table_name VARCHAR(100) NOT NULL,
        record_id UUID,
        old_values JSONB,
        new_values JSONB,
        ip_address INET,
        user_agent TEXT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        success BOOLEAN NOT NULL,
        error_message TEXT
      )`,

      `CREATE TABLE IF NOT EXISTS access_log (
        id SERIAL PRIMARY KEY,
        user_id UUID,
        resource_type VARCHAR(50) NOT NULL,
        resource_id UUID,
        action VARCHAR(50) NOT NULL,
        granted BOOLEAN NOT NULL,
        denial_reason TEXT,
        ip_address INET,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,

      `CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_type VARCHAR(100) NOT NULL,
        severity VARCHAR(20) NOT NULL,
        description TEXT,
        affected_user_id UUID,
        metadata JSONB DEFAULT '{}',
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMP
      )`
    ];

    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_security_audit_user ON security_audit_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_security_audit_table ON security_audit_log(table_name)',
      'CREATE INDEX IF NOT EXISTS idx_security_audit_timestamp ON security_audit_log(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_access_log_user ON access_log(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_access_log_resource ON access_log(resource_type, resource_id)',
      'CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type)',
      'CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity)'
    ];

    for (const table of tables) {
      await this.pool.query(table);
    }

    for (const index of indexes) {
      await this.pool.query(index);
    }

    logger.info('Security audit tables created');
  }

  /**
   * Create security policies
   */
  async createSecurityPolicies() {
    const policies = [
      // Prevent deletion of critical records
      `CREATE POLICY prevent_user_deletion ON users
       FOR DELETE USING (false)`,

      // Prevent modification of system fields
      `CREATE POLICY protect_system_fields ON users
       FOR UPDATE USING (
         NOT (old_values ? 'created_at' : false) OR
         NOT (old_values ? 'id' : false)
       )`
    ];

    for (const policy of policies) {
      try {
        await this.pool.query(policy.replace('CREATE POLICY', 'CREATE POLICY IF NOT EXISTS'));
      } catch (error) {
        logger.debug('Could not create security policy', { error: error.message });
      }
    }
  }

  /**
   * Enable security extensions
   */
  async enableSecurityExtensions() {
    const extensions = [
      'pgcrypto', // For cryptographic functions
      'pg_stat_statements' // For query monitoring
    ];

    for (const ext of extensions) {
      try {
        await this.pool.query(`CREATE EXTENSION IF NOT EXISTS "${ext}"`);
        logger.debug(`Extension ${ext} enabled`);
      } catch (error) {
        logger.debug(`Could not enable extension ${ext}`, { error: error.message });
      }
    }
  }

  /**
   * Check for SQL injection attempts
   */
  checkSqlInjection(query) {
    if (!this.config.enableSqlInjectionProtection) {
      return { safe: true };
    }

    const suspiciousPatterns = [
      /(\bunion\b.*\bselect\b)/i,
      /(\bselect\b.*\bfrom\b.*\bwhere\b.*\bor\b.*\b1\b.*=\b1\b)/i,
      /(\bdrop\b|\btruncate\b|\balter\b)/i,
      /(\bexec\b|\beval\b|\bsp_executesql\b)/i,
      /(--\s*|\b;\s*\/\*|\*\/\s*;)/i,
      /(\bxp_cmdshell\b|\bsp_oacreate\b)/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(query)) {
        logger.warn('Potential SQL injection detected', { query: query.substring(0, 100) });
        return {
          safe: false,
          reason: 'Suspicious SQL pattern detected',
          pattern: pattern.toString()
        };
      }
    }

    // Check query length
    if (query.length > this.config.maxQueryLength) {
      logger.warn('Query too long', { length: query.length });
      return {
        safe: false,
        reason: 'Query exceeds maximum length',
        length: query.length
      };
    }

    return { safe: true };
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(userId) {
    if (!this.config.enableRateLimiting) {
      return { allowed: true };
    }

    const now = Date.now();
    const userKey = userId || 'anonymous';
    const userStats = this.queryCounter.get(userKey) || { count: 0, resetTime: now + 60000 };

    // Reset counter if time window passed
    if (now > userStats.resetTime) {
      userStats.count = 0;
      userStats.resetTime = now + 60000;
    }

    userStats.count++;
    this.queryCounter.set(userKey, userStats);

    if (userStats.count > this.config.maxQueriesPerMinute) {
      logger.warn('Rate limit exceeded', { userId: userKey, count: userStats.count });
      return {
        allowed: false,
        reason: 'Rate limit exceeded',
        limit: this.config.maxQueriesPerMinute,
        resetTime: new Date(userStats.resetTime)
      };
    }

    return { allowed: true };
  }

  /**
   * Check IP whitelist
   */
  checkIPWhitelist(ipAddress) {
    if (!this.config.allowedIPs || this.config.allowedIPs.length === 0) {
      return { allowed: true };
    }

    if (this.config.allowedIPs.includes(ipAddress)) {
      return { allowed: true };
    }

    logger.warn('IP not in whitelist', { ipAddress });
    return {
      allowed: false,
      reason: 'IP address not in whitelist'
    };
  }

  /**
   * Mask sensitive data
   */
  maskSensitiveData(data, schema) {
    if (!this.config.enableDataMasking || !this.config.maskSensitiveFields) {
      return data;
    }

    const sensitiveFields = [
      'password', 'password_hash', 'credit_card', 'ssn', 'pan',
      'account_number', 'ifsc', 'aadhaar', 'phone', 'email'
    ];

    const maskedData = { ...data };

    for (const field of sensitiveFields) {
      if (maskedData[field]) {
        maskedData[field] = this.maskValue(maskedData[field]);
      }
    }

    return maskedData;
  }

  /**
   * Mask a single value
   */
  maskValue(value) {
    if (!value) return value;

    const str = String(value);
    if (str.length <= 4) {
      return '****';
    }

    return str.substring(0, 2) + '*'.repeat(str.length - 4) + str.substring(str.length - 2);
  }

  /**
   * Log security audit event
   */
  async logAuditEvent(event) {
    if (!this.config.enableAuditLogging) {
      return;
    }

    try {
      await this.pool.query(`
        INSERT INTO security_audit_log (
          user_id, operation, table_name, record_id, 
          old_values, new_values, ip_address, user_agent, success, error_message
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        event.userId || null,
        event.operation,
        event.tableName,
        event.recordId || null,
        event.oldValues ? JSON.stringify(event.oldValues) : null,
        event.newValues ? JSON.stringify(event.newValues) : null,
        event.ipAddress || null,
        event.userAgent || null,
        event.success !== false,
        event.errorMessage || null
      ]);
    } catch (error) {
      logger.error('Failed to log audit event', { error: error.message });
    }
  }

  /**
   * Log access event
   */
  async logAccessEvent(event) {
    if (!this.config.enableAuditLogging) {
      return;
    }

    try {
      await this.pool.query(`
        INSERT INTO access_log (
          user_id, resource_type, resource_id, action, 
          granted, denial_reason, ip_address
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        event.userId || null,
        event.resourceType,
        event.resourceId || null,
        event.action,
        event.granted,
        event.denialReason || null,
        event.ipAddress || null
      ]);
    } catch (error) {
      logger.error('Failed to log access event', { error: error.message });
    }
  }

  /**
   * Log security event
   */
  async logSecurityEvent(event) {
    try {
      await this.pool.query(`
        INSERT INTO security_events (
          event_type, severity, description, affected_user_id, metadata
        ) VALUES ($1, $2, $3, $4, $5)
      `, [
        event.eventType,
        event.severity,
        event.description,
        event.affectedUserId || null,
        event.metadata ? JSON.stringify(event.metadata) : null
      ]);

      // Emit event for real-time monitoring
      this.emit('securityEvent', event);
    } catch (error) {
      logger.error('Failed to log security event', { error: error.message });
    }
  }

  /**
   * Set user context for RLS
   */
  async setUserContext(userId, userRole) {
    try {
      await this.pool.query('SET LOCAL app.user_id TO $1', [userId]);
      await this.pool.query('SET LOCAL app.user_role TO $1', [userRole]);
      logger.debug('User context set', { userId, userRole });
    } catch (error) {
      logger.error('Failed to set user context', { error: error.message });
    }
  }

  /**
   * Clear user context
   */
  async clearUserContext() {
    try {
      await this.pool.query('SET LOCAL app.user_id TO NULL');
      await this.pool.query('SET LOCAL app.user_role TO NULL');
      logger.debug('User context cleared');
    } catch (error) {
      logger.error('Failed to clear user context', { error: error.message });
    }
  }

  /**
   * Validate query before execution
   */
  validateQuery(query, userId, ipAddress) {
    // Check SQL injection
    const injectionCheck = this.checkSqlInjection(query);
    if (!injectionCheck.safe) {
      this.logSecurityEvent({
        eventType: 'sql_injection_attempt',
        severity: 'critical',
        description: 'SQL injection attempt detected',
        affectedUserId: userId,
        metadata: { query: query.substring(0, 100), ...injectionCheck }
      });
      return { valid: false, reason: injectionCheck.reason };
    }

    // Check rate limiting
    const rateLimitCheck = this.checkRateLimit(userId);
    if (!rateLimitCheck.allowed) {
      this.logSecurityEvent({
        eventType: 'rate_limit_exceeded',
        severity: 'warning',
        description: 'Rate limit exceeded',
        affectedUserId: userId,
        metadata: rateLimitCheck
      });
      return { valid: false, reason: rateLimitCheck.reason };
    }

    // Check IP whitelist
    const ipCheck = this.checkIPWhitelist(ipAddress);
    if (!ipCheck.allowed) {
      this.logSecurityEvent({
        eventType: 'unauthorized_ip',
        severity: 'warning',
        description: 'Unauthorized IP access attempt',
        affectedUserId: userId,
        metadata: { ipAddress, ...ipCheck }
      });
      return { valid: false, reason: ipCheck.reason };
    }

    return { valid: true };
  }

  /**
   * Get security statistics
   */
  async getSecurityStatistics() {
    try {
      const [auditStats, accessStats, eventStats] = await Promise.all([
        this.pool.query(`
          SELECT 
            operation,
            COUNT(*) as count,
            COUNT(CASE WHEN success = false THEN 1 END) as failures
          FROM security_audit_log
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          GROUP BY operation
        `),
        this.pool.query(`
          SELECT 
            granted,
            COUNT(*) as count
          FROM access_log
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          GROUP BY granted
        `),
        this.pool.query(`
          SELECT 
            severity,
            COUNT(*) as count
          FROM security_events
          WHERE timestamp > NOW() - INTERVAL '24 hours'
          GROUP BY severity
        `)
      ]);

      return {
        audit: auditStats.rows,
        access: accessStats.rows,
        events: eventStats.rows
      };
    } catch (error) {
      logger.error('Failed to get security statistics', { error: error.message });
      return null;
    }
  }

  /**
   * Shutdown security system
   */
  async shutdown() {
    if (this.pool) {
      await this.pool.end();
    }

    this.queryCounter.clear();
    this.isInitialized = false;

    logger.info('Database security system shutdown complete');
  }
}

// Singleton instance
let instance = null;

/**
 * Get or create the singleton security instance
 */
function getDatabaseSecurity(config = {}) {
  if (!instance) {
    instance = new DatabaseSecurity(config);
  }
  return instance;
}

module.exports = {
  DatabaseSecurity,
  getDatabaseSecurity
};
