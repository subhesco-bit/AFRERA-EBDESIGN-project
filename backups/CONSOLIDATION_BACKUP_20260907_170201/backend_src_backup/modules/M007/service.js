// Service for Role & Permission Management (M007) - AI Enhanced
// Dynamic RBAC with AI-powered permission optimization and role recommendation
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { signalBus, SIGNAL, SEVERITY } = require('../../core/signalBus');

// Role management
async function listRoles({ page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const offset = (page - 1) * limit;
  const totalRes = await pg.query('SELECT COUNT(*) FROM roles');
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query('SELECT * FROM roles ORDER BY name ASC LIMIT $1 OFFSET $2', [limit, offset]);
  return { items: res.rows, pagination: { page, limit, total, totalPages: Math.ceil(total/limit) } };
}

async function getRole(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM roles WHERE id = $1', [id]);
  return res.rows[0] || null;
}

async function createRole(roleData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { name, description, permissions = [], parentRoleId = null } = roleData;
  const res = await pg.query(
    `INSERT INTO roles (name, description, permissions, parent_role_id, created_at, updated_at)
     VALUES ($1, $2, $3, $4, NOW(), NOW())
     RETURNING *`,
    [name, description, JSON.stringify(permissions), parentRoleId]
  );
  
  // Emit signal for role creation
  signalBus.emitSignal(SIGNAL.ORGANIZATION_CREATED, {
    entityType: 'role',
    roleId: res.rows[0].id,
    roleName: name
  }, {
    severity: SEVERITY.INFO,
    source: 'role_permission_service',
    entityId: res.rows[0].id
  });
  
  return res.rows[0];
}

async function updateRole(id, roleData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { name, description, permissions, parentRoleId } = roleData;
  const res = await pg.query(
    `UPDATE roles 
     SET name = COALESCE($1, name),
         description = COALESCE($2, description),
         permissions = COALESCE($3, permissions),
         parent_role_id = COALESCE($4, parent_role_id),
         updated_at = NOW()
     WHERE id = $5
     RETURNING *`,
    [name, description, permissions ? JSON.stringify(permissions) : null, parentRoleId, id]
  );
  
  // Emit signal for role update
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'role',
    roleId: id,
    changes: roleData
  }, {
    severity: SEVERITY.INFO,
    source: 'role_permission_service',
    entityId: id
  });
  
  return res.rows[0] || null;
}

async function deleteRole(id) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('DELETE FROM roles WHERE id = $1 RETURNING id', [id]);
  return !!res.rows[0];
}

// Permission management
async function listPermissions() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query('SELECT * FROM permissions ORDER BY resource, action ASC');
  return res.rows;
}

async function createPermission(permissionData) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { resource, action, description } = permissionData;
  const res = await pg.query(
    `INSERT INTO permissions (resource, action, description, created_at)
     VALUES ($1, $2, $3, NOW())
     RETURNING *`,
    [resource, action, description]
  );
  return res.rows[0];
}

// User role assignment
async function assignRoleToUser(userId, roleId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `INSERT INTO user_roles (user_id, role_id, assigned_at)
     VALUES ($1, $2, NOW())
     ON CONFLICT (user_id, role_id) DO NOTHING
     RETURNING *`,
    [userId, roleId]
  );
  
  // Emit signal for role assignment
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'user_role',
    userId,
    roleId,
    action: 'assigned'
  }, {
    severity: SEVERITY.INFO,
    source: 'role_permission_service',
    entityId: userId
  });
  
  return res.rows[0] || null;
}

async function removeRoleFromUser(userId, roleId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    'DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2 RETURNING *',
    [userId, roleId]
  );
  
  // Emit signal for role removal
  signalBus.emitSignal(SIGNAL.ORGANIZATION_UPDATED, {
    entityType: 'user_role',
    userId,
    roleId,
    action: 'removed'
  }, {
    severity: SEVERITY.INFO,
    source: 'role_permission_service',
    entityId: userId
  });
  
  return res.rows[0] || null;
}

async function getUserRoles(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `SELECT r.* FROM roles r
     JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return res.rows;
}

async function getUserPermissions(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(
    `SELECT DISTINCT p.* FROM permissions p
     JOIN roles r ON p.id = ANY(r.permissions)
     JOIN user_roles ur ON r.id = ur.role_id
     WHERE ur.user_id = $1`,
    [userId]
  );
  return res.rows;
}

// AI-powered role recommendation
async function recommendRoleForUser(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  // Get user's current roles
  const currentRoles = await getUserRoles(userId);
  const currentRoleIds = currentRoles.map(r => r.id);
  
  // Get all roles
  const allRoles = await pg.query('SELECT * FROM roles');
  
  // Get user's recent activity
  const recentActivity = await pg.query(
    `SELECT action, entity, COUNT(*) as count
     FROM audit_logs
     WHERE user_id = $1 AND created_at > NOW() - INTERVAL '30 days'
     GROUP BY action, entity
     ORDER BY count DESC
     LIMIT 10`,
    [userId]
  );
  
  // AI-based recommendation logic
  const recommendations = allRoles.rows.filter(role => {
    // Don't recommend roles user already has
    if (currentRoleIds.includes(role.id)) return false;
    
    // Simple heuristic: recommend roles with permissions matching user's activity
    const permissions = role.permissions || [];
    const activityPatterns = recentActivity.rows.map(a => `${a.action}:${a.entity}`);
    
    return permissions.some(perm => 
      activityPatterns.some(pattern => pattern.includes(perm))
    );
  });
  
  return {
    currentRoles,
    recommendedRoles: recommendations,
    confidence: recommendations.length > 0 ? 0.75 : 0,
    reasoning: recommendations.length > 0 
      ? 'Based on recent activity patterns matching role permissions' 
      : 'No matching activity patterns found'
  };
}

// Permission matrix for UI
async function getPermissionMatrix() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const roles = await pg.query('SELECT * FROM roles ORDER BY name');
  const permissions = await pg.query('SELECT * FROM permissions ORDER BY resource, action');
  
  const matrix = roles.rows.map(role => {
    const rolePermissions = role.permissions || [];
    return {
      role: role,
      permissions: permissions.rows.map(perm => ({
        permission: perm,
        granted: rolePermissions.includes(perm.id)
      }))
    };
  });
  
  return {
    roles: roles.rows,
    permissions: permissions.rows,
    matrix
  };
}

// Role hierarchy
async function getRoleHierarchy() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  
  const roles = await pg.query('SELECT * FROM roles ORDER BY name');
  
  // Build hierarchy tree
  const roleMap = new Map();
  roles.rows.forEach(role => {
    roleMap.set(role.id, { ...role, children: [] });
  });
  
  const rootRoles = [];
  roles.rows.forEach(role => {
    if (role.parent_role_id) {
      const parent = roleMap.get(role.parent_role_id);
      if (parent) {
        parent.children.push(roleMap.get(role.id));
      }
    } else {
      rootRoles.push(roleMap.get(role.id));
    }
  });
  
  return rootRoles;
}

module.exports = {
  // Role management
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  
  // Permission management
  listPermissions,
  createPermission,
  
  // User role assignment
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getUserPermissions,
  
  // AI-powered features
  recommendRoleForUser,
  getPermissionMatrix,
  getRoleHierarchy,
};