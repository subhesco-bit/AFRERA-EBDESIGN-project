/**
 * Platform Foundation Routes
 * Routes for M001-M020 Platform Foundation modules
 */

const express = require('express');
const router = express.Router();
const platformCoreService = require('../services/platformCoreService');
const userManagementService = require('../services/userManagementService');
const roleManagementService = require('../services/roleManagementService');
const { authMiddleware, requireRole, requirePermission } = require('../middleware/auth');

// ============================================================================
// Platform Core Routes (M001)
// ============================================================================

// Platform status and health
router.get('/platform/status', authMiddleware, async (req, res) => {
  try {
    const status = await platformCoreService.getPlatformStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/platform/health', async (req, res) => {
  try {
    const health = await platformCoreService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform configuration
router.get('/platform/config', authMiddleware, requirePermission('read_config'), async (req, res) => {
  try {
    const config = await platformCoreService.getPlatformConfiguration();
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/platform/config/:configId', authMiddleware, requirePermission('update_config'), async (req, res) => {
  try {
    const updated = await platformCoreService.updatePlatformConfiguration(
      req.params.configId,
      { ...req.body, updated_by: req.user.id }
    );
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform optimization
router.post('/platform/optimize', authMiddleware, requirePermission('system_optimize'), async (req, res) => {
  try {
    const optimization = await platformCoreService.optimizeSystem(req.body);
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform analysis
router.post('/platform/analyze', authMiddleware, requirePermission('system_analyze'), async (req, res) => {
  try {
    const analysis = await platformCoreService.analyzeSystemPerformance(req.body);
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform analytics
router.get('/platform/analytics', authMiddleware, requirePermission('read_analytics'), async (req, res) => {
  try {
    const analytics = await platformCoreService.getPlatformAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Platform monitoring
router.post('/platform/monitoring/start', authMiddleware, requirePermission('system_monitor'), async (req, res) => {
  try {
    const monitor = await platformCoreService.startPlatformMonitoring(req.body);
    res.json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// User Management Routes (M011)
// ============================================================================

// User CRUD operations
router.post('/users', authMiddleware, requirePermission('create_user'), async (req, res) => {
  try {
    const user = await userManagementService.createUser(req.body);
    res.status(201).json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users', authMiddleware, requirePermission('read_users'), async (req, res) => {
  try {
    const users = await userManagementService.getUsers(req.query, {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 20,
      sort_by: req.query.sort_by || 'created_at',
      sort_order: req.query.sort_order || 'DESC'
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/:id', authMiddleware, requirePermission('read_users'), async (req, res) => {
  try {
    const user = await userManagementService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.put('/users/:id', authMiddleware, requirePermission('update_users'), async (req, res) => {
  try {
    const user = await userManagementService.updateUser(req.params.id, req.body);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.delete('/users/:id', authMiddleware, requirePermission('delete_users'), async (req, res) => {
  try {
    const user = await userManagementService.deleteUser(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.message === 'User not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// User role assignments
router.post('/users/:id/roles/:roleId', authMiddleware, requirePermission('assign_roles'), async (req, res) => {
  try {
    const assignment = await userManagementService.assignRole(req.params.id, req.params.roleId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/users/:id/roles/:roleId', authMiddleware, requirePermission('remove_roles'), async (req, res) => {
  try {
    const assignment = await userManagementService.removeRole(req.params.id, req.params.roleId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User analytics and AI features
router.get('/users/:id/behavior', authMiddleware, requirePermission('read_analytics'), async (req, res) => {
  try {
    const analysis = await userManagementService.analyzeUserBehavior(
      req.params.id,
      req.query.timeframe || '30d'
    );
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/users/segment', authMiddleware, requirePermission('read_analytics'), async (req, res) => {
  try {
    const segmentation = await userManagementService.segmentUsers(req.body);
    res.json(segmentation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/users/analytics', authMiddleware, requirePermission('read_analytics'), async (req, res) => {
  try {
    const analytics = await userManagementService.getUserAnalytics(req.query);
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Role Management Routes (M014)
// ============================================================================

// Role CRUD operations
router.post('/roles', authMiddleware, requirePermission('create_roles'), async (req, res) => {
  try {
    const role = await roleManagementService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/roles', authMiddleware, requirePermission('read_roles'), async (req, res) => {
  try {
    const roles = await roleManagementService.getRoles(req.query);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/roles/:id', authMiddleware, requirePermission('read_roles'), async (req, res) => {
  try {
    const role = await roleManagementService.getRoleById(req.params.id);
    res.json(role);
  } catch (error) {
    if (error.message === 'Role not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.put('/roles/:id', authMiddleware, requirePermission('update_roles'), async (req, res) => {
  try {
    const role = await roleManagementService.updateRole(req.params.id, req.body);
    res.json(role);
  } catch (error) {
    if (error.message === 'Role not found') {
      res.status(404).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

router.delete('/roles/:id', authMiddleware, requirePermission('delete_roles'), async (req, res) => {
  try {
    const role = await roleManagementService.deleteRole(req.params.id);
    res.json(role);
  } catch (error) {
    if (error.message === 'Role not found' || error.message === 'Cannot delete system role') {
      res.status(400).json({ error: error.message });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Role permission assignments
router.post('/roles/:id/permissions/:permissionId', authMiddleware, requirePermission('assign_permissions'), async (req, res) => {
  try {
    const assignment = await roleManagementService.assignPermission(req.params.id, req.params.permissionId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/roles/:id/permissions/:permissionId', authMiddleware, requirePermission('remove_permissions'), async (req, res) => {
  try {
    const assignment = await roleManagementService.removePermission(req.params.id, req.params.permissionId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Role AI features
router.post('/roles/optimize', authMiddleware, requirePermission('system_optimize'), async (req, res) => {
  try {
    const optimization = await roleManagementService.optimizeRoleAssignments();
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/roles/permissions/analysis', authMiddleware, requirePermission('read_analytics'), async (req, res) => {
  try {
    const analysis = await roleManagementService.analyzePermissionUsage();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Health Check Endpoints
// ============================================================================

router.get('/health/users', async (req, res) => {
  try {
    const health = await userManagementService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/health/roles', async (req, res) => {
  try {
    const health = await roleManagementService.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;