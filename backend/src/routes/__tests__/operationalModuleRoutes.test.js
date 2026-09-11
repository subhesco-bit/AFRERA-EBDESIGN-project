'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../../middleware/auth', () => (req, res, next) => {
  if (req.headers.authorization === 'Bearer admin') {
    req.user = { id: '00000000-0000-0000-0000-000000000001', role: 'admin' };
    return next();
  }
  if (req.headers.authorization === 'Bearer user') {
    req.user = { id: '00000000-0000-0000-0000-000000000002', role: 'consumer' };
    return next();
  }
  return res.status(401).json({ error: 'No authorization header provided' });
});

jest.mock('../../services/operationalModuleService', () => ({
  listEntities: jest.fn().mockResolvedValue([]),
  createEntity: jest.fn().mockResolvedValue({ id: 'entity-1', owner_user_id: '00000000-0000-0000-0000-000000000002' }),
  getEntity: jest.fn().mockImplementation(async id => ({ id, owner_user_id: '00000000-0000-0000-0000-000000000002' })),
  updateEntity: jest.fn().mockResolvedValue({ id: 'entity-1' }),
  softDeleteEntity: jest.fn().mockResolvedValue(true),
}));

const service = require('../../services/operationalModuleService');
const router = require('../operationalModuleRoutes');

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/operational-modules', router);
  return app;
}

describe('operational module route security', () => {
  beforeEach(() => jest.clearAllMocks());

  test('requires authentication', async () => {
    const response = await request(buildApp()).get('/api/v1/operational-modules');
    expect(response.status).toBe(401);
    expect(service.listEntities).not.toHaveBeenCalled();
  });

  test('ordinary users are isolated to their own owner id', async () => {
    await request(buildApp())
      .get('/api/v1/operational-modules?ownerUserId=00000000-0000-0000-0000-000000000099')
      .set('Authorization', 'Bearer user');

    expect(service.listEntities).toHaveBeenCalledWith(expect.objectContaining({
      ownerUserId: '00000000-0000-0000-0000-000000000002',
    }));
  });

  test('admin can request a cross-owner listing', async () => {
    await request(buildApp())
      .get('/api/v1/operational-modules?ownerUserId=00000000-0000-0000-0000-000000000099')
      .set('Authorization', 'Bearer admin');

    expect(service.listEntities).toHaveBeenCalledWith(expect.objectContaining({
      ownerUserId: '00000000-0000-0000-0000-000000000099',
    }));
  });

  test('ordinary users cannot create an entity for another owner', async () => {
    await request(buildApp())
      .post('/api/v1/operational-modules')
      .set('Authorization', 'Bearer user')
      .send({ moduleKey: 'inventory', ownerUserId: '00000000-0000-0000-0000-000000000099' });

    expect(service.createEntity).toHaveBeenCalledWith(expect.objectContaining({
      ownerUserId: '00000000-0000-0000-0000-000000000002',
    }));
  });

  test('ordinary users cannot access another owner by id', async () => {
    service.getEntity.mockResolvedValueOnce({
      id: 'entity-2',
      owner_user_id: '00000000-0000-0000-0000-000000000099',
    });

    const response = await request(buildApp())
      .get('/api/v1/operational-modules/entity-2')
      .set('Authorization', 'Bearer user');

    expect(response.status).toBe(404);
  });
});
