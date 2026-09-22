'use strict';

const express = require('express');
const router = express.Router();
const service = require('../../services/serverManagementService');
const { authMiddleware } = require('../../middleware/auth');
const { adminMiddleware } = require('../../middleware/admin');

router.use(authMiddleware, adminMiddleware);

const asyncRoute = (handler) => async (req, res) => {
  try {
    await service.initializeStorage();
    res.json({ success: true, data: await handler(req) });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, error: error.message });
  }
};

router.get('/service-health', async (_req, res) => {
  await service.initializeStorage();
  return res.json({
    success: true,
    status: 'healthy',
    servers_count: service.servers.size,
    load_balancers_count: service.loadBalancers.size,
    backup_schedules_count: service.backupSchedules.size,
    monitoring_data_count: service.monitoringData.size,
  });
});
router.get('/servers', asyncRoute(() => service.getAllServers()));
router.get('/servers/group/:group', asyncRoute((req) => service.getServersByGroup(req.params.group)));
router.get('/servers/:serverId', asyncRoute((req) => service.getServer(req.params.serverId)));
router.post('/servers', asyncRoute((req) => service.provisionServer(req.body || {})));
router.put('/servers/:serverId', asyncRoute((req) => service.updateServer(req.params.serverId, req.body || {})));
router.delete('/servers/:serverId', asyncRoute((req) => service.deleteServer(req.params.serverId)));
router.get('/servers/:serverId/metrics', asyncRoute((req) => service.getServerMetrics(req.params.serverId)));
router.post('/servers/:serverId/health-check', asyncRoute((req) => service.healthCheck(req.params.serverId)));
router.get('/metrics', asyncRoute(() => service.getAllMetrics()));
router.post('/scale', asyncRoute((req) => service.scaleServers(req.body.group, req.body.count, req.body.action)));

router.get('/load-balancers', asyncRoute(() => service.getAllLoadBalancers()));
router.get('/load-balancers/:lbId', asyncRoute((req) => service.getLoadBalancer(req.params.lbId)));
router.post('/load-balancers', asyncRoute((req) => service.createLoadBalancer(req.body || {})));
router.put('/load-balancers/:lbId', asyncRoute((req) => service.updateLoadBalancer(req.params.lbId, req.body || {})));
router.delete('/load-balancers/:lbId', asyncRoute((req) => service.deleteLoadBalancer(req.params.lbId)));

router.get('/backup-schedules', asyncRoute(() => service.getAllBackupSchedules()));
router.get('/backup-schedules/:scheduleId', asyncRoute((req) => service.getBackupSchedule(req.params.scheduleId)));
router.post('/backup-schedules', asyncRoute((req) => service.createBackupSchedule(req.body || {})));
router.post('/backup-schedules/:scheduleId/execute', asyncRoute((req) => service.executeBackup(req.params.scheduleId)));

router.get('/server-groups', asyncRoute(() => service.getServerGroups()));
router.get('/server-groups/:groupId', asyncRoute((req) => service.getServerGroup(req.params.groupId)));
router.get('/overview', asyncRoute(() => service.getInfrastructureOverview()));

module.exports = router;