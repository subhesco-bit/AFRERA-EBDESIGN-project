/**
 * Machinery Access Service — REOS Rural Life OS, Layer 3.
 *
 * Backs `machinery_access` (041_rural_life_os_schema.sql): rental / lease /
 * subscription / cooperative / fpo_owned / village_owned / certified
 * second-life access to shared machinery. The real work here is cost
 * calculation by rental_type, double-booking prevention for the same
 * machinery asset, and utilization reporting — none of which a bare CRUD
 * scaffold provides.
 */

const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../middleware/auth');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');

const r2 = (n) => Math.round(n * 100) / 100;

function daysBetween(start, end) {
  return Math.max(1, Math.ceil((new Date(end) - new Date(start)) / (24 * 3600 * 1000)));
}

/**
 * Cost by rental_type. hourly/daily use unit_rate directly against the
 * declared duration; weekly/seasonal/crop_cycle price the whole span at
 * unit_rate as a package rate (that is what "weekly rate" etc. means in this
 * domain) rather than multiplying by a day count, which would silently
 * double-charge a package booking.
 */
function computeBookingCost({ rental_type, unit_rate, duration_hours, duration_days, delivery_required, delivery_cost, security_deposit }) {
  let baseCost;
  const reasoning = [];
  switch (rental_type) {
    case 'hourly':
      if (!(duration_hours > 0)) throw new Error('duration_hours is required for hourly bookings');
      baseCost = r2(unit_rate * duration_hours);
      reasoning.push(`${duration_hours}h × ₹${unit_rate}/hr`);
      break;
    case 'daily':
      if (!(duration_days > 0)) throw new Error('duration_days is required for daily bookings');
      baseCost = r2(unit_rate * duration_days);
      reasoning.push(`${duration_days}d × ₹${unit_rate}/day`);
      break;
    case 'weekly':
    case 'seasonal':
    case 'crop_cycle':
      baseCost = r2(unit_rate);
      reasoning.push(`Package rate for ${rental_type} booking`);
      break;
    default:
      throw new Error(`Unknown rental_type: ${rental_type}`);
  }
  const delivery = delivery_required ? r2(delivery_cost || 0) : 0;
  const total = r2(baseCost + delivery);
  return { base_cost: baseCost, delivery_cost: delivery, security_deposit: r2(security_deposit || 0), total_cost: total, reasoning };
}

async function checkConflict({ machinery_id, start_date, end_date, excludeId }) {
  if (!machinery_id) return null;
  const pg = getPostgreSQL();
  const params = [machinery_id, start_date, end_date];
  let query = `SELECT id, booking_number, start_date, end_date, status FROM machinery_access
                WHERE machinery_id = $1
                  AND status NOT IN ('cancelled', 'completed')
                  AND start_date <= $3 AND end_date >= $2`;
  if (excludeId) { params.push(excludeId); query += ` AND id <> $${params.length}`; }
  const { rows } = await pg.query(query, params);
  return rows[0] || null;
}

async function createBooking(payload) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const {
    reu_id, machinery_id, access_model, rental_type, start_date, end_date,
    duration_hours, duration_days, unit_rate, security_deposit,
    pickup_location, delivery_location, delivery_required, delivery_cost,
    purpose, crop_id, area, area_unit, operator_id, operator_name,
  } = payload;

  if (!reu_id) throw new Error('reu_id is required');
  if (!access_model) throw new Error('access_model is required');
  if (!start_date || !end_date) throw new Error('start_date and end_date are required');
  if (new Date(end_date) < new Date(start_date)) throw new Error('end_date must not be before start_date');
  if (!(unit_rate > 0)) throw new Error('unit_rate must be positive');

  const conflict = await checkConflict({ machinery_id, start_date, end_date });
  if (conflict) {
    const err = new Error(`Machinery already booked ${conflict.start_date}–${conflict.end_date} (${conflict.booking_number || conflict.id})`);
    err.code = 'BOOKING_CONFLICT';
    throw err;
  }

  const cost = computeBookingCost({ rental_type, unit_rate, duration_hours, duration_days, delivery_required, delivery_cost, security_deposit });
  const bookingNumber = `MA-${Date.now().toString(36).toUpperCase()}`;

  const { rows } = await pg.query(
    `INSERT INTO machinery_access
       (reu_id, machinery_id, access_model, rental_type, booking_number, start_date, end_date,
        duration_hours, duration_days, unit_rate, total_cost, security_deposit,
        pickup_location, delivery_location, delivery_required, delivery_cost,
        purpose, crop_id, area, area_unit, operator_id, operator_name, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,'pending')
     RETURNING *`,
    [reu_id, machinery_id || null, access_model, rental_type || null, bookingNumber, start_date, end_date,
      duration_hours || null, duration_days || null, unit_rate, cost.total_cost, cost.security_deposit,
      pickup_location ? JSON.stringify(pickup_location) : null, delivery_location ? JSON.stringify(delivery_location) : null,
      !!delivery_required, cost.delivery_cost, purpose || null, crop_id || null, area || null, area_unit || null,
      operator_id || null, operator_name || null]
  );

  logger.info(`Machinery booking created: ${bookingNumber}`, { total_cost: cost.total_cost });
  return { booking: rows[0], cost_breakdown: cost };
}

async function listBookings({ reu_id, machinery_id, status, page = 1, limit = 20 } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const conditions = [];
  const params = [];
  if (reu_id) { params.push(reu_id); conditions.push(`reu_id = $${params.length}`); }
  if (machinery_id) { params.push(machinery_id); conditions.push(`machinery_id = $${params.length}`); }
  if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  const totalRes = await pg.query(`SELECT COUNT(*) FROM machinery_access ${where}`, params);
  const { rows } = await pg.query(
    `SELECT * FROM machinery_access ${where} ORDER BY start_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  return { items: rows, pagination: { page, limit, total: parseInt(totalRes.rows[0].count, 10), totalPages: Math.ceil(totalRes.rows[0].count / limit) } };
}

async function completeBooking(id, { actual_start_date, actual_end_date, actual_duration_hours, rating, feedback } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const { rows: existing } = await pg.query('SELECT * FROM machinery_access WHERE id = $1', [id]);
  if (!existing.length) throw new Error('Booking not found');

  const { rows } = await pg.query(
    `UPDATE machinery_access
        SET status = 'completed', actual_start_date = $2, actual_end_date = $3,
            actual_duration_hours = $4, rating = $5, feedback = $6
      WHERE id = $1 RETURNING *`,
    [id, actual_start_date || existing[0].start_date, actual_end_date || existing[0].end_date,
      actual_duration_hours || null, rating || null, feedback || null]
  );
  return rows[0];
}

/**
 * Utilization for a single machinery asset over a window: booked days as a
 * fraction of the window, using non-cancelled bookings only.
 */
async function getUtilization(machineryId, { from, to } = {}) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  const windowFrom = from || new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const windowTo = to || new Date().toISOString().slice(0, 10);

  const { rows } = await pg.query(
    `SELECT start_date, end_date FROM machinery_access
      WHERE machinery_id = $1 AND status NOT IN ('cancelled')
        AND start_date <= $3 AND end_date >= $2`,
    [machineryId, windowFrom, windowTo]
  );

  const windowDays = daysBetween(windowFrom, windowTo);
  let bookedDays = 0;
  for (const b of rows) {
    const clampedStart = new Date(Math.max(new Date(b.start_date), new Date(windowFrom)));
    const clampedEnd = new Date(Math.min(new Date(b.end_date), new Date(windowTo)));
    bookedDays += daysBetween(clampedStart, clampedEnd);
  }
  const utilizationPct = windowDays > 0 ? r2(Math.min(100, (bookedDays / windowDays) * 100)) : 0;

  return {
    machinery_id: machineryId, window: { from: windowFrom, to: windowTo, days: windowDays },
    booked_days: bookedDays, booking_count: rows.length, utilization_pct: utilizationPct,
    reasoning: `${bookedDays} booked day(s) across ${rows.length} booking(s) over a ${windowDays}-day window`,
  };
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

router.get('/', async (req, res) => {
  try {
    const result = await listBookings({
      reu_id: req.query.reu_id, machinery_id: req.query.machinery_id, status: req.query.status,
      page: parseInt(req.query.page, 10) || 1, limit: parseInt(req.query.limit, 10) || 20,
    });
    res.json({ success: true, data: result });
  } catch (error) {
    logger.warn('machineryAccessService list failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  try {
    const result = await createBooking(req.body || {});
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.code === 'BOOKING_CONFLICT' ? 409 : 400).json({ success: false, error: error.message });
  }
});

router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const booking = await completeBooking(req.params.id, req.body || {});
    res.json({ success: true, data: booking });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.get('/machinery/:machineryId/utilization', async (req, res) => {
  try {
    const result = await getUtilization(req.params.machineryId, { from: req.query.from, to: req.query.to });
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

function setupRoutes(app) {
  app.use('/api/v1/machinery-access', router);
}

module.exports = { router, setupRoutes, computeBookingCost, createBooking, listBookings, completeBooking, getUtilization };
