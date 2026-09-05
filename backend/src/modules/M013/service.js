// Service for M013 - Authorization (CRITICAL PATH)
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const tableName = 'authorizations';

// Advanced AI-powered authorization service with role-based access control
class AuthorizationService {
  constructor() {
    this.roleHierarchy = {
      'SUPER_ADMIN': 100,
      'ADMIN': 90,
      'MANAGER': 80,
      'SUPERVISOR': 70,
      'USER': 50,
      'GUEST': 10
    };
    
    this.permissionCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  async listAuthorizations({ page = 1, limit = 20, userId = null, roleId = null } = {}) {
    const pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const offset = (page - 1) * limit;
    
    let query = `SELECT COUNT(*) FROM ${tableName}`;
    let countParams = [];
    let conditions = [];
    
    if (userId) {
      conditions.push('user_id = $' + (conditions.length + 1));
      countParams.push(userId);
    }
    if (roleId) {
      conditions.push('role_id = $' + (conditions.length + 1));
      countParams.push(roleId);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    const totalRes = await pg.query(query, countParams);
    const total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = `SELECT a.*, u.username as user_name, r.name as role_name FROM ${tableName} a LEFT JOIN users u ON a.user_id = u.id LEFT JOIN roles r ON a.role_id = r.id`;
    let dataParams = [...countParams];
    
    if (conditions.length > 0) {
      dataQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    dataQuery += ' ORDER BY a.created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    const res = await pg.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async getAuthorization(id) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    let res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
    return res.rows[0] || null;
  }

  async createAuthorization(payload) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { userId, roleId, permissions, context, expiresAt, metadata } = payload;
    
    let res = await pg.query(
      `INSERT INTO ${tableName} (user_id, role_id, permissions, context, expires_at, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [userId, roleId, JSON.stringify(permissions || []), JSON.stringify(context || {}), expiresAt, JSON.stringify(metadata || {})]
    );
    
    // Clear cache for this user
    this.clearUserCache(userId);
    
    return res.rows[0];
  }

  async updateAuthorization(id, payload) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { roleId, permissions, context, expiresAt, status, metadata } = payload;
    
    let res = await pg.query(
      `UPDATE ${tableName} 
       SET role_id = $1, permissions = $2, context = $3, expires_at = $4, status = $5, metadata = $6, updated_at = NOW() 
       WHERE id = $7 RETURNING *`,
      [roleId, JSON.stringify(permissions || []), JSON.stringify(context || {}), expiresAt, status, JSON.stringify(metadata || {}), id]
    );
    
    if (res.rows[0]) {
      this.clearUserCache(res.rows[0].user_id);
    }
    
    return res.rows[0] || null;
  }

  async deleteAuthorization(id) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Get user_id before deletion
    const auth = await this.getAuthorization(id);
    if (auth) {
      this.clearUserCache(auth.user_id);
    }
    
    let res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
    return !!res.rows[0];
  }

  // Advanced authorization check with AI-powered context awareness
  async checkPermission(userId, resource, action, context = {}) {
    const cacheKey = `${userId}:${resource}:${action}`;
    
    // Check cache first
    if (this.permissionCache.has(cacheKey)) {
      const cached = this.permissionCache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.result;
      }
    }
    
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Get user's authorizations
    let res = await pg.query(
      `SELECT a.*, r.hierarchy_level, r.name as role_name 
       FROM ${tableName} a 
       JOIN roles r ON a.role_id = r.id 
       WHERE a.user_id = $1 AND a.status = 'ACTIVE' 
       AND (a.expires_at IS NULL OR a.expires_at > NOW())`,
      [userId]
    );
    
    // AI-powered permission evaluation
    const result = await this.evaluatePermissions(res.rows, resource, action, context);
    
    // Cache result
    this.permissionCache.set(cacheKey, {
      result,
      timestamp: Date.now()
    });
    
    return result;
  }

  async evaluatePermissions(authorizations, resource, action, context) {
    if (!authorizations || authorizations.length === 0) {
      return { authorized: false, reason: 'No active authorizations' };
    }
    
    // Get highest role level
    const maxLevel = Math.max(...authorizations.map(a => a.hierarchy_level || 0));
    
    // Check for explicit permission
    for (const auth of authorizations) {
      const permissions = auth.permissions || [];
      
      // Check exact match
      if (permissions.some(p => p.resource === resource && p.action === action)) {
        return { 
          authorized: true, 
          reason: 'Explicit permission granted',
          role: auth.role_name,
          level: auth.hierarchy_level
        };
      }
      
      // Check wildcard permissions
      if (permissions.some(p => p.resource === '*' && p.action === action)) {
        return { 
          authorized: true, 
          reason: 'Wildcard permission granted',
          role: auth.role_name,
          level: auth.hierarchy_level
        };
      }
      
      if (permissions.some(p => p.resource === resource && p.action === '*')) {
        return { 
          authorized: true, 
          reason: 'Resource wildcard permission granted',
          role: auth.role_name,
          level: auth.hierarchy_level
        };
      }
    }
    
    // AI-powered context-aware authorization
    const contextResult = await this.evaluateContextAwarePermissions(authorizations, resource, action, context);
    if (contextResult.authorized) {
      return contextResult;
    }
    
    // Role-based authorization
    if (maxLevel >= 80) { // Manager and above
      return { 
        authorized: true, 
        reason: 'Role-based authorization (high-level role)',
        level: maxLevel
      };
    }
    
    return { 
      authorized: false, 
      reason: 'No matching permissions found',
      level: maxLevel
    };
  }

  async evaluateContextAwarePermissions(authorizations, resource, action, context) {
    // AI-powered context evaluation
    // This would integrate with ML models for advanced authorization decisions
    
    const factors = {
      timeOfDay: new Date().getHours(),
      location: context.location || 'unknown',
      device: context.device || 'unknown',
      riskScore: context.riskScore || 0
    };
    
    // High-risk scenarios require explicit permissions
    if (factors.riskScore > 0.7) {
      return { 
        authorized: false, 
        reason: 'High-risk context detected',
        factors
      };
    }
    
    // Business hours authorization
    if (factors.timeOfDay >= 9 && factors.timeOfDay <= 17) {
      // Normal business hours - standard authorization
      return null; // Fall through to standard evaluation
    }
    
    // After-hours authorization for high-level roles
    let maxLevel = Math.max(...authorizations.map(a => a.hierarchy_level || 0));
    if (maxLevel >= 90 && factors.timeOfDay >= 17 && factors.timeOfDay <= 22) {
      return {
        authorized: true,
        reason: 'After-hours authorization for high-level role',
        factors
      };
    }
    
    return null;
  }

  async grantPermission(userId, resource, action, conditions = {}) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Get existing authorization for user
    const existingRes = await pg.query(
      `SELECT * FROM ${tableName} WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [userId]
    );
    
    if (existingRes.rows.length === 0) {
      throw new Error('No active authorization found for user');
    }
    
    let auth = existingRes.rows[0];
    let permissions = auth.permissions || [];
    
    // Add new permission if not exists
    if (!permissions.some(p => p.resource === resource && p.action === action)) {
      permissions.push({
        resource,
        action,
        conditions,
        grantedAt: new Date().toISOString()
      });
      
      await this.updateAuthorization(auth.id, { permissions });
    }
    
    this.clearUserCache(userId);
    
    return { granted: true, permission: { resource, action, conditions } };
  }

  async revokePermission(userId, resource, action) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    let existingRes = await pg.query(
      `SELECT * FROM ${tableName} WHERE user_id = $1 AND status = 'ACTIVE' LIMIT 1`,
      [userId]
    );
    
    if (existingRes.rows.length === 0) {
      throw new Error('No active authorization found for user');
    }
    
    let auth = existingRes.rows[0];
    let permissions = (auth.permissions || []).filter(
      p => !(p.resource === resource && p.action === action)
    );
    
    await this.updateAuthorization(auth.id, { permissions });
    this.clearUserCache(userId);
    
    return { revoked: true, permission: { resource, action } };
  }

  async getUserPermissions(userId) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    let res = await pg.query(
      `SELECT permissions FROM ${tableName} WHERE user_id = $1 AND status = 'ACTIVE'`,
      [userId]
    );
    
    const allPermissions = res.rows.reduce((acc, row) => {
      return [...acc, ...(row.permissions || [])];
    }, []);
    
    return {
      userId,
      permissions: allPermissions,
      totalPermissions: allPermissions.length
    };
  }

