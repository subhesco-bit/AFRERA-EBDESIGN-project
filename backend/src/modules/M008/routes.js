const express = require('express');
const router = express.Router();
const controller = require('./controller');
const { authMiddleware, requireRole } = require('../../middleware/auth');

// Audit logging
router.post('/logs', authMiddleware, controller.createAuditLog);
router.get('/logs', authMiddleware, requireRole('admin'), controller.getAuditLogs);
router.get('/logs/:id', authMiddleware, requireRole('admin'), controller.getAuditLog);

// Blockchain verification
router.get('/logs/:id/verify', authMiddleware, requireRole('admin'), controller.verifyAuditLogIntegrity);

// Compliance rules
router.post('/compliance-rules', authMiddleware, requireRole('admin'), controller.createComplianceRule);
router.get('/compliance-rules', authMiddleware, requireRole('admin'), controller.listComplianceRules);
router.get('/users/:userId/compliance', authMiddleware, requireRole('admin'), controller.evaluateComplianceRules);

// Regulatory reporting
router.get('/reports/compliance', authMiddleware, requireRole('admin'), controller.generateComplianceReport);

// AI-powered anomaly detection
router.get('/anomalies', authMiddleware, requireRole('admin'), controller.detectAuditAnomalies);

module.exports = router;