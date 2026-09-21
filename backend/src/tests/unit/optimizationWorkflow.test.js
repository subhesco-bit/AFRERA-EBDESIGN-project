'use strict';

jest.mock('../../database/pool', () => ({ query: jest.fn() }));
jest.mock('../../services/aiGatewayService', () => ({ run: jest.fn() }));

const pool = require('../../database/pool');
const engine = require('../../core/ai/optimisation');
const jobs = require('../../services/ai/optimizationJobService');

const instance = {
  consignments: [
    { id: 'c1', minTempC: 2, maxTempC: 6, volumeM3: 2, valueINR: 1000, perishability: 0.8 },
    { id: 'c2', minTempC: 3, maxTempC: 8, volumeM3: 1, valueINR: 500, perishability: 0.3 },
  ],
  bays: [
    { id: 'b1', tempC: 4, capacityM3: 5, distanceFromDockM: 10 },
    { id: 'b2', tempC: 7, capacityM3: 5, distanceFromDockM: 2 },
  ],
};

describe('optimization workflow', () => {
  beforeEach(() => { pool.query.mockReset(); jobs.quantumConfigured = false; });

  test('classical baseline is deterministic, feasible and makes no optimality claim', () => {
    const first = engine.solve('coldstorage.bay_allocation', instance);
    const second = engine.solve('coldstorage.bay_allocation', instance);
    expect(second.assignment).toEqual(first.assignment);
    expect(first.feasible).toBe(true);
    expect(first.guarantee).toMatch(/not a proven optimum/);
  });

  test('validates duplicate identifiers before solver execution', () => {
    const invalid = { ...instance, consignments: [instance.consignments[0], instance.consignments[0]] };
    expect(() => engine.validateInstance('coldstorage.bay_allocation', invalid)).toThrow(/unique/);
  });

  test('accepts provider-neutral asynchronous adapters and verifies their feasibility', async () => {
    engine.registerBackend('testremote', async () => ({ assignment: { c1: 'b1', c2: 'b1' }, cost: 321, unplaced: [] }));
    await expect(engine.solveAsync('coldstorage.bay_allocation', instance, { backend: 'testremote' }))
      .resolves.toMatchObject({ backend: 'testremote', cost: 321, feasible: true });
  });

  test('persists an honest unavailable quantum job and its audit event', async () => {
    pool.query
      .mockResolvedValueOnce({ rows: [{ id: 'job-1', status: 'unavailable', requested_backend: 'quantum' }] })
      .mockResolvedValueOnce({ rows: [] });
    const result = await jobs.create({ objectiveId: 'coldstorage.bay_allocation', instance, requestedBackend: 'quantum' }, { id: 'user-1' });
    expect(result.status).toBe('unavailable');
    expect(pool.query.mock.calls[0][1][8]).toMatch(/No quantum solver adapter/);
    expect(pool.query.mock.calls[1][1]).toEqual(expect.arrayContaining(['job-1', 'created', 'user-1']));
  });

  test('rejects unknown backend before persistence', async () => {
    await expect(jobs.create({ objectiveId: 'coldstorage.bay_allocation', instance, requestedBackend: 'magic' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(pool.query).not.toHaveBeenCalled();
  });
});
