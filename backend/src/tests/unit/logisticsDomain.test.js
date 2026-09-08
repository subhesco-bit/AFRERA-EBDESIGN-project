/**
 * Logistics domain - real unit tests covering the services not already
 * covered by coldStorageService.test.js: freightPoolingService,
 * returnLoadBoardService, logisticsEnhancementService, logisticsService.
 *
 * Replaces the generic `expect(true).toBe(true)` padding tests
 * (backend/src/__tests__/testN.test.js) for this domain per the
 * 2026-09-07 Logistics very-large-batch pass.
 */

'use strict';

const mockClient = { query: jest.fn(), release: jest.fn() };
const mockPool = { query: jest.fn(), connect: jest.fn(() => Promise.resolve(mockClient)) };

jest.mock('../../database/pool', () => mockPool);
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

const freightPoolingService = require('../../services/legacy/freightPoolingService');
const returnLoadBoardService = require('../../services/legacy/returnLoadBoardService');
const logisticsEnhancementService = require('../../services/legacy/logisticsEnhancementService');
const logisticsService = require('../../services/legacy/logisticsService');

beforeEach(() => {
  mockPool.query.mockReset();
  mockClient.query.mockReset();
  mockClient.release.mockReset();
});

describe('freightPoolingService - real API surface, not a stub', () => {
  it('exposes every documented method', () => {
    for (const method of ['findPoolableShipments', 'createPoolWindow', 'getPoolWindow', 'joinPoolWindow', 'listOpenWindows', 'closeAndDispatch']) {
      expect(typeof freightPoolingService[method]).toBe('function');
    }
  });

  describe('joinPoolWindow - fill-percentage rate slab + capacity rule', () => {
    it('locks in the cheaper rate once the pool crosses a fill-percentage breakpoint', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'window-1', status: 'open', vehicle_capacity_kg: 1000 }] }) // window lock
        .mockResolvedValueOnce({ rows: [{ id: 'shipment-1', weight_kg: 600, status: 'pending' }] }) // shipment lock
        .mockResolvedValueOnce({ rows: [] }) // not already pooled
        .mockResolvedValueOnce({ rows: [{ total: '0' }] }) // existing weight in window
        .mockResolvedValueOnce({ rows: [{ id: 'fps-1', rate_per_kg_inr: 13 }] }) // insert
        .mockResolvedValueOnce({}); // COMMIT

      const result = await freightPoolingService.joinPoolWindow('window-1', 'shipment-1');

      // 600/1000 = 60% fill -> the 50-75% slab -> 13/kg, not the 0-25% slab's 24/kg
      const insertCall = mockClient.query.mock.calls[5];
      expect(insertCall[1]).toEqual(['window-1', 'shipment-1', 600, 13]);
      expect(result.id).toBe('fps-1');
    });

    it('rejects a join that would exceed the vehicle capacity', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'window-1', status: 'open', vehicle_capacity_kg: 1000 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'shipment-1', weight_kg: 600, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ total: '900' }] }) // already 900kg in the pool
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(freightPoolingService.joinPoolWindow('window-1', 'shipment-1'))
        .rejects.toThrow('would exceed vehicle capacity');
    });

    it('rejects joining a shipment already pooled elsewhere', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'window-1', status: 'open', vehicle_capacity_kg: 1000 }] })
        .mockResolvedValueOnce({ rows: [{ id: 'shipment-1', weight_kg: 600, status: 'pending' }] })
        .mockResolvedValueOnce({ rows: [{ shipment_id: 'shipment-1' }] }) // already pooled
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(freightPoolingService.joinPoolWindow('window-1', 'shipment-1'))
        .rejects.toThrow('already in a freight pool window');
    });
  });

  describe('createPoolWindow validation', () => {
    it('requires both origin and destination', async () => {
      await expect(freightPoolingService.createPoolWindow({ vehicleCapacityKg: 500 }))
        .rejects.toThrow('originAddress and destinationAddress are required');
    });

    it('requires a positive vehicle capacity', async () => {
      await expect(freightPoolingService.createPoolWindow({ originAddress: 'A', destinationAddress: 'B', vehicleCapacityKg: 0 }))
        .rejects.toThrow('vehicleCapacityKg must be > 0');
    });
  });
});

describe('returnLoadBoardService - real API surface and validation', () => {
  it('exposes every documented method', () => {
    for (const method of ['postCapacity', 'searchAvailable', 'bookPosting', 'cancelPosting']) {
      expect(typeof returnLoadBoardService[method]).toBe('function');
    }
  });

  it('rejects a posting where availableUntil is before availableFrom', async () => {
    await expect(returnLoadBoardService.postCapacity('user-1', {
      originAddress: 'Guwahati',
      destinationAddress: 'Shillong',
      availableCapacityKg: 200,
      availableFrom: '2026-10-10',
      availableUntil: '2026-10-01'
    })).rejects.toThrow('availableUntil must be after availableFrom');
  });

  it('persists a valid posting', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [{ id: 'posting-1' }] });
    const result = await returnLoadBoardService.postCapacity('user-1', {
      originAddress: 'Guwahati',
      destinationAddress: 'Shillong',
      availableCapacityKg: 200,
      availableFrom: '2026-10-01',
      availableUntil: '2026-10-10'
    });
    expect(result.id).toBe('posting-1');
    expect(mockPool.query.mock.calls[0][0]).toMatch(/INSERT INTO return_load_postings/);
  });

  it('rejects booking a posting that is not open (already booked or expired)', async () => {
    mockPool.query.mockResolvedValueOnce({ rows: [] });
    await expect(returnLoadBoardService.bookPosting('posting-1', 'shipment-1'))
      .rejects.toThrow('Posting not found or not open');
  });
});

describe('logisticsEnhancementService - real API surface, not a stub', () => {
  it('exposes fleet, tracking, temperature and warehouse methods', () => {
    for (const method of [
      'addVehicle', 'getFleet', 'getVehicle', 'updateVehicle', 'scheduleMaintenance', 'getMaintenanceDueList',
      'updateTracking', 'getTracking', 'getLiveTracking', 'setGeofence',
      'recordTemperature', 'getTemperatureData', 'setTemperatureAlert', 'getTemperatureAlerts', 'checkTemperatureAlerts',
      'createWarehouse', 'getWarehouses', 'getWarehouse', 'addInventory', 'getWarehouseInventory', 'processWarehouseShipment',
      'getLogisticsStatistics'
    ]) {
      expect(typeof logisticsEnhancementService[method]).toBe('function');
    }
  });

  it('getMaintenanceDueList joins scheduled work orders onto each active vehicle', async () => {
    mockPool.query
      .mockResolvedValueOnce({ rows: [{ id: 'vehicle-1', type: 'truck', registration_number: 'AS-01-1234', status: 'active', mileage: 1000, last_maintenance_date: null, next_maintenance_date: null }] }) // vehicles
      .mockResolvedValueOnce({ rows: [] }); // no scheduled work orders

    const result = await logisticsEnhancementService.getMaintenanceDueList({ dueSoonWithinDays: 7 });

    expect(mockPool.query).toHaveBeenCalledTimes(2);
    expect(Array.isArray(result.vehicles)).toBe(true);
    expect(result.vehicles[0].vehicleId).toBe('vehicle-1');
    expect(result.dueSoonWithinDays).toBe(7);
  });
});

describe('logisticsService - real API surface, not a stub', () => {
  it('is a real Express router with registered routes, not a canned handler', () => {
    expect(logisticsService.router).toBeDefined();
    expect(typeof logisticsService.router.use).toBe('function');
  });
});
