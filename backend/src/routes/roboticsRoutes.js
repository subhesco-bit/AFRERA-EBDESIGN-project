'use strict';

const express = require('express');
const service = require('../services/robotics/roboticsOrchestrationService');
const { authMiddleware, requireRole, userRateLimit } = require('../middleware/auth');

const router = express.Router();
const operator = requireRole('admin', 'super_admin', 'operations_manager', 'robotics_operator', 'warehouse_manager');
const safetyOfficer = requireRole('admin', 'super_admin', 'safety_officer');
const telemetryWriter = requireRole('admin', 'super_admin', 'robotics_operator', 'iot_gateway');
const planningLimit = userRateLimit(10, 60_000);

const actor = req => req.user.id;
const organization = req => req.user.organization_id || null;
const scopedBody = req => ({ ...req.body, organizationId: organization(req) });
const authorizeDevice = async req => {
  if (!['admin', 'super_admin'].includes(req.user.role)) await service.assertDeviceOrganization(req.params.id, organization(req));
};
const authorizeMission = async req => {
  if (!['admin', 'super_admin'].includes(req.user.role)) await service.assertMissionOrganization(req.params.id, organization(req));
};
const reply = handler => async (req, res, next) => {
  try { res.json({ success: true, data: await handler(req) }); } catch (error) { next(error); }
};

router.use(authMiddleware);
router.post('/devices', operator, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.registerDevice(scopedBody(req), actor(req)) }); } catch (error) { next(error); }
});
router.post('/devices/:id/certification', safetyOfficer, reply(async req => { await authorizeDevice(req); return service.certifyDevice(req.params.id, req.body, actor(req)); }));
router.post('/devices/:id/telemetry', telemetryWriter, async (req, res, next) => {
  try { await authorizeDevice(req); res.status(202).json({ success: true, data: await service.recordTelemetry(req.params.id, req.body, actor(req)) }); } catch (error) { next(error); }
});
router.get('/devices/:id/telemetry', operator, reply(async req => { await authorizeDevice(req); return service.listTelemetry(req.params.id, req.query.limit); }));
router.post('/devices/:id/emergency-stop', operator, reply(async req => { await authorizeDevice(req); return service.emergencyStop(req.params.id, actor(req), req.body.reason); }));
router.post('/devices/:id/emergency-stop/clear', safetyOfficer, reply(async req => { await authorizeDevice(req); return service.clearEmergencyStop(req.params.id, actor(req), req.body.inspection); }));

router.post('/missions', operator, async (req, res, next) => {
  try { res.status(201).json({ success: true, data: await service.createMission(scopedBody(req), actor(req)) }); } catch (error) { next(error); }
});
router.get('/missions/:id', operator, reply(async req => { await authorizeMission(req); return service.getMission(req.params.id); }));
router.post('/missions/:id/approval', safetyOfficer, reply(async req => { await authorizeMission(req); return service.approveMission(req.params.id, req.body, actor(req)); }));
router.post('/missions/:id/start', operator, reply(async req => { await authorizeMission(req); return service.startMission(req.params.id, actor(req)); }));
router.post('/missions/:id/pause', operator, reply(async req => { await authorizeMission(req); return service.transitionMission(req.params.id, 'paused', actor(req), req.body.reason); }));
router.post('/missions/:id/complete', operator, reply(async req => { await authorizeMission(req); return service.transitionMission(req.params.id, 'completed', actor(req), req.body.reason); }));
router.post('/missions/:id/abort', operator, reply(async req => { await authorizeMission(req); return service.transitionMission(req.params.id, 'aborted', actor(req), req.body.reason); }));
router.post('/planning/advisory', operator, planningLimit, reply(req => service.planWithAI(req.body, actor(req))));

module.exports = router;
