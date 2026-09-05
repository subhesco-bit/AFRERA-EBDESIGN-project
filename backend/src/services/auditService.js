/**
 * Audit Service
 * Handles audit logging and compliance tracking
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');

class AuditService {
  constructor() {
    this.db = null;
  }

  async initialize() {
    try {
      this.db = getPostgreSQL();
      logger.info('AuditService initialized');
    } catch (error) {
      logger.error('AuditService initialization failed', error);
    }
  }

  /**
   * Log audit event
   */
  async logEvent(auditData) {
    const { 
      userId, 
      action, 
      entityType, 
      entityId, 
      changes, 
      ipAddress, 
      userAgent, 
      metadata = {} 
    } = auditData;

    try {
      const query = `
        INSERT INTO audit_logs (
          user_id, action, entity_type, entity_id, 
          changes, ip_address, user_agent, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [
        userId,
        action,
        entityType,
        entityId,
        JSON.stringify(changes),
        ipAddress,
        userAgent,
        JSON.stringify(metadata)
      ]);

      logger.info(`Audit event logged: ${action} on ${entityType}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Log audit event failed', error);
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(filters = {}) {
    const { 
      limit = 100, 
      offset = 0, 
      userId, 
      action, 
      entityType, 
      entityId, 
      startDate, 
      endDate 
    } = filters;

    try {
      let query = `
        SELECT 
          al.*,
          u.username,
          u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE 1=1
      `;
      const params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` AND al.user_id = $${paramCount}`;
        params.push(userId);
      }

      if (action) {
        paramCount++;
        query += ` AND al.action = $${paramCount}`;
        params.push(action);
      }

      if (entityType) {
        paramCount++;
        query += ` AND al.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      if (entityId) {
        paramCount++;
        query += ` AND al.entity_id = $${paramCount}`;
        params.push(entityId);
      }

      if (startDate) {
        paramCount++;
        query += ` AND al.created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += ` AND al.created_at <= $${paramCount}`;
        params.push(endDate);
      }

      query += ` ORDER BY al.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);

      const result = await this.db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Get audit logs failed', error);
      throw error;
    }
  }

  /**
   * Get audit log by ID
   */
  async getAuditLog(auditLogId) {
    try {
      const query = `
        SELECT 
          al.*,
          u.username,
          u.email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.audit_log_id = $1
      `;
      const result = await this.db.query(query, [auditLogId]);
      
      if (result.rows.length === 0) {
        throw new Error('Audit log not found');
      }

      return result.rows[0];
    } catch (error) {
      logger.error('Get audit log failed', error);
      throw error;
    }
  }

  /**
   * Get user activity history
   */
  async getUserActivityHistory(userId, limit = 50) {
    try {
      const query = `
        SELECT 
          action,
          entity_type,
          entity_id,
          created_at
        FROM audit_logs
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
      `;
      const result = await this.db.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Get user activity history failed', error);
      throw error;
    }
  }

  /**
   * Get entity change history
   */
  async getEntityChangeHistory(entityType, entityId, limit = 50) {
    try {
      const query = `
        SELECT 
          al.*,
          u.username
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.entity_type = $1 AND al.entity_id = $2
        ORDER BY al.created_at DESC
        LIMIT $3
      `;
      const result = await this.db.query(query, [entityType, entityId, limit]);
      return result.rows;
    } catch (error) {
      logger.error('Get entity change history failed', error);
      throw error;
    }
  }

  /**
   * Get audit statistics
   */
  async getAuditStatistics(filters = {}) {
    const { userId, startDate, endDate } = filters;

    try {
      let query = `
        SELECT 
          COUNT(*) as total_events,
          COUNT(DISTINCT user_id) as unique_users,
          COUNT(DISTINCT entity_type) as unique_entities,
          SUM(CASE WHEN action = 'create' THEN 1 ELSE 0 END) as creates,
          SUM(CASE WHEN action = 'update' THEN 1 ELSE 0 END) as updates,
          SUM(CASE WHEN action = 'delete' THEN 1 ELSE 0 END) as deletes,
          SUM(CASE WHEN action = 'read' THEN 1 ELSE 0 END) as reads
        FROM audit_logs
      `;
      const params = [];
      let paramCount = 0;

      if (userId) {
        paramCount++;
        query += ` WHERE user_id = $${paramCount}`;
        params.push(userId);
      }

      if (startDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at >= $${paramCount}`;
        params.push(startDate);
      }

      if (endDate) {
        paramCount++;
        query += paramCount === 1 ? ' WHERE' : ' AND';
        query += ` created_at <= $${paramCount}`;
        params.push(endDate);
      }

      const result = await this.db.query(query, params);
      return result.rows[0];
    } catch (error) {
      logger.error('Get audit statistics failed', error);
      throw error;
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(filters = {}) {
    const { startDate, endDate, entityType } = filters;

    try {
      // Default to last 30 days if no date range provided
      const defaultStartDate = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const defaultEndDate = endDate || new Date();

      let query = `
        SELECT 
          user_id,
          u.username,
          u.email,
          COUNT(*) as total_actions,
          SUM(CASE WHEN action = 'delete' THEN 1 ELSE 0 END) as deletions,
          SUM(CASE WHEN action = 'update' THEN 1 ELSE 0 END) as updates,
          MAX(created_at) as last_activity
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.user_id
        WHERE al.created_at >= $1 AND al.created_at <= $2
      `;
      const params = [defaultStartDate, defaultEndDate];
      let paramCount = 2;

      if (entityType) {
        paramCount++;
        query += ` AND al.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      query += ` GROUP BY user_id, u.username, u.email ORDER BY total_actions DESC`;

      const result = await this.db.query(query, params);
      return {
        period: { start: defaultStartDate, end: defaultEndDate },
        entityType: entityType || 'all',
        summary: result.rows
      };
    } catch (error) {
      logger.error('Get compliance report failed', error);
      throw error;
    }
  }

  /**
   * Clean old audit logs
   */
  async cleanOldLogs(daysToKeep = 90) {
    try {
      const query = `
        DELETE FROM audit_logs
        WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
        RETURNING *
      `;
      const result = await this.db.query(query);
      
      logger.info(`Cleaned ${result.rows.length} old audit logs`);
      return result.rows.length;
    } catch (error) {
      logger.error('Clean old logs failed', error);
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(filters = {}) {
    try {
      const logs = await this.getAuditLogs({
        ...filters,
        limit: 10000 // High limit for export
      });

      // Convert to CSV format
      const headers = ['audit_log_id', 'user_id', 'action', 'entity_type', 'entity_id', 'created_at'];
      const csvRows = [headers.join(',')];

      for (const log of logs) {
        const row = headers.map(header => {
          const value = log[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(row.join(','));
      }

      return csvRows.join('\n');
    } catch (error) {
      logger.error('Export audit logs failed', error);
      throw error;
    }
  }

  /**
   * Create audit snapshot
   */
  async createAuditSnapshot(description) {
    try {
      const query = `
        INSERT INTO audit_snapshots (description, created_at)
        VALUES ($1, NOW())
        RETURNING *
      `;
      const result = await this.db.query(query, [description]);
      
      const snapshotId = result.rows[0].snapshot_id;

      // Copy current audit logs to snapshot
      const copyQuery = `
        INSERT INTO audit_log_snapshots (snapshot_id, audit_log_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, metadata, created_at)
        SELECT $1, audit_log_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, metadata, created_at
        FROM audit_logs
      `;
      await this.db.query(copyQuery, [snapshotId]);

      logger.info(`Audit snapshot created: ${snapshotId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Create audit snapshot failed', error);
      throw error;
    }
  }

  /**
   * Restore from audit snapshot
   */
  async restoreFromSnapshot(snapshotId) {
    try {
      // Verify snapshot exists
      const snapshotQuery = `
        SELECT * FROM audit_snapshots WHERE snapshot_id = $1
      `;
      const snapshotResult = await this.db.query(snapshotQuery, [snapshotId]);
      
      if (snapshotResult.rows.length === 0) {
        throw new Error('Snapshot not found');
      }

      // Clear current audit logs
      await this.db.query('DELETE FROM audit_logs');

      // Restore from snapshot
      const restoreQuery = `
        INSERT INTO audit_logs (audit_log_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, metadata, created_at)
        SELECT audit_log_id, user_id, action, entity_type, entity_id, changes, ip_address, user_agent, metadata, created_at
        FROM audit_log_snapshots
        WHERE snapshot_id = $1
      `;
      await this.db.query(restoreQuery, [snapshotId]);

      logger.info(`Audit logs restored from snapshot: ${snapshotId}`);
      return snapshotResult.rows[0];
    } catch (error) {
      logger.error('Restore from snapshot failed', error);
      throw error;
    }
  }

  /**
   * Get audit snapshots
   */
  async getAuditSnapshots(limit = 20) {
    try {
      const query = `
        SELECT 
          s.*,
          COUNT(als.snapshot_id) as log_count
        FROM audit_snapshots s
        LEFT JOIN audit_log_snapshots als ON s.snapshot_id = als.snapshot_id
        GROUP BY s.snapshot_id
        ORDER BY s.created_at DESC
        LIMIT $1
      `;
      const result = await this.db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Get audit snapshots failed', error);
      throw error;
    }
  }
}

module.exports = new AuditService();
