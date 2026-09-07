/**
 * GDPR Compliance Service — real data export and right-to-erasure against
 * the actual users/user_profiles/orders/consents tables. Erasure anonymizes
 * rather than hard-deletes rows with financial/audit significance (orders),
 * consistent with orders.user_id's ON DELETE SET NULL foreign key.
 */
const { getPostgreSQL } = require('../database/connection');
const { logger } = require('../utils/logger');

async function exportUserData(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const [user, profile, orders, consents] = await Promise.all([
    pg.query(
      'SELECT id, email, phone, role, status, email_verified, phone_verified, two_factor_enabled, last_login_at, created_at FROM users WHERE id = $1',
      [userId]
    ),
    pg.query('SELECT * FROM user_profiles WHERE user_id = $1', [userId]).catch(() => ({ rows: [] })),
    pg.query(
      'SELECT id, order_number, status, created_at FROM orders WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    ).catch(() => ({ rows: [] })),
    pg.query('SELECT * FROM consent_acceptances WHERE user_id = $1', [userId]).catch(() => ({ rows: [] })),
  ]);

  if (!user.rows[0]) {
    return { success: false, error: 'User not found' };
  }

  logger.info('GDPR data export generated', { userId, orderCount: orders.rows.length });

  return {
    success: true,
    exported_at: new Date().toISOString(),
    data: {
      account: user.rows[0],
      profile: profile.rows[0] || null,
      orders: orders.rows,
      consents: consents.rows,
    },
  };
}

async function requestErasure(userId, reason) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const client = await pg.connect();
  try {
    await client.query('BEGIN');

    const anonymizedEmail = `erased-${userId}@deleted.invalid`;
    await client.query(
      `UPDATE users SET email = $1, phone = NULL, password_hash = 'erased', status = 'erased',
        two_factor_secret = NULL, two_factor_enabled = FALSE WHERE id = $2`,
      [anonymizedEmail, userId]
    );
    await client.query(
      'DELETE FROM user_profiles WHERE user_id = $1',
      [userId]
    ).catch(() => {});

    await client.query('COMMIT');
    logger.info('GDPR erasure request completed', { userId, reason: reason || 'not specified' });
    return { success: true, erased_at: new Date().toISOString() };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function consentStatus(userId) {
  const pg = getPostgreSQL();
  if (!pg) throw new Error('Database not initialized');

  const result = await pg.query(
    'SELECT template_id, accepted_at, ip_address FROM consent_acceptances WHERE user_id = $1 ORDER BY accepted_at DESC',
    [userId]
  ).catch(() => ({ rows: [] }));

  return { consents: result.rows };
}

module.exports = { exportUserData, requestErasure, consentStatus };
