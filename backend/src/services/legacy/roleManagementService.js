/**
 * Role Management Module Service (M014)
 * Role and permission management with AI-powered access optimization
 * Dynamic role assignment, permission inheritance, and access analytics
 */

const { logger } = require('..\/utils\/logger');
const { getPostgreSQL } = require('..\/database\/connection');
const aiGateway = require('./aiGatewayService');
const analytics = require('./analyticsService');

class RoleManagementService {
  constructor() {
    this.aiGateway = aiGateway;
    this.analytics = analytics;
  }

  /**
   * Create new role
   */
  async createRole(roleData) {
    try {
      const pg = getPostgreSQL();
      
      const query = `
        INSERT INTO roles (name, description, permissions, is_system_role, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        RETURNING *
      `;
      
      const result = await pg.query(query, [
        roleData.name,
        roleData.description,
        JSON.stringify(roleData.permissions || []),
        roleData.is_system_role || false
      ]);
      
      logger.info(`Role created: ${result.rows[0].id}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating role:', error);
      throw error;
    }
  }

  /**
   * Get role by ID
   */
  async getRoleById(roleId) {
    try {
      let pg = getPostgreSQL();
      
      let query = `
        SELECT r.*,
               COALESCE(json_agg(DISTINCT u.id) FILTER (WHERE u.id IS NOT NULL), '[]') as user_ids,
               COALESCE(json_agg(DISTINCT p.name) FILTER (WHERE p.name IS NOT NULL), '[]') as permissions
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        LEFT JOIN users u ON ur.user_id = u.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE r.id = $1
        GROUP BY r.id
      `;
      
      let result = await pg.query(query, [roleId]);
      
      if (result.rows.length === 0) {
        throw new Error('Role not found');
      }
      
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting role:', error);
      throw error;
    }
  }

  /**
   * Get all roles
   */
  async getRoles(filters = {}) {
    try {
      let pg = getPostgreSQL();
      
      const { is_system_role } = filters;
      
      let query = `
        SELECT r.*,
               COUNT(DISTINCT ur.user_id) as user_count
        FROM roles r
        LEFT JOIN user_roles ur ON r.id = ur.role_id
        WHERE 1=1
      `;
      
      const params = [];
      let paramCount = 0;
      
      if (is_system_role !== undefined) {
        paramCount++;
        query += ` AND r.is_system_role = $${paramCount}`;
        params.push(is_system_role);
      }
      
      query += ` GROUP BY r.id ORDER BY r.name`;
      
      let result = await pg.query(query, params);
      
      return {
        roles: result.rows,
        total: result.rows.length
      };
    } catch (error) {
      logger.error('Error getting roles:', error);
      throw error;
    }
  }

  /**
   * Update role
   */
  async updateRole(roleId, updates) {
    try {
      let pg = getPostgreSQL();
      
      const allowedFields = ['name', 'description', 'permissions'];
      const updateFields = [];
      const values = [];
      let paramCount = 0;
      
      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          paramCount++;
          if (field === 'permissions') {
            updateFields.push(`${field} = $${paramCount}::jsonb`);
            values.push(JSON.stringify(updates[field]));
          } else {
            updateFields.push(`${field} = $${paramCount}`);
            values.push(updates[field]);
          }
        }
      }
      
      if (updateFields.length === 0) {
        throw new Error('No valid fields to update');
      }
      
      updateFields.push('updated_at = NOW()');
      paramCount++;
      values.push(roleId);
      
      let query = `
        UPDATE roles
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING *
      `;
      
      let result = await pg.query(query, values);
      
      if (result.rows.length === 0) {
        throw new Error('Role not found');
      }
      
      logger.info(`Role updated: ${roleId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating role:', error);
      throw error;
    }
  }

  /**
   * Delete role
   */
  async deleteRole(roleId) {
    try {
      let pg = getPostgreSQL();
      
      // Check if role is system role
      const role = await this.getRoleById(roleId);
      if (role.is_system_role) {
        throw new Error('Cannot delete system role');
      }
      
      let query = `
        DELETE FROM roles
        WHERE id = $1
        RETURNING *
      `;
      
      let result = await pg.query(query, [roleId]);
      
      if (result.rows.length === 0) {
        throw new Error('Role not found');
      }
      
      logger.info(`Role deleted: ${roleId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error deleting role:', error);
      throw error;
    }
  }

  /**
   * Assign permission to role
   */
  async assignPermission(roleId, permissionId) {
    try {
      let pg = getPostgreSQL();
      
      let query = `
        INSERT INTO role_permissions (role_id, permission_id, assigned_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (role_id, permission_id) DO NOTHING
        RETURNING *
      `;
      
      let result = await pg.query(query, [roleId, permissionId]);
      
      logger.info(`Permission ${permissionId} assigned to role ${roleId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error assigning permission:', error);
      throw error;
    }
  }

  /**
   * Remove permission from role
   */
  async removePermission(roleId, permissionId) {
    try {
      let pg = getPostgreSQL();
      
      let query = `
        DELETE FROM role_permissions
        WHERE role_id = $1 AND permission_id = $2
        RETURNING *
      `;
      
      let result = await pg.query(query, [roleId, permissionId]);
      
      logger.info(`Permission ${permissionId} removed from role ${roleId}`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error removing permission:', error);
      throw error;
    }
  }

  /**
   * AI-powered role optimization
   */
  async optimizeRoleAssignments() {
    try {
      const users = await this.getUsersWithRoles();
      const roles = await this.getRoles();
      
      const optimization = await this.aiGateway.optimize('role_assignment', {
        users: users,
        roles: roles.roles
      });
      
      return {
        current_assignments: users,
        optimization_recommendations: optimization,
        potential_improvements: optimization.improvements || [],
        security_gains: optimization.security_gains || {},
        efficiency_gains: optimization.efficiency_gains || {}
      };
    } catch (error) {
      logger.error('Error optimizing role assignments:', error);
      throw error;
    }
  }

  /**
   * AI-powered permission analysis
   */
  async analyzePermissionUsage() {
    try {
      let roles = await this.getRoles();
      const permissionUsage = await this.getPermissionUsage();
      
      const analysis = await this.aiGateway.analyze('permission_usage', {
        roles: roles.roles,
        usage: permissionUsage
      });
      
      return {
        analysis_result: analysis,
        overprivileged_roles: analysis.overprivileged || [],
        underprivileged_roles: analysis.underprivileged || [],
        unused_permissions: analysis.unused || [],
        recommendations: analysis.recommendations || []
      };
    } catch (error) {
      logger.error('Error analyzing permission usage:', error);
      throw error;
    }
  }

  /**
   * Get users with roles
   */
  async getUsersWithRoles() {
    try {
      let pg = getPostgreSQL();
      
      let query = `
        SELECT u.id, u.name, u.email, u.role as primary_role,
               COALESCE(json_agg(DISTINCT r.name) FILTER (WHERE r.name IS NOT NULL), '[]') as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        WHERE u.status = 'active'
        GROUP BY u.id
      `;
      
      let result = await pg.query(query);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting users with roles:', error);
      throw error;
    }
  }

  /**
   * Get permission usage
   */
  async getPermissionUsage() {
    try {
      let pg = getPostgreSQL();
      
      let query = `
        SELECT p.name, p.category, COUNT(rp.role_id) as role_count
        FROM permissions p
        LEFT JOIN role_permissions rp ON p.id = rp.permission_id
        GROUP BY p.id, p.name, p.category
        ORDER BY role_count DESC
      `;
      
      let result = await pg.query(query);
      
      return result.rows;
    } catch (error) {
      logger.error('Error getting permission usage:', error);
      throw error;
    }
  }

  /**
   * Role health check
   */
  async healthCheck() {
    try {
      let pg = getPostgreSQL();
      await pg.query('SELECT 1 FROM roles LIMIT 1');
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Role management health check failed:', error);
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new RoleManagementService();

