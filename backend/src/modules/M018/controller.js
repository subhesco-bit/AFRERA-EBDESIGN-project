// Controller for Privacy Controls (M018) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Data access management
async function createDataAccessPolicy(req, res) {
  try {
    const policy = await service.createDataAccessPolicy(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    logger.error('createDataAccessPolicy error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getDataAccessPolicies(req, res) {
  try {
    const { resourceName, accessLevel } = req.query;
    const policies = await service.getDataAccessPolicies({ resourceName, accessLevel });
    res.json({ success: true, data: policies });
  } catch (error) {
    logger.error('getDataAccessPolicies error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function checkDataAccess(req, res) {
  try {
    const userId = req.user?.id;
    const { resourceName, accessLevel } = req.body;
    const result = await service.checkDataAccess(userId, resourceName, accessLevel);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('checkDataAccess error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Data masking
async function applyDataMasking(req, res) {
  try {
    const { data, maskingRules } = req.body;
    const maskedData = await service.applyDataMasking(data, maskingRules);
    res.json({ success: true, data: maskedData });
  } catch (error) {
    logger.error('applyDataMasking error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function createMaskingRule(req, res) {
  try {
    const rule = await service.createMaskingRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    logger.error('createMaskingRule error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getMaskingRules(req, res) {
  try {
    const { resource } = req.query;
    const rules = await service.getMaskingRules({ resource });
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error('getMaskingRules error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Privacy policy management
async function createPrivacyPolicy(req, res) {
  try {
    const policy = await service.createPrivacyPolicy(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    logger.error('createPrivacyPolicy error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getPrivacyPolicies(req, res) {
  try {
    const { activeOnly } = req.query;
    const policies = await service.getPrivacyPolicies({ activeOnly: activeOnly === 'true' });
    res.json({ success: true, data: policies });
  } catch (error) {
    logger.error('getPrivacyPolicies error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function acceptPrivacyPolicy(req, res) {
  try {
    const userId = req.user?.id;
    const { policyId } = req.body;
    const acceptance = await service.acceptPrivacyPolicy(userId, policyId);
    res.json({ success: true, data: acceptance });
  } catch (error) {
    logger.error('acceptPrivacyPolicy error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered risk assessment
async function assessPrivacyRisk(req, res) {
  try {
    const userId = req.user?.id;
    const riskAssessment = await service.assessPrivacyRisk(userId, req.body);
    res.json({ success: true, data: riskAssessment });
  } catch (error) {
    logger.error('assessPrivacyRisk error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Privacy impact analysis
async function performPrivacyImpactAnalysis(req, res) {
  try {
    const userId = req.user?.id;
    const analysis = await service.performPrivacyImpactAnalysis(userId, req.body);
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('performPrivacyImpactAnalysis error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Compliance monitoring
async function getPrivacyComplianceStatus(req, res) {
  try {
    const status = await service.getPrivacyComplianceStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    logger.error('getPrivacyComplianceStatus error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Data retention
async function enforceDataRetention(req, res) {
  try {
    const result = await service.enforceDataRetention();
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('enforceDataRetention error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Data access management
  createDataAccessPolicy,
  getDataAccessPolicies,
  checkDataAccess,
  
  // Data masking
  applyDataMasking,
  createMaskingRule,
  getMaskingRules,
  
  // Privacy policy management
  createPrivacyPolicy,
  getPrivacyPolicies,
  acceptPrivacyPolicy,
  
  // AI-powered risk assessment
  assessPrivacyRisk,
  
  // Privacy impact analysis
  performPrivacyImpactAnalysis,
  
  // Compliance monitoring
  getPrivacyComplianceStatus,
  
  // Data retention
  enforceDataRetention,
};