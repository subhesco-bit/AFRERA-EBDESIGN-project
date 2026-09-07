/**
 * M119 — Employee Onboarding Checklist
 *
 * Strategy Card: see README.md.
 *
 * One row per employee's onboarding run: a list of required/optional tasks,
 * each with a due offset from the employee's start date. Real logic lives in
 * progress computation (percent complete, next-due item) and overdue
 * detection (dueDate = startDate + dueOffsetDays, past due and incomplete),
 * plus a status state machine (not_started -> in_progress -> completed)
 * driven by the checklist itself rather than set by hand.
 *
 * DATA SHAPE (core_m0nn_items.data JSONB, table fpo_m119_items):
 * {
 *   employeeId:   string
 *   employeeName: string
 *   department:   string
 *   role:         string
 *   startDate:    string (ISO date)
 *   status:       'not_started'|'in_progress'|'completed'
 *   checklistItems: [{
 *     id: string, task: string, category: string,      // 'paperwork'|'access'|'training'|'equipment'|'other'
 *     required: boolean, dueOffsetDays: number,          // relative to startDate
 *     completed: boolean, completedAt: string|null
 *   }]
 * }
 */

const { getPostgreSQL } = require('../../database/connection');

const tableName = 'fpo_m119_items';

function toRow(row) {
  if (!row) return null;
  const data = row.data || {};
  return { id: row.id, ...data, created_at: row.created_at, updated_at: row.updated_at };
}

function dayMs(n) { return n * 24 * 3600 * 1000; }

/**
 * Real algorithm: percent complete (required items only count toward the
 * denominator that gates "completed" — optional items affect the reported
 * percentage but never block status transition), overdue items (dueDate
 * passed, not completed), and the single next-due item to work on.
 */
function computeProgress(entry) {
  const items = entry.checklistItems || [];
  const startDate = entry.startDate ? new Date(entry.startDate) : null;
  const now = Date.now();

  const required = items.filter((i) => i.required !== false);
  const requiredDone = required.filter((i) => i.completed).length;
  const allDone = items.filter((i) => i.completed).length;

  const withDue = items.map((i) => {
    const dueDate = startDate && i.dueOffsetDays != null
      ? new Date(startDate.getTime() + dayMs(i.dueOffsetDays)) : null;
    const overdue = !!dueDate && !i.completed && dueDate.getTime() < now;
    return { ...i, dueDate: dueDate ? dueDate.toISOString() : null, overdue };
  });

  const overdueItems = withDue.filter((i) => i.overdue);
  const pending = withDue.filter((i) => !i.completed).sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  const percentComplete = items.length > 0 ? Number(((allDone / items.length) * 100).toFixed(1)) : 0;
  const requiredPercentComplete = required.length > 0 ? Number(((requiredDone / required.length) * 100).toFixed(1)) : 100;

  return {
    percentComplete,
    requiredPercentComplete,
    totalItems: items.length,
    completedItems: allDone,
    overdueCount: overdueItems.length,
    overdueItems,
    nextDue: pending[0] || null,
    computedStatus: requiredDone === 0 ? 'not_started' : requiredDone === required.length ? 'completed' : 'in_progress',
    itemsWithDueDates: withDue,
  };
}

async function listItems({ page = 1, limit = 20, status, department } = {}) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const offset = (page - 1) * limit;
  const where = [];
  const params = [];
  if (status) { params.push(status); where.push(`data->>'status' = $${params.length}`); }
  if (department) { params.push(department); where.push(`data->>'department' = $${params.length}`); }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const totalRes = await pg.query(`SELECT COUNT(*) FROM ${tableName} ${whereSql}`, params);
  const total = parseInt(totalRes.rows[0].count || '0');
  const res = await pg.query(
    `SELECT * FROM ${tableName} ${whereSql} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
    [...params, limit, offset]
  );
  const items = res.rows.map(toRow).map((item) => ({ ...item, progress: computeProgress(item) }));
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`SELECT * FROM ${tableName} WHERE id = $1`, [id]);
  const item = toRow(res.rows[0]);
  return item ? { ...item, progress: computeProgress(item) } : null;
}

async function createItem(payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const checklistItems = Array.isArray(payload.checklistItems) ? payload.checklistItems : defaultChecklist();
  const data = {
    employeeId: payload.employeeId || null,
    employeeName: payload.employeeName || null,
    department: payload.department || null,
    role: payload.role || null,
    startDate: payload.startDate || new Date().toISOString().slice(0, 10),
    status: 'not_started',
    checklistItems: checklistItems.map((i, idx) => ({
      id: i.id || `item-${idx + 1}`,
      task: i.task,
      category: i.category || 'other',
      required: i.required !== false,
      dueOffsetDays: i.dueOffsetDays ?? 7,
      completed: false,
      completedAt: null,
    })),
  };
  const res = await pg.query(`INSERT INTO ${tableName} (data, created_at) VALUES ($1, NOW()) RETURNING *`, [data]);
  return { ...toRow(res.rows[0]), progress: computeProgress(data) };
}

function defaultChecklist() {
  return [
    { task: 'Sign offer letter and employment agreement', category: 'paperwork', required: true, dueOffsetDays: 1 },
    { task: 'Submit ID and bank details', category: 'paperwork', required: true, dueOffsetDays: 3 },
    { task: 'Provision system access / email', category: 'access', required: true, dueOffsetDays: 1 },
    { task: 'Issue equipment (laptop/phone)', category: 'equipment', required: true, dueOffsetDays: 2 },
    { task: 'Complete platform orientation training', category: 'training', required: true, dueOffsetDays: 14 },
    { task: 'Meet assigned buddy/manager', category: 'other', required: false, dueOffsetDays: 5 },
  ];
}

/** Marks a checklist item complete/incomplete, then re-derives `status` from the state machine. */
async function setChecklistItem(id, itemId, completed) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const existing = await getItem(id);
  if (!existing) return null;
  const { id: _drop, created_at, updated_at, progress: _p, ...prev } = existing;
  const checklistItems = (prev.checklistItems || []).map((i) =>
    i.id === itemId ? { ...i, completed: !!completed, completedAt: completed ? new Date().toISOString() : null } : i
  );
  const merged = { ...prev, checklistItems };
  merged.status = computeProgress(merged).computedStatus;
  const res = await pg.query(`UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [merged, id]);
  return { ...toRow(res.rows[0]), progress: computeProgress(merged) };
}

async function updateItem(id, payload) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const existing = await getItem(id);
  if (!existing) return null;
  const { id: _drop, created_at, updated_at, progress: _p, ...prev } = existing;
  const merged = { ...prev, ...payload };
  if (merged.checklistItems) merged.status = computeProgress(merged).computedStatus;
  const res = await pg.query(`UPDATE ${tableName} SET data = $1, updated_at = NOW() WHERE id = $2 RETURNING *`, [merged, id]);
  return { ...toRow(res.rows[0]), progress: computeProgress(merged) };
}

async function deleteItem(id) {
  const pg = getPostgreSQL(); if (!pg) throw new Error('Database not initialized');
  const res = await pg.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING id`, [id]);
  return !!res.rows[0];
}

module.exports = { listItems, getItem, createItem, updateItem, deleteItem, setChecklistItem, computeProgress };
