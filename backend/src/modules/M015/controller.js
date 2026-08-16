// Controller for Multi-Factor Authentication (M015) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// TOTP endpoints
async function setupTOTP(req, res) {
  try {
    const userId = req.user?.id;
    const result = await service.setupTOTP(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('setupTOTP error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifyTOTP(req, res) {
  try {
    const userId = req.user?.id;
    const { token } = req.body;
    const result = await service.verifyTOTP(userId, token);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('verifyTOTP error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// SMS OTP endpoints
async function sendSMSOTP(req, res) {
  try {
    const userId = req.user?.id;
    const { phoneNumber } = req.body;
    const result = await service.sendSMSOTP(userId, phoneNumber);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sendSMSOTP error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifySMSOTP(req, res) {
  try {
    const userId = req.user?.id;
    const { otp } = req.body;
    const result = await service.verifySMSOTP(userId, otp);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('verifySMSOTP error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Email OTP endpoints
async function sendEmailOTP(req, res) {
  try {
    const userId = req.user?.id;
    const { email } = req.body;
    const result = await service.sendEmailOTP(userId, email);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('sendEmailOTP error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifyEmailOTP(req, res) {
  try {
    const userId = req.user?.id;
    const { otp } = req.body;
    const result = await service.verifyEmailOTP(userId, otp);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('verifyEmailOTP error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Biometric endpoints
async function registerBiometric(req, res) {
  try {
    const userId = req.user?.id;
    const result = await service.registerBiometric(userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('registerBiometric error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifyBiometric(req, res) {
  try {
    const userId = req.user?.id;
    const result = await service.verifyBiometric(userId, req.body);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('verifyBiometric error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Device trust endpoints
async function setDeviceTrust(req, res) {
  try {
    const userId = req.user?.id;
    const { deviceFingerprint, trustLevel } = req.body;
    const result = await service.setDeviceTrust(userId, deviceFingerprint, trustLevel);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('setDeviceTrust error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function checkDeviceTrust(req, res) {
  try {
    const userId = req.user?.id;
    const { deviceFingerprint } = req.body;
    const result = await service.checkDeviceTrust(userId, deviceFingerprint);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('checkDeviceTrust error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Recovery codes endpoints
async function generateRecoveryCodes(req, res) {
  try {
    const userId = req.user?.id;
    const result = await service.generateRecoveryCodes(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('generateRecoveryCodes error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifyRecoveryCode(req, res) {
  try {
    const userId = req.user?.id;
    const { code } = req.body;
    const result = await service.verifyRecoveryCode(userId, code);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('verifyRecoveryCode error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Status and management
async function getMFAStatus(req, res) {
  try {
    const userId = req.params.userId || req.user?.id;
    const status = await service.getMFAStatus(userId);
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('getMFAStatus error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function disableMFA(req, res) {
  try {
    const userId = req.user?.id;
    const { method } = req.body;
    const result = await service.disableMFA(userId, method);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('disableMFA error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered fraud detection
async function detectMFAFraud(req, res) {
  try {
    const userId = req.user?.id;
    const { method, context } = req.body;
    const result = await service.detectMFAFraud(userId, method, context);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('detectMFAFraud error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // TOTP
  setupTOTP,
  verifyTOTP,
  
  // SMS OTP
  sendSMSOTP,
  verifySMSOTP,
  
  // Email OTP
  sendEmailOTP,
  verifyEmailOTP,
  
  // Biometric
  registerBiometric,
  verifyBiometric,
  
  // Device trust
  setDeviceTrust,
  checkDeviceTrust,
  
  // Recovery codes
  generateRecoveryCodes,
  verifyRecoveryCode,
  
  // Status and management
  getMFAStatus,
  disableMFA,
  
  // AI-powered fraud detection
  detectMFAFraud,
};