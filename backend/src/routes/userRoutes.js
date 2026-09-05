const express = require('express');
const logger = console; // TODO: use Winston/Pino logger

const router = express.Router();

/**
 * User/Profile Routes
 * GET /users/profile - Get user profile
 * PUT /users/profile - Update user profile
 * GET /users/addresses - Get user addresses
 * POST /users/addresses - Add new address
 */

function verifyToken(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  req.userId = token;
  next();
}

const userProfiles = new Map();

function getProfile(userId) {
  if (!userProfiles.has(userId)) {
    userProfiles.set(userId, {
      id: userId,
      name: 'User Name',
      email: 'user@example.com',
      phone: '+91-XXXXXXXXXX',
      profilePic: null,
      addresses: [],
      preferences: {
        notifications: true,
        newsletter: false,
      },
    });
  }
  return userProfiles.get(userId);
}

// GET /users/profile
router.get
    // Log request
    logger.debug('router.get request');('/profile', verifyToken, async (req, res) => {
  try {
    const profile = getProfile(req.userId);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /users/profile
router.put
    // Log request
    logger.debug('router.put request');('/profile', verifyToken, async (req, res) => {
  try {
    const profile = getProfile(req.userId);
    const { name, phone, profilePic, preferences } = req.body;

    if (name) profile.name = name;
    if (phone) profile.phone = phone;
    if (profilePic) profile.profilePic = profilePic;
    if (preferences) {
      profile.preferences = { ...profile.preferences, ...preferences };
    }

    res.json({
      success: true,
      data: profile,
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /users/addresses
router.get
    // Log request
    logger.debug('router.get request');('/addresses', verifyToken, async (req, res) => {
  try {
    const profile = getProfile(req.userId);

    res.json({
      success: true,
      data: {
        addresses: profile.addresses,
        count: profile.addresses.length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /users/addresses
router.post
    // Log request
    logger.debug('router.post request');('/addresses', verifyToken, async (req, res) => {
  try {
    const { street, city, state, zipCode, country, isDefault } = req.body;

    if (!street || !city || !state || !zipCode) {
      return res.status(400).json({
        success: false,
        error: 'Missing required address fields',
      });
    }

    const profile = getProfile(req.userId);

    // If this is the default address, unset others
    if (isDefault) {
      profile.addresses.forEach((addr) => {
        addr.isDefault = false;
      });
    }

    const newAddress = {
      id: `addr_${Date.now()}`,
      street,
      city,
      state,
      zipCode,
      country: country || 'India',
      isDefault: isDefault || profile.addresses.length === 0,
    };

    profile.addresses.push(newAddress);

    res.status(201).json({
      success: true,
      data: newAddress,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
