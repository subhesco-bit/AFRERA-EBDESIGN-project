/**
 * Cold Storage Routes — facility capacity, booking, and temperature
 * compliance for refrigerated storage facilities.
 *
 * Schema: cold_storage_facilities / cold_storage_bookings (migration
 * 3104_cold_storage_schema.sql) and cold_storage_temperature_readings
 * (migration 9998_cold_storage_temperature_compliance.sql, added alongside
 * this file — temperature_readings in logisticsEnhancementService.js is
 * shipment-scoped and cannot represent a facility probe with no shipment).
 *
 * Capacity is enforced here in application code, not a DB trigger — see
 * migration 9998_cold_storage_booking_trigger_fix.sql for why: a leftover
 * trigger from an earlier, different cold-storage schema attempt was still
 * attached to this table and referenced columns that don't exist on it,
 * which made every booking insert fail at runtime. That trigger is now
 * dropped; checkFacilityCapacity() below is the real (and only) capacity
 * rule.
 */

const express = require('express');
const router = express.Router();

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) return res.status(401).json({ error: "Unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();

}

}

}

const pool = require('../../database/pool');
const { logger } = require('../../utils/logger');
const { authMiddleware, requireRole } = require('../../middleware/auth');

const MAX_READING_LIMIT = 1000;
const DEFAULT_READING_LIMIT = 500;

function boundedPage({ page, limit }) {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || DEFAULT_READING_LIMIT, 1), MAX_READING_LIMIT);
  return { page: p, limit: l, offset: (p - 1) * l };
}

/**
 * Real capacity check: sum quantity_units of every active booking (status
 * 'booked' or 'checked_in') at this facility whose [check_in_date,
 * check_out_date] window overlaps the requested window, then compare
 * against the facility's declared capacity_units. Same overlap-window
 * arithmetic the dropped DB trigger was meant to enforce, done here instead.
 */
