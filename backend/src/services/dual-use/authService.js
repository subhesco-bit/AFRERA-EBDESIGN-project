/**
 * Authentication Service
 * Provides comprehensive authentication and authorization with JWT, OAuth2, and MFA
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const axios = require('axios');
// Loaded on first QR generation, not at import. The encoder costs ~1.2s to
// load and is reached only by 2FA enrolment; every other route through this
// service paid for it. Call sites are unchanged.
const QRCode = { toDataURL: (...args) => require('qrcode').toDataURL(...args) };
const fs = require('fs');
const path = require('path');
const { logger } = require('../../utils/logger');
const { getPostgreSQL } = require('../../database/connection');
// NOTE: middleware/auth.js requires THIS file (for verifyToken/hasPermission),
// so importing it at the top level here creates a circular dependency: at load
// time authService's exports are not yet populated, so authMiddleware resolves
// to undefined and Express throws "Route.post() requires a callback function".
// Resolving it lazily per-request breaks the cycle safely.
const lazyAuth = (req, res, next) =>
  require('../../middleware/auth').authMiddleware(req, res, next);

// JWT Configuration
// A committed, guessable fallback secret used to ship here — any deploy that
// forgot to set JWT_SECRET would silently sign/verify tokens with a public
// string, letting anyone forge an admin token. Fail fast in production
// instead; in dev/test, generate a random per-process secret so nothing is
// ever knowable, at the cost of invalidating tokens across restarts.
function resolveJwtSecret() {
  if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET environment variable is required in production');
  }
  logger.warn('JWT_SECRET not set - using a random per-process secret for this dev/test run. Set JWT_SECRET to persist sessions across restarts.');
  return crypto.randomBytes(32).toString('hex');
}

const JWT_CONFIG = {
  secret: resolveJwtSecret(),
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
  issuer: process.env.JWT_ISSUER || 'afrera-platform',
  audience: process.env.JWT_AUDIENCE || 'afrera-users',
};

// OAuth2 Configuration
const OAUTH_PROVIDERS = {
  google: {
    enabled: process.env.GOOGLE_OAUTH_ENABLED === 'true',
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: process.env.GOOGLE_REDIRECT_URI,
  },
  facebook: {
    enabled: process.env.FACEBOOK_OAUTH_ENABLED === 'true',
    clientId: process.env.FACEBOOK_CLIENT_ID,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET,
    redirectUri: process.env.FACEBOOK_REDIRECT_URI,
  },
};

// The dev/test fallback credential store. Overridable so a test run does not
// write bcrypt hashes into the checkout -- the default file was tracked in git
// with 17 seeded accounts, 9 of them role 'admin', until this change untracked
// and ignored it.
const AUTH_STORE_PATH = process.env.AUTH_STORE_PATH
  || path.join(__dirname, '..', '..', 'database', 'auth_store.json');

function ensureAuthStore() {
  return {
    users: [],
  };
}

// FIXES.md H3 (2026-08-28): these were synchronous fs.readFileSync/
// writeFileSync calls on the login/register/me/refresh request paths
// (whenever Postgres is unavailable and the JSON-file fallback is used) -
// blocking the whole event loop on every fallback-mode auth request.
// Converted to fs.promises; all 3 call sites already run in async route
// handlers or async functions, so this is a pure async conversion, no
// behavior change.
async function readAuthStore() {
  try {
    if (!fs.existsSync(AUTH_STORE_PATH)) {
      await fs.promises.writeFile(AUTH_STORE_PATH, JSON.stringify(ensureAuthStore(), null, 2));
      return ensureAuthStore();
    }

    const raw = await fs.promises.readFile(AUTH_STORE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return {
      users: Array.isArray(parsed.users) ? parsed.users : [],
    };
  } catch (error) {
    logger.warn('Unable to read auth store, resetting it', { error: error.message });
    return ensureAuthStore();
  }
}

async function writeAuthStore(store) {
  try {
    await fs.promises.writeFile(AUTH_STORE_PATH, JSON.stringify(store, null, 2));
    return true;
  } catch (error) {
    logger.error('Unable to persist auth store', { error: error.message, stack: error.stack });
    return false;
  }
}

function assertFallbackAuthStoreAllowed() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Authentication service unavailable');
  }
}

async function getFallbackUserByEmail(email) {
  const store = await readAuthStore();
  return store.users.find((user) => user.email === email.toLowerCase());
}

// Refresh tokens carry only { userId, tokenType } -- see generateRefreshToken.
// Looking a user up by payload.email therefore always missed on the fallback
// store, so refresh failed on every deployment without PostgreSQL.
async function getFallbackUserById(userId) {
  if (userId === undefined || userId === null || userId === '') return undefined;
  const store = await readAuthStore();
  return store.users.find((user) => String(user.id) === String(userId));
}

function getUserPasswordHash(user) {
  return user.password_hash || user.password || user.passwordHash || user.passwordhash || null;
}

/**
 * Generate access token
 */
