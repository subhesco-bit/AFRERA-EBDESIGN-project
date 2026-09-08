/**
 * Cold Storage Service.
 *
 * See migration 3104_cold_storage_schema.sql for the pre-build gate answer —
 * confirmed genuinely absent (only a single asset-type-mapping string existed
 * anywhere in the codebase before this).
 *
 * REAL BUSINESS RULE: CAPACITY CHECK
 * A booking is rejected if it would push a facility's booked quantity, for
 * any day in the requested [check_in_date, check_out_date] range, over the
 * facility's declared capacity_units. This is computed from the SUM of
 * `quantity_units` on every other active (booked/checked_in) booking whose
 * own date range overlaps the requested one — not from a cached counter — so
 * it can never drift the way a maintained running total would. The overlap
 * test and the capacity comparison happen inside one transaction with the
 * facility row locked, mirroring the FOR UPDATE pattern millCircuitService.js
 * uses for mill-circuit slot booking, so two concurrent bookings cannot both
 * read "capacity available" and both insert.
 */

'use strict';

const { logger } = require('../../utils/logger');
const pool = require('../../database/pool');
const { withTransaction } = require('../../core/withTransaction');

class ColdStorageService {
  constructor() {
    this.pool = pool;
  }

  // -------------------------------------------------------------------
  // Facilities
  // -------------------------------------------------------------------

