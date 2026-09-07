'use strict';

const { getPostgreSQL } = require('../database/connection');

function db() {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');
  return pg;
}

async function listWorkers() {
  const result = await db().query(
    `SELECT id, name, phone, skill, wage_type, wage_rate, status, created_at
     FROM labour_workers WHERE status = 'active' ORDER BY name`
  );
  return result.rows;
}

async function createWorker(data) {
  const result = await db().query(
    `INSERT INTO labour_workers (name, phone, skill, wage_type, wage_rate)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.name, data.phone || null, data.skill || 'General', data.wage_type || 'Daily', Number(data.wage_rate || 0)]
  );
  return result.rows[0];
}

async function updateWorker(id, data) {
  const result = await db().query(
    `UPDATE labour_workers
     SET name = COALESCE($1, name), phone = COALESCE($2, phone), skill = COALESCE($3, skill),
         wage_type = COALESCE($4, wage_type), wage_rate = COALESCE($5, wage_rate), updated_at = NOW()
     WHERE id = $6 AND status = 'active' RETURNING *`,
    [data.name || null, data.phone || null, data.skill || null, data.wage_type || null,
      data.wage_rate == null ? null : Number(data.wage_rate), id]
  );
  return result.rows[0] || null;
}

async function listAttendance() {
  const result = await db().query(
    `SELECT a.id, a.worker_id, w.name AS worker_name, a.attendance_date AS date, a.status, a.hours
     FROM labour_attendance a JOIN labour_workers w ON w.id = a.worker_id
     ORDER BY a.attendance_date DESC, w.name`
  );
  return result.rows;
}

async function recordAttendance(data) {
  const result = await db().query(
    `INSERT INTO labour_attendance (worker_id, attendance_date, status, hours)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (worker_id, attendance_date)
     DO UPDATE SET status = EXCLUDED.status, hours = EXCLUDED.hours
     RETURNING *`,
    [data.worker_id, data.date, data.status, data.hours == null || data.hours === '' ? null : Number(data.hours)]
  );
  return result.rows[0];
}

async function listPayments() {
  const result = await db().query(
    `SELECT p.id, p.worker_id, w.name AS worker_name, p.payment_date AS date, p.amount, p.payment_type, p.notes
     FROM labour_payments p JOIN labour_workers w ON w.id = p.worker_id
     ORDER BY p.payment_date DESC, w.name`
  );
  return result.rows;
}

async function recordPayment(data) {
  const result = await db().query(
    `INSERT INTO labour_payments (worker_id, payment_date, amount, payment_type, notes)
     VALUES ($1, $2, $3, $4, $5) RETURNING *`,
    [data.worker_id, data.date, Number(data.amount), data.payment_type || 'wage', data.notes || null]
  );
  return result.rows[0];
}

module.exports = { listWorkers, createWorker, updateWorker, listAttendance, recordAttendance, listPayments, recordPayment };