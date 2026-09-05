// Controller for Audit & Compliance (M008) - AI Enhanced
const service = require('./service');
const { logger } = require('../../utils/logger');

// Audit logging
async function createAuditLog(req, res) {
  try {
    const log = await service.createAuditLog(req.body);
    res.status(201).json({ success: true, data: log });
  } catch (error) {
    logger.error('createAuditLog error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getAuditLogs(req, res) {
  try {
    const filters = {
      page: req.query.page,
      limit: req.query.limit,
      userId: req.query.userId,
      action: req.query.action,
      entity: req.query.entity,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };
    const result = await service.getAuditLogs(filters);
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error('getAuditLogs error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function getAuditLog(req, res) {
  try {
    let log = await service.getAuditLog(req.params.id);
    if (!log) return res.status(404).json({ success: false, error: 'Audit log not found' });
    res.json({ success: true, data: log });
  } catch (error) {
    logger.error('getAuditLog error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Blockchain verification
async function verifyAuditLogIntegrity(req, res) {
  try {
    const verification = await service.verifyAuditLogIntegrity(req.params.id);
    res.json({ success: true, data: verification });
  } catch (error) {
    logger.error('verifyAuditLogIntegrity error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Compliance rules
async function createComplianceRule(req, res) {
  try {
    const rule = await service.createComplianceRule(req.body);
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    logger.error('createComplianceRule error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function listComplianceRules(req, res) {
  try {
    const { activeOnly } = req.query;
    const rules = await service.listComplianceRules({ activeOnly: activeOnly === 'true' });
    res.json({ success: true, data: rules });
  } catch (error) {
    logger.error('listComplianceRules error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

async function evaluateComplianceRules(req, res) {
  try {
    const evaluation = await service.evaluateComplianceRules(req.params.userId);
    res.json({ success: true, data: evaluation });
  } catch (error) {
    logger.error('evaluateComplianceRules error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// Regulatory reporting
async function generateComplianceReport(req, res) {
  try {
    const { startDate, endDate, reportType } = req.query;
    const report = await service.generateComplianceReport({ startDate, endDate, reportType });
    res.json({ success: true, data: report });
  } catch (error) {
    logger.error('generateComplianceReport error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

// AI-powered anomaly detection
async function detectAuditAnomalies(req, res) {
  try {
    const { timeframe } = req.query;
    const anomalies = await service.detectAuditAnomalies({ timeframe });
    res.json({ success: true, data: anomalies });
  } catch (error) {
    logger.error('detectAuditAnomalies error', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
}

module.exports = {
  // Audit logging
  createAuditLog,
  getAuditLogs,
  getAuditLog,
  
  // Blockchain verification
  verifyAuditLogIntegrity,
  
  // Compliance rules
  createComplianceRule,
  listComplianceRules,
  evaluateComplianceRules,
  
  // Regulatory reporting
  generateComplianceReport,
  
  // AI-powered anomaly detection
  detectAuditAnomalies,
};