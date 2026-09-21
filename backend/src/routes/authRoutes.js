const express = require('express');
const router = express.Router();

/**
 * Authentication Routes
 * POST /auth/login - User login
 * POST /auth/register - User registration
 * POST /auth/logout - User logout
 * POST /auth/refresh - Refresh token
 */

// ---------------------------------------------------------------------------
// FAIL-CLOSED GUARD
//
// This router is a MOCK. It keeps users in a process-local Map, compares and
// stores passwords in PLAINTEXT (lines below), and issues fabricated non-JWT
// strings of the form `jwt_<userId>_<timestamp>`.
//
// It is live: index.js mounts it explicitly at `/api/auth`. Verified against a
// running server before this guard was added:
//
//   POST /api/auth/register -> 201, token "jwt_user_1789981049426_..."
//   POST /api/auth/login    -> 200 with the plaintext password
//
// The tokens it mints are correctly REJECTED by the real verifier in
// middleware/auth.js, so this was not an authorization bypass. It was still a
// live endpoint accepting and retaining plaintext credentials, and a login that
// appears to succeed while granting no access -- the two-incoherent-auth-systems
// problem.
//
// Per the project rule that nothing is deleted, the implementation is retained
// but disabled unless explicitly opted into. Set ALLOW_MOCK_AUTH=true (never in
// a deployed environment) to use it. Replace this router with the real identity
// service rather than enabling the flag: see
// .ai/tasks/AFRERA_ENHANCEMENT_TODO.md items 1.1.1-1.1.5.
//
// The same remediation is applied in subhesco-bit/subh-deep, where the
// equivalent router was auto-mounted at /api/v1/auth by route discovery.
// ---------------------------------------------------------------------------
const MOCK_AUTH_ENABLED = process.env.ALLOW_MOCK_AUTH === 'true';

router.use((req, res, next) => {
  if (MOCK_AUTH_ENABLED) return next();
  return res.status(503).json({
    success: false,
    error: {
      message:
        'Mock authentication is disabled. This endpoint stores plaintext ' +
        'passwords and issues non-JWT tokens, and must not serve traffic. ' +
        'A real identity service has not yet replaced it.',
      code: 'MOCK_AUTH_DISABLED',
    },
    timestamp: new Date().toISOString(),
  });
});

// Mock user database (in production, use PostgreSQL)
const users = new Map();
const sessions = new Map();

// Utility: Generate mock JWT token
function generateToken(userId) {
  return `jwt_${userId}_${Date.now()}`;
}

// POST /auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
      });
    }

    // In production: query PostgreSQL, hash password, verify
    // For now: mock verification
    const user = Array.from(users.values()).find((u) => u.email === email);

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    const token = generateToken(user.id);
    sessions.set(token, user.id);

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password required',
      });
    }

    // Check if user exists
    if (Array.from(users.values()).some((u) => u.email === email)) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
      });
    }

    // Create new user
    const userId = `user_${Date.now()}`;
    const newUser = { id: userId, name, email, password };
    users.set(userId, newUser);

    const token = generateToken(userId);
    sessions.set(token, userId);

    res.status(201).json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          name,
          email,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /auth/logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      sessions.delete(token);
    }

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// POST /auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token || !sessions.has(token)) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired token',
      });
    }

    const userId = sessions.get(token);
    const newToken = generateToken(userId);
    sessions.set(newToken, userId);
    sessions.delete(token);

    res.json({
      success: true,
      data: { token: newToken },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

module.exports = router;
