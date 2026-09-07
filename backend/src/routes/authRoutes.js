const express = require('express');
const router = express.Router();

/**
 * Authentication Routes
 * POST /auth/login - User login
 * POST /auth/register - User registration
 * POST /auth/logout - User logout
 * POST /auth/refresh - Refresh token
 */

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
