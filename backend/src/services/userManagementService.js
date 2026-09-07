/**
 * User Management Module Service (M011)
 * User management with AI-powered insights and automation
 * User lifecycle, permissions, and intelligent user analytics
 */

const { logger } = require('../utils/logger');
const { getPostgreSQL } = require('../database/connection');
const aiGateway = require('./aiGatewayService');
const analytics = require('./analyticsService');

class UserManagementService {
  constructor() {
    this.aiGateway = aiGateway;
    this.analytics = analytics;
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        INSERT INTO users (name, email, phone, role, status, created_at)
        VALUES ($1, $2, $3, $4, 'active', NOW())
        RETURNING *
      `;
      
      const result = await pg.query(query, [
        userData.name,
        userData.email,
        userData.phone,
        userData.role || 'user'
      ]);
      
      logger.info(`User created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        SELECT u.*, 
               COALESCE(json_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles,
               COALESCE(json_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]') as permissions
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1
        GROUP BY u.id
      `;
      
      const result = await pg.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting user:', error);
      throw error;
    }
  }

  /**
   * Get users with filtering and pagination
   */
  async getUsers(filters = {}, pagination = {}) {
    try {
      const pg = getPostgreSQL();
      
      const { role, status, search } = filters;
      const { page = 1, limit = 20, sort_by = 'created_at', sort_order = 'DESC' } = pagination;
      
      const offset = (page - 1) * limit;
      
      let query = `
        SELECT u.*, 
               COALESCE(json_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 0;
      
      if (role) {
        paramCount++;
        query += ` AND u.role = $${paramCount}`;
        params.push(role);
      }
      
      if (status) {
        paramCount++;
        query += ` AND u.status = $${paramCount}`;
        params.push(status);
      }
      
      if (search) {
        paramCount++;
        query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
        params.push(`%${search}%`);
      }
      
      query += ` GROUP BY u.id ORDER BY u.${sort_by} ${sort_order} LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
      params.push(limit, offset);
      
      const result = await pg.query(query, params);
      
      // Get total count
      const countQuery = query.replace(/SELECT u\.\*,.*?GROUP BY u\.id.*?ORDER BY u\.\w+ \w+ LIMIT \d+ OFFSET \d+/, 'SELECT COUNT(DISTINCT u.id)');
      const countResult = await pg.query(countQuery, params.slice(0, paramCount));
      const total = parseInt(countResult.rows[0].count);
      
      return {
        users: result.rows,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Update user
   */
  async updateUser(userId, updates) {
    try {
      const pg = getPostgreSQL();
      
      const allowedFields = ['name', 'email', 'phone', 'role', 'status'];
      const updateFields = [];
      const values = [];
      let paramCount = 0;
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          paramCount++;
          updateFields.push(`${field} = $${paramCount}`);
          values.push(updates[field]);
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push('updated_at = NOW()');
      paramCount++;
      values.push(userId);
      
      const query = `
        UPDATE users
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      const result = await pg.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      logger.info(`User updated: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating user:', error);
      throw error;
    }
  }

  /**
   * Delete user
   */
  async deleteUser(userId) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        UPDATE users
        SET status = 'deleted', deleted_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await pg.query(query, [userId]);
      
      if (result.rows.length === 0) {
        throw new Error('User not found');
      }
      
      logger.info(`User deleted: ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw error;
    }
  }

  /**
   * AI-powered user behavior analysis
   */
  async analyzeUserBehavior(userId, timeframe = '30d') {
    try {
      const userData = await this.getUserById(userId);
      const userActivity = await this.getUserActivity(userId, timeframe);
      
      const analysis = await this.aiGateway.analyze('user_behavior', {
        user: userData,
        activity: userActivity,
        timeframe
      });
      
      return {
        user_id: userId,
        analysis_period: timeframe,
        behavior_patterns: analysis.patterns,
        engagement_score: analysis.engagement_score,
        risk_factors: analysis.risk_factors,
        recommendations: analysis.recommendations,
        predicted_churn_risk: analysis.churn_risk,
        analyzed_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  /**
   * AI-powered user segmentation
   */
  async segmentUsers(criteria = {}) {
    try {
      const users = await this.getUsers(criteria, { limit: 10000 });
      
      const segmentation = await this.aiGateway.analyze('user_segmentation', {
        users: users.users,
        criteria
      });
      
      return {
        total_users: users.pagination.total,
        segments: segmentation.segments,
        segment_sizes: segmentation.sizes,
        segment_characteristics: segmentation.characteristics,
        recommendations: segmentation.recommendations,
        segmented_at: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Error segmenting users:', error);
      throw error;
    }
  }

  /**
   * User activity analytics
   */
  async getUserAnalytics(parameters) {
    try {
      const report = await this.analytics.generateReport('user_analytics', parameters);
      
      return {
        report_type: 'user_analytics',
        summary: report.summary,
        user_demographics: report.user_demographics,
        engagement_metrics: report.engagement_metrics,
        feature_usage: report.feature_usage,
        user_journey: report.user_journey,
        generated_at: report.generated_at
      };
    } catch (error) {
      logger.error('Error getting user analytics:', error);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(userId, roleId) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        INSERT INTO user_roles (user_id, role_id, assigned_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id, role_id) DO NOTHING
        RETURNING *
      `;
      
      const result = await pg.query(query, [userId, roleId]);
      
      logger.info(`Role ${roleId} assigned to user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error assigning role:', error);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  async removeRole(userId, roleId) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        DELETE FROM user_roles
        WHERE user_id = $1 AND role_id = $2
        RETURNING *
      `;
      
      const result = await pg.query(query, [userId, roleId]);
      
      logger.info(`Role ${roleId} removed from user ${userId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error removing role:', error);
      throw error;
    }
  }

  /**
   * Get user activity
   */
  async getUserActivity(userId, timeframe) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        SELECT *
        FROM user_activities
        WHERE user_id = $1
          AND created_at >= NOW() - INTERVAL '${timeframe}'
        ORDER BY created_at DESC
      `;
      
      const result = await pg.query(query, [userId]);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting user activity:', error);
      throw error;
    }
  }

  /**
   * User health check
   */
  async healthCheck() {
    try {
      const pg = getPostgreSQL();
      await pg.query('SELECT 1 FROM users LIMIT 1');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('User management health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new UserManagementService();