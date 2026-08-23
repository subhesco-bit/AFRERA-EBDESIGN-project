/**
 * Role Management Routes (M014) — extracted from platformFoundationRoutes.js
 * (2026-08-21). The rest of that file duplicated already-mounted routes
 * (M011 users, platformCoreRoutes, platformConfigurationRoutes,
 * platformTelemetryRoutes) and was deleted; this /roles section had no
 * live equivalent anywhere and matches frontend/src/services/api.js's
 * getRoles/createRole/updateRole/deleteRole calls against `/roles` exactly.
 */

'use strict';

const express = require('express');
const router = express.Router();
const roleManagementService = require('../services/roleManagementService');
const { authMiddleware, requirePermission } = require('../middleware/auth');

router.post('/', authMiddleware, requirePermission('create_roles'), async (req, res) => {
  try {
    const role = await roleManagementService.createRole(req.body);
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', authMiddleware, requirePermission('read_roles'), async (req, res) => {
  try {
    const roles = await roleManagementService.getRoles(req.query);
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', authMiddleware, requirePermission('read_roles'), async (req, res) => {
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

router.put('/:id', authMiddleware, requirePermission('update_roles'), async (req, res) => {
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

router.delete('/:id', authMiddleware, requirePermission('delete_roles'), async (req, res) => {
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

router.post('/:id/permissions/:permissionId', authMiddleware, requirePermission('assign_permissions'), async (req, res) => {
  try {
    const assignment = await roleManagementService.assignPermission(req.params.id, req.params.permissionId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id/permissions/:permissionId', authMiddleware, requirePermission('remove_permissions'), async (req, res) => {
  try {
    const assignment = await roleManagementService.removePermission(req.params.id, req.params.permissionId);
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/optimize', authMiddleware, requirePermission('system_optimize'), async (req, res) => {
  try {
    const optimization = await roleManagementService.optimizeRoleAssignments();
    res.json(optimization);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/permissions/analysis', authMiddleware, requirePermission('read_analytics'), async (req, res) => {
  try {
    const analysis = await roleManagementService.analyzePermissionUsage();
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
