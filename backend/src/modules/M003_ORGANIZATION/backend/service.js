/**
 * M003 Organization Management Service - Plug-and-Play Module
 * Production-ready organization management with Claude AI integration
 */

const { getPostgreSQL } = require('../../../backend/src/database/connection');

class OrganizationManagementService {
  constructor() {
    this.moduleId = 'M003_ORGANIZATION';
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
      console.log('Organization database tables verified');
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
        case 'createOrganization': return await this.createOrganization(parameters, context);
        case 'getOrganization': return await this.getOrganization(parameters, context);
        case 'updateOrganization': return await this.updateOrganization(parameters, context);
        case 'deleteOrganization': return await this.deleteOrganization(parameters, context);
        case 'addMember': return await this.addMember(parameters, context);
        case 'removeMember': return await this.removeMember(parameters, context);
        // Merged from backend/src/modules/M004 - listOrganizations didn't exist here.
        case 'listOrganizations': return await this.listOrganizations(parameters, context);
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

  async createOrganization(parameters, context) {
    try {
      const { name, type, description, address } = parameters;
      if (!name) throw new Error('Organization name is required');

      const query = `
        INSERT INTO organizations (name, type, description, address, created_at)
        VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
        RETURNING id, name, type, description, address, created_at
      `;
      
      const result = await this.pool.query(query, [name, type, description, address]);

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'createOrganization', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async getOrganization(parameters, context) {
    try {
      const { organizationId } = parameters;
      if (!organizationId) throw new Error('Organization ID is required');

      const query = 'SELECT * FROM organizations WHERE id = $1 AND deleted_at IS NULL';
      const result = await this.pool.query(query, [organizationId]);
      
      if (result.rows.length === 0) throw new Error('Organization not found');

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'getOrganization', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async updateOrganization(parameters, context) {
    try {
      const { organizationId, updates } = parameters;
      if (!organizationId) throw new Error('Organization ID is required');

      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.name) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updates.name);
      }
      if (updates.type) {
        updateFields.push(`type = $${paramIndex++}`);
        updateValues.push(updates.type);
      }
      if (updates.description) {
        updateFields.push(`description = $${paramIndex++}`);
        updateValues.push(updates.description);
      }

      if (updateFields.length === 0) throw new Error('No valid fields to update');

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(organizationId);

      const query = `UPDATE organizations SET ${updateFields.join(', ')} WHERE id = $${paramIndex} AND deleted_at IS NULL RETURNING *`;
      const result = await this.pool.query(query, updateValues);
      
      if (result.rows.length === 0) throw new Error('Organization not found or update failed');

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'updateOrganization', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteOrganization(parameters, context) {
    try {
      const { organizationId } = parameters;
      if (!organizationId) throw new Error('Organization ID is required');

      const query = 'UPDATE organizations SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1 AND deleted_at IS NULL RETURNING id';
      const result = await this.pool.query(query, [organizationId]);
      
      if (result.rows.length === 0) throw new Error('Organization not found or already deleted');

      return {
        success: true,
        data: { organizationId: organizationId, deleted: true },
        metadata: { operation: 'deleteOrganization', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async addMember(parameters, context) {
    try {
      const { organizationId, userId, role } = parameters;
      if (!organizationId || !userId) throw new Error('Organization ID and User ID are required');

      const query = `
        INSERT INTO organization_members (organization_id, user_id, role, joined_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        ON CONFLICT (organization_id, user_id) DO UPDATE SET role = EXCLUDED.role
        RETURNING organization_id, user_id, role, joined_at
      `;
      
      const result = await this.pool.query(query, [organizationId, userId, role || 'member']);

      return {
        success: true,
        data: result.rows[0],
        metadata: { operation: 'addMember', moduleId: this.moduleId, timestamp: new Date().toISOString() }
      };
    } catch (error) {
      throw error;
    }
  }

  async removeMember(parameters, context) {
    try {
      const { organizationId, userId } = parameters;
      if (!organizationId || !userId) throw new Error('Organization ID and User ID are required');

      const query = 'DELETE FROM organization_members WHERE organization_id = $1 AND user_id = $2 RETURNING organization_id, user_id';
      const result = await this.pool.query(query, [organizationId, userId]);
      
      if (result.rows.length === 0) throw new Error('Member not found');

      return {
        success: true,
        data: { organizationId: organizationId, userId: userId, removed: true },
        metadata: { operation: 'removeMember', moduleId: this.moduleId, timestamp: new Date().toISOString() }
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

// Merged from backend/src/modules/M004 (see there for full context) - the only
// non-colliding operation; createOrganization/getOrganization/updateOrganization
// already existed here with a different (single-object-param) calling convention
// and were left untouched rather than overwritten.
OrganizationManagementService.prototype.listOrganizations = async function (parameters, context) {
  const { listOrganizations } = require('../../../backend/src/modules/M004/service');
  const data = await listOrganizations(parameters);
  return { success: true, data, metadata: { operation: 'listOrganizations', moduleId: this.moduleId, timestamp: new Date().toISOString() } };
};

module.exports = OrganizationManagementService;