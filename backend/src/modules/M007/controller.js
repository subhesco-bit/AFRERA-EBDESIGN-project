// Controller for Role & Permission Management (M007) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Role management
async function listRoles(req, res) {
  try {
    const { page, limit } = req.query;
    const result = await service.listRoles({ page, limit });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('listRoles error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getRole(req, res) {
  try {
    const role = await service.getRole(req.params.id);
    if (!role) return res.status(404).json({ success: false, error: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    logger.error('getRole error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createRole(req, res) {
  try {
    const role = await service.createRole(req.body);
    res.status(201).json({ success: true, data: role });
  } catch (error) {
    logger.error('createRole error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateRole(req, res) {
  try {
    const role = await service.updateRole(req.params.id, req.body);
    if (!role) return res.status(404).json({ success: false, error: 'Role not found' });
    res.json({ success: true, data: role });
  } catch (error) {
    logger.error('updateRole error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function deleteRole(req, res) {
  try {
    const deleted = await service.deleteRole(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, error: 'Role not found' });
    res.json({ success: true, message: 'Role deleted successfully' });
  } catch (error) {
    logger.error('deleteRole error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Permission management
async function listPermissions(req, res) {
  try {
    const permissions = await service.listPermissions();
    res.json({ success: true, data: permissions });
  } catch (error) {
    logger.error('listPermissions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createPermission(req, res) {
  try {
    const permission = await service.createPermission(req.body);
    res.status(201).json({ success: true, data: permission });
  } catch (error) {
    logger.error('createPermission error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// User role assignment
async function assignRoleToUser(req, res) {
  try {
    const { userId, roleId } = req.body;
    const assignment = await service.assignRoleToUser(userId, roleId);
    res.json({ success: true, data: assignment });
  } catch (error) {
    logger.error('assignRoleToUser error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function removeRoleFromUser(req, res) {
  try {
    const { userId, roleId } = req.body;
    const removed = await service.removeRoleFromUser(userId, roleId);
    res.json({ success: true, data: removed });
  } catch (error) {
    logger.error('removeRoleFromUser error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserRoles(req, res) {
  try {
    const roles = await service.getUserRoles(req.params.userId);
    res.json({ success: true, data: roles });
  } catch (error) {
    logger.error('getUserRoles error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserPermissions(req, res) {
  try {
    const permissions = await service.getUserPermissions(req.params.userId);
    res.json({ success: true, data: permissions });
  } catch (error) {
    logger.error('getUserPermissions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered features
async function recommendRoleForUser(req, res) {
  try {
    const recommendation = await service.recommendRoleForUser(req.params.userId);
    res.json({ success: true, data: recommendation });
  } catch (error) {
    logger.error('recommendRoleForUser error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPermissionMatrix(req, res) {
  try {
    const matrix = await service.getPermissionMatrix();
    res.json({ success: true, data: matrix });
  } catch (error) {
    logger.error('getPermissionMatrix error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getRoleHierarchy(req, res) {
  try {
    const hierarchy = await service.getRoleHierarchy();
    res.json({ success: true, data: hierarchy });
  } catch (error) {
    logger.error('getRoleHierarchy error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
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