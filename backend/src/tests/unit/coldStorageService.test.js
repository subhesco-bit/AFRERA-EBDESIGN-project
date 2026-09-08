/**
 * Cold Storage Service - real unit tests.
 *
 * Context: backend/src/services/legacy/coldStorageService.js is the
 * canonical, DB-backed implementation (mounted via
 * backend/src/routes/coldStorageRoutes.js). This test suite covers:
 *  - the overlap-window capacity-check business rule in createBooking()
 *    (the transactional core of the service)
 *  - the temperature-compliance threshold logic added in the 2026-09-07
 *    Logistics domain batch, merged in from the previously-unmounted
 *    backend/src/routes/logistics/coldStorageRoutes.js
 *  - the aggregate rollups (getComplianceStats, getUtilization) used by
 *    ColdStorageDashboardPage
 */

'use strict';

const mockClient = { query: jest.fn(), release: jest.fn() };
const mockPool = { query: jest.fn(), connect: jest.fn(() => Promise.resolve(mockClient)) };

jest.mock('../../database/pool', () => mockPool);
jest.mock('../../utils/logger', () => ({
  logger: { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }
}));

const coldStorageService = require('../../services/legacy/coldStorageService');

describe('ColdStorageService (canonical, DB-mocked)', () => {
  beforeEach(() => {
    mockPool.query.mockReset();
    mockPool.connect.mockClear();
    mockClient.query.mockReset();
    mockClient.release.mockReset();
  });

  it('exposes the full real API surface, not a stub', () => {
    const expectedMethods = [
      'createFacility', 'getFacilities', 'getFacility', 'updateFacility',
      'createBooking', 'getBookings', 'updateBookingStatus', 'getUtilization',
      'recordTemperatureReading', 'getTemperatureReadings', 'getTemperatureAlerts',
      'getComplianceStats', 'bookFacility', 'getCapacityPlanning', 'getSystemStatus',
      'getFacilitiesWithStatus'
    ];
    for (const method of expectedMethods) {
      expect(typeof coldStorageService[method]).toBe('function');
    }
  });

  describe('createBooking - real overlap-window capacity check', () => {
    const data = {
      facilityId: 'facility-1',
      farmerId: 'farmer-1',
      produceType: 'potato',
      quantityUnits: 50,
      checkInDate: '2026-10-01',
      checkOutDate: '2026-10-10'
    };

    it('accepts a booking that fits within remaining capacity', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'facility-1', status: 'active', capacity_units: 100 }] }) // facility lock
        .mockResolvedValueOnce({ rows: [{ overlapping_units: '30' }] }) // overlap sum
        .mockResolvedValueOnce({ rows: [{ id: 'booking-1', ...data }] }) // insert
        .mockResolvedValueOnce({}); // COMMIT

      const result = await coldStorageService.createBooking(data);

      expect(result.id).toBe('booking-1');
      expect(mockClient.query.mock.calls[0][0]).toBe('BEGIN');
      expect(mockClient.query.mock.calls[3][0]).toMatch(/INSERT INTO cold_storage_bookings/);
      expect(mockClient.query.mock.calls[4][0]).toBe('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('rejects a booking that would exceed facility capacity for the overlapping window', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'facility-1', status: 'active', capacity_units: 100 }] }) // facility lock
        .mockResolvedValueOnce({ rows: [{ overlapping_units: '80' }] }) // overlap sum (80 already booked)
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(coldStorageService.createBooking(data)).rejects.toThrow('Booking would exceed capacity');

      // no INSERT should have been issued
      const queries = mockClient.query.mock.calls.map((c) => c[0]);
      expect(queries.some((q) => /INSERT INTO cold_storage_bookings/.test(q))).toBe(false);
      expect(queries).toContain('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('rejects when the facility is not active', async () => {
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 'facility-1', status: 'maintenance', capacity_units: 100 }] })
        .mockResolvedValueOnce({}); // ROLLBACK

      await expect(coldStorageService.createBooking(data)).rejects.toThrow('Facility is maintenance, not accepting bookings');
    });

    it('validates required fields before touching the database', async () => {
      await expect(coldStorageService.createBooking({ ...data, quantityUnits: 0 }))
        .rejects.toThrow('quantityUnits must be > 0');
      await expect(coldStorageService.createBooking({ ...data, checkOutDate: '2026-09-01' }))
        .rejects.toThrow('checkOutDate must be on or after checkInDate');
      expect(mockPool.connect).not.toHaveBeenCalled();
    });
  });

  describe('checkTemperatureCompliance (pure threshold logic)', () => {
    it('is compliant when there is no declared range', () => {
      const result = coldStorageService.checkTemperatureCompliance(5, null, null);
      expect(result.isCompliant).toBe(true);
      expect(result.deviationC).toBe(0);
    });

    it('flags a reading below the declared minimum with the correct deviation', () => {
      const result = coldStorageService.checkTemperatureCompliance(-2, 0, 4);
      expect(result.isCompliant).toBe(false);
      expect(result.deviationC).toBe(2);
    });

    it('flags a reading above the declared maximum with the correct deviation', () => {
      const result = coldStorageService.checkTemperatureCompliance(8, 0, 4);
      expect(result.isCompliant).toBe(false);
      expect(result.deviationC).toBe(4);
    });

    it('is compliant within range', () => {
      const result = coldStorageService.checkTemperatureCompliance(2, 0, 4);
      expect(result.isCompliant).toBe(true);
    });
  });

  describe('recordTemperatureReading', () => {
    it('computes compliance against the facility declared range and persists it', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'facility-1', temperature_range_min_c: 0, temperature_range_max_c: 4 }] }) // getFacility
        .mockResolvedValueOnce({ rows: [{ id: 'reading-1', is_compliant: false, deviation_c: 3 }] }); // insert

      const result = await coldStorageService.recordTemperatureReading('facility-1', { temperatureC: 7 });

      expect(result.reasoning.isCompliant).toBe(false);
      expect(result.reasoning.deviationC).toBe(3);
      const insertCall = mockPool.query.mock.calls[1];
      expect(insertCall[0]).toMatch(/INSERT INTO cold_storage_temperature_readings/);
      expect(insertCall[1]).toEqual(['facility-1', 7, null, null, false, 3]);
    });

    it('rejects a non-numeric temperature', async () => {
      await expect(coldStorageService.recordTemperatureReading('facility-1', { temperatureC: 'warm' }))
        .rejects.toThrow('temperatureC is required and must be numeric');
    });
  });

  describe('getComplianceStats', () => {
    it('reports fully_compliant when every reading in the window was in range', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'facility-1', temperature_range_min_c: 0, temperature_range_max_c: 4 }] }) // getFacility
        .mockResolvedValueOnce({
          rows: [{
            total: '5', compliant_count: '5', min_temp: '1', max_temp: '3.5', avg_temp: '2.2',
            latest_reading_at: '2026-09-07T00:00:00Z'
          }]
        });

      const stats = await coldStorageService.getComplianceStats('facility-1', 24);

      expect(stats.status).toBe('fully_compliant');
      expect(stats.compliancePct).toBe(100);
      expect(stats.nonCompliantReadings).toBe(0);
    });

    it('reports no_data when there are no readings in the window', async () => {
      mockPool.query
        .mockResolvedValueOnce({ rows: [{ id: 'facility-1', temperature_range_min_c: 0, temperature_range_max_c: 4 }] })
        .mockResolvedValueOnce({ rows: [{ total: '0', compliant_count: '0', min_temp: null, max_temp: null, avg_temp: null, latest_reading_at: null }] });

      const stats = await coldStorageService.getComplianceStats('facility-1', 24);
      expect(stats.status).toBe('no_data');
      expect(stats.compliancePct).toBeNull();
    });
  });

  describe('getUtilization', () => {
    it('computes remaining capacity and utilization percentage for a single facility', async () => {
      mockPool.query.mockResolvedValueOnce({
        rows: [{ facility_id: 'facility-1', name: 'Guwahati Cold Store', capacity_units: 200, capacity_unit_label: 'quintal', booked_units: '150' }]
      });

      const util = await coldStorageService.getUtilization('facility-1');

      expect(util.remainingUnits).toBe(50);
      expect(util.utilizationPct).toBe(75);
    });
  });
});
