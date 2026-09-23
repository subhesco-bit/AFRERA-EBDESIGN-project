const express = require('express');

const router = express.Router();

/**
 * Authentication Routes  (mounted by index.js at /api/auth)
 *
 *   POST /auth/register
 *   POST /auth/login
 *   POST /auth/refresh
 *   POST /auth/logout
 *
 * ---------------------------------------------------------------------------
 * HISTORY -- why this file was rewritten
 *
 * This router used to be a MOCK: users in a process-local `Map`, passwords
 * compared and retained in PLAINTEXT, and fabricated non-JWT strings of the
 * form `jwt_<userId>_<timestamp>` handed out as tokens. It was live --
 * index.js mounts it at /api/auth -- and verified against a running server:
 *
 *   POST /api/auth/register -> 201, token "jwt_user_1789981049426_..."
 *   POST /api/auth/login    -> 200 with the plaintext password
 *
 * The tokens it minted were correctly REJECTED by the real verifier in
 * middleware/auth.js, so this was never an authorization bypass. It was still
 * a live endpoint accepting and retaining plaintext credentials, and a login
 * that appeared to succeed while granting no access -- login and authorization
 * were two different systems.
 *
 * A previous pass disabled the mock behind ALLOW_MOCK_AUTH, which closed the
 * credential exposure but left /api/auth returning 503: the platform had no
 * working login at all. This pass replaces it, so the flag is retired.
 *
 * OPERATOR NOTE: any account created against the old mock endpoint must be
 * treated as compromised. Those passwords were held in cleartext in process
 * memory and are not carried over here.
 *
 * The router now delegates to services/dual-use/authService -- bcrypt at salt
 * rounds 12, signed HS256 JWTs, and the same module middleware/auth.js already
 * trusts to verify. Login and authorization are one system.
 * ---------------------------------------------------------------------------
 */

const authService = require('../services/dual-use/authService');
const { authMiddleware } = require('../middleware/auth');

/**
 * Map a service-layer error message onto an HTTP status. The auth service
 * signals failure by throwing `Error` with a descriptive message rather than
 * typed errors, so the mapping is by message. Anything unrecognised is a 500 --
 * an unknown failure must never be reported to the caller as a clean 4xx.
 */
function statusForError(message) {
  const text = String(message || '');
  if (/already registered|already exists/i.test(text)) return 409;
  if (/invalid credentials|invalid email or password|invalid token|invalid refresh token|invalid or expired|token expired|not active|inactive|locked/i.test(text)) return 401;
  if (/not found/i.test(text)) return 404;
  if (/required|invalid |must be|too short|too weak/i.test(text)) return 400;
  if (/unavailable/i.test(text)) return 503;
  return 500;
}

function fail(res, error, fallbackStatus) {
  const status = fallbackStatus || statusForError(error && error.message);
  return res.status(status).json({
    success: false,
    error: (error && error.message) || 'Authentication failed',
    timestamp: new Date().toISOString(),
  });
}

function requireFields(body, fields) {
  const missing = fields.filter((field) => !body || !body[field]);
  return missing.length ? `${missing.join(', ')} required` : null;
}

// POST /auth/register
router.post('/register', async (req, res) => {
  const missing = requireFields(req.body, ['email', 'password']);
  if (missing) {
    return res.status(400).json({ success: false, error: missing });
  }

  try {
    const result = await authService.registerUser(req.body);

    // A PostgreSQL-backed registration lands as status 'pending' and cannot
    // log in until verified. Issue the activation token as part of the same
    // call so the account is never stranded.
    const verification = result.user && result.user.status === 'pending'
      ? await issueVerification(result.user.id)
      : { required: false };

    return res.status(201).json({
      success: true,
      data: {
        verification,
        // `token` is the legacy field name existing clients read; the
        // canonical names are returned alongside it so callers can migrate.
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        user: result.user,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});

// Activation tokens are delivered to the client ONLY outside production,
// because no mail transport is configured in this deployment (see
// issueEmailVerificationToken). Returning it in production would put a working
// activation link in an unauthenticated HTTP response.
const EXPOSE_VERIFICATION_TOKEN = process.env.NODE_ENV !== 'production';

async function issueVerification(userId) {
  try {
    const issued = await authService.issueEmailVerificationToken(userId);
    return {
      required: true,
      delivered: false,
      reason: 'No mail transport is configured in this deployment.',
      expiresAt: issued.expiresAt,
      ...(EXPOSE_VERIFICATION_TOKEN ? { token: issued.token } : {}),
    };
  } catch (error) {
    // Registration itself succeeded; report that verification could not be
    // issued rather than failing the request and stranding the account.
    return { required: true, delivered: false, reason: error.message };
  }
}

// POST /auth/login
router.post('/login', async (req, res) => {
  const missing = requireFields(req.body, ['email', 'password']);
  if (missing) {
    return res.status(400).json({ success: false, error: 'Email and password required' });
  }

  try {
    const result = await authService.loginUser(req.body.email, req.body.password, {
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
    });
    return res.json({
      success: true,
      data: {
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
        user: result.user,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  // `token` accepted as well, because the mock this replaces took that name.
  const refreshToken = (req.body && (req.body.refreshToken || req.body.token)) || null;
  if (!refreshToken) {
    return res.status(400).json({ success: false, error: 'refreshToken required' });
  }

  try {
    const result = await authService.refreshAccessToken(refreshToken);
    return res.json({
      success: true,
      data: {
        token: result.accessToken,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
        expiresIn: result.expiresIn,
      },
    });
  } catch (error) {
    return fail(res, error);
  }
});

// POST /auth/verify-email
// Consumes a single-use activation token: marks the email verified and moves a
// pending account to active. Unauthenticated by design -- the token is the
// credential.
router.post('/verify-email', async (req, res) => {
  const token = (req.body && (req.body.token || req.body.verificationToken)) || null;
  if (!token) {
    return res.status(400).json({ success: false, error: 'token required' });
  }

  try {
    const result = await authService.verifyEmailToken(token);
    return res.json({ success: true, data: { user: result.user } });
  } catch (error) {
    return fail(res, error);
  }
});

// POST /auth/resend-verification
// Always answers 200 with the same body whether or not the address is
// registered, so this cannot be used to enumerate accounts.
router.post('/resend-verification', async (req, res) => {
  const email = (req.body && req.body.email) || null;
  if (!email) {
    return res.status(400).json({ success: false, error: 'email required' });
  }

  const generic = {
    success: true,
    message: 'If that address has a pending account, a verification token has been issued.',
  };

  try {
    const user = await authService.findPendingUserByEmail(email);
    if (!user) return res.json(generic);
    const verification = await issueVerification(user.id);
    // The extra `data` block is dev-only: in production its mere presence
    // would tell the caller the address exists, defeating the generic reply.
    return res.json(EXPOSE_VERIFICATION_TOKEN ? { ...generic, data: { verification } } : generic);
  } catch (error) {
    return fail(res, error);
  }
});

// POST /auth/logout
// Behind authMiddleware: the user being logged out is taken from the verified
// token, never from the request body, so one caller cannot log another out.
router.post('/logout', authMiddleware, async (req, res) => {
  try {
    const result = await authService.logoutUser(
      req.user.id,
      (req.body && req.body.refreshToken) || null,
    );
    return res.json({ success: true, message: result.message || 'Logged out successfully' });
  } catch (error) {
    return fail(res, error);
  }
});

module.exports = router;
