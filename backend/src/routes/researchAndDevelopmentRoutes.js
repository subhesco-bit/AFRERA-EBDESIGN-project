/**
 * research And Development Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'researchAndDevelopmentRoutes',
    message: 'Route operational',
    timestamp: new Date().toISOString()
  });
});

/**
 * Health check
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    module: 'researchAndDevelopmentRoutes'
  });
});

// 2026-09-17: found while auditing ResearchDashboardPage.jsx's
// researchAndDevelopmentAPI (getRDProjects/getCollaborations/getInnovations/
// getRDAnalytics/searchKnowledgeBase) against api.js - none of those
// methods existed. Traced the real backend:
// services/legacy/researchAndDevelopmentService.js is a genuine, 709-line,
// in-memory (Map-based, seeded with real-shaped sample projects via
// initializeDefaultData()) R&D management service with exactly these 5
// methods - its own AI-assistance method (generateAIResponse) was already
// honestly fixed 2026-09-01 to report "unavailable" instead of a
// Math.random() fabricated response, so nothing fabricated is being wired
// here. It just had no route file at all (this file, already mounted at
// /api/researchanddevelopment, was the "Route operational" scaffold in
// front of it - and routes/researchAndDevelopmentRoutes_merged.js, despite
// the usual "_merged.js is the real one" pattern, is ALSO just a dead
// scaffold here, the same rare exception as coldStorageRoutes_merged.js).
const rdService = require('../services/legacy/researchAndDevelopmentService.js');

router.get('/projects', (req, res) => {
  try {
    res.json({ success: true, data: rdService.getRDProjects(req.query) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/collaborations', (req, res) => {
  try {
    res.json({ success: true, data: rdService.getCollaborations(req.query) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/innovations', (req, res) => {
  try {
    res.json({ success: true, data: rdService.getInnovations(req.query) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/analytics', (req, res) => {
  try {
    res.json({ success: true, data: rdService.getRDAnalytics() });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/knowledge-base', (req, res) => {
  try {
    const { q, ...filters } = req.query;
    res.json({ success: true, data: rdService.searchKnowledgeBase(q, filters) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
