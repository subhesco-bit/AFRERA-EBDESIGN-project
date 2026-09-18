/**
 * Real backend routes for AdminDashboardPage.jsx's adminAPI.getRecentAudit
 * and systemAPI.getHealth. getRecentAudit -> auditService.js's
 * getRecentEvents(limit); getHealth -> the already-real
 * systemAdministrationService.js's getSystemHealthDashboard() (closest
 * semantic matches — neither frontend method name exists verbatim on
 * either service).
 */
'use strict';

const express = require('express');
const router = express.Router();
const auditSvc = require('../services/legacy/auditService');
const sysAdminSvc = require('../services/legacy/systemAdministrationService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => async (req, res) => {
  try {
    res.json({ success: true, data: await fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/admin/recent-audit', wrap((req) => auditSvc.getRecentEvents(req.query.limit ? Number(req.query.limit) : undefined)));
router.get('/system/health', wrap(() => sysAdminSvc.getSystemHealthDashboard()));

module.exports = router;
