// Controller for Authentication (M012) - AI Enhanced
// login/register/refreshToken/logout wrappers were deleted here (2026-08-17)
// alongside their service.js implementations - see service.js header comment.
const service = require('./service');
const { logger } = require('../../utils/logger');

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
    let session = await service.validateSession(sessionToken);
    
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
    let userId = req.params.userId || req.user?.id;
    let result = await service.invalidateAllUserSessions(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('invalidateAllUserSessions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function recordDeviceFingerprint(req, res) {
  try {
    let userId = req.user?.id;
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
    let userId = req.params.userId || req.user?.id;
    const devices = await service.getUserDevices(userId);
    res.json({ success: true, data: devices });
  } catch (error) {
    logger.error('getUserDevices error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserSecurityEvents(req, res) {
  try {
    let userId = req.params.userId || req.user?.id;
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
    let userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    let result = await service.changePassword(userId, currentPassword, newPassword);
    
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
  createSession,
  validateSession,
  invalidateSession,
  invalidateAllUserSessions,
  recordDeviceFingerprint,
  getUserDevices,
  getUserSecurityEvents,
  changePassword,
};