/**
 * Audit Service
 * Comprehensive audit trail and reporting system
 */

const logger = require('../../utils\/logger');

class AuditService {
  constructor() {
    // Shared pool (2026-08-04): was a per-instance Pool. 42 services each
    // holding one meant ~420 connections vs a PostgreSQL default of 100.
    this.pool = require('../../database\/pool');
  }

  /**
   * Log an audit event
   */
  async logEvent(eventData) {
    const {
      userId,
      action,
      entityType,
      entityId,
      changes,
      ipAddress,
      userAgent,
      status = 'success',
      metadata = {}
    } = eventData;

    try {
      const query = `
        INSERT INTO audit_logs 
        (user_id, action, entity_type, entity_id, changes, ip_address, 
         user_agent, status, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *
      `;

      const result = await this.pool.query(query, [
        userId,
        action,
        entityType,
        entityId,
        JSON.stringify(changes),
        ipAddress,
        userAgent,
        status,
        JSON.stringify(metadata)
      ]);

      logger.info(`Audit event logged: ${action} on ${entityType}:${entityId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error logging audit event', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get audit logs for an entity
   */
  async getEntityLogs(entityType, entityId, filters = {}) {
    try {
      const { startDate, endDate, userId, action, limit = 100 } = filters;

      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.entity_type = $1 AND al.entity_id = $2
      `;

      const params = [entityType, entityId];
      let paramCount = 2;

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

      query += ' ORDER BY al.created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
      }

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting entity logs', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get audit logs for a user
   */
  async getUserLogs(userId, filters = {}) {
    try {
      const { startDate, endDate, action, entityType, limit = 100 } = filters;

      let query = `
        SELECT al.*
        FROM audit_logs al
        WHERE al.user_id = $1
      `;

      let params = [userId];
      let paramCount = 1;

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

      query += ' ORDER BY al.created_at DESC';

      if (limit) {
        paramCount++;
        query += ` LIMIT $${paramCount}`;
        params.push(limit);
      }

      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error getting user logs', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get recent audit events across the platform
   */
  async getRecentEvents(limit = 20) {
    try {
      let query = `
        SELECT al.*, u.name as user_name, u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1
      `;
      let result = await this.pool.query(query, [limit]);
      return result.rows;
    } catch (error) {
      logger.error('Error getting recent events', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Generate audit report
   */
  async generateAuditReport(filters = {}) {
    try {
      const { startDate, endDate, entityType, action, groupBy = 'user' } = filters;

      let query = `
        SELECT 
          ${groupBy === 'user' ? 'al.user_id, u.name as user_name' : 'al.entity_type, al.entity_id'},
          COUNT(*) as event_count,
          COUNT(CASE WHEN al.status = 'success' THEN 1 END) as success_count,
          COUNT(CASE WHEN al.status = 'failure' THEN 1 END) as failure_count,
          COUNT(DISTINCT al.action) as unique_actions
        FROM audit_logs al
        ${groupBy === 'user' ? 'LEFT JOIN users u ON al.user_id = u.id' : ''}
        WHERE 1=1
      `;

      let params = [];
      let paramCount = 0;

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

      if (entityType) {
        paramCount++;
        query += ` AND al.entity_type = $${paramCount}`;
        params.push(entityType);
      }

      if (action) {
        paramCount++;
        query += ` AND al.action = $${paramCount}`;
        params.push(action);
      }

      query += groupBy === 'user' ? ' GROUP BY al.user_id, u.name' : ' GROUP BY al.entity_type, al.entity_id';
      query += ' ORDER BY event_count DESC';

      let result = await this.pool.query(query, params);

      return {
        reportType: groupBy,
        period: { startDate, endDate },
        filters,
        summary: result.rows,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error generating audit report', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get compliance audit
   */
  async getComplianceAudit(complianceType, period) {
    try {
      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          cr.status as compliance_status
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        LEFT JOIN compliance_reports cr ON al.entity_id = cr.id
        WHERE al.entity_type = 'compliance_report'
          AND al.action IN ('create', 'update', 'review')
          AND al.metadata->>'compliance_type' = $1
          AND al.created_at >= $2
        ORDER BY al.created_at DESC
      `;

      let result = await this.pool.query(query, [complianceType, period]);

      return {
        complianceType,
        period,
        events: result.rows,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error getting compliance audit', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Get security audit
   */
  async getSecurityAudit(filters = {}) {
    try {
      const { startDate, endDate, eventType } = filters;

      const securityActions = ['login', 'logout', 'failed_login', 'password_change', 'permission_denied', 'data_access'];

      let query = `
        SELECT 
          al.*,
          u.name as user_name,
          u.email as user_email
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        WHERE al.action = ANY($1)
      `;

      let params = [securityActions];
      let paramCount = 1;

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

      if (eventType) {
        paramCount++;
        query += ` AND al.action = $${paramCount}`;
        params.push(eventType);
      }

      query += ' ORDER BY al.created_at DESC';

      let result = await this.pool.query(query, params);

      return {
        securityEvents: result.rows,
        filters,
        generatedAt: new Date()
      };
    } catch (error) {
      logger.error('Error getting security audit', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(filters = {}) {
    try {
      const logs = await this.getEntityLogs(filters.entityType, filters.entityId, filters);

      const csvHeader = 'Timestamp,User,Action,Entity Type,Entity ID,Status,IP Address\n';
      const csvRows = logs.map(log => 
        `${log.created_at},${log.user_name || 'System'},${log.action},${log.entity_type},${log.entity_id},${log.status},${log.ip_address}`
      ).join('\n');

      return csvHeader + csvRows;
    } catch (error) {
      logger.error('Error exporting audit logs', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new AuditService();



