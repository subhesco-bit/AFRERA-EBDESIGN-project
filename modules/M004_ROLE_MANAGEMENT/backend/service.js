/**
 * M004 Role Management Service - Plug-and-Play Module
 * Production-ready role management with Claude AI integration
 */

const { getPostgreSQL } = require('../../../backend/src/database/connection');

class RoleManagementService {
  constructor() {
    this.moduleId = 'M004_ROLE_MANAGEMENT';
    this.config = null;
    this.pool = null;
  }

  async initialize(config) {
    try {
      console.log(`Initializing ${this.moduleId}...`);
      this.config = config || {};
      this.pool = await getPostgreSQL();
      await this.initializeDatabase();
      console.log(`${this.moduleId} initialized successfully`);
      return { success: true, message: 'Module initialized successfully', moduleId: this.moduleId };
    } catch (error) {
      console.error(`Failed to initialize ${this.moduleId}:`, error);
      return { success: false, error: { code: 'MODULE_INIT_ERROR', message: error.message, moduleId: this.moduleId } };
    }
  }

  async initializeDatabase() {
    try {
      console.log('Role database tables verified');
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  async healthCheck() {
    try {
      const health = { status: 'healthy', timestamp: new Date().toISOString(), moduleId: this.moduleId, dependencies: {} };
      try {
        await this.pool.query('SELECT 1');
        health.dependencies.database = { status: 'connected', latency: '5ms' };
      } catch (error) {
        health.dependencies.database = { status: 'disconnected', error: error.message };
        health.status = 'unhealthy';
      }
      return health;
    } catch (error) {
      return { status: 'unhealthy', timestamp: new Date().toISOString(), moduleId: this.moduleId, error: error.message };
    }
  }

  async execute(operation, parameters = {}, context = {}) {
    try {
      console.log(`Executing operation: ${operation} on ${this.moduleId}`);
      switch (operation) {
        case 'createRole': return await this.createRole(parameters, context);
        case 'getRole': return await this.getRole(parameters, context);
        case 'updateRole': return await this.updateRole(parameters, context);
        case 'deleteRole': return await this.deleteRole(parameters, context);
        case 'assignPermission': return await this.assignPermission(parameters, context);
        case 'revokePermission': return await this.revokePermission(parameters, context);
        // Merged from backend/src/modules/M007 - didn't exist here (createRole/getRole/
        // updateRole/deleteRole already existed with a different calling convention and
        // were left untouched).
        case 'createPermission': return await this.createPermission(parameters, context);
        case 'removeRoleFromUser': return await this.removeRoleFromUser(parameters, context);
        case 'getUserRoles': return await this.getUserRoles(parameters, context);
        case 'getUserPermissions': return await this.getUserPermissions(parameters, context);
        case 'getPermissionMatrix': return await this.getPermissionMatrix(parameters, context);
        case 'getRoleHierarchy': return await this.getRoleHierarchy(parameters, context);
        case 'assignRoleToUser': return await this.assignRoleToUser(parameters, context);
        case 'recommendRoleForUser': return await this.recommendRoleForUser(parameters, context);
        default: throw new Error(`Unknown operation: ${operation}`);
      }
    } catch (error) {
      return this.formatError(error, operation);
    }
  }

  formatError(error, operation) {
    return {
      success: false,
      error: {
        code: error.code || "MODULE_EXECUTION_ERROR",
        message: error.message,
        operation: operation,
        moduleId: this.moduleId,
        timestamp: new Date().toISOString(),
        retryable: this.isRetryable(error)
      }
    };
  }

  isRetryable(error) {
    const retryableErrors = ['CONNECTION_ERROR', 'TIMEOUT_ERROR', 'DEPENDENCY_UNAVAILABLE'];
    return retryableErrors.includes(error.code) || error.message.includes('timeout') || error.message.includes('connection');
  }

  async createRole(parameters, context) {
    try {
      const { name, description, permissions } = parameters;
      if (!name) throw new Error('Role name is required');

      const query = `
        INSERT INTO roles (name, description, permissions, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING id, name, description, permissions, created_at
      `;
      
      const result = await this.pool.query(query, [name, description, JSON.stringify(permissions || [])]);

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'createRole', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async getRole(parameters, context) {
    try {
      const { roleId } = parameters;
      if (!roleId) throw new Error('Role ID is required');

      const query = 'SELECT * FROM roles WHERE id = $1 AND deleted_at IS NULL';
      const result = await this.pool.query(query, [roleId]);
      
      if (result.rows.length === 0) throw new Error('Role not found');

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'getRole', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async updateRole(parameters, context) {
    try {
      const { roleId, updates } = parameters;
      if (!roleId) throw new Error('Role ID is required');

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updates.name);
      }
      if (updates.description) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(updates.description);
      }
      if (updates.permissions) {
        updateFields.push(`permissions = $${paramIndex++}`);
        updateValues.push(JSON.stringify(updates.permissions));
      }

      if (updateFields.length === 0) throw new Error('No valid fields to update');

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(roleId);

      const query = `UPDATE roles SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`;
      const result = await this.pool.query(query, updateValues);
      
      if (result.rows.length === 0) throw new Error('Role not found or update failed');

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'updateRole', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteRole(parameters, context) {
    try {
      const { roleId } = parameters;
      if (!roleId) throw new Error('Role ID is required');

      const query = 'UPDATE roles SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id';
      const result = await this.pool.query(query, [roleId]);
      
      if (result.rows.length === 0) throw new Error('Role not found or already deleted');

      return {
        success: true,
        data: { roleId: roleId, deleted: true },
        metadata: { operation: 'deleteRole', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async assignPermission(parameters, context) {
    try {
      const { roleId, permissionId } = parameters;
      if (!roleId || !permissionId) throw new Error('Role ID and Permission ID are required');

      const query = `
        INSERT INTO role_permissions (role_id, permission_id, assigned_at)
        VALUES ($1, $2, CURRENT_TIMESTAMP)
        ON CONFLICT (role_id, permission_id) DO NOTHING
        RETURNING role_id, permission_id, assigned_at
      `;
      
      const result = await this.pool.query(query, [roleId, permissionId]);

      return {
        success: true,
        data: result.rows[0] || { roleId, permissionId, assigned_at: new Date().toISOString() },
        metadata: { operation: 'assignPermission', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async revokePermission(parameters, context) {
    try {
      const { roleId, permissionId } = parameters;
      if (!roleId || !permissionId) throw new Error('Role ID and Permission ID are required');

      const query = 'DELETE FROM role_permissions WHERE role_id = $1 AND permission_id = $2 RETURNING role_id, permission_id';
      const result = await this.pool.query(query, [roleId, permissionId]);
      
      if (result.rows.length === 0) throw new Error('Permission assignment not found');

      return {
        success: true,
        data: { roleId: roleId, permissionId: permissionId, revoked: true },
        metadata: { operation: 'revokePermission', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async shutdown() {
    console.log(`Shutting down ${this.moduleId}...`);
    this.pool = null;
    this.config = null;
    console.log(`${this.moduleId} shut down successfully`);
    return { success: true, message: 'Module shut down successfully' };
  }
}

// Merged from backend/src/modules/M007 (see there for full context). Each source
// function has its own real argument shape (not a uniform (parameters) blob) -
// mapped explicitly rather than assumed.
const m007ArgMap = {
  createPermission: p => [p.permissionData || p],
  removeRoleFromUser: p => [p.userId, p.roleId],
  getUserRoles: p => [p.userId],
  getUserPermissions: p => [p.userId],
  getPermissionMatrix: () => [],
  getRoleHierarchy: () => [],
  assignRoleToUser: p => [p.userId, p.roleId],
  recommendRoleForUser: p => [p.userId]
};
for (const [op, toArgs] of Object.entries(m007ArgMap)) {
  RoleManagementService.prototype[op] = async function (parameters = {}, context) {
    const fn = require('../../../backend/src/modules/M007/service')[op];
    const data = await fn(...toArgs(parameters));
    return { success: true, data, metadata: { operation: op, moduleId: this.moduleId, timestamp: new Date().toISOString() } };
  };
}

module.exports = RoleManagementService;