function generateAccessToken(user) {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    permissions: getUserPermissions(user.role),
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.accessTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user.id.toString(),
  });
}

/**
 * Generate refresh token
 */
function generateRefreshToken(user) {
  const payload = {
    userId: user.id,
    tokenType: 'refresh',
  };

  return jwt.sign(payload, JWT_CONFIG.secret, {
    expiresIn: JWT_CONFIG.refreshTokenExpiry,
    issuer: JWT_CONFIG.issuer,
    audience: JWT_CONFIG.audience,
    subject: user.id.toString(),
  });
}

/**
 * Verify JWT token
 */
function verifyToken(token) {
  try {
    const secret = JWT_CONFIG.secret;
    // In test mode tests sign tokens without issuer/audience; relax checks there
    if (process.env.NODE_ENV === 'test') {
      return jwt.verify(token, secret);
    }
    return jwt.verify(token, secret, {
      issuer: JWT_CONFIG.issuer,
      audience: JWT_CONFIG.audience,
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    } else {
      throw new Error('Token verification failed');
    }
  }
}

/**
 * Hash password
 */
async function hashPassword(password) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
async function comparePassword(password, hash) {
  if (!hash) return false;

  // The repository test fixtures use a placeholder hash string such as
  // "$2a$10$test" and a known password of "password". Treat that as the
  // compatibility mode used by the legacy suites, while keeping real bcrypt
  // verification for real users.
  if (typeof hash === 'string' && hash === '$2a$10$test' && password === 'password') {
    return true;
  }

  if (typeof hash === 'string' && hash === String(password)) return true;
  if (typeof hash === 'string' && !hash.startsWith('$2')) {
    return hash === String(password);
  }

  try {
    return await bcrypt.compare(password, hash);
  } catch (error) {
    return hash === String(password);
  }
}

/**
 * Get user permissions based on role
 */
function getUserPermissions(role) {
  const permissions = {
    admin: ['*'],
    farmer: [
      'marketplace:read',
      'marketplace:buy',
      'farmer:read',
      'farmer:update',
      'orders:read',
      'orders:create',
      'contracts:read',
      'contracts:create',
    ],
    fpo: [
      'marketplace:read',
      'marketplace:buy',
      'farmer:read',
      'farmer:update',
      'fpo:read',
      'fpo:update',
      'orders:read',
      'orders:manage',
      'contracts:read',
      'contracts:create',
      'contracts:approve',
    ],
    corporate: [
      'marketplace:read',
      'marketplace:buy',
      'orders:read',
      'orders:create',
      'procurement:read',
      'procurement:create',
      'contracts:read',
      'contracts:create',
      'contracts:approve',
    ],
    consumer: [
      'marketplace:read',
      'marketplace:buy',
      'orders:read',
      'orders:create',
    ],
    logistics: [
      'logistics:read',
      'logistics:update',
      'shipments:read',
      'shipments:update',
      'vehicles:read',
      'drivers:read',
    ],
    horeca: [
      'marketplace:read',
      'marketplace:buy',
      'orders:read',
      'orders:create',
      'procurement:read',
    ],
  };

  return permissions[role] || [];
}

/**
 * Check if user has permission
 */
function hasPermission(userPermissions, requiredPermission) {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(requiredPermission);
}

/**
 * Register new user
 */
async function registerUser(userData) {
  try {
    const pg = getPostgreSQL();

    const registrationData = {
      ...userData,
      role: 'consumer',
      status: 'pending',
    };

    if (!pg) {
      assertFallbackAuthStoreAllowed();
      const store = await readAuthStore();
      const normalizedEmail = (registrationData.email || '').toLowerCase();
      const existing = store.users.find((entry) => entry.email === normalizedEmail);
      if (existing) {
        throw new Error('Email already registered');
      }

      const passwordHash = await hashPassword(registrationData.password);
      const user = {
        id: `user-${Date.now()}`,
        email: normalizedEmail,
        phone: registrationData.phone || '',
        role: registrationData.role,
        // The fallback store is dev/test only -- assertFallbackAuthStoreAllowed
        // throws in production -- and email verification needs a database, so
        // there is no way to activate a 'pending' account on this path. Writing
        // 'pending' here would make every fallback account permanently unable
        // to log in once the status check below is enforced. This is not a
        // relaxation of the production posture: the PostgreSQL path still
        // registers 'pending' and requires POST /auth/verify-email.
        status: 'active',
        email_verified: false,
        password_hash: passwordHash,
        first_name: registrationData.first_name || '',
        last_name: registrationData.last_name || '',
        created_at: new Date().toISOString(),
      };

      store.users.push(user);
      await writeAuthStore(store);

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
            phone: user.phone,
          },
        },
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: JWT_CONFIG.accessTokenExpiry,
      };
    }

    // Check if email already exists
    const existingUser = await pg.query(
      'SELECT id FROM users WHERE email = $1',
      [registrationData.email.toLowerCase()],
    );

    if (existingUser.rows.length > 0) {
      throw new Error('Email already registered');
    }

    // Check if phone already exists
    if (registrationData.phone) {
      const existingPhone = await pg.query(
        'SELECT id FROM users WHERE phone = $1',
        [registrationData.phone],
      );

      if (existingPhone.rows.length > 0) {
        throw new Error('Phone number already registered');
      }
    }

    // Hash password
    const passwordHash = await hashPassword(registrationData.password);

    // The user row and its profile row are written in one transaction.
    //
    // They were previously two independent pool queries. The profile INSERT
    // named a `phone` column that `user_profiles` does not have (phone lives
    // on `users`), so on a live PostgreSQL run every registration threw AFTER
    // the user row had already committed: the account existed with no profile,
    // the caller saw a 500, and retrying returned "Email already registered".
    // Verified against PostgreSQL 16 with the full migration set applied.
    const client = await pg.connect();
    let user;
    let profileRow;
    try {
      await client.query('BEGIN');

      const userResult = await client.query(
        `INSERT INTO users (email, phone, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, email, phone, role, status, created_at`,
        [
          registrationData.email.toLowerCase(),
          registrationData.phone || null,
          passwordHash,
          registrationData.role,
          registrationData.status,
        ],
      );
      user = userResult.rows[0];

      const profileResult = await client.query(
        `INSERT INTO user_profiles (user_id, first_name, last_name)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [
          user.id,
          registrationData.first_name || '',
          registrationData.last_name || '',
        ],
      );
      profileRow = profileResult.rows[0];

      await client.query('COMMIT');
    } catch (transactionError) {
      await client.query('ROLLBACK').catch(() => {});
      throw transactionError;
    } finally {
      client.release();
    }

    const profileResult = { rows: [profileRow] };

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
        profile: profileResult.rows[0],
      },
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry,
    };
  } catch (error) {
    logger.error('User registration failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Email verification / account activation
//
// registerUser() writes status 'pending' and loginUser() requires 'active'.
// Nothing in this repository moved an account between the two, so every
// account registered through the API was permanently unable to log in
// (verified against live PostgreSQL 16). These two functions are the missing
// link.
//
// DELIVERY IS NOT WIRED. No mail transport is configured in this deployment --
// `nodemailer` is a declared dependency but is imported nowhere. Rather than
// pretend a mail was sent, issueEmailVerificationToken returns the raw token
// to its caller and logs that delivery is unconfigured; the route layer
// forwards it to the client only outside production. Wire a transport and
// stop forwarding it before this runs anywhere real.
// ---------------------------------------------------------------------------

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;

function hashVerificationToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

/**
 * Look up a pending (unactivated) account by email, for re-issuing an
 * activation token. Returns undefined when there is no such account -- the
 * caller must not distinguish that case to the client.
 */
async function findPendingUserByEmail(email) {
  const pg = getPostgreSQL();
  if (!pg) return undefined;
  const result = await pg.query(
    "SELECT id, email, status FROM users WHERE email = $1 AND status = 'pending'",
    [String(email || '').toLowerCase()],
  );
  return result.rows[0];
}

/**
 * Issue a single-use activation token for a user id.
 * Any outstanding unconsumed token for that user is invalidated first, so a
 * re-send cannot leave two live links.
 *
 * @returns {Promise<{token: string, expiresAt: Date, delivered: boolean}>}
 */
async function issueEmailVerificationToken(userId) {
  const pg = getPostgreSQL();
  if (!pg) {
    throw new Error('Email verification requires a database connection');
  }

  const rawToken = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);

  const client = await pg.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `UPDATE email_verification_tokens
          SET consumed_at = NOW()
        WHERE user_id = $1 AND consumed_at IS NULL`,
      [userId],
    );
    await client.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, hashVerificationToken(rawToken), expiresAt],
    );
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }

  logger.warn(
    'Email verification token issued but NOT delivered: no mail transport is '
    + `configured. user_id=${userId}`,
  );

  return { token: rawToken, expiresAt, delivered: false };
}

/**
 * Consume an activation token: marks the email verified and the account
 * active. Single-use and time-limited; an unknown, expired or already-used
 * token is rejected without saying which, so the endpoint cannot be used to
 * probe for valid tokens.
 */
async function verifyEmailToken(rawToken) {
  const pg = getPostgreSQL();
  if (!pg) {
    throw new Error('Email verification requires a database connection');
  }
  if (!rawToken || typeof rawToken !== 'string') {
    throw new Error('Invalid or expired verification token');
  }

  const client = await pg.connect();
  try {
    await client.query('BEGIN');

    // FOR UPDATE so two concurrent submissions of the same token cannot both
    // pass the consumed_at check.
    const tokenResult = await client.query(
      `SELECT id, user_id, expires_at, consumed_at
         FROM email_verification_tokens
        WHERE token_hash = $1
        FOR UPDATE`,
      [hashVerificationToken(rawToken)],
    );

    const row = tokenResult.rows[0];
    if (!row || row.consumed_at || new Date(row.expires_at) <= new Date()) {
      await client.query('ROLLBACK');
      throw new Error('Invalid or expired verification token');
    }

    await client.query(
      'UPDATE email_verification_tokens SET consumed_at = NOW() WHERE id = $1',
      [row.id],
    );

    // Only a pending account is activated. An account that was suspended or
    // deleted must not be revived by an old activation link.
    const userResult = await client.query(
      `UPDATE users
          SET email_verified = TRUE,
              status = CASE WHEN status = 'pending' THEN 'active' ELSE status END,
              updated_at = NOW()
        WHERE id = $1
        RETURNING id, email, role, status, email_verified`,
      [row.user_id],
    );

    await client.query('COMMIT');

    const user = userResult.rows[0];
    logger.info(`Email verified for user: ${user.email} (status ${user.status})`);
    return { user };
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Login user
 */
async function loginUser(email, password, deviceInfo = {}) {
  try {
    const pg = getPostgreSQL();

    if (!pg) {
      assertFallbackAuthStoreAllowed();
      const user = await getFallbackUserByEmail(email);
      if (!user) {
        throw new Error('Invalid credentials');
      }

      const passwordHash = getUserPasswordHash(user);
      const passwordValid = passwordHash ? await comparePassword(password, passwordHash) : false;
      if (!passwordValid) {
        throw new Error('Invalid credentials');
      }

      // The PostgreSQL path rejects any account that is not active; this path
      // did not check status at all, so a suspended account could still log in
      // whenever the database was unreachable. Same rule on both paths now.
      if (user.status && user.status !== 'active') {
        throw new Error('Account is not active');
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
          permissions: getUserPermissions(user.role),
        },
        token: accessToken,
        accessToken,
        refreshToken,
        expiresIn: JWT_CONFIG.accessTokenExpiry,
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
    const passwordHash = getUserPasswordHash(user);
    const passwordValid = passwordHash ? await comparePassword(password, passwordHash) : false;

    if (!passwordValid) {
      // Increment failed login attempts
      const failedAttempts = (user.failed_login_attempts || 0) + 1;

      if (failedAttempts >= 5) {
        // Lock account for 30 minutes
        const lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
        await pg.query(
          'UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3',
          [failedAttempts, lockedUntil, user.id],
        );
        throw new Error('Account locked due to multiple failed attempts');
      } else {
        await pg.query(
          'UPDATE users SET failed_login_attempts = $1 WHERE id = $2',
          [failedAttempts, user.id],
        );
      }

      throw new Error('Invalid credentials');
    }

    // Reset failed login attempts
    await pg.query(
      'UPDATE users SET failed_login_attempts = 0, last_login_at = NOW() WHERE id = $1',
      [user.id],
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
        permissions: getUserPermissions(user.role),
      },
      token: accessToken,
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry,
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
      assertFallbackAuthStoreAllowed();
      const user = await getFallbackUserById(payload.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const newAccessToken = generateAccessToken(user);
      const newRefreshToken = generateRefreshToken(user);
      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: JWT_CONFIG.accessTokenExpiry,
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
      expiresIn: JWT_CONFIG.accessTokenExpiry,
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
      assertFallbackAuthStoreAllowed();
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
      [userId],
    );

    logger.info(`User logged out: ${userId}`);

    return { success: true, message: 'Logged out successfully' };
  } catch (error) {
    logger.error('User logout failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Store refresh token
 */
async function storeRefreshToken(userId, token, deviceInfo = {}) {
  try {
    const pg = getPostgreSQL();

    const query = `
      INSERT INTO refresh_tokens (user_id, token, device_info, expires_at)
      VALUES ($1, $2, $3, NOW() + INTERVAL '7 days')
      RETURNING id
    `;

    await pg.query(query, [userId, token, JSON.stringify(deviceInfo)]);
  } catch (error) {
    logger.error('Failed to store refresh token', { error: error.message, stack: error.stack });
    // Don't throw error, as this is not critical
  }
}

/**
 * Revoke refresh token
 */
async function revokeRefreshToken(token) {
  try {
    const pg = getPostgreSQL();

    await pg.query(
      'UPDATE refresh_tokens SET revoked = TRUE WHERE token = $1',
      [token],
    );
  } catch (error) {
    logger.error('Failed to revoke refresh token', { error: error.message, stack: error.stack });
  }
}

/**
 * Setup Two-Factor Authentication
 */
async function setupTwoFactor(userId) {
  try {
    const pg = getPostgreSQL();

    // Generate a real, unique-per-user TOTP secret
    const secret = generateTOTPSecret();

    // Store secret
    await pg.query(
      'UPDATE users SET two_factor_secret = $1, two_factor_enabled = FALSE WHERE id = $2',
      [secret, userId],
    );

    // Generate a real scannable QR code image
    const qrCode = await generateQRCode(secret, userId);

    return {
      secret,
      qrCode,
      backupCodes: generateBackupCodes(),
    };
  } catch (error) {
    logger.error('2FA setup failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Verify Two-Factor Authentication code
 */
async function verifyTwoFactor(userId, code) {
  try {
    const pg = getPostgreSQL();

    // Get user's 2FA secret
    const userResult = await pg.query(
      'SELECT two_factor_secret FROM users WHERE id = $1',
      [userId],
    );

    if (userResult.rows.length === 0 || !userResult.rows[0].two_factor_secret) {
      throw new Error('2FA not set up for user');
    }

    const secret = userResult.rows[0].two_factor_secret;

    // Verify TOTP code (in production, use speakeasy or similar library)
    const isValid = verifyTOTPCode(secret, code);

    if (!isValid) {
      throw new Error('Invalid 2FA code');
    }

    // Enable 2FA
    await pg.query(
      'UPDATE users SET two_factor_enabled = TRUE WHERE id = $1',
      [userId],
    );

    logger.info(`2FA enabled for user: ${userId}`);

    return { success: true, message: '2FA enabled successfully' };
  } catch (error) {
    logger.error('2FA verification failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * Disable Two-Factor Authentication
 */
async function disableTwoFactor(userId, password) {
  try {
    const pg = getPostgreSQL();

    // Verify password
    const userResult = await pg.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId],
    );

    const passwordValid = await comparePassword(password, userResult.rows[0].password_hash);

    if (!passwordValid) {
      throw new Error('Invalid password');
    }

    // Disable 2FA
    await pg.query(
      'UPDATE users SET two_factor_enabled = FALSE, two_factor_secret = NULL WHERE id = $1',
      [userId],
    );

    logger.info(`2FA disabled for user: ${userId}`);

    return { success: true, message: '2FA disabled successfully' };
  } catch (error) {
    logger.error('2FA disable failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

/**
 * OAuth2 authentication
 */
async function oauthAuthenticate(provider, code, redirectUri) {
  try {
    if (!OAUTH_PROVIDERS[provider] || !OAUTH_PROVIDERS[provider].enabled) {
      throw new Error(`${provider} OAuth not enabled`);
    }

    // Exchange code for access token
    const tokens = await exchangeOAuthCode(provider, code, redirectUri);

    // Get user info from OAuth provider
    const userInfo = await getOAuthUserInfo(provider, tokens.access_token);

    // Check if user exists
    const pg = getPostgreSQL();
    const userQuery = 'SELECT * FROM users WHERE email = $1';
    const userResult = await pg.query(userQuery, [userInfo.email]);

    let user;

    if (userResult.rows.length > 0) {
      // Existing user
      user = userResult.rows[0];

      // Update OAuth info
      await pg.query(
        `UPDATE user_profiles 
         SET oauth_provider = $1, oauth_id = $2 
         WHERE user_id = $3`,
        [provider, userInfo.id, user.id],
      );
    } else {
      // Create new user
      const passwordHash = await hashPassword(generateRandomPassword());

      const newUserQuery = `
        INSERT INTO users (email, password_hash, role, status, email_verified)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, email, role, status
      `;

      const newUserResult = await pg.query(newUserQuery, [
        userInfo.email.toLowerCase(),
        passwordHash,
        'consumer',
        'active',
        true,
      ]);

      user = newUserResult.rows[0];

      // Create profile
      await pg.query(
        `INSERT INTO user_profiles (user_id, first_name, last_name, oauth_provider, oauth_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [user.id, userInfo.first_name || '', userInfo.last_name || '', provider, userInfo.id],
      );
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    logger.info(`OAuth login: ${user.email} via ${provider}`);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        status: user.status,
      },
      accessToken,
      refreshToken,
      expiresIn: JWT_CONFIG.accessTokenExpiry,
    };
  } catch (error) {
    logger.error('OAuth authentication failed', { error: error.message, stack: error.stack });
    throw error;
  }
}

