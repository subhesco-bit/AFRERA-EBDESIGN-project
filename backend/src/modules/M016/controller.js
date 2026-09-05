// Controller for Identity Federation (M016) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

function sendError(res, error) {
  const status = error.statusCode || (error.code === 'VALIDATION_ERROR' ? 400 : 500);
  return res.status(status).json({ success: false, error: { code: error.code || 'INTERNAL_ERROR', message: error.message } });
}

function isAdmin(req) {
  return ['admin', 'superadmin'].includes(req.user?.role);
}

// Federated identity management
async function createFederatedIdentity(req, res) {
  try {
    const result = await service.createFederatedIdentity(req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    logger.error('createFederatedIdentity error', { error: error.message });
    sendError(res, error);
  }
}

async function getFederatedIdentities(req, res) {
  try {
    const userId = req.params.userId;
    if (!isAdmin(req) && req.user.id !== userId) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You may only read your own identities' } });
    const identities = await service.getFederatedIdentities(userId);
    res.json({ success: true, data: identities });
  } catch (error) {
    logger.error('getFederatedIdentities error', { error: error.message });
    sendError(res, error);
  }
}

async function getFederatedIdentity(req, res) {
  try {
    const identity = await service.getFederatedIdentity(req.params.identityId);
    if (!identity) return res.status(404).json({ success: false, error: 'Identity not found' });
    if (!isAdmin(req) && identity.user_id !== req.user.id) return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'You may only read your own identities' } });
    res.json({ success: true, data: identity });
  } catch (error) {
    logger.error('getFederatedIdentity error', { error: error.message });
    sendError(res, error);
  }
}

async function updateFederatedIdentity(req, res) {
  try {
    let identity = await service.updateFederatedIdentity(req.params.identityId, req.body);
    if (!identity) return res.status(404).json({ success: false, error: 'Identity not found' });
    res.json({ success: true, data: identity });
  } catch (error) {
    logger.error('updateFederatedIdentity error', { error: error.message });
    sendError(res, error);
  }
}

async function revokeFederatedIdentity(req, res) {
  try {
    let identity = await service.revokeFederatedIdentity(req.params.identityId);
    if (!identity) return res.status(404).json({ success: false, error: 'Identity not found' });
    res.json({ success: true, data: identity });
  } catch (error) {
    logger.error('revokeFederatedIdentity error', { error: error.message });
    sendError(res, error);
  }
}

// Identity attribute mapping
async function createAttributeMapping(req, res) {
  try {
    const mapping = await service.createAttributeMapping(req.body);
    res.status(201).json({ success: true, data: mapping });
  } catch (error) {
    logger.error('createAttributeMapping error', { error: error.message });
    sendError(res, error);
  }
}

async function getAttributeMappings(req, res) {
  try {
    const { provider } = req.params;
    const mappings = await service.getAttributeMappings(provider);
    res.json({ success: true, data: mappings });
  } catch (error) {
    logger.error('getAttributeMappings error', { error: error.message });
    sendError(res, error);
  }
}

async function applyAttributeMapping(req, res) {
  try {
    const { provider, sourceAttributes } = req.body;
    const mapped = await service.applyAttributeMapping(provider, sourceAttributes);
    res.json({ success: true, data: mapped });
  } catch (error) {
    logger.error('applyAttributeMapping error', { error: error.message });
    sendError(res, error);
  }
}

// Federation trust management
async function createTrustRelationship(req, res) {
  try {
    const trust = await service.createTrustRelationship(req.body);
    res.status(201).json({ success: true, data: trust });
  } catch (error) {
    logger.error('createTrustRelationship error', { error: error.message });
    sendError(res, error);
  }
}

async function getTrustRelationships(req, res) {
  try {
    const relationships = await service.getTrustRelationships();
    res.json({ success: true, data: relationships });
  } catch (error) {
    logger.error('getTrustRelationships error', { error: error.message });
    sendError(res, error);
  }
}

async function updateTrustScore(req, res) {
  try {
    const { provider, delta, reason } = req.body;
    let trust = await service.updateTrustScore(provider, delta, reason);
    if (!trust) return res.status(404).json({ success: false, error: 'Provider not found' });
    res.json({ success: true, data: trust });
  } catch (error) {
    logger.error('updateTrustScore error', { error: error.message });
    sendError(res, error);
  }
}

// Centralized identity directory
async function searchIdentities(req, res) {
  try {
    let result = await service.searchIdentities(req.query);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('searchIdentities error', { error: error.message });
    sendError(res, error);
  }
}

// AI-powered analysis
async function analyzeIdentityPatterns(req, res) {
  try {
    const analysis = await service.analyzeIdentityPatterns();
    res.json({ success: true, data: analysis });
  } catch (error) {
    logger.error('analyzeIdentityPatterns error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Health monitoring
async function getFederationHealth(req, res) {
  try {
    const health = await service.getFederationHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    logger.error('getFederationHealth error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Federated identity management
  createFederatedIdentity,
  getFederatedIdentities,
  getFederatedIdentity,
  updateFederatedIdentity,
  revokeFederatedIdentity,
  
  // Identity attribute mapping
  createAttributeMapping,
  getAttributeMappings,
  applyAttributeMapping,
  
  // Federation trust management
  createTrustRelationship,
  getTrustRelationships,
  updateTrustScore,
  
  // Centralized identity directory
  searchIdentities,
  
  // AI-powered analysis
  analyzeIdentityPatterns,
  
  // Health monitoring
  getFederationHealth,
};