  async createFacility(data) {
    try {
      const {
        fpoId, name, location, district, state,
        capacityUnits, capacityUnitLabel = 'quintal',
        temperatureRangeMinC, temperatureRangeMaxC,
        operatorName, operatorPhone,
      } = data;

      if (!name) throw new Error('name is required');
      if (!location) throw new Error('location is required');
      if (!(Number(capacityUnits) > 0)) throw new Error('capacityUnits must be > 0');

      const result = await this.pool.query(
        `INSERT INTO cold_storage_facilities
           (fpo_id, name, location, district, state, capacity_units, capacity_unit_label,
            temperature_range_min_c, temperature_range_max_c, operator_name, operator_phone)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [
          fpoId || null, name, location, district || null, state || null,
          capacityUnits, capacityUnitLabel,
          temperatureRangeMinC ?? null, temperatureRangeMaxC ?? null,
          operatorName || null, operatorPhone || null,
        ]
      );

      logger.info(`Cold storage facility created: ${result.rows[0].id} (${name})`);
      return result.rows[0];
    } catch (error) {
      logger.error('Error creating cold storage facility', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getFacilities(filters = {}) {
    try {
      let query = 'SELECT * FROM cold_storage_facilities WHERE 1=1';
      const params = [];

      if (filters.fpoId) { params.push(filters.fpoId); query += ` AND fpo_id = $${params.length}`; }
      if (filters.district) { params.push(filters.district); query += ` AND district = $${params.length}`; }
      if (filters.status) { params.push(filters.status); query += ` AND status = $${params.length}`; }
      if (filters.search) {
        params.push(`%${filters.search}%`);
        query += ` AND (name ILIKE $${params.length} OR location ILIKE $${params.length})`;
      }

      query += ' ORDER BY name ASC';
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error listing cold storage facilities', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Same listing as getFacilities(), enriched with real per-facility
   * occupancy/utilization/latest-temperature so the frontend dashboard
   * (ColdStorageDashboardPage) can render capacity + cold-chain status
   * without a second round trip per facility. Every added field is a live
   * aggregate, not a stored/cached counter.
   */
  async getFacilitiesWithStatus(filters = {}) {
    try {
      const facilities = await this.getFacilities(filters);
      const today = new Date().toISOString().slice(0, 10);

      return Promise.all(facilities.map(async (f) => {
        const occResult = await this.pool.query(
          `SELECT
             COALESCE(SUM(quantity_units) FILTER (WHERE status = 'checked_in'), 0) AS checked_in_units,
             COALESCE(SUM(quantity_units) FILTER (WHERE status = 'booked'), 0) AS reserved_units
           FROM cold_storage_bookings
           WHERE facility_id = $1 AND status IN ('booked', 'checked_in')
             AND check_in_date <= $2 AND check_out_date >= $2`,
          [f.id, today]
        );
        const occ = occResult.rows[0];
        const checkedIn = Number(occ.checked_in_units);
        const reserved = Number(occ.reserved_units);
        const capacity = Number(f.capacity_units);
        const currentLoad = checkedIn + reserved;
        const utilizationPct = capacity > 0 ? Number(((currentLoad / capacity) * 100).toFixed(1)) : 0;

        const tempResult = await this.pool.query(
          `SELECT recorded_temperature_c FROM cold_storage_temperature_readings
            WHERE facility_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
          [f.id]
        );
        const currentTemp = tempResult.rows[0] ? Number(tempResult.rows[0].recorded_temperature_c) : null;

        return {
          ...f,
          capacity,
          currentLoad,
          reserved,
          utilization: utilizationPct,
          currentTemp,
        };
      }));
    } catch (error) {
      logger.error('Error listing cold storage facilities with status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getFacility(facilityId) {
    try {
      const result = await this.pool.query('SELECT * FROM cold_storage_facilities WHERE id = $1', [facilityId]);
      if (result.rows.length === 0) throw new Error('Cold storage facility not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error getting cold storage facility', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateFacility(facilityId, data) {
    try {
      const fields = [];
      const params = [];
      const map = {
        name: 'name', location: 'location', district: 'district', state: 'state',
        capacityUnits: 'capacity_units', capacityUnitLabel: 'capacity_unit_label',
        temperatureRangeMinC: 'temperature_range_min_c', temperatureRangeMaxC: 'temperature_range_max_c',
        operatorName: 'operator_name', operatorPhone: 'operator_phone', status: 'status',
      };
      for (const [key, column] of Object.entries(map)) {
        if (data[key] !== undefined) {
          params.push(data[key]);
          fields.push(`${column} = $${params.length}`);
        }
      }
      if (fields.length === 0) throw new Error('No fields to update');

      params.push(facilityId);
      const result = await this.pool.query(
        `UPDATE cold_storage_facilities SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
        params
      );
      if (result.rows.length === 0) throw new Error('Cold storage facility not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating cold storage facility', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Bookings — the real capacity-vs-booked business rule
  // -------------------------------------------------------------------

  async createBooking(data) {
    const { facilityId, farmerId, fpoId, produceType, quantityUnits, checkInDate, checkOutDate, notes } = data;

    if (!facilityId) throw new Error('facilityId is required');
    if (!produceType) throw new Error('produceType is required');
    if (!(Number(quantityUnits) > 0)) throw new Error('quantityUnits must be > 0');
    if (!checkInDate || !checkOutDate) throw new Error('checkInDate and checkOutDate are required');
    if (new Date(checkOutDate) < new Date(checkInDate)) throw new Error('checkOutDate must be on or after checkInDate');
    if (!farmerId && !fpoId) throw new Error('Either farmerId or fpoId is required');

    return withTransaction(async (client) => {
      // Lock the facility row so a concurrent booking against the same
      // facility cannot read the same "capacity available" snapshot.
      const facilityResult = await client.query(
        'SELECT * FROM cold_storage_facilities WHERE id = $1 FOR UPDATE',
        [facilityId]
      );
      if (facilityResult.rows.length === 0) throw new Error('Cold storage facility not found');
      const facility = facilityResult.rows[0];
      if (facility.status !== 'active') throw new Error(`Facility is ${facility.status}, not accepting bookings`);

      // Real overlap-based capacity check: sum quantity on every other
      // active booking whose date range overlaps the requested one.
      const overlapResult = await client.query(
        `SELECT COALESCE(SUM(quantity_units), 0) AS overlapping_units
         FROM cold_storage_bookings
         WHERE facility_id = $1
           AND status IN ('booked', 'checked_in')
           AND check_in_date <= $3
           AND check_out_date >= $2`,
        [facilityId, checkInDate, checkOutDate]
      );
      const overlappingUnits = Number(overlapResult.rows[0].overlapping_units);
      const wouldBeBooked = overlappingUnits + Number(quantityUnits);

      if (wouldBeBooked > Number(facility.capacity_units)) {
        const remaining = Number(facility.capacity_units) - overlappingUnits;
        const err = new Error(
          `Booking would exceed capacity: ${remaining.toFixed(2)} ${facility.capacity_unit_label} remaining ` +
          `for ${checkInDate}–${checkOutDate}, requested ${Number(quantityUnits).toFixed(2)}.`
        );
        err.code = 'CAPACITY_EXCEEDED';
        throw err;
      }

      const bookingResult = await client.query(
        `INSERT INTO cold_storage_bookings
           (facility_id, farmer_id, fpo_id, produce_type, quantity_units, check_in_date, check_out_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [facilityId, farmerId || null, fpoId || null, produceType, quantityUnits, checkInDate, checkOutDate, notes || null]
      );

      logger.info(`Cold storage booking created: ${bookingResult.rows[0].id} on facility ${facilityId}`);
      return bookingResult.rows[0];
    }, { name: 'coldStorage.createBooking' });
  }

  async getBookings(filters = {}) {
    try {
      let query = `
        SELECT b.*, f.name AS facility_name, f.capacity_unit_label
        FROM cold_storage_bookings b
        JOIN cold_storage_facilities f ON f.id = b.facility_id
        WHERE 1=1
      `;
      const params = [];
      if (filters.facilityId) { params.push(filters.facilityId); query += ` AND b.facility_id = $${params.length}`; }
      if (filters.farmerId) { params.push(filters.farmerId); query += ` AND b.farmer_id = $${params.length}`; }
      if (filters.fpoId) { params.push(filters.fpoId); query += ` AND b.fpo_id = $${params.length}`; }
      if (filters.status) { params.push(filters.status); query += ` AND b.status = $${params.length}`; }

      query += ' ORDER BY b.check_in_date DESC, b.created_at DESC';
      const result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error listing cold storage bookings', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async updateBookingStatus(bookingId, status) {
    try {
      if (!['booked', 'checked_in', 'checked_out', 'cancelled'].includes(status)) {
        throw new Error('Invalid status');
      }
      const result = await this.pool.query(
        `UPDATE cold_storage_bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
        [status, bookingId]
      );
      if (result.rows.length === 0) throw new Error('Booking not found');
      return result.rows[0];
    } catch (error) {
      logger.error('Error updating cold storage booking status', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Utilization — real rollup, never cached
  // -------------------------------------------------------------------

  /**
   * Utilization for one facility as of `atDate` (default: today) — booked
   * units are the SUM of active bookings whose range covers that date.
   * Omitting `facilityId` returns the rollup for every facility.
   */
  async getUtilization(facilityId = null, atDate = null) {
    try {
      const date = atDate || new Date().toISOString().slice(0, 10);
      let query = `
        SELECT
          f.id AS facility_id,
          f.name,
          f.capacity_units,
          f.capacity_unit_label,
          COALESCE(booked.booked_units, 0) AS booked_units
        FROM cold_storage_facilities f
        LEFT JOIN LATERAL (
          SELECT SUM(quantity_units) AS booked_units
          FROM cold_storage_bookings b
          WHERE b.facility_id = f.id
            AND b.status IN ('booked', 'checked_in')
            AND b.check_in_date <= $1
            AND b.check_out_date >= $1
        ) booked ON TRUE
      `;
      const params = [date];
      if (facilityId) {
        params.push(facilityId);
        query += ` WHERE f.id = $${params.length}`;
      }
      query += ' ORDER BY f.name';

      const result = await this.pool.query(query, params);
      const rows = result.rows.map((r) => {
        const capacity = Number(r.capacity_units);
        const booked = Number(r.booked_units);
        return {
          facilityId: r.facility_id,
          name: r.name,
          capacityUnits: capacity,
          capacityUnitLabel: r.capacity_unit_label,
          bookedUnits: booked,
          remainingUnits: Number((capacity - booked).toFixed(2)),
          utilizationPct: capacity > 0 ? Number(((booked / capacity) * 100).toFixed(2)) : null,
          asOfDate: date,
        };
      });

      return facilityId ? (rows[0] || null) : rows;
    } catch (error) {
      logger.error('Error computing cold storage utilization', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  // -------------------------------------------------------------------
  // Temperature compliance — facility-level probe log.
  // Merged in from the previously-unmounted
  // backend/src/routes/logistics/coldStorageRoutes.js (2026-09-07 Logistics
  // domain batch): that file talked to `pool` directly rather than going
  // through this service. Same schema
  // (cold_storage_temperature_readings, migration
  // 9998_cold_storage_temperature_compliance.sql), same compliance math,
  // now exposed as service methods so the mounted route file
  // (coldStorageRoutes.js) stays consistent with every other endpoint here.
  // -------------------------------------------------------------------

  /** Real threshold check against the facility's own declared temperature range. */
  checkTemperatureCompliance(temperatureC, minC, maxC) {
    const min = minC === null || minC === undefined ? null : Number(minC);
    const max = maxC === null || maxC === undefined ? null : Number(maxC);
    if (min === null && max === null) {
      return { isCompliant: true, deviationC: 0, note: 'Facility has no declared temperature range; nothing to check against.' };
    }
    let deviationC = 0;
    let isCompliant = true;
    if (min !== null && temperatureC < min) {
      isCompliant = false;
      deviationC = Number((min - temperatureC).toFixed(2));
    } else if (max !== null && temperatureC > max) {
      isCompliant = false;
      deviationC = Number((temperatureC - max).toFixed(2));
    }
    return { isCompliant, deviationC };
  }

  async recordTemperatureReading(facilityId, data = {}) {
    try {
      const { temperatureC, humidityPct, sensorId } = data;
      if (temperatureC === undefined || temperatureC === null || Number.isNaN(Number(temperatureC))) {
        throw new Error('temperatureC is required and must be numeric');
      }

      const facility = await this.getFacility(facilityId);
      const compliance = this.checkTemperatureCompliance(
        Number(temperatureC), facility.temperature_range_min_c, facility.temperature_range_max_c
      );

      const result = await this.pool.query(
        `INSERT INTO cold_storage_temperature_readings
           (facility_id, recorded_temperature_c, recorded_humidity_pct, sensor_id, is_compliant, deviation_c)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [facilityId, temperatureC, humidityPct ?? null, sensorId || null, compliance.isCompliant, compliance.deviationC]
      );

      if (!compliance.isCompliant) {
        logger.warn(`Cold storage facility ${facilityId} out of range: ${temperatureC}C, deviation ${compliance.deviationC}C`);
      }
      return { reading: result.rows[0], reasoning: compliance };
    } catch (error) {
      logger.error('Error recording cold storage temperature', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getTemperatureReadings(facilityId, { page = 1, limit = 500 } = {}) {
    try {
      const p = Math.max(parseInt(page, 10) || 1, 1);
      const l = Math.min(Math.max(parseInt(limit, 10) || 500, 1), 1000);
      const offset = (p - 1) * l;
      const result = await this.pool.query(
        `SELECT * FROM cold_storage_temperature_readings
          WHERE facility_id = $1
          ORDER BY recorded_at DESC
          LIMIT $2 OFFSET $3`,
        [facilityId, l, offset]
      );
      return { page: p, limit: l, rows: result.rows };
    } catch (error) {
      logger.error('Error listing cold storage temperature readings', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getTemperatureAlerts(facilityId, { hours = 72, limit = 100 } = {}) {
    try {
      const h = Math.min(Math.max(parseInt(hours, 10) || 72, 1), 24 * 90);
      const result = await this.pool.query(
        `SELECT * FROM cold_storage_temperature_readings
          WHERE facility_id = $1 AND is_compliant = FALSE
            AND recorded_at >= NOW() - ($2 || ' hours')::INTERVAL
          ORDER BY recorded_at DESC
          LIMIT $3`,
        [facilityId, h, Math.min(Math.max(parseInt(limit, 10) || 100, 1), 500)]
      );
      return result.rows;
    } catch (error) {
      logger.error('Error listing cold storage temperature alerts', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getComplianceStats(facilityId, hours = 24) {
    try {
      const h = Math.min(Math.max(parseInt(hours, 10) || 24, 1), 24 * 90);
      const facility = await this.getFacility(facilityId);

      const result = await this.pool.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE is_compliant) AS compliant_count,
           MIN(recorded_temperature_c) AS min_temp,
           MAX(recorded_temperature_c) AS max_temp,
           AVG(recorded_temperature_c) AS avg_temp,
           MAX(recorded_at) AS latest_reading_at
         FROM cold_storage_temperature_readings
        WHERE facility_id = $1 AND recorded_at >= NOW() - ($2 || ' hours')::INTERVAL`,
        [facilityId, h]
      );

      const stats = result.rows[0];
      const total = Number(stats.total);
      const compliantCount = Number(stats.compliant_count);
      const compliancePct = total > 0 ? Number(((compliantCount / total) * 100).toFixed(1)) : null;

      return {
        facilityId: facility.id,
        windowHours: h,
        totalReadings: total,
        compliantReadings: compliantCount,
        nonCompliantReadings: total - compliantCount,
        compliancePct,
        status: total === 0 ? 'no_data' : (compliancePct === 100 ? 'fully_compliant' : compliancePct >= 90 ? 'mostly_compliant' : 'at_risk'),
        minTempC: stats.min_temp === null ? null : Number(stats.min_temp),
        maxTempC: stats.max_temp === null ? null : Number(stats.max_temp),
        avgTempC: stats.avg_temp === null ? null : Number(Number(stats.avg_temp).toFixed(2)),
        latestReadingAt: stats.latest_reading_at,
        declaredRangeC: { min: facility.temperature_range_min_c, max: facility.temperature_range_max_c },
      };
    } catch (error) {
      logger.error('Error computing cold storage compliance', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * Facility-scoped booking convenience wrapper for the REST-style
   * POST /facilities/:facilityId/book path the frontend calls
   * (coldStorageAPI.bookFacility) — delegates to the same real
   * capacity-checked createBooking() above.
   */
  async bookFacility(facilityId, data = {}) {
    return this.createBooking({ ...data, facilityId });
  }

  /**
   * Real capacity-planning projection: for each of the next `days` days,
   * sum quantity_units of active bookings whose window covers that date
   * and compare to declared capacity. Not canned — driven entirely by the
   * same overlap query the booking capacity check uses.
   */
  async getCapacityPlanning(facilityId, days = 30) {
    try {
      const d = Math.min(Math.max(parseInt(days, 10) || 30, 1), 180);
      const facility = await this.getFacility(facilityId);
      const capacity = Number(facility.capacity_units);

      const result = await this.pool.query(
        `SELECT gs::date AS day,
                COALESCE(SUM(b.quantity_units) FILTER (
                  WHERE b.status IN ('booked', 'checked_in')
                    AND b.check_in_date <= gs::date AND b.check_out_date >= gs::date
                ), 0) AS booked_units
         FROM generate_series(CURRENT_DATE, CURRENT_DATE + ($1 || ' days')::INTERVAL, '1 day') gs
         LEFT JOIN cold_storage_bookings b ON b.facility_id = $2
         GROUP BY gs
         ORDER BY gs`,
        [d - 1, facilityId]
      );

      const projection = result.rows.map((r) => {
        const booked = Number(r.booked_units);
        return {
          date: r.day,
          bookedUnits: booked,
          availableUnits: Number(Math.max(capacity - booked, 0).toFixed(2)),
          utilizationPct: capacity > 0 ? Number(((booked / capacity) * 100).toFixed(1)) : null,
        };
      });

      const daysAtOrOverCapacity = projection.filter((p) => p.utilizationPct !== null && p.utilizationPct >= 100).length;

      return {
        facilityId: facility.id,
        capacityUnits: capacity,
        capacityUnitLabel: facility.capacity_unit_label,
        horizonDays: d,
        daysAtOrOverCapacity,
        projection,
      };
    } catch (error) {
      logger.error('Error computing cold storage capacity planning', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  /**
   * System-wide status rollup for the dashboard overview cards
   * (frontend coldStorageAPI.getStatus()). Every figure is a real
   * aggregate over cold_storage_facilities / cold_storage_bookings /
   * cold_storage_temperature_readings — nothing canned.
   */
  async getSystemStatus() {
    try {
      const facilities = await this.getFacilities();

      const readingResult = await this.pool.query(
        `SELECT
           COUNT(*) FILTER (WHERE NOT is_compliant) AS active_alerts,
           COUNT(*) FILTER (WHERE is_compliant) AS compliant_count,
           COUNT(*) AS total_count,
           MIN(recorded_temperature_c) AS min_temp,
           MAX(recorded_temperature_c) AS max_temp,
           AVG(recorded_temperature_c) AS avg_temp,
           COUNT(DISTINCT sensor_id) FILTER (WHERE sensor_id IS NOT NULL) AS active_sensors,
           MAX(recorded_at) AS last_sync
         FROM cold_storage_temperature_readings
         WHERE recorded_at >= NOW() - INTERVAL '24 hours'`
      );
      const r = readingResult.rows[0];
      const totalReadings = Number(r.total_count);
      const compliancePct = totalReadings > 0 ? Number(((Number(r.compliant_count) / totalReadings) * 100).toFixed(1)) : null;

      const today = new Date().toISOString().slice(0, 10);
      let sumUtilization = 0;
      let utilizationCount = 0;
      let inRange = 0;
      for (const f of facilities) {
        const util = await this.getUtilization(f.id, today);
        if (util && util.utilizationPct !== null) {
          sumUtilization += util.utilizationPct;
          utilizationCount += 1;
        }
      }

      const alertsResult = await this.pool.query(
        `SELECT t.recorded_temperature_c, t.deviation_c, t.recorded_at, f.name AS facility, f.id AS facility_id
         FROM cold_storage_temperature_readings t
         JOIN cold_storage_facilities f ON f.id = t.facility_id
         WHERE t.is_compliant = FALSE
         ORDER BY t.recorded_at DESC
         LIMIT 10`
      );
      const recentAlerts = alertsResult.rows.map((a) => ({
        facility: a.facility,
        facilityId: a.facility_id,
        message: `Recorded ${Number(a.recorded_temperature_c).toFixed(1)}C — ${Number(a.deviation_c).toFixed(1)}C out of range`,
        severity: Math.abs(Number(a.deviation_c)) >= 5 ? 'critical' : 'warning',
        timestamp: a.recorded_at,
      }));

      const inRangeResult = await this.pool.query(
        `SELECT COUNT(DISTINCT facility_id) AS n FROM cold_storage_facilities f
         WHERE NOT EXISTS (
           SELECT 1 FROM cold_storage_temperature_readings t
           WHERE t.facility_id = f.id AND t.is_compliant = FALSE
             AND t.recorded_at >= NOW() - INTERVAL '24 hours'
         )`
      );
      inRange = Number(inRangeResult.rows[0]?.n || 0);

      return {
        status: Number(r.active_alerts) > 0 ? 'degraded' : 'healthy',
        activeAlerts: Number(r.active_alerts),
        avgUtilization: utilizationCount > 0 ? Number((sumUtilization / utilizationCount).toFixed(1)) : 0,
        complianceRate: compliancePct,
        avgTemperature: r.avg_temp === null ? null : Number(Number(r.avg_temp).toFixed(1)),
        minTemp: r.min_temp === null ? null : Number(r.min_temp),
        maxTemp: r.max_temp === null ? null : Number(r.max_temp),
        activeSensors: Number(r.active_sensors),
        lastSync: r.last_sync,
        alertThreshold: null,
        inRange,
        totalFacilities: facilities.length,
        recentAlerts,
      };
    } catch (error) {
      logger.error('Error computing cold storage system status', { error: error.message, stack: error.stack });
      throw error;
    }
  }
}

module.exports = new ColdStorageService();

// Merged from backend/src/modules/M078
{
  const m078 = require("../../modules/M078/service");
  const { ...rest } = m078;
  Object.assign(module.exports, rest);
}
