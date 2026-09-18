'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/auth', () => ({
  authMiddleware: (req, _res, next) => { req.user = { id: 'operator-1', role: 'admin', organization_id: 'org-1' }; next(); },
  requireRole: () => (_req, _res, next) => next(),
  userRateLimit: () => (_req, _res, next) => next(),
}));

jest.mock('../../services/robotics/roboticsOrchestrationService', () => ({
  registerDevice: jest.fn(), certifyDevice: jest.fn(), recordTelemetry: jest.fn(), listTelemetry: jest.fn(),
  emergencyStop: jest.fn(), clearEmergencyStop: jest.fn(), createMission: jest.fn(), getMission: jest.fn(),
  approveMission: jest.fn(), startMission: jest.fn(), transitionMission: jest.fn(), planWithAI: jest.fn(),
  assertDeviceOrganization: jest.fn(), assertMissionOrganization: jest.fn(),
}));

const service = require('../../services/robotics/roboticsOrchestrationService');
const routes = require('../roboticsRoutes');
const app = express().use(express.json()).use('/api/v1/robotics', routes);

describe('robotics routes', () => {
  beforeEach(() => jest.clearAllMocks());

  test('binds authenticated actor identity when creating a mission', async () => {
    service.createMission.mockResolvedValue({ id: 'm1', status: 'pending_approval' });
    const response = await request(app).post('/api/v1/robotics/missions').send({ name: 'Harvest' }).expect(201);
    expect(response.body.data.status).toBe('pending_approval');
    expect(service.createMission).toHaveBeenCalledWith({ name: 'Harvest', organizationId: 'org-1' }, 'operator-1');
  });

  test('emergency stop requires a reason and delegates to the control plane', async () => {
    service.emergencyStop.mockResolvedValue({ deviceId: 'd1', emergencyStopActive: true });
    await request(app).post('/api/v1/robotics/devices/d1/emergency-stop').send({ reason: 'Person entered work cell' }).expect(200);
    expect(service.emergencyStop).toHaveBeenCalledWith('d1', 'operator-1', 'Person entered work cell');
  });

  test('AI endpoint returns advisory result without execution authority', async () => {
    service.planWithAI.mockResolvedValue({ content: 'plan', executionAuthorized: false });
    const response = await request(app).post('/api/v1/robotics/planning/advisory').send({ objective: 'Inspect' }).expect(200);
    expect(response.body.data.executionAuthorized).toBe(false);
  });
});
