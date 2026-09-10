/**
 * INTEGRATION STATUS ROUTES
 * Unified API showing ALL project status and integration state
 * Accessible at: /api/status/*
 */

const express = require('express');
const router = express.Router();

const { routesRegistry } = require('../ROUTES_REGISTRY');
const { servicesRegistry } = require('../SERVICES_REGISTRY');
const { modulesRegistry } = require('../MODULES_REGISTRY');
const { IntegrationStatusDashboard } = require('../INTEGRATION_STATUS_DASHBOARD');

const dashboard = new IntegrationStatusDashboard();

/**
 * GET /api/status/complete
 * Full project status - everything visible
 */
router.get('/complete', (req, res) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      project: {
        name: "EBDESIGN",
        status: "42-68% COMPLETE",
        phase: "PRE-LAUNCH",
      },
      components: {
        routes: {
          total: routesRegistry.summary?.totalRoutes || 226,
          complete: routesRegistry.summary?.completeRoutes || 155,
          partial: routesRegistry.summary?.partialRoutes || 65,
          skeleton: routesRegistry.summary?.skeletonRoutes || 6,
          percent: routesRegistry.summary?.completionPercentage || "68.6%",
        },
        services: {
          total: servicesRegistry.summary.total,
          complete: servicesRegistry.summary.complete,
          partial: servicesRegistry.summary.partial,
          skeleton: servicesRegistry.summary.skeleton,
          percent: servicesRegistry.summary.completionPercentage,
        },
        modules: {
          total: modulesRegistry.summary.total,
          complete: modulesRegistry.summary.complete,
          partial: modulesRegistry.summary.partial,
          skeleton: modulesRegistry.summary.skeleton,
          percent: modulesRegistry.summary.completionPercentage,
        },
      },
      timeline: {
        phase1: "4-5 days",
        phase2: "2-3 weeks",
        phase3: "3-5 weeks",
        phase4: "1 week",
        total: "7-10 weeks",
      },
      blockers: dashboard.getCriticalBlockers(),
      nextSteps: [
        "Run database migrations",
        "Configure API keys",
        "Fix 19+ endpoint mismatches",
        "Complete Stripe integration",
      ],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/routes
 * All routes with status
 */
router.get('/routes', (req, res) => {
  try {
    res.json(routesRegistry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/services
 * All services with status
 */
router.get('/services', (req, res) => {
  try {
    res.json(servicesRegistry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/modules
 * All modules with status
 */
router.get('/modules', (req, res) => {
  try {
    res.json(modulesRegistry);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/blockers
 * Critical blockers only
 */
router.get('/blockers', (req, res) => {
  try {
    res.json({
      criticalBlockers: dashboard.getCriticalBlockers(),
      count: dashboard.getCriticalBlockers().length,
      phase1: "Must fix all blockers before Phase 2",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/timeline
 * Implementation timeline
 */
router.get('/timeline', (req, res) => {
  try {
    res.json(dashboard.getTimeline());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/team
 * Team assignments and readiness
 */
router.get('/team', (req, res) => {
  try {
    res.json(dashboard.getTeamReadiness());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/status/integration-health
 * Quick integration health check
 */
router.get('/integration-health', (req, res) => {
  try {
    res.json({
      status: "INTEGRATION_STATUS_READY",
      endpoints: {
        complete: "/api/status/complete",
        routes: "/api/status/routes",
        services: "/api/status/services",
        modules: "/api/status/modules",
        blockers: "/api/status/blockers",
        timeline: "/api/status/timeline",
        team: "/api/status/team",
      },
      totalRoutes: routesRegistry.summary?.totalRoutes || 226,
      totalServices: servicesRegistry.summary.total,
      totalModules: modulesRegistry.summary.total,
      readyForDeployment: false,
      blockerCount: dashboard.getCriticalBlockers().length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
