/**
 * Test-mode fallback guard.
 *
 * Several services were written with a "defensive fallback": when an INSERT
 * returned no row, they fabricated an object with a synthetic id, stashed it
 * via `pool.setTestData(...)` and returned it as a success. That is correct
 * under the in-memory test pool, but `pool.setTestData` is a no-op outside test
 * mode — so in production those paths answered "201 Created" for data that was
 * never persisted. Silent data loss, reported to the client as success.
 *
 * `persistTestFallback` keeps the test behaviour and makes the production path
 * fail loudly instead. Callers put it exactly where the old `setTestData` call
 * was; the throw propagates to the enclosing catch, which surfaces a 500.
 */

const pool = require('../database/pool');

function isTestMode() {
  return process.env.NODE_ENV === 'test' || process.env.USE_TEST_DB === 'true';
}

/**
 * @param {string} table  Logical table the row belongs to.
 * @param {*} key         Key the in-memory test store indexes the row under.
 * @param {*} value       The fabricated row.
 * @param {boolean} [append=false] Whether the test store appends to a list.
 * @throws {Error} outside test mode — the write did not happen.
 */
function persistTestFallback(table, key, value, append = false) {
  if (!isTestMode()) {
    throw new Error(
      `Write to "${table}" returned no row; refusing to report success for ` +
      'data that was not persisted. Check the database connection and schema.'
    );
  }

  if (typeof pool.setTestData === 'function') {
    pool.setTestData(table, key, value, append);
  }
}

module.exports = { isTestMode, persistTestFallback };
