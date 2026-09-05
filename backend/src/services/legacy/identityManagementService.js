/**
 * Backend for 5 of the 6 remaining Identity-domain tabs on
 * frontend/src/pages/IdentityManagementPage.jsx: M015 Permission
 * Management, M016 Single Sign-On, M017 MFA Devices, M018 Digital
 * Identity, M019 Consent Management (registry numbers). M014 Role
 * Management already has a real backend (roleManagementService.js /
 * roleManagementRoutes.js) and is untouched. M011/M012/M013 have their own
 * real flows and are out of scope.
 *
 * M020 Session Management is NOT a generic CRUD table here - see
 * sessionManagementService below: it reads and terminates real sessions
 * from the `sessions` table M012 already writes to (backend/src/modules/
 * M012/service.js's createSession/validateSession), joined to users for a
 * human-readable identifier. Building a second, disconnected "sessions"
 * table for this tab would fork the truth about which sessions are live -
 * the same class of risk this session has avoided everywhere else.
 *
 * Field lists for the 5 CRUD resources are taken directly from each tab's
 * `fields`/`requiredFields` in IdentityManagementPage.jsx, not invented.
 */

'use strict';

const pool = require('../../../database/pool');
const { createCrudService } = require('./resourceCrudFactory');

const permissionManagement = createCrudService('identity_permissions', {
  fields: ['permission_name', 'resource', 'action', 'role_assigned'],
  requiredFields: ['permission_name', 'resource'],
});

const ssoManagement = createCrudService('sso_providers', {
  fields: ['provider_name', 'protocol', 'client_id', 'status', 'notes'],
  requiredFields: ['provider_name'],
});

const mfaManagement = createCrudService('mfa_devices', {
  fields: ['user_identifier', 'device_type', 'enrolled_date', 'status'],
  requiredFields: ['user_identifier'],
});

const digitalIdentity = createCrudService('digital_identities', {
  fields: ['identity_ref', 'identity_type', 'verification_status', 'issued_date'],
  requiredFields: ['identity_ref'],
});

const consentManagement = createCrudService('consent_records', {
  fields: ['subject_name', 'consent_type', 'granted_date', 'expiry_date', 'status'],
  requiredFields: ['subject_name'],
});

/**
 * Admin view over the real `sessions` table (M012). `status` is derived,
 * never stored: invalidated -> Terminated, past expiry -> Expired,
 * otherwise Active. There is no separately-tracked "last active" time in
 * the real schema - only when the session was created and when it expires
 * - so last_active is left null rather than invented from created_at.
 */
const sessionManagement = {
  async list({ page = 1, limit = 20, status } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(200, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const totalRes = await pool.query('SELECT COUNT(*) FROM sessions');
    const total = parseInt(totalRes.rows[0].count, 10);

    const res = await pool.query(
      `SELECT s.id, u.email AS user_identifier, s.user_agent AS device, s.ip_address,
              s.created_at AS login_time, s.expires_at, s.is_active, s.invalidated_at,
              CASE
                WHEN s.invalidated_at IS NOT NULL THEN 'Terminated'
                WHEN s.expires_at <= NOW() THEN 'Expired'
                WHEN s.is_active THEN 'Active'
                ELSE 'Terminated'
              END AS status
       FROM sessions s
       LEFT JOIN users u ON u.id = s.user_id
       ORDER BY s.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limitNum, offset]
    );
    let items = res.rows.map((r) => ({ ...r, last_active: null }));
    if (status) items = items.filter((r) => r.status === status);

    return { items, pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.max(1, Math.ceil(total / limitNum)) } };
  },

  async get(id) {
    let res = await pool.query(
      `SELECT s.id, u.email AS user_identifier, s.user_agent AS device, s.ip_address,
              s.created_at AS login_time, s.expires_at, s.is_active, s.invalidated_at
       FROM sessions s LEFT JOIN users u ON u.id = s.user_id
       WHERE s.id = $1`,
      [id]
    );
    return res.rows[0] ? { ...res.rows[0], last_active: null } : null;
  },

  /** Only a status change of 'Terminated' has real meaning here - it invalidates the session. */
  async update(id, payload = {}) {
    if (payload.status === 'Terminated') {
      let res = await pool.query(
        'UPDATE sessions SET is_active = false, invalidated_at = NOW() WHERE id = $1 RETURNING id',
        [id]
      );
      if (!res.rows[0]) return null;
    }
    return this.get(id);
  },

  async remove(id) {
    let res = await pool.query('DELETE FROM sessions WHERE id = $1 RETURNING id', [id]);
    return !!res.rows[0];
  },
};

module.exports = {
  permissionManagement, ssoManagement, mfaManagement, digitalIdentity,
  consentManagement, sessionManagement,
};

// Merged from backend/src/modules/M016
{
  const m016 = require("../../modules/M016/service");
  const { ...rest } = m016;
  Object.assign(module.exports, rest);
}