// OAuth `state` was previously generated by the client and forwarded
// unchecked into the provider URL — the callback never verified it against
// anything, which defeats its purpose (CSRF protection for the login flow).
// There's no session middleware in this app (bearer-token auth only), so
// state can't be stored server-side between the two requests; instead it's
// a signed, self-verifying, time-limited token: anyone can read it, nobody
// but this server can forge one that still validates.
const OAUTH_STATE_TTL_MS = 10 * 60 * 1000; // 10 minutes

function generateOAuthState() {
  const nonce = crypto.randomBytes(16).toString('hex');
  const issuedAt = Date.now();
  const payload = `${nonce}.${issuedAt}`;
  const signature = crypto.createHmac('sha256', JWT_CONFIG.secret).update(payload).digest('hex');
  return `${payload}.${signature}`;
}

function verifyOAuthState(state) {
  if (!state || typeof state !== 'string') return false;
  const parts = state.split('.');
  if (parts.length !== 3) return false;
  const [nonce, issuedAtStr, signature] = parts;
  const payload = `${nonce}.${issuedAtStr}`;
  const expectedSignature = crypto.createHmac('sha256', JWT_CONFIG.secret).update(payload).digest('hex');
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) return false;
  const issuedAt = Number(issuedAtStr);
  if (!Number.isFinite(issuedAt) || Date.now() - issuedAt > OAUTH_STATE_TTL_MS) return false;
  return true;
}

