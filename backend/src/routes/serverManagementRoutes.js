/**
 * Server Management Routes
 * 
 * API endpoints for server management including:
 * - Server provisioning and management
 * - Monitoring and metrics
 * - Auto-scaling
 * - Load balancing
 * - Backup and recovery
 * - Health checks
 * - Server groups
 */

const express = require('express');
const router = express.Router();
const serverManagementService = require('../services/serverManagementService');

/**
 * Provision server
 * POST /api/server-management/servers
 */
router.post('/servers', async (req, res) => {
  try {
    const { name, group, cpu, memory, storage, os, tags } = req.body;
    
    if (!name || !group) {
      return res.status(400).json({
        success: false,
        error: 'name and group are required'
      });
    }
    
    const result = await serverManagementService.provisionServer({
      name,
      group,
      cpu,
      memory,
      storage,
      os,
      tags
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error provisioning server:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all servers
 * GET /api/server-management/servers
 */
router.get('/servers', (req, res) => {
  try {
    const servers = serverManagementService.getAllServers();
    
    res.json({
      success: true,
      servers: servers
    });
  } catch (error) {
    console.error('Error getting servers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get server by ID
 * GET /api/server-management/servers/:serverId
 */
router.get('/servers/:serverId', (req, res) => {
  try {
    const { serverId } = req.params;
    const server = serverManagementService.getServer(serverId);
    
    if (!server) {
      return res.status(404).json({
        success: false,
        error: `Server ${serverId} not found`
      });
    }
    
    res.json({
      success: true,
      server: server
    });
  } catch (error) {
    console.error('Error getting server:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get servers by group
 * GET /api/server-management/servers/group/:group
 */
router.get('/servers/group/:group', (req, res) => {
  try {
    const { group } = req.params;
    const servers = serverManagementService.getServersByGroup(group);
    
    res.json({
      success: true,
      servers: servers
    });
  } catch (error) {
    console.error('Error getting servers by group:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update server
 * PUT /api/server-management/servers/:serverId
 */
router.put('/servers/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const updates = req.body;
    
    const result = await serverManagementService.updateServer(serverId, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating server:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete server
 * DELETE /api/server-management/servers/:serverId
 */
router.delete('/servers/:serverId', async (req, res) => {
  try {
    const { serverId } = req.params;
    const result = await serverManagementService.deleteServer(serverId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting server:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get server metrics
 * GET /api/server-management/servers/:serverId/metrics
 */
router.get('/servers/:serverId/metrics', (req, res) => {
  try {
    const { serverId } = req.params;
    const metrics = serverManagementService.getServerMetrics(serverId);
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting server metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all metrics
 * GET /api/server-management/metrics
 */
router.get('/metrics', (req, res) => {
  try {
    const metrics = serverManagementService.getAllMetrics();
    
    res.json({
      success: true,
      metrics: metrics
    });
  } catch (error) {
    console.error('Error getting all metrics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Scale servers
 * POST /api/server-management/scale
 */
router.post('/scale', async (req, res) => {
  try {
    const { group, count, action } = req.body;
    
    if (!group || !count || !action) {
      return res.status(400).json({
        success: false,
        error: 'group, count, and action are required'
      });
    }
    
    const result = await serverManagementService.scaleServers(group, count, action);
    
    res.json(result);
  } catch (error) {
    console.error('Error scaling servers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create load balancer
 * POST /api/server-management/load-balancers
 */
router.post('/load-balancers', async (req, res) => {
  try {
    const { name, type, algorithm, target_servers, health_check } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'name is required'
      });
    }
    
    const result = await serverManagementService.createLoadBalancer({
      name,
      type,
      algorithm,
      target_servers,
      health_check
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating load balancer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all load balancers
 * GET /api/server-management/load-balancers
 */
router.get('/load-balancers', (req, res) => {
  try {
    const loadBalancers = serverManagementService.getAllLoadBalancers();
    
    res.json({
      success: true,
      load_balancers: loadBalancers
    });
  } catch (error) {
    console.error('Error getting load balancers:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get load balancer by ID
 * GET /api/server-management/load-balancers/:lbId
 */
router.get('/load-balancers/:lbId', (req, res) => {
  try {
    const { lbId } = req.params;
    const loadBalancer = serverManagementService.getLoadBalancer(lbId);
    
    if (!loadBalancer) {
      return res.status(404).json({
        success: false,
        error: `Load balancer ${lbId} not found`
      });
    }
    
    res.json({
      success: true,
      load_balancer: loadBalancer
    });
  } catch (error) {
    console.error('Error getting load balancer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update load balancer
 * PUT /api/server-management/load-balancers/:lbId
 */
router.put('/load-balancers/:lbId', async (req, res) => {
  try {
    const { lbId } = req.params;
    const updates = req.body;
    
    const result = await serverManagementService.updateLoadBalancer(lbId, updates);
    
    res.json(result);
  } catch (error) {
    console.error('Error updating load balancer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete load balancer
 * DELETE /api/server-management/load-balancers/:lbId
 */
router.delete('/load-balancers/:lbId', async (req, res) => {
  try {
    const { lbId } = req.params;
    const result = await serverManagementService.deleteLoadBalancer(lbId);
    
    res.json(result);
  } catch (error) {
    console.error('Error deleting load balancer:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create backup schedule
 * POST /api/server-management/backup-schedules
 */
router.post('/backup-schedules', (req, res) => {
  try {
    const { name, servers, schedule, retention, backup_type } = req.body;
    
    if (!name || !servers) {
      return res.status(400).json({
        success: false,
        error: 'name and servers are required'
      });
    }
    
    const result = serverManagementService.createBackupSchedule({
      name,
      servers,
      schedule,
      retention,
      backup_type
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error creating backup schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get all backup schedules
 * GET /api/server-management/backup-schedules
 */
router.get('/backup-schedules', (req, res) => {
  try {
    const schedules = serverManagementService.getAllBackupSchedules();
    
    res.json({
      success: true,
      schedules: schedules
    });
  } catch (error) {
    console.error('Error getting backup schedules:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get backup schedule by ID
 * GET /api/server-management/backup-schedules/:scheduleId
 */
router.get('/backup-schedules/:scheduleId', (req, res) => {
  try {
    const { scheduleId } = req.params;
    const schedule = serverManagementService.getBackupSchedule(scheduleId);
    
    if (!schedule) {
      return res.status(404).json({
        success: false,
        error: `Backup schedule ${scheduleId} not found`
      });
    }
    
    res.json({
      success: true,
      schedule: schedule
    });
  } catch (error) {
    console.error('Error getting backup schedule:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Execute backup
 * POST /api/server-management/backup-schedules/:scheduleId/execute
 */
router.post('/backup-schedules/:scheduleId/execute', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const result = await serverManagementService.executeBackup(scheduleId);
    
    res.json(result);
  } catch (error) {
    console.error('Error executing backup:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check
 * POST /api/server-management/servers/:serverId/health-check
 */
router.post('/servers/:serverId/health-check', async (req, res) => {
  try {
    const { serverId } = req.params;
    const result = await serverManagementService.healthCheck(serverId);
    
    res.json(result);
  } catch (error) {
    console.error('Error performing health check:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get server groups
 * GET /api/server-management/server-groups
 */
router.get('/server-groups', (req, res) => {
  try {
    const groups = serverManagementService.getServerGroups();
    
    res.json({
      success: true,
      groups: groups
    });
  } catch (error) {
    console.error('Error getting server groups:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get server group by ID
 * GET /api/server-management/server-groups/:groupId
 */
router.get('/server-groups/:groupId', (req, res) => {
  try {
    const { groupId } = req.params;
    const group = serverManagementService.getServerGroup(groupId);
    
    if (!group) {
      return res.status(404).json({
        success: false,
        error: `Server group ${groupId} not found`
      });
    }
    
    res.json({
      success: true,
      group: group
    });
  } catch (error) {
    console.error('Error getting server group:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get infrastructure overview
 * GET /api/server-management/overview
 */
router.get('/overview', (req, res) => {
  try {
    const overview = serverManagementService.getInfrastructureOverview();
    
    res.json({
      success: true,
      overview: overview
    });
  } catch (error) {
    console.error('Error getting infrastructure overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Health check for Server Management service
 * GET /api/server-management/service-health
 */
router.get('/service-health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    servers_count: serverManagementService.servers.size,
    load_balancers_count: serverManagementService.loadBalancers.size,
    backup_schedules_count: serverManagementService.backupSchedules.size,
    monitoring_data_count: serverManagementService.monitoringData.size,
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
