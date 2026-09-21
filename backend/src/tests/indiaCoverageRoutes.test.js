'use strict';

const express = require('express');
const request = require('supertest');

jest.mock('../services/platform/indiaCoverageService', () => ({ listCoverage: jest.fn(), changeStage: jest.fn() }));
const service = require('../services/platform/indiaCoverageService');
const auth = require('../services/dual-use/authService');
const routes = require('../routes/indiaCoverageRoutes');

describe('India coverage HTTP authorization', () => {
  const app = express();
  app.use(express.json());
  app.use('/api/v1/india-coverage', routes);
  const farmerToken = auth.generateAccessToken({ id: '11111111-1111-4111-8111-111111111111', role: 'farmer' });
  const adminToken = auth.generateAccessToken({ id: '22222222-2222-4222-8222-222222222222', role: 'admin' });

  beforeEach(() => { service.listCoverage.mockReset(); service.changeStage.mockReset(); });

  test('coverage needs identity and farmer may read national market scope', async () => {
    await request(app).get('/api/v1/india-coverage').expect(401);
    service.listCoverage.mockResolvedValue({ rows: [{ name: 'Assam', market_launch_scope: true }], meaning: 'Market scope' });
    const response = await request(app).get('/api/v1/india-coverage').set('Authorization', `Bearer ${farmerToken}`).expect(200);
    expect(response.body.data.rows[0].market_launch_scope).toBe(true);
  });

  test('only a named platform administrator may change local rollout stage', async () => {
    const path = '/api/v1/india-coverage/Assam/stage';
    await request(app).patch(path).set('Authorization', `Bearer ${farmerToken}`).send({ stage: 'active' }).expect(403);
    expect(service.changeStage).not.toHaveBeenCalled();
    service.changeStage.mockResolvedValue({ name: 'Assam', rollout_stage: 'pilot' });
    await request(app).patch(path).set('Authorization', `Bearer ${adminToken}`)
      .send({ stage: 'pilot', rationale: 'Verified village operator workflow' }).expect(200);
    expect(service.changeStage).toHaveBeenCalledWith('Assam', expect.any(Object), '22222222-2222-4222-8222-222222222222');
  });
});
