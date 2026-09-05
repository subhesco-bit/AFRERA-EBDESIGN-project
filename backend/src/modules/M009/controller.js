// Controller for Security & Access Control (M009) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Security event logging
async function createSecurityEvent(req, res) {
  try {
    const event = await service.createSecurityEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    logger.error('createSecurityEvent error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getSecurityEvents(req, res) {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      userId: req.query.userId,
      eventType: req.query.eventType,
      severity: req.query.severity,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const result = await service.getSecurityEvents(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('getSecurityEvents error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// IP whitelist/blacklist
async function addToIpList(req, res) {
  try {
    const { listType, ipAddress, description } = req.body;
    const userId = req.user?.id;
    const entry = await service.addToIpList(listType, ipAddress, description, userId);
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    logger.error('addToIpList error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function removeFromIpList(req, res) {
  try {
    const { listType, ipAddress } = req.body;
    const removed = await service.removeFromIpList(listType, ipAddress);
    if (!removed) return res.status(404).json({ success: false, error: 'IP entry not found' });
    res.json({ success: true, data: removed });
  } catch (error) {
    logger.error('removeFromIpList error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getIpLists(req, res) {
  try {
    const { listType } = req.params;
    const lists = await service.getIpLists(listType);
    res.json({ success: true, data: lists });
  } catch (error) {
    logger.error('getIpLists error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function checkIpAccess(req, res) {
  try {
    const { ipAddress } = req.body;
    const access = await service.checkIpAccess(ipAddress);
    res.json({ success: true, data: access });
  } catch (error) {
    logger.error('checkIpAccess error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Rate limiting
async function checkRateLimit(req, res) {
  try {
    const { identifier, limit, windowMinutes } = req.body;
    let result = await service.checkRateLimit(identifier, limit, windowMinutes);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('checkRateLimit error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered threat detection
async function detectThreats(req, res) {
  try {
    const threats = await service.detectThreats();
    res.json({ success: true, data: threats });
  } catch (error) {
    logger.error('detectThreats error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Security score
async function calculateSecurityScore(req, res) {
  try {
    const score = await service.calculateSecurityScore(req.params.userId);
    res.json({ success: true, data: score });
  } catch (error) {
    logger.error('calculateSecurityScore error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Access control policies
async function createAccessPolicy(req, res) {
  try {
    const policy = await service.createAccessPolicy(req.body);
    res.status(201).json({ success: true, data: policy });
  } catch (error) {
    logger.error('createAccessPolicy error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function evaluateAccessPolicy(req, res) {
  try {
    const { userId, resource, action } = req.body;
    let result = await service.evaluateAccessPolicy(userId, resource, action);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('evaluateAccessPolicy error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Security event logging
  createSecurityEvent,
  getSecurityEvents,
  
  // IP whitelist/blacklist
  addToIpList,
  removeFromIpList,
  getIpLists,
  checkIpAccess,
  
  // Rate limiting
  checkRateLimit,
  
  // AI-powered threat detection
  detectThreats,
  
  // Security score
  calculateSecurityScore,
  
  // Access control policies
  createAccessPolicy,
  evaluateAccessPolicy,
};