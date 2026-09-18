'use strict';

// Two gaps in the in-memory test-mode SQL mock, both surfaced only after
// fixing the database/connection-vs-database/pool import bug in
// backend/src/modules/*/service.js let real module code actually reach
// these query shapes for the first time (2026-09-16):
//
// 1. `SELECT COUNT(*) as total FROM <table> WHERE ...` (used by every
//    M0XX module's getAll pagination) fell through to the generic
//    `SELECT *` handler and got back real data rows instead of an
//    aggregate row, so `result.rows[0].total` read undefined off a row
//    with no `total` column.
// 2. `<col> IS [NOT] NULL` clauses (used by every M0XX module's soft-delete
//    guard, `AND deleted_at IS NULL`) have no `=` sign, so the WHERE
//    clause parser silently dropped them - a soft-deleted row still
//    matched `getById`.

const pool = require('../pool.js');

describe('database/pool.js test-mode mock', () => {
  const table = `pool_test_scratch_${Date.now()}`;

  test('COUNT(*) reflects rows actually inserted, not an empty/raw-row fallback', async () => {
    await pool.query(
      `INSERT INTO ${table} (id, user_id, status) VALUES ($1, $2, $3) RETURNING *`,
      ['row-1', 'user-a', 'active'],
    );
    await pool.query(
      `INSERT INTO ${table} (id, user_id, status) VALUES ($1, $2, $3) RETURNING *`,
      ['row-2', 'user-a', 'active'],
    );
    await pool.query(
      `INSERT INTO ${table} (id, user_id, status) VALUES ($1, $2, $3) RETURNING *`,
      ['row-3', 'user-b', 'active'],
    );

    const all = await pool.query(`SELECT COUNT(*) as total FROM ${table}`, []);
    expect(all.rows).toHaveLength(1);
    expect(Number(all.rows[0].total)).toBe(3);

    const filtered = await pool.query(`SELECT COUNT(*) as total FROM ${table} WHERE user_id = $1`, ['user-a']);
    expect(Number(filtered.rows[0].total)).toBe(2);
  });

  test('IS NULL / IS NOT NULL clauses actually filter, not silently ignored', async () => {
    const t2 = `${table}_2`;
    await pool.query(
      `INSERT INTO ${t2} (id, deleted_at) VALUES ($1, $2) RETURNING *`,
      ['live-row', null],
    );
    await pool.query(
      `UPDATE ${t2} SET deleted_at = $1 WHERE id = $2 RETURNING *`,
      [new Date().toISOString(), 'live-row'],
    );
    await pool.query(
      `INSERT INTO ${t2} (id, deleted_at) VALUES ($1, $2) RETURNING *`,
      ['other-row', null],
    );

    const notDeleted = await pool.query(`SELECT * FROM ${t2} WHERE deleted_at IS NULL`, []);
    expect(notDeleted.rows.map((r) => r.id)).toEqual(['other-row']);

    const deletedOnly = await pool.query(`SELECT * FROM ${t2} WHERE deleted_at IS NOT NULL`, []);
    expect(deletedOnly.rows.map((r) => r.id)).toEqual(['live-row']);
  });
});
