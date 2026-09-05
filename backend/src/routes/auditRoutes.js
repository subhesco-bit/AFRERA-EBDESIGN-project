/**
 * Audit & Compliance Routes
 * Admin-only API endpoints exposing auditService — previously never wired to any route.
 */

const express = require('express');
const router = express.Router();
const auditService = require('../services/legacy/auditService');
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');

// Log an audit event manually (most events should be logged internally by other
// services calling auditService.logEvent() directly; this endpoint exists for
// admin tooling / manual entries)
router.post('/events', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const event = await auditService.logEvent(req.body);
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logs for a specific entity (e.g. an order, a farmer profile, a claim)
router.get('/entities/:entityType/:entityId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await auditService.getEntityLogs(req.params.entityType, req.params.entityId, req.query);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Logs for a specific user
router.get('/users/:userId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let logs = await auditService.getUserLogs(req.params.userId, req.query);
    res.json({ success: true, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// General audit report
router.get('/report', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const report = await auditService.generateAuditReport(req.query);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Compliance-specific audit trail
router.get('/compliance/:complianceType', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { period } = req.query;
    let report = await auditService.getComplianceAudit(req.params.complianceType, period);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Security audit trail (logins, failed logins, permission denials, etc.)
router.get('/security', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    let report = await auditService.getSecurityAudit(req.query);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export audit logs as CSV
router.get('/export', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const csv = await auditService.exportAuditLogs(req.query);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="audit-logs.csv"');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/recent', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const events = await auditService.getRecentEvents(limit);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
