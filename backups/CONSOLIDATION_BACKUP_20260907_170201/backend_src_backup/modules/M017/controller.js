// Controller for Consent Management (M017) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Consent management
async function createConsent(req, res) {
  try {
    const consent = await service.createConsent(req.body);
    res.status(201).json({ success: true, data: consent });
  } catch (error) {
    logger.error('createConsent error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getUserConsents(req, res) {
  try {
    const userId = req.params.userId;
    const { category, status } = req.query;
    const consents = await service.getUserConsents(userId, { category, status });
    res.json({ success: true, data: consents });
  } catch (error) {
    logger.error('getUserConsents error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getConsent(req, res) {
  try {
    const consent = await service.getConsent(req.params.consentId);
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    res.json({ success: true, data: consent });
  } catch (error) {
    logger.error('getConsent error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function updateConsent(req, res) {
  try {
    const consent = await service.updateConsent(req.params.consentId, req.body);
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    res.json({ success: true, data: consent });
  } catch (error) {
    logger.error('updateConsent error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function revokeConsent(req, res) {
  try {
    const { reason } = req.body;
    const consent = await service.revokeConsent(req.params.consentId, reason);
    if (!consent) return res.status(404).json({ success: false, error: 'Consent not found' });
    res.json({ success: true, data: consent });
  } catch (error) {
    logger.error('revokeConsent error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Consent category management
async function createConsentCategory(req, res) {
  try {
    const category = await service.createConsentCategory(req.body);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    logger.error('createConsentCategory error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getConsentCategories(req, res) {
  try {
    const categories = await service.getConsentCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    logger.error('getConsentCategories error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Consent template management
async function createConsentTemplate(req, res) {
  try {
    const template = await service.createConsentTemplate(req.body);
    res.status(201).json({ success: true, data: template });
  } catch (error) {
    logger.error('createConsentTemplate error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getConsentTemplates(req, res) {
  try {
    const { consentType, consentCategory } = req.query;
    const templates = await service.getConsentTemplates({ consentType, consentCategory });
    res.json({ success: true, data: templates });
  } catch (error) {
    logger.error('getConsentTemplates error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function applyConsentTemplate(req, res) {
  try {
    const { userId, templateId } = req.body;
    const result = await service.applyConsentTemplate(userId, templateId);
    if (result.success) {
      res.json({ success: true, data: result.data });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('applyConsentTemplate error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered analysis
async function analyzeConsentCompliance(req, res) {
  try {
    const userId = req.params.userId;
    const analysis = await service.analyzeConsentCompliance(userId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeConsentCompliance error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Consent history and audit
async function getConsentHistory(req, res) {
  try {
    const history = await service.getConsentHistory(req.params.consentId);
    res.json({ success: true, data: history });
  } catch (error) {
    logger.error('getConsentHistory error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Automated expiration
async function checkExpiredConsents(req, res) {
  try {
    const result = await service.checkExpiredConsents();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('checkExpiredConsents error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Analytics
async function getConsentAnalytics(req, res) {
  try {
    const { startDate, endDate, consentCategory } = req.query;
    const analytics = await service.getConsentAnalytics({ startDate, endDate, consentCategory });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getConsentAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Bulk operations
async function bulkCreateConsents(req, res) {
  try {
    const { consents } = req.body;
    const result = await service.bulkCreateConsents(consents);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('bulkCreateConsents error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Consent management
  createConsent,
  getUserConsents,
  getConsent,
  updateConsent,
  revokeConsent,
  
  // Consent category management
  createConsentCategory,
  getConsentCategories,
  
  // Consent template management
  createConsentTemplate,
  getConsentTemplates,
  applyConsentTemplate,
  
  // AI-powered analysis
  analyzeConsentCompliance,
  
  // Consent history and audit
  getConsentHistory,
  
  // Automated expiration
  checkExpiredConsents,
  
  // Analytics
  getConsentAnalytics,
  
  // Bulk operations
  bulkCreateConsents,
};