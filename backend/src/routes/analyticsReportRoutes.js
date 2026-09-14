/**
 * Routes for analyticsService.js (backend/src/services/legacy/analyticsService.js)
 * — a real, 643-line report-generation engine (buildAgriculturalOverview,
 * buildFinancialPerformance, buildOperationalEfficiency, buildMarketIntelligence,
 * buildResourceUtilization, buildRiskAssessment, buildSustainabilityMetrics,
 * buildUserAnalytics, buildSupplyChain, buildCustomReport) that was never
 * reachable: `mountRoute('/api/v1/analytics', analyticsService)` in index.js
 * silently no-ops because the service exports a plain class instance, not
 * `{router}` — confirmed by the boot log's own warning: "Skipping route
 * mount for /api/v1/analytics because no router was exported." Found via a
 * whole-repo audit, 2026-08-28.
 */

'use strict';

const express = require('express');
const router = express.Router();
const { authMiddleware, requireRole } = require('../middleware/auth');
const { PLATFORM_STAFF_ROLES } = require('../middleware/roleGroups');
const analyticsService = require('../services/legacy/analyticsService');

const REPORT_TYPES = [
  'agricultural_overview', 'financial_performance', 'operational_efficiency',
  'market_intelligence', 'resource_utilization', 'risk_assessment',
  'sustainability_metrics', 'user_analytics', 'supply_chain', 'custom',
];

router.get('/report-types', (req, res) => {
  res.json({ success: true, data: REPORT_TYPES });
});

router.post('/reports/:reportType', authMiddleware, requireRole(...PLATFORM_STAFF_ROLES), async (req, res) => {
  try {
    const { parameters = {}, options = {} } = req.body || {};
    const report = await analyticsService.generateReport(req.params.reportType, parameters, options);
    res.json({ success: true, data: report });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
