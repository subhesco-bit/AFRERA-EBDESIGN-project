const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Role management
router.get('/roles', authMiddleware, requireRole('admin'), controller.listRoles);
router.get('/roles/:id', authMiddleware, requireRole('admin'), controller.getRole);
router.post('/roles', authMiddleware, requireRole('admin'), controller.createRole);
router.put('/roles/:id', authMiddleware, requireRole('admin'), controller.updateRole);
router.delete('/roles/:id', authMiddleware, requireRole('admin'), controller.deleteRole);

// Permission management
router.get('/permissions', authMiddleware, requireRole('admin'), controller.listPermissions);
router.post('/permissions', authMiddleware, requireRole('admin'), controller.createPermission);

// User role assignment
router.post('/assign-role', authMiddleware, requireRole('admin'), controller.assignRoleToUser);
router.post('/remove-role', authMiddleware, requireRole('admin'), controller.removeRoleFromUser);
router.get('/users/:userId/roles', authMiddleware, controller.getUserRoles);
router.get('/users/:userId/permissions', authMiddleware, controller.getUserPermissions);

// AI-powered features
router.get('/users/:userId/recommend-role', authMiddleware, requireRole('admin'), controller.recommendRoleForUser);
router.get('/permission-matrix', authMiddleware, requireRole('admin'), controller.getPermissionMatrix);
router.get('/role-hierarchy', authMiddleware, requireRole('admin'), controller.getRoleHierarchy);

module.exports = router;