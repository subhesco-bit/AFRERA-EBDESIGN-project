// Controller for Authentication (M012) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const ipAddress = req.ip;
    const userAgent = req.headers['user-agent'];
    
    const result = await service.login(email, password, ipAddress, userAgent);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(401).json({ success: false, error: result.error, requiresVerification: result.requiresVerification });
    }
  } catch (error) {
    logger.error('login error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function register(req, res) {
  try {
    const result = await service.register(req.body);
    
    if (result.success) {
      res.status(201).json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('register error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function refreshToken(req, res) {
  try {
    const { refreshToken } = req.body;
    const result = await service.refreshToken(refreshToken);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(401).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('refreshToken error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function logout(req, res) {
  try {
    const userId = req.user?.id;
    const result = await service.logout(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('logout error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createSession(req, res) {
  try {
    const userId = req.user?.id;
    const deviceInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      ...req.body
    };
    
    const session = await service.createSession(userId, deviceInfo);
    res.status(201).json({ success: true, data: session });
  } catch (error) {
    logger.error('createSession error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function validateSession(req, res) {
  try {
    const { sessionToken } = req.body;
    const session = await service.validateSession(sessionToken);
    
    if (session) {
      res.json({ success: true, data: session });
    } else {
      res.status(401).json({ success: false, error: 'Invalid or expired session' });
    }
  } catch (error) {
    logger.error('validateSession error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function invalidateSession(req, res) {
  try {
    const { sessionToken } = req.body;
    const result = await service.invalidateSession(sessionToken);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('invalidateSession error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function invalidateAllUserSessions(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const result = await service.invalidateAllUserSessions(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('invalidateAllUserSessions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function recordDeviceFingerprint(req, res) {
  try {
    const userId = req.user?.id;
    const fingerprint = {
      ...req.body,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    };
    
    const recorded = await service.recordDeviceFingerprint(userId, fingerprint);
    res.status(201).json({ success: true, data: recorded });
  } catch (error) {
    logger.error('recordDeviceFingerprint error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserDevices(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const devices = await service.getUserDevices(userId);
    res.json({ success: true, data: devices });
  } catch (error) {
    logger.error('getUserDevices error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserSecurityEvents(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const { limit } = req.query;
    const events = await service.getUserSecurityEvents(userId, { limit });
    res.json({ success: true, data: events });
  } catch (error) {
    logger.error('getUserSecurityEvents error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function changePassword(req, res) {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    const result = await service.changePassword(userId, currentPassword, newPassword);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('changePassword error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  login,
  register,
  refreshToken,
  logout,
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  recordDeviceFingerprint,
  getUserDevices,
  getUserSecurityEvents,
  changePassword,
};