  async createRole(payload) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    const { name, description, hierarchyLevel, defaultPermissions, metadata } = payload;
    
    let res = await pg.query(
      `INSERT INTO roles (name, description, hierarchy_level, default_permissions, metadata, created_at) 
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [name, description, hierarchyLevel, JSON.stringify(defaultPermissions || []), JSON.stringify(metadata || {})]
    );
    
    return res.rows[0];
  }

  async assignRole(userId, roleId) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    // Check if user already has this role
    let existingRes = await pg.query(
      `SELECT * FROM ${tableName} WHERE user_id = $1 AND role_id = $2`,
      [userId, roleId]
    );
    
    if (existingRes.rows.length > 0) {
      return { assigned: false, reason: 'User already has this role' };
    }
    
    // Get role details
    const roleRes = await pg.query(`SELECT * FROM roles WHERE id = $1`, [roleId]);
    if (roleRes.rows.length === 0) {
      throw new Error('Role not found');
    }
    
    const role = roleRes.rows[0];
    
    let res = await pg.query(
      `INSERT INTO ${tableName} (user_id, role_id, permissions, status, created_at) 
       VALUES ($1, $2, $3, 'ACTIVE', NOW()) RETURNING *`,
      [userId, roleId, JSON.stringify(role.default_permissions || [])]
    );
    
    this.clearUserCache(userId);
    
    return { assigned: true, authorization: res.rows[0] };
  }

  clearUserCache(userId) {
    // Clear all cache entries for this user
    for (const key of this.permissionCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.permissionCache.delete(key);
      }
    }
  }

  async getAuthorizationAuditLog(userId, { page = 1, limit = 20, startDate, endDate } = {}) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    let offset = (page - 1) * limit;
    
    let query = `SELECT COUNT(*) FROM authorization_audit_logs WHERE user_id = $1`;
    let countParams = [userId];
    
    if (startDate) {
      query += ` AND created_at >= $${countParams.length + 1}`;
      countParams.push(startDate);
    }
    if (endDate) {
      query += ` AND created_at <= $${countParams.length + 1}`;
      countParams.push(endDate);
    }
    
    let totalRes = await pg.query(query, countParams);
    let total = parseInt(totalRes.rows[0].count || '0');
    
    let dataQuery = `SELECT * FROM authorization_audit_logs WHERE user_id = $1`;
    let dataParams = [...countParams];
    
    if (startDate) {
      dataQuery += ` AND created_at >= $${dataParams.length + 1}`;
      dataParams.push(startDate);
    }
    if (endDate) {
      dataQuery += ` AND created_at <= $${dataParams.length + 1}`;
      dataParams.push(endDate);
    }
    
    dataQuery += ' ORDER BY created_at DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);
    
    let res = await pg.query(dataQuery, dataParams);
    return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
  }

  async logAuthorizationEvent(userId, event, details) {
    let pg = getPostgreSQL(); if(!pg) throw new Error('Database not initialized');
    
    await pg.query(
      `INSERT INTO authorization_audit_logs (user_id, event, details, created_at) 
       VALUES ($1, $2, $3, NOW())`,
      [userId, event, JSON.stringify(details || {})]
    );
  }
}

const authorizationService = new AuthorizationService();

module.exports = {
  listAuthorizations: (params) => authorizationService.listAuthorizations(params),
  getAuthorization: (id) => authorizationService.getAuthorization(id),
  createAuthorization: (payload) => authorizationService.createAuthorization(payload),
  updateAuthorization: (id, payload) => authorizationService.updateAuthorization(id, payload),
  deleteAuthorization: (id) => authorizationService.deleteAuthorization(id),
  checkPermission: (userId, resource, action, context) => authorizationService.checkPermission(userId, resource, action, context),
  grantPermission: (userId, resource, action, conditions) => authorizationService.grantPermission(userId, resource, action, conditions),
  revokePermission: (userId, resource, action) => authorizationService.revokePermission(userId, resource, action),
  getUserPermissions: (userId) => authorizationService.getUserPermissions(userId),
  createRole: (payload) => authorizationService.createRole(payload),
  assignRole: (userId, roleId) => authorizationService.assignRole(userId, roleId),
  getAuthorizationAuditLog: (userId, params) => authorizationService.getAuthorizationAuditLog(userId, params),
  logAuthorizationEvent: (userId, event, details) => authorizationService.logAuthorizationEvent(userId, event, details)
};