/**
 * Mill Circuit & FPO Ledger Service (v44 feature 3 — Enhanced Farmer Portal)
 *
 * Backs two panels from docs/V44_ADDITIONAL_FEATURES_EXTRACTION.md that had
 * no equivalent anywhere in this codebase before migration
 * 9995_scheme_verification_map_protection.sql added their tables:
 *
 *   - Mill Circuit: a trailer-mounted rice mill that rotates through village
 *     clusters on a fixed weekly schedule (not a fixed hub) — farmers book a
 *     slot against it.
 *   - FPO Ledger: a farmer-owned running ledger of what the FPO has recorded
 *     for that farmer (lot sales, shared equipment costs, etc.) — explicitly
 *     "not a bank NPA file"; only what the FPO chooses to share leaves it.
 *
 * Deliberately kept out of sharedInfraService.js (other in-flight work owns
 * that file) and as its own router rather than folded into an existing
 * service, since neither concept maps onto an existing table.
 */

const express = require('express');
const { logger } = require('../../utils\/logger');
const { authMiddleware } = require('../../middleware\/auth');

const router = express.Router();
// Shared pool convention (2026-08-04, see database/pool.js).
const pool = require('../../database\/pool');

// ============================================================================
// MILL CIRCUIT
// ============================================================================

/**
 * Upcoming/open mill circuit slots. Public read (a farmer deciding whether
 * to book does not need to be logged in to see the schedule).
 */
router.get('/mill-circuit/slots', async (req, res) => {
  try {
    const { status, cluster } = req.query;
    const conditions = [];
    const params = [];

    if (status) { params.push(status); conditions.push(`status = $${params.length}`); }
    if (cluster) { params.push(cluster); conditions.push(`cluster = $${params.length}`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT * FROM mill_circuit_slots ${where} ORDER BY week_label, cluster`,
      params
    );
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    logger.error('List mill circuit slots error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to list mill circuit slots' });
  }
});

/** Admin/FPO-side: publish a new week's rotation. */
router.post('/mill-circuit/slots', authMiddleware, async (req, res) => {
  try {
    const { week_label, cluster, days, capacity_kg, status, slot_date } = req.body;
    if (!week_label || !cluster || !days) {
      return res.status(400).json({ success: false, error: 'week_label, cluster and days are required' });
    }

    let result = await pool.query(
      `INSERT INTO mill_circuit_slots (week_label, cluster, days, capacity_kg, status, slot_date)
       VALUES ($1, $2, $3, $4, COALESCE($5, 'open'), $6)
       RETURNING *`,
      [week_label, cluster, days, capacity_kg || null, status || null, slot_date || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Create mill circuit slot error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to create mill circuit slot' });
  }
});

/**
 * Book a slot. Capacity-aware when the slot has a capacity_kg set; otherwise
 * a slot marked 'waitlist' or 'closed' cannot take a 'confirmed' booking.
 */
router.post('/mill-circuit/bookings', authMiddleware, async (req, res) => {
  const client = await pool.connect();
  try {
    const { slot_id, farmer_id, quantity_kg } = req.body;
    if (!slot_id || !farmer_id || !quantity_kg) {
      return res.status(400).json({ success: false, error: 'slot_id, farmer_id and quantity_kg are required' });
    }

    await client.query('BEGIN');

    const slotResult = await client.query(
      'SELECT * FROM mill_circuit_slots WHERE id = $1 FOR UPDATE',
      [slot_id]
    );
    if (slotResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Mill circuit slot not found' });
    }

    const slot = slotResult.rows[0];
    const wouldExceedCapacity = slot.capacity_kg !== null &&
      Number(slot.booked_kg) + Number(quantity_kg) > Number(slot.capacity_kg);
    const bookingStatus = (slot.status === 'closed') ? null
      : (slot.status === 'waitlist' || wouldExceedCapacity) ? 'waitlisted'
      : 'confirmed';

    if (bookingStatus === null) {
      await client.query('ROLLBACK');
      return res.status(422).json({ success: false, error: 'This slot is closed for booking' });
    }

    const bookingResult = await client.query(
      `INSERT INTO mill_circuit_bookings (slot_id, farmer_id, quantity_kg, status)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [slot_id, farmer_id, quantity_kg, bookingStatus]
    );

    if (bookingStatus === 'confirmed') {
      await client.query(
        'UPDATE mill_circuit_slots SET booked_kg = booked_kg + $1, updated_at = NOW() WHERE id = $2',
        [quantity_kg, slot_id]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: bookingResult.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Create mill circuit booking error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to book mill circuit slot' });
  } finally {
    client.release();
  }
});

router.get('/mill-circuit/bookings', authMiddleware, async (req, res) => {
  try {
    const { farmer_id, slot_id } = req.query;
    let conditions = [];
    let params = [];
    if (farmer_id) { params.push(farmer_id); conditions.push(`b.farmer_id = $${params.length}`); }
    if (slot_id) { params.push(slot_id); conditions.push(`b.slot_id = $${params.length}`); }

    let where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let result = await pool.query(
      `SELECT b.*, s.week_label, s.cluster, s.days
       FROM mill_circuit_bookings b
       JOIN mill_circuit_slots s ON s.id = b.slot_id
       ${where}
       ORDER BY b.created_at DESC`,
      params
    );
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    logger.error('List mill circuit bookings error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to list mill circuit bookings' });
  }
});

// ============================================================================
// FPO LEDGER
// ============================================================================

router.get('/fpo-ledger/entries', authMiddleware, async (req, res) => {
  try {
    const { fpo_id, farmer_id } = req.query;
    let conditions = [];
    let params = [];
    if (fpo_id) { params.push(fpo_id); conditions.push(`fpo_id = $${params.length}`); }
    if (farmer_id) { params.push(farmer_id); conditions.push(`farmer_id = $${params.length}`); }

    let where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    let result = await pool.query(
      `SELECT * FROM fpo_ledger_entries ${where} ORDER BY entry_date DESC, created_at DESC`,
      params
    );
    res.json({ success: true, data: result.rows, total: result.rows.length });
  } catch (error) {
    logger.error('List FPO ledger entries error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to list FPO ledger entries' });
  }
});

router.post('/fpo-ledger/entries', authMiddleware, async (req, res) => {
  try {
    const { fpo_id, farmer_id, entry_date, description, quantity_kg, amount_inr, entry_type } = req.body;
    if (!fpo_id || !farmer_id || !description) {
      return res.status(400).json({ success: false, error: 'fpo_id, farmer_id and description are required' });
    }

    let result = await pool.query(
      `INSERT INTO fpo_ledger_entries
        (fpo_id, farmer_id, entry_date, description, quantity_kg, amount_inr, entry_type)
       VALUES ($1, $2, COALESCE($3, CURRENT_DATE), $4, $5, $6, COALESCE($7, 'credit'))
       RETURNING *`,
      [fpo_id, farmer_id, entry_date || null, description, quantity_kg || null, amount_inr || null, entry_type || null]
    );

    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    logger.error('Create FPO ledger entry error', { error: error.message, stack: error.stack });
    res.status(500).json({ success: false, error: 'Failed to create FPO ledger entry' });
  }
});

function isHealthy() {
  return true;
}

module.exports = {
  router,
  isHealthy
};



