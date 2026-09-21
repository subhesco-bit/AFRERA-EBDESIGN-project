/**
 * INTEGRATION STATUS ROUTES
 * Unified API showing project status and integration state
 * Accessible at: /api/status/*
 *
 * Rewritten 2026-09-20: previously hardcoded "42-68% COMPLETE", a fabricated
 * "155/226 routes complete" figure (with `|| 226`/`|| 155` fallbacks that made
 * the fabrication apply even if the registry was empty), a fake 7-10 week
 * timeline, and fake team-assignment data. Now delegates entirely to
 * IntegrationStatusDashboard, which computes real values from a live boot +
 * filesystem scan (see INTEGRATION_STATUS_DASHBOARD.js for what is and isn't
 * derivable that way).
 */

const express = require('express');
const router = express.Router();

const { IntegrationStatusDashboard } = require('../INTEGRATION_STATUS_DASHBOARD');
const dashboard = new IntegrationStatusDashboard();

/**
 * GET /api/status/complete
 * Full project status - everything derivable by static analysis + live boot
 */
router.get('/complete', (req, res) => {
  try {
    res.json(dashboard.generateFullDashboard());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/routes', (req, res) => {
  try {
    res.json(dashboard.getRoutesStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/services', (req, res) => {
  try {
    res.json(dashboard.getServicesStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/modules', (req, res) => {
  try {
    res.json(dashboard.getModulesStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/database', (req, res) => {
  try {
    res.json(dashboard.getDatabaseStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/integrations', (req, res) => {
  try {
    res.json(dashboard.getIntegrationsStatus());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/integration-health
 * Quick pointer to the other endpoints. `blockers`, `timeline`, and `team`
 * were removed: they were 100% hardcoded fiction (fake blocker list, fake
 * 7-10 week timeline, fake 4-6 person roster) with no mechanical way to
 * derive real equivalents from static analysis -- that is project-management
 * judgment, not something this endpoint should assert.
 */
router.get('/integration-health', (req, res) => {
  try {
    res.json({
      status: 'INTEGRATION_STATUS_READY',
      endpoints: {
        complete: '/api/status/complete',
        routes: '/api/status/routes',
        services: '/api/status/services',
        modules: '/api/status/modules',
        database: '/api/status/database',
        integrations: '/api/status/integrations',
      },
      note: 'blockers/timeline/team endpoints were removed 2026-09-20: they returned hardcoded fictional data with no real derivation available from static analysis.',
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