async function bookedUnitsInWindow(facilityId, checkInDate, checkOutDate, excludeBookingId = null) {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(quantity_units), 0) AS booked
       FROM cold_storage_bookings
      WHERE facility_id = $1
        AND status IN ('booked', 'checked_in')
        AND check_in_date <= $3
        AND check_out_date >= $2
        AND ($4::uuid IS NULL OR id <> $4)`,
    [facilityId, checkInDate, checkOutDate, excludeBookingId]
  );
  return Number(rows[0].booked);
}

async function checkFacilityCapacity(facility, quantityUnits, checkInDate, checkOutDate, excludeBookingId = null) {
  const alreadyBooked = await bookedUnitsInWindow(facility.id, checkInDate, checkOutDate, excludeBookingId);
  const capacity = Number(facility.capacity_units);
  const available = capacity - alreadyBooked;
  const fits = quantityUnits <= available;
  return { fits, capacity, alreadyBooked, available, requested: quantityUnits };
}

/** Real threshold check against the facility's own declared temperature range. */
function checkTemperatureCompliance(temperatureC, minC, maxC) {
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

function utilizationStatus(pct) {
  if (pct >= 100) return 'over_capacity';
  if (pct >= 90) return 'critical';
  if (pct >= 75) return 'high';
  return 'normal';
}

// ---------------------------------------------------------------------------
// Facilities
// ---------------------------------------------------------------------------

router.get('/facilities', async (req, res) => {
  try {
    const { district, state, status } = req.query;
    const params = [];
    const clauses = [];
    if (district) { params.push(district); clauses.push(`district = $${params.length}`); }
    if (state) { params.push(state); clauses.push(`state = $${params.length}`); }
    if (status) { params.push(status); clauses.push(`status = $${params.length}`); }
    const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';

    const { rows: facilities } = await pool.query(
      `SELECT * FROM cold_storage_facilities ${where} ORDER BY name ASC`,
      params
    );

    const today = new Date().toISOString().slice(0, 10);
    const withUtilization = await Promise.all(facilities.map(async (f) => {
      const booked = await bookedUnitsInWindow(f.id, today, today);
      const capacity = Number(f.capacity_units);
      const utilizationPct = capacity > 0 ? Number(((booked / capacity) * 100).toFixed(1)) : null;
      return {
        ...f,
        occupiedUnits: booked,
        availableUnits: Math.max(capacity - booked, 0),
        utilizationPct,
        utilizationStatus: utilizationPct === null ? 'unknown' : utilizationStatus(utilizationPct)
    }));

    res.json({ success: true, count: withUtilization.length, data: withUtilization });
  } catch (error) {
    logger.error('Error listing cold storage facilities', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:id', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM cold_storage_facilities WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Facility not found' });
    const facility = rows[0];

    const today = new Date().toISOString().slice(0, 10);
    const occupiedUnits = await bookedUnitsInWindow(facility.id, today, today);
    const capacity = Number(facility.capacity_units);
    const utilizationPct = capacity > 0 ? Number(((occupiedUnits / capacity) * 100).toFixed(1)) : null;

    const { rows: activeBookings } = await pool.query(
      `SELECT * FROM cold_storage_bookings
        WHERE facility_id = $1 AND status IN ('booked', 'checked_in')
        ORDER BY check_in_date ASC`,
      [facility.id]
    );

    res.json({
      success: true,
      data: {
        ...facility,
        occupiedUnits,
        availableUnits: Math.max(capacity - occupiedUnits, 0),
        utilizationPct,
        utilizationStatus: utilizationPct === null ? 'unknown' : utilizationStatus(utilizationPct),
        activeBookings
      }
    });
  } catch (error) {
    logger.error('Error getting cold storage facility', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/facilities', authMiddleware, requireRole('logistics', 'admin'), async (req, res) => {
  try {
    const {
      fpoId, name, location, district, state, capacityUnits, capacityUnitLabel,
      temperatureRangeMinC, temperatureRangeMaxC, operatorName, operatorPhone
    } = req.body || {};

    if (!name || !location || !capacityUnits) {
      return res.status(400).json({ success: false, error: 'name, location and capacityUnits are required' });
    }
    if (Number(capacityUnits) <= 0) {
      return res.status(400).json({ success: false, error: 'capacityUnits must be greater than zero' });
    }
    if (
      temperatureRangeMinC !== undefined && temperatureRangeMinC !== null &&
      temperatureRangeMaxC !== undefined && temperatureRangeMaxC !== null &&
      Number(temperatureRangeMinC) > Number(temperatureRangeMaxC)
    ) {
      return res.status(400).json({ success: false, error: 'temperatureRangeMinC cannot exceed temperatureRangeMaxC' });
    }

    const { rows } = await pool.query(
      `INSERT INTO cold_storage_facilities
         (fpo_id, name, location, district, state, capacity_units, capacity_unit_label,
          temperature_range_min_c, temperature_range_max_c, operator_name, operator_phone)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [
        fpoId || null, name, location, district || null, state || null,
        capacityUnits, capacityUnitLabel || 'quintal',
        temperatureRangeMinC ?? null, temperatureRangeMaxC ?? null,
        operatorName || null, operatorPhone || null
      ]
    );

    logger.info(`Cold storage facility created: ${rows[0].id}`);
    res.status(201).json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error creating cold storage facility', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.put('/facilities/:id', authMiddleware, requireRole('logistics', 'admin'), async (req, res) => {
  try {
    const { name, location, district, state, temperatureRangeMinC, temperatureRangeMaxC, operatorName, operatorPhone, status } = req.body || {};
    const { rows } = await pool.query(
      `UPDATE cold_storage_facilities SET
         name = COALESCE($1, name),
         location = COALESCE($2, location),
         district = COALESCE($3, district),
         state = COALESCE($4, state),
         temperature_range_min_c = COALESCE($5, temperature_range_min_c),
         temperature_range_max_c = COALESCE($6, temperature_range_max_c),
         operator_name = COALESCE($7, operator_name),
         operator_phone = COALESCE($8, operator_phone),
         status = COALESCE($9, status),
         updated_at = NOW()
       WHERE id = $10
       RETURNING *`,
      [name, location, district, state, temperatureRangeMinC, temperatureRangeMaxC, operatorName, operatorPhone, status, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, error: 'Facility not found' });
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error updating cold storage facility', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

router.get('/facilities/:id/bookings', async (req, res) => {
  try {
    const { status } = req.query;
    const params = [req.params.id];
    let where = 'WHERE facility_id = $1';
    if (status) { params.push(status); where += ` AND status = $${params.length}`; }
    const { rows } = await pool.query(
      `SELECT * FROM cold_storage_bookings ${where} ORDER BY check_in_date DESC`,
      params
    );
    res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    logger.error('Error listing cold storage bookings', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/facilities/:id/bookings', authMiddleware, async (req, res) => {
  try {
    const { farmerId, fpoId, produceType, quantityUnits, checkInDate, checkOutDate, notes } = req.body || {};

    if (!produceType || !quantityUnits || !checkInDate || !checkOutDate) {
      return res.status(400).json({ success: false, error: 'produceType, quantityUnits, checkInDate and checkOutDate are required' });
    }
    if (!farmerId && !fpoId) {
      return res.status(400).json({ success: false, error: 'Either farmerId or fpoId is required' });
    }
    if (new Date(checkOutDate) < new Date(checkInDate)) {
      return res.status(400).json({ success: false, error: 'checkOutDate cannot be before checkInDate' });
    }
    if (Number(quantityUnits) <= 0) {
      return res.status(400).json({ success: false, error: 'quantityUnits must be greater than zero' });
    }

    const { rows: facilityRows } = await pool.query('SELECT * FROM cold_storage_facilities WHERE id = $1', [req.params.id]);
    if (facilityRows.length === 0) return res.status(404).json({ success: false, error: 'Facility not found' });
    const facility = facilityRows[0];
    if (facility.status !== 'active') {
      return res.status(409).json({ success: false, error: `Facility is ${facility.status}, not accepting bookings` });
    }

    const capacityCheck = await checkFacilityCapacity(facility, Number(quantityUnits), checkInDate, checkOutDate);
    if (!capacityCheck.fits) {
      return res.status(409).json({
        success: false,
        error: 'Requested quantity exceeds available facility capacity for that window',
        reasoning: capacityCheck
      });
    }

    const { rows } = await pool.query(
      `INSERT INTO cold_storage_bookings
         (facility_id, farmer_id, fpo_id, produce_type, quantity_units, check_in_date, check_out_date, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'booked')
       RETURNING *`,
      [facility.id, farmerId || null, fpoId || null, produceType, quantityUnits, checkInDate, checkOutDate, notes || null]
    );

    logger.info(`Cold storage booking created: ${rows[0].id} at facility ${facility.id}`);
    res.status(201).json({ success: true, data: rows[0], reasoning: capacityCheck });
  } catch (error) {
    logger.error('Error creating cold storage booking', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

const ALLOWED_TRANSITIONS = {
  booked: ['checked_in', 'cancelled'],
  checked_in: ['checked_out', 'cancelled'],
  checked_out: [],
  cancelled: []router.patch('/facilities/:id/bookings/:bookingId', authMiddleware, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status) return res.status(400).json({ success: false, error: 'status is required' });

    const { rows: existingRows } = await pool.query(
      'SELECT * FROM cold_storage_bookings WHERE id = $1 AND facility_id = $2',
      [req.params.bookingId, req.params.id]
    );
    if (existingRows.length === 0) return res.status(404).json({ success: false, error: 'Booking not found' });
    const existing = existingRows[0];

    const allowed = ALLOWED_TRANSITIONS[existing.status] || [];
    if (!allowed.includes(status)) {
      return res.status(409).json({
        success: false,
        error: `Cannot move booking from '${existing.status}' to '${status}'`,
        allowedTransitions: allowed
      });
    }

    const { rows } = await pool.query(
      `UPDATE cold_storage_bookings SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, existing.id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (error) {
    logger.error('Error updating cold storage booking', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

// ---------------------------------------------------------------------------
// Temperature compliance
// ---------------------------------------------------------------------------

router.post('/facilities/:id/temperature', authMiddleware, async (req, res) => {
  try {
    const { temperatureC, humidityPct, sensorId } = req.body || {};
    if (temperatureC === undefined || temperatureC === null || Number.isNaN(Number(temperatureC))) {
      return res.status(400).json({ success: false, error: 'temperatureC is required and must be numeric' });
    }

    const { rows: facilityRows } = await pool.query('SELECT * FROM cold_storage_facilities WHERE id = $1', [req.params.id]);
    if (facilityRows.length === 0) return res.status(404).json({ success: false, error: 'Facility not found' });
    const facility = facilityRows[0];

    const compliance = checkTemperatureCompliance(Number(temperatureC), facility.temperature_range_min_c, facility.temperature_range_max_c);

    const { rows } = await pool.query(
      `INSERT INTO cold_storage_temperature_readings
         (facility_id, recorded_temperature_c, recorded_humidity_pct, sensor_id, is_compliant, deviation_c)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING *`,
      [facility.id, temperatureC, humidityPct ?? null, sensorId || null, compliance.isCompliant, compliance.deviationC]
    );

    if (!compliance.isCompliant) {
      logger.warn(`Cold storage facility ${facility.id} out of range: ${temperatureC}C, deviation ${compliance.deviationC}C`);
    }

    res.status(201).json({ success: true, data: rows[0], reasoning: compliance });
  } catch (error) {
    logger.error('Error recording cold storage temperature', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:id/temperature', async (req, res) => {
  try {
    const { page, limit, offset } = boundedPage(req.query);
    const { rows } = await pool.query(
      `SELECT * FROM cold_storage_temperature_readings
        WHERE facility_id = $1
        ORDER BY recorded_at DESC
        LIMIT $2 OFFSET $3`,
      [req.params.id, limit, offset]
    );
    res.json({ success: true, page, limit, count: rows.length, data: rows });
  } catch (error) {
    logger.error('Error listing cold storage temperature readings', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/facilities/:id/compliance', async (req, res) => {
  try {
    const hours = Math.min(Math.max(parseInt(req.query.hours, 10) || 24, 1), 24 * 90);
    const { rows: facilityRows } = await pool.query('SELECT * FROM cold_storage_facilities WHERE id = $1', [req.params.id]);
    if (facilityRows.length === 0) return res.status(404).json({ success: false, error: 'Facility not found' });
    const facility = facilityRows[0];

    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total,
         COUNT(*) FILTER (WHERE is_compliant) AS compliant_count,
         MIN(recorded_temperature_c) AS min_temp,
         MAX(recorded_temperature_c) AS max_temp,
         AVG(recorded_temperature_c) AS avg_temp,
         MAX(recorded_at) AS latest_reading_at
       FROM cold_storage_temperature_readings
      WHERE facility_id = $1 AND recorded_at >= NOW() - ($2 || ' hours')::INTERVAL`,
      [facility.id, hours]
    );

    const stats = rows[0];
    const total = Number(stats.total);
    const compliantCount = Number(stats.compliant_count);
    const compliancePct = total > 0 ? Number(((compliantCount / total) * 100).toFixed(1)) : null;

    res.json({
      success: true,
      data: {
        facilityId: facility.id,
        windowHours: hours,
        totalReadings: total,
        compliantReadings: compliantCount,
        nonCompliantReadings: total - compliantCount,
        compliancePct,
        status: total === 0 ? 'no_data' : (compliancePct === 100 ? 'fully_compliant' : compliancePct >= 90 ? 'mostly_compliant' : 'at_risk'),
        minTempC: stats.min_temp === null ? null : Number(stats.min_temp),
        maxTempC: stats.max_temp === null ? null : Number(stats.max_temp),
        avgTempC: stats.avg_temp === null ? null : Number(Number(stats.avg_temp).toFixed(2)),
        latestReadingAt: stats.latest_reading_at,
        declaredRangeC: { min: facility.temperature_range_min_c, max: facility.temperature_range_max_c }
      }
    });
  } catch (error) {
    logger.error('Error computing cold storage compliance', { error: error.message });
    res.status(400).json({ success: false, error: error.message });
  }
});

module.exports = router;
