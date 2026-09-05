// Controller for Account Recovery (M020) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Password reset
async function initiatePasswordReset(req, res) {
  try {
    const { email, method } = req.body;
    const result = await service.initiatePasswordReset(email, method);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('initiatePasswordReset error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifyPasswordResetToken(req, res) {
  try {
    const { token } = req.body;
    let result = await service.verifyPasswordResetToken(token);
    res.json({ success: result.success, data: result });
  } catch (error) {
    logger.error('verifyPasswordResetToken error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    let result = await service.resetPassword(token, newPassword);
    res.json({ success: result.success, data: result });
  } catch (error) {
    logger.error('resetPassword error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Security questions
async function setupSecurityQuestions(req, res) {
  try {
    const userId = req.user?.id;
    const { questions } = req.body;
    let result = await service.setupSecurityQuestions(userId, questions);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('setupSecurityQuestions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function verifySecurityQuestions(req, res) {
  try {
    let userId = req.params.userId || req.user?.id;
    const { answers } = req.body;
    let result = await service.verifySecurityQuestions(userId, answers);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('verifySecurityQuestions error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Account lockout
async function lockAccount(req, res) {
  try {
    const { userId, reason, duration } = req.body;
    let result = await service.lockAccount(userId, reason, duration);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('lockAccount error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function unlockAccount(req, res) {
  try {
    let userId = req.params.userId;
    let result = await service.unlockAccount(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('unlockAccount error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function checkAccountLockStatus(req, res) {
  try {
    let userId = req.params.userId || req.user?.id;
    const status = await service.checkAccountLockStatus(userId);
    res.json({ success: status.success, data: status });
  } catch (error) {
    logger.error('checkAccountLockStatus error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Recovery tracking
async function getRecoveryAttempts(req, res) {
  try {
    let userId = req.params.userId || req.user?.id;
    const { limit } = req.query;
    const attempts = await service.getRecoveryAttempts(userId, { limit });
    res.json({ success: true, data: attempts });
  } catch (error) {
    logger.error('getRecoveryAttempts error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered fraud detection
async function detectRecoveryFraud(req, res) {
  try {
    const { userId, email } = req.body;
    const fraudCheck = await service.detectRecoveryFraud(userId, email);
    res.json({ success: true, data: fraudCheck });
  } catch (error) {
    logger.error('detectRecoveryFraud error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Temporary password
async function generateTemporaryPassword(req, res) {
  try {
    let userId = req.params.userId;
    let result = await service.generateTemporaryPassword(userId);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('generateTemporaryPassword error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getRecoveryAnalytics(req, res) {
  try {
    const { startDate, endDate } = req.query;
    const analytics = await service.getRecoveryAnalytics({ startDate, endDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getRecoveryAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Password reset
  initiatePasswordReset,
  verifyPasswordResetToken,
  resetPassword,
  
  // Security questions
  setupSecurityQuestions,
  verifySecurityQuestions,
  
  // Account lockout
  lockAccount,
  unlockAccount,
  checkAccountLockStatus,
  
  // Recovery tracking
  getRecoveryAttempts,
  
  // AI-powered fraud detection
  detectRecoveryFraud,
  
  // Temporary password
  generateTemporaryPassword,
  
  // Analytics
  getRecoveryAnalytics,
};