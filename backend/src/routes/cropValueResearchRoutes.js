/**
 * crop Value Research Routes
 */

const express = require('express');
const router = express.Router();

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

// 2026-09-17: cropValueResearchController.js (getPending/review, wrapping
// the real services/legacy/cropValueResearchService.js AI-suggestion review
// queue) was never wired to any route anywhere - CropValueReviewPage.jsx's
// cropValueResearchAPI.getPending()/review(id, approve) calls threw. Added
// here rather than as a new file since this scaffold is already mounted at
// /api/cropvalueresearch.
const cropValueResearchController = require('../controllers/cropValueResearchController');

router.get('/pending', cropValueResearchController.getPending);
router.post('/:id/review', cropValueResearchController.review);

/**
 * Main endpoint
 */
router.post('/', async (req, res) => {
  res.json({
    success: true,
    module: 'cropValueResearchRoutes',
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
    module: 'cropValueResearchRoutes'
  });
});

module.exports = router;
