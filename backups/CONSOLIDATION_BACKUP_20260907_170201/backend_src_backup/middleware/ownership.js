/**
 * Ownership authorization.
 *
 * `authMiddleware` answers "is this a logged-in account?" and `requireRole`
 * answers "is this the right kind of account?" — neither answers "is this
 * *their* record?". Several routes identified a row by an id in the path and
 * mutated it with no third check, so any logged-in account could edit or
 * delete another user's row by iterating ids (OWASP A01 / IDOR).
 *
 * Both guards below fail closed and answer 404 rather than 403 on a
 * non-owner, so an attacker cannot use the response to learn which ids exist.
 * Admins bypass both, matching the wildcard permission in
 * services/authService.js getUserPermissions().
 */

'use strict';

const pool = require('../database/pool');
const { logger } = require('../utils/logger');

const IDENTIFIER = /^[a-z_][a-z0-9_]*$/i;

/**
 * For routes whose path parameter *is* a user id (e.g. /profiles/:userId).
 * Non-admins may only address their own id.
 */
function requireSelfOrAdmin(paramName = 'userId') {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    if (req.user.role === 'admin') return next();

    const target = req.params[paramName];
    // Absent parameter means the route's "own record" variant — the
    // controllers fall back to req.user.id, which is already correct.
    if (target === undefined || target === null || target === '') return next();

    if (String(target) !== String(req.user.id)) {
      return res.status(403).json({
        error: 'You may only access your own record',
        code: 'NOT_RESOURCE_OWNER',
      });
    }
    return next();
  };
}

/**
 * For routes whose path parameter is a row id on a table that carries an
 * owner column. Looks the row up once and compares the owner to the caller.
 *
 * @param {object}   opts
 * @param {string}   opts.table        table holding the row
 * @param {string}   opts.idParam      req.params key holding the row id
 * @param {string}   opts.ownerColumn  column holding the owner id
 * @param {string}   [opts.idColumn]   primary-key column (default 'id')
 * @param {Function} [opts.ownerId]    async (req) => owner id to compare
 *                                     against; defaults to req.user.id
 */
function requireResourceOwner({ table, idParam, ownerColumn, idColumn = 'id', ownerId }) {
  // Table/column names are interpolated (they cannot be bound as parameters),
  // so they are validated here — they are developer-supplied constants, never
  // request data, and this keeps it that way.
  for (const [label, value] of [['table', table], ['ownerColumn', ownerColumn], ['idColumn', idColumn]]) {
    if (!IDENTIFIER.test(value)) throw new Error(`requireResourceOwner: unsafe ${label}: ${value}`);
  }

  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required', code: 'AUTH_REQUIRED' });
    }
    if (req.user.role === 'admin') return next();

    try {
      const rowId = req.params[idParam];
      if (rowId === undefined) {
        return res.status(400).json({ error: `Missing ${idParam}`, code: 'MISSING_PARAMETER' });
      }

      const result = await pool.query(
        `SELECT ${ownerColumn} AS owner_id FROM ${table} WHERE ${idColumn} = $1`,
        [rowId]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
      }

      const callerOwnerId = ownerId ? await ownerId(req) : req.user.id;
      if (callerOwnerId === null || callerOwnerId === undefined) {
        return res.status(403).json({ error: 'Not permitted', code: 'NOT_RESOURCE_OWNER' });
      }

      if (String(result.rows[0].owner_id) !== String(callerOwnerId)) {
        // 404 rather than 403: a 403 would confirm the id exists.
        return res.status(404).json({ error: 'Not found', code: 'NOT_FOUND' });
      }

      return next();
    } catch (error) {
      logger.error('Ownership check failed', { table, idParam, error: error.message });
      return res.status(500).json({ error: 'Authorization check failed' });
    }
  };
}

/** Resolves the farmers.id owned by the calling user, or null. */
async function farmerIdOf(req) {
  const result = await pool.query('SELECT id FROM farmers WHERE user_id = $1', [req.user.id]);
  return result.rows.length ? result.rows[0].id : null;
}

module.exports = { requireSelfOrAdmin, requireResourceOwner, farmerIdOf };
