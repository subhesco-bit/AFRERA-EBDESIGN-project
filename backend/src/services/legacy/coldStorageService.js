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
      let result = await this.pool.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('Error listing cold storage facilities', { error: error.message, stack: error.stack });
      throw error;
    }
  }

  async getFacility(facilityId) {
    try {
      let result = await this.pool.query('SELECT * FROM cold_storage_facilities WHERE id = $1', [facilityId]);
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
      let params = [];
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
      let result = await this.pool.query(
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
      let params = [];
      if (filters.facilityId) { params.push(filters.facilityId); query += ` AND b.facility_id = $${params.length}`; }
      if (filters.farmerId) { params.push(filters.farmerId); query += ` AND b.farmer_id = $${params.length}`; }
      if (filters.fpoId) { params.push(filters.fpoId); query += ` AND b.fpo_id = $${params.length}`; }
      if (filters.status) { params.push(filters.status); query += ` AND b.status = $${params.length}`; }

      query += ' ORDER BY b.check_in_date DESC, b.created_at DESC';
      let result = await this.pool.query(query, params);
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
      let result = await this.pool.query(
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
      let params = [date];
      if (facilityId) {
        params.push(facilityId);
        query += ` WHERE f.id = $${params.length}`;
      }
      query += ' ORDER BY f.name';

      let result = await this.pool.query(query, params);
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
}

module.exports = new ColdStorageService();

// Merged from backend/src/modules/M078
{
  const m078 = require("../../modules/M078/service");
  const { ...rest } = m078;
  Object.assign(module.exports, rest);
}
