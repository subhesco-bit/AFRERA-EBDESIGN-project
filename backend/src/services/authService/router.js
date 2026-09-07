/**
 * Express router for the authentication service. Split out of the former
 * monolithic services/authService.js (M11).
 */

const express = require('express');
const { getPostgreSQL } = require('../../database/connection');
const { verifyToken } = require('./tokens');
const { getUserPermissions } = require('./permissions');
const { registerUser, loginUser, refreshAccessToken, logoutUser } = require('./userAuth');
const { setupTwoFactor, verifyTwoFactor, disableTwoFactor } = require('./twoFactor');
const { oauthAuthenticate, getOAuthAuthUrl } = require('./oauth');
const { getFallbackUserByEmail } = require('./store');

// NOTE: middleware/auth.js requires the authService directory (for
// verifyToken/hasPermission), so importing it at the top level here creates
// a circular dependency: at load time authService's exports are not yet
// populated, so authMiddleware resolves to undefined and Express throws
// "Route.post() requires a callback function". Resolving it lazily
// per-request breaks the cycle safely.
// __dirname here is backend/src/services/authService, one level deeper than
// the original single-file authService.js, so this now needs '../../' (not
// '../') to reach backend/src/middleware/auth.
const lazyAuth = (req, res, next) =>
  require('../../middleware/auth').authMiddleware(req, res, next);

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, device_info } = req.body;
    const result = await loginUser(email, password, device_info);
    res.json(result);
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
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

// Verify 2FA
router.post('/2fa/verify', async (req, res) => {
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
    const { state } = req.query;
    const url = getOAuthAuthUrl(provider, state);
    res.json({ url });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// OAuth callback
router.post('/oauth/:provider/callback', async (req, res) => {
  try {
    const { provider } = req.params;
    const { code, redirect_uri } = req.body;
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
      const user = getFallbackUserByEmail(payload.email || '');
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json({
        user: {
          ...user,
          permissions: getUserPermissions(user.role)
        }
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
        permissions: getUserPermissions(user.role)
      }
    });
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
});

module.exports = router;
