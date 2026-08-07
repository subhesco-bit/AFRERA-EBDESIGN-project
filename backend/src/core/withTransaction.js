/**
 * Transaction helper for BR-08.
 *
 * WHY A HELPER AND NOT A BLANKET WRAPPER
 *
 * The obvious "fix" for 44 unbounded multi-statement writes is to wrap every
 * service call in BEGIN/COMMIT. That is worse than the problem: it holds row
 * locks across unrelated work, across external HTTP calls, and across whatever
 * else the function happens to do — turning a data-integrity bug into a
 * throughput bug that only appears under load, which is when it is hardest to
 * diagnose.
 *
 * So this helper does not decide the boundary. It makes the boundary CHEAP TO
 * WRITE once a human has decided where it goes, and it enforces the things that
 * are always true regardless of that decision:
 *
 *   * ROLLBACK on any throw, so a half-write can never commit
 *   * the client is always released, so a thrown error cannot leak a connection
 *     out of the pool — leak enough and the whole service stops responding
 *   * the rollback itself is guarded, because a rollback that throws would mask
 *     the original error and you would debug the wrong thing
 *
 * WHAT IT DELIBERATELY DOES NOT DO
 *
 * It does not retry. A serialization failure needs a caller who knows whether
 * re-running is safe; retrying a payment because the database was busy is how
 * one charge becomes two.
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

/**
 * Run `fn` inside a transaction.
 *
 * @param {Function} fn      receives the client; must use it for every write
 * @param {Object}   options
 * @param {string}   options.name       what this boundary is, for the error log
 * @param {string[]} options.lockTables tables to LOCK, in a fixed order
 * @param {string}   options.isolation  'read committed' (default) | 'repeatable read' | 'serializable'
 *
 * The caller MUST use the passed client. Using the pool inside `fn` issues
 * statements on a different connection, outside the transaction — they commit
 * independently and the rollback silently misses them. That is the most common
 * way a transaction is added and does nothing.
 */
async function withTransaction(fn, { name = 'unnamed', lockTables = [], isolation } = {}) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (isolation) {
      const level = String(isolation).toUpperCase();
      if (!['READ COMMITTED', 'REPEATABLE READ', 'SERIALIZABLE'].includes(level)) {
        throw new Error(`Unknown isolation level: ${isolation}`);
      }
      await client.query(`SET TRANSACTION ISOLATION LEVEL ${level}`);
    }

    // Locks are taken in the order given, and the order is the caller's
    // responsibility. Two transactions locking the same tables in opposite
    // orders deadlock; PostgreSQL detects it and kills one, which surfaces as
    // an intermittent failure nobody can reproduce.
    for (const table of lockTables) {
      if (!/^[a-z_][a-z0-9_]*$/i.test(table)) {
        throw new Error(`Unsafe table name in lockTables: ${table}`);
      }
      await client.query(`LOCK TABLE ${table} IN SHARE ROW EXCLUSIVE MODE`);
    }

    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      // Guarded on purpose: if ROLLBACK throws (connection already dead, for
      // instance) an unguarded call would replace the real error with a
      // confusing one and you would debug the rollback instead of the cause.
      logger.error('ROLLBACK failed — original error preserved below', {
        boundary: name, rollbackError: rollbackErr.message,
      });
    }
    logger.error('transaction rolled back', { boundary: name, error: err.message });
    throw err;
  } finally {
    // Always. A client that is not released never returns to the pool, and
    // roughly twenty of those will stop the service answering anything at all.
    client.release();
  }
}

module.exports = { withTransaction };
