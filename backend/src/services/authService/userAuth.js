/**
 * Core user account flows: register, login, refresh, logout. Split out of
 * the former monolithic services/authService.js (M11).
 */

const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
const { JWT_CONFIG } = require('./config');
const { hashPassword, comparePassword } = require('./passwordUtils');
const {
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  storeRefreshToken,
  revokeRefreshToken
} = require('./tokens');
const { readAuthStore, writeAuthStore, getFallbackUserByEmail } = require('./store');
const { getUserPermissions } = require('./permissions');

/**
 * Register new user
 */
async function registerUser(userData) {
  try {
    const pg = getPostgreSQL();

    if (!pg) {
      const store = readAuthStore();
      const normalizedEmail = (userData.email || '').toLowerCase();
      const existing = store.users.find((entry) => entry.email === normalizedEmail);
      if (existing) {
        // Idempotent in test/fallback mode: return tokens for existing user
        const accessToken = generateAccessToken(existing);
        const refreshToken = generateRefreshToken(existing);
        return {
          user: {
            id: existing.id,
            email: existing.email,
            phone: existing.phone,
            role: existing.role,
            status: existing.status,
            profile: {
              first_name: existing.first_name,
              last_name: existing.last_name,
              phone: existing.phone
            }
          },
          token: accessToken,
          accessToken,
          refreshToken,
          expiresIn: JWT_CONFIG.accessTokenExpiry
        };
      }

      const passwordHash = await hashPassword(userData.password);
      const user = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        phone: userData.phone || '',
        role: userData.role || 'consumer',
        status: userData.status || 'active',
        password_hash: passwordHash,
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        created_at: new Date().toISOString()
      };

      store.users.push(user);
      writeAuthStore(store);

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info(`User registered in fallback mode: ${user.email} (${user.role})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          profile: {
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone
          }
        },
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: JWT_CONFIG.accessTokenExpiry
      };
    }

    // Check if email already exists
    const existingUser = await pg.query(
      'SELECT id FROM users WHERE email = $1',
      [userData.email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Check if phone already exists
    if (userData.phone) {
      const existingPhone = await pg.query(
        'SELECT id FROM users WHERE phone = $1',
        [userData.phone]
      );

      if (existingPhone.rows.length > 0) {
        throw new Error('Phone number already registered');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(userData.password);

    // Insert user
    const userQuery = `
      INSERT INTO users (email, phone, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, email, phone, role, status, created_at
    `;

    const userResult = await pg.query(userQuery, [
      userData.email.toLowerCase(),
      userData.phone || null,
      passwordHash,
      userData.role || 'consumer',
      userData.status || 'active'
    ]);

    const user = userResult.rows[0];

    // Insert user profile
    const profileQuery = `
      INSERT INTO user_profiles (user_id, first_name, last_name, phone)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const profileResult = await pg.query(profileQuery, [
      user.id,
      userData.first_name || '',
      userData.last_name || '',
      userData.phone || ''
    ]);

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`User registered: ${user.email} (${user.role})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        profile: profileResult.rows[0]
      },
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry
    };
  } catch (error) {
    logger.error('User registration failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Login user
 */
async function loginUser(email, password, deviceInfo = {}) {
  try {
    const pg = getPostgreSQL();

    if (!pg) {
      const user = getFallbackUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const passwordValid = await comparePassword(password, user.password_hash);
      if (!passwordValid) {
        throw new Error('Invalid credentials');
      }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      logger.info(`User logged in in fallback mode: ${user.email} (${user.role})`);

      return {
        user: {
          id: user.id,
          email: user.email,
          phone: user.phone,
          role: user.role,
          status: user.status,
          firstName: user.first_name,
          lastName: user.last_name,
          profileImage: user.profile_image_url,
          permissions: getUserPermissions(user.role)
        },
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: JWT_CONFIG.accessTokenExpiry
      };
    }

    // Get user by email
    const userQuery = `
      SELECT u.*, up.first_name, up.last_name, up.profile_image_url
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.email = $1
    `;

    const userResult = await pg.query(userQuery, [email.toLowerCase()]);

    if (userResult.rows.length === 0) {
      throw new Error('Invalid credentials');
    }

    const user = userResult.rows[0];

    // Check if account is locked
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      throw new Error('Account temporarily locked due to multiple failed attempts');
    }

    // Check if account is active
    if (user.status !== 'active') {
      throw new Error('Account is not active');
    }

    // Verify password
    const passwordValid = await comparePassword(password, user.password_hash);

    if (!passwordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;

      if (failedAttempts >= 5) {
        // Lock account for 30 minutes
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await pg.query(
          'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
          [failedAttempts, lockedUntil, user.id]
        );
        throw new Error('Account locked due to multiple failed attempts');
      } else {
        await pg.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [failedAttempts, user.id]
        );
      }

      throw new Error('Invalid credentials');
    }

    // Reset failed login attempts
    await pg.query(
      'UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database (optional, for revocation)
    await storeRefreshToken(user.id, refreshToken, deviceInfo);

    logger.info(`User logged in: ${user.email} (${user.role})`);

    return {
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        firstName: user.first_name,
        lastName: user.last_name,
        profileImage: user.profile_image_url,
        permissions: getUserPermissions(user.role)
      },
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry
    };
  } catch (error) {
    logger.error('User login failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Refresh access token
 */
async function refreshAccessToken(refreshToken) {
  try {
    // Verify refresh token
    const payload = verifyToken(refreshToken);

    if (payload.tokenType !== 'refresh') {
      throw new Error('Invalid refresh token');
    }

    const pg = getPostgreSQL();
    if (!pg) {
      const user = getFallbackUserByEmail(payload.email || '');
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_CONFIG.accessTokenExpiry
      };
    }

    // Check if refresh token exists and is valid
    const tokenQuery = `
      SELECT * FROM refresh_tokens
      WHERE user_id = $1 AND token = $2 AND revoked = FALSE
      ORDER BY created_at DESC
      LIMIT 1
    `;

    const tokenResult = await pg.query(tokenQuery, [payload.userId, refreshToken]);

    if (tokenResult.rows.length === 0) {
      throw new Error('Invalid or expired refresh token');
    }

    // Get user
    const userQuery = `
      SELECT u.*, up.first_name, up.last_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;

    const userResult = await pg.query(userQuery, [payload.userId]);
    const user = userResult.rows[0];

    if (!user || user.status !== 'active') {
      throw new Error('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Revoke old refresh token
    await revokeRefreshToken(refreshToken);

    // Store new refresh token
    await storeRefreshToken(user.id, newRefreshToken);

    logger.info(`Token refreshed for user: ${user.email}`);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry
    };
  } catch (error) {
    logger.error('Token refresh failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Logout user
 */
async function logoutUser(userId, refreshToken) {
  try {
    const pg = getPostgreSQL();
    if (!pg) {
      logger.info(`User logged out in fallback mode: ${userId}`);
      return { success: true, message: 'Logged out successfully' };
    }

    // Revoke refresh token
    if (refreshToken) {
      await revokeRefreshToken(refreshToken);
    }

    // Revoke all refresh tokens for user (optional, for complete logout)
    await pg.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE user_id = $1',
      [userId]
    );

    logger.info(`User logged out: ${userId}`);

    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    logger.error('User logout failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

module.exports = { registerUser, loginUser, refreshAccessToken, logoutUser };
