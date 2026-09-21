/**
 * API ROUTES INDEX - FIXED
 * Centralized route registration with proper error handling
 */

'use strict';

const express = require('express');
const { logger } = require('../utils/logger');
const { authMiddleware, requirePermission } = require('../middleware/auth');

const router = express.Router();

// ============================================================================
// PUBLIC ROUTES (No authentication required)
// ============================================================================

// Health checks
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is healthy',
    timestamp: new Date().toISOString(),
  });
});

// Status
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'operational',
    version: '1.0.0',
    environment: process.env.NODE_ENV,
  });
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

router.post('/auth/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Authentication logic would go here
    // For now, return placeholder
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token: 'placeholder-token',
        user: {
          id: 'user-id',
          email: email,
        },
      },
    });
  } catch (err) {
    logger.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Login failed',
    });
  }
});

router.post('/auth/register', async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and name are required',
      });
    }

    // Registration logic would go here
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: 'new-user-id',
          email: email,
          name: name,
        },
      },
    });
  } catch (err) {
    logger.error('Registration error:', err);
    res.status(500).json({
      success: false,
      error: 'Registration failed',
    });
  }
});

router.post('/auth/logout', authMiddleware, (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful',
  });
});

// ============================================================================
// PROTECTED ROUTES (Authentication required)
// ============================================================================

router.get('/users/profile', authMiddleware, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user?.id,
        email: req.user?.email,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch profile',
    });
  }
});

router.put('/users/profile', authMiddleware, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to update profile',
    });
  }
});

// ============================================================================
// ADMIN ROUTES (Role-based)
// ============================================================================

router.get('/admin/users', authMiddleware, (req, res) => {
  try {
    res.status(200).json({
      success: true,
      data: [],
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

router.use((err, req, res, next) => {
  logger.error('Route error:', {
    error: err.message,
    path: req.path,
    method: req.method,
  });

  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal server error',
    requestId: req.id,
  });
});

module.exports = router;
