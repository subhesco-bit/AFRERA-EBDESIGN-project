const express = require('express');
const request = require('supertest');

jest.mock('../modules/M029/service', () => ({
  listHealthRecords: jest.fn(),
  getHealthRecord: jest.fn(),
  createHealthRecord: jest.fn(),
  updateHealthRecord: jest.fn(),
  deleteHealthRecord: jest.fn(),
  getFarmerHealthSummary: jest.fn(),
  getWelfarePrograms: jest.fn(),
  enrollWelfareProgram: jest.fn()
}));

jest.mock('../database/pool', () => ({ query: jest.fn() }));

const farmerHealthService = require('../modules/M029/service');
const pool = require('../database/pool');
const { generateAccessToken } = require('../services/dual-use/authService');
const router = require('../routes/farmerHealthRoutes');

const farmerId = '123e4567-e89b-12d3-a456-426614174000';
const otherFarmerId = '123e4567-e89b-12d3-a456-426614174001';

function app() {
  const instance = express();
  instance.use(express.json());
  instance.use(router);
  return instance;
}

function token(role = 'farmer', id = '123e4567-e89b-12d3-a456-426614174010') {
  return generateAccessToken({ id, email: `${role}@example.com`, role });
}

const validRecord = {
  farmerId,
  healthType: 'GENERAL',
  severity: 'LOW',
  date: '2026-08-20',
  metadata: {}
};

describe('M029 farmer health routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('keeps UUID farmer IDs intact for public reads', async () => {
    farmerHealthService.getFarmerHealthSummary.mockResolvedValue({ farmerId, summary: [], totalRecords: 0 });

    await request(app())
      .get(`/farmers/${farmerId}/health-summary`)
      .expect(200);

    expect(farmerHealthService.getFarmerHealthSummary).toHaveBeenCalledWith(farmerId);
  });

  it('returns 400 for an invalid farmer UUID instead of reaching the service', async () => {
    await request(app())
      .get('/farmers/not-a-number/health-summary')
      .expect(400);

    expect(farmerHealthService.getFarmerHealthSummary).not.toHaveBeenCalled();
  });

  it('requires authentication for health record writes', async () => {
    await request(app())
      .post('/health-records')
      .send(validRecord)
      .expect(401);

    expect(farmerHealthService.createHealthRecord).not.toHaveBeenCalled();
  });

  it('returns 400 for missing required health record fields', async () => {
    await request(app())
      .post('/health-records')
      .set('Authorization', `Bearer ${token()}`)
      .send({ farmerId, healthType: 'GENERAL' })
      .expect(400);

    expect(farmerHealthService.createHealthRecord).not.toHaveBeenCalled();
  });

  it('resolves a farmer account and passes the UUID to the service', async () => {
    pool.query.mockResolvedValueOnce({ rows: [{ id: farmerId }] });
    farmerHealthService.createHealthRecord.mockResolvedValue({ id: 1, ...validRecord });

    await request(app())
      .post('/health-records')
      .set('Authorization', `Bearer ${token()}`)
      .send({ ...validRecord, farmerId: otherFarmerId })
      .expect(201);

    expect(farmerHealthService.createHealthRecord).toHaveBeenCalledWith({ ...validRecord, farmerId });
  });

  it('returns 403 when a farmer updates another farmer\'s record', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: farmerId }] })
      .mockResolvedValueOnce({ rows: [{ farmer_id: otherFarmerId }] });

    await request(app())
      .put('/health-records/1')
      .set('Authorization', `Bearer ${token()}`)
      .send(validRecord)
      .expect(403);

    expect(farmerHealthService.updateHealthRecord).not.toHaveBeenCalled();
  });

  it('returns 400 for an invalid welfare enrollment request', async () => {
    await request(app())
      .post('/welfare-enrollments')
      .set('Authorization', `Bearer ${token()}`)
      .send({ farmerId, programId: 'not-an-integer' })
      .expect(400);

    expect(farmerHealthService.enrollWelfareProgram).not.toHaveBeenCalled();
  });
});
