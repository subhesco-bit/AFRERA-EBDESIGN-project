// Controller for Single Sign-On (M014) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// OAuth2/OIDC endpoints
async function initiateOAuthFlow(req, res) {
  try {
    const { provider, redirectUri } = req.body;
    const result = await service.initiateOAuthFlow(provider, redirectUri);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('initiateOAuthFlow error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleOAuthCallback(req, res) {
  try {
    const { provider, code, state } = req.body;
    let result = await service.handleOAuthCallback(provider, code, state);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('handleOAuthCallback error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// SAML endpoints
async function initiateSAMLFlow(req, res) {
  try {
    const { provider, redirectUri } = req.body;
    let result = await service.initiateSAMLFlow(provider, redirectUri);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('initiateSAMLFlow error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function handleSAMLResponse(req, res) {
  try {
    const { provider, samlResponse } = req.body;
    let result = await service.handleSAMLResponse(provider, samlResponse);
    
    if (result.success) {
      res.json({ success: true, data: result });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    logger.error('handleSAMLResponse error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Provider management
async function createProviderConfig(req, res) {
  try {
    let result = await service.createProviderConfig(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('createProviderConfig error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listProviders(req, res) {
  try {
    const providers = await service.listProviders();
    res.json({ success: true, data: providers });
  } catch (error) {
    logger.error('listProviders error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered analytics
async function getSSOAnalytics(req, res) {
  try {
    const { provider, startDate, endDate } = req.query;
    const analytics = await service.getSSOAnalytics({ provider, startDate, endDate });
    res.json({ success: true, data: analytics });
  } catch (error) {
    logger.error('getSSOAnalytics error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function detectSSOAnomalies(req, res) {
  try {
    const anomalies = await service.detectSSOAnomalies();
    res.json({ success: true, data: anomalies });
  } catch (error) {
    logger.error('detectSSOAnomalies error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // OAuth2/OIDC
  initiateOAuthFlow,
  handleOAuthCallback,
  
  // SAML
  initiateSAMLFlow,
  handleSAMLResponse,
  
  // Provider management
  createProviderConfig,
  listProviders,
  
  // AI-powered analytics
  getSSOAnalytics,
  detectSSOAnomalies,
};