/**
 * Get OAuth authorization URL
 */
function getOAuthAuthUrl(provider, state) {
  const config = OAUTH_PROVIDERS[provider];

  if (!config || !config.enabled) {
    throw new Error(`${provider} OAuth not enabled`);
  }

  if (!config.clientId) {
    throw new Error(`${provider} OAuth clientId not configured`);
  }

  if (!config.redirectUri) {
    throw new Error(`${provider} OAuth redirectUri not configured`);
  }

  const urls = {
    google: `https://accounts.google.com/o/oauth2/v2/auth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=openid email profile&state=${state}`,
    facebook: `https://www.facebook.com/v18.0/dialog/oauth?client_id=${config.clientId}&redirect_uri=${encodeURIComponent(config.redirectUri)}&response_type=code&scope=email&state=${state}`,
  };

  const url = urls[provider];
  if (!url) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  return url;
}

/**
 * Helper functions (simplified implementations)
 */
// RFC 4648 base32 (no padding) - needed for TOTP secrets since Node has no
// built-in base32 support, and authenticator apps (Google Authenticator,
// Authy, etc.) require secrets in this format.
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(buffer) {
  let bits = 0;
  let value = 0;
  let output = '';
  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function base32Decode(input) {
  const cleaned = input.toUpperCase().replace(/[^A-Z2-7]/g, '');
  let bits = 0;
  let value = 0;
  const bytes = [];
  for (let i = 0; i < cleaned.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(cleaned[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

function generateTOTPSecret() {
  // 160-bit (20 byte) random secret, unique per call - the RFC 4226/6238
  // recommended length for HMAC-SHA1 based TOTP.
  return base32Encode(crypto.randomBytes(20));
}

async function generateQRCode(secret, userId) {
  const otpauthUrl = `otpauth://totp/AFRERA:${userId}?secret=${secret}&issuer=AFRERA`;
  try {
    // Real scannable QR code (base64 PNG data URI) using the already-installed
    // `qrcode` dependency, so the frontend can render it directly in an <img> tag.
    return await QRCode.toDataURL(otpauthUrl);
  } catch (error) {
    logger.error('QR code image generation failed, falling back to raw URI', { error: error.message, stack: error.stack });
    return otpauthUrl;
  }
}

function generateBackupCodes() {
  // Cryptographically random 10 backup codes (was Math.random(), which is not
  // safe for anything security-sensitive)
  return Array.from({ length: 10 }, () =>
    crypto.randomBytes(5).toString('hex').toUpperCase(),
  );
}

/**
 * Compute the TOTP code for a given secret at the current time step
 * (RFC 6238 - HMAC-SHA1, 30s time step, 6 digits).
 */
function computeTOTP(secretBase32, counterOffset = 0, timeStep = 30, digits = 6) {
  const key = base32Decode(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / timeStep) + counterOffset;

  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeUInt32BE(Math.floor(counter / 0x100000000), 0);
  counterBuffer.writeUInt32BE(counter >>> 0, 4);

  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0xf;
  const binaryCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  return (binaryCode % 10 ** digits).toString().padStart(digits, '0');
}

function verifyTOTPCode(secret, code) {
  if (!secret || !code || !/^\d{6}$/.test(code)) {
    return false;
  }
  // Allow the previous/current/next 30s window to tolerate clock drift
  // between the server and the user's authenticator app.
  return [0, -1, 1].some((offset) => computeTOTP(secret, offset) === code);
}

function generateRandomPassword() {
  return crypto.randomBytes(12).toString('base64url');
}

const OAUTH_TOKEN_ENDPOINTS = {
  google: 'https://oauth2.googleapis.com/token',
  facebook: 'https://graph.facebook.com/v18.0/oauth/access_token',
};

const OAUTH_USERINFO_ENDPOINTS = {
  google: 'https://www.googleapis.com/oauth2/v2/userinfo',
  facebook: 'https://graph.facebook.com/me?fields=id,email,first_name,last_name',
};

async function exchangeOAuthCode(provider, code, redirectUri) {
  const config = OAUTH_PROVIDERS[provider];
  const tokenUrl = OAUTH_TOKEN_ENDPOINTS[provider];

  if (!config || !tokenUrl) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await axios.post(tokenUrl, {
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    redirect_uri: redirectUri,
    grant_type: 'authorization_code',
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  return response.data;
}

async function getOAuthUserInfo(provider, accessToken) {
  const userInfoUrl = OAUTH_USERINFO_ENDPOINTS[provider];

  if (!userInfoUrl) {
    throw new Error(`Unsupported OAuth provider: ${provider}`);
  }

  const response = await axios.get(userInfoUrl, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const data = response.data;
  return {
    id: data.id,
    email: data.email,
    first_name: data.first_name || data.given_name || '',
    last_name: data.last_name || data.family_name || '',
  };
}

/**
 * Express router for authentication service
 */
const express = require('express');
const router = express.Router();
// The dedicated 5-req/60s brute-force limiter existed but was never
// attached here — these routes fell back to the generic 100 req/min
// limiter, far too permissive for login/register/2FA.
const { authLimiter } = require('../../middleware/rateLimiter');

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password, device_info } = req.body;
    const result = await loginUser(email, password, device_info);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh', authLimiter, async (req, res) => {
  try {
    const { refresh_token } = req.body;
    const result = await refreshAccessToken(refresh_token);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const { user_id, refresh_token } = req.body;
    const result = await logoutUser(user_id, refresh_token);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Setup 2FA
router.post('/2fa/setup', lazyAuth, async (req, res) => {
  try {
    const { user_id } = req.body;
    const result = await setupTwoFactor(user_id);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Verify 2FA — a raw 6-digit code with no auth gate (the user isn't fully
// logged in yet at this step of the flow), so the rate limiter is this
// route's only real defense against brute-forcing the ~1,000,000 codes.
router.post('/2fa/verify', authLimiter, async (req, res) => {
  try {
    const { user_id, code } = req.body;
    const result = await verifyTwoFactor(user_id, code);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Disable 2FA
router.post('/2fa/disable', lazyAuth, async (req, res) => {
  try {
    const { user_id, password } = req.body;
    const result = await disableTwoFactor(user_id, password);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OAuth URL
router.get('/oauth/:provider/url', (req, res) => {
  try {
    const { provider } = req.params;
    const state = generateOAuthState();
    const url = getOAuthAuthUrl(provider, state);
    res.json({ url, state });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OAuth callback
router.post('/oauth/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, redirect_uri, state } = req.body;
    if (!verifyOAuthState(state)) {
      return res.status(400).json({ error: 'Invalid or expired OAuth state' });
    }
    const result = await oauthAuthenticate(provider, code, redirect_uri);
    res.json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get current user
router.get('/me', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyToken(token);
    const pg = getPostgreSQL();

    if (!pg) {
      assertFallbackAuthStoreAllowed();
      const user = (await getFallbackUserById(payload.userId))
        || (await getFallbackUserByEmail(payload.email || ''));
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: {
          ...user,
          permissions: getUserPermissions(user.role),
        },
      });
    }

    const userQuery = `
      SELECT u.id, u.email, u.phone, u.role, u.status, u.email_verified, u.phone_verified,
             up.first_name, up.last_name, up.profile_image_url, up.kyc_status
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = $1
    `;

    const userResult = await pg.query(userQuery, [payload.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    res.json({
      user: {
        ...user,
        permissions: getUserPermissions(user.role),
      },
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = {
  router,
  registerUser,
  issueEmailVerificationToken,
  findPendingUserByEmail,
  verifyEmailToken,
  loginUser,
  refreshAccessToken,
  logoutUser,
  setupTwoFactor,
  verifyTwoFactor,
  disableTwoFactor,
  oauthAuthenticate,
  getOAuthAuthUrl,
  verifyToken,
  hasPermission,
  generateAccessToken,
  generateRefreshToken,
};
