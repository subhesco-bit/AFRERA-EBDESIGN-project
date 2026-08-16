/**
 * Crop Value-Compound Research Routes — "when a product is added, AI
 * searches and adds/updates" the published reference data. See
 * services/cropValueResearchService.js header for the review-before-trust
 * discipline: every write from here lands unverified.
 */

const express = require('express');
const cropValueResearchController = require('../controllers/cropValueResearchController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authMiddleware);
router.use(rateLimiter);

router.get('/status', cropValueResearchController.getProviderStatus);
router.post('/research', cropValueResearchController.research);
router.get('/pending', requireRole('admin'), cropValueResearchController.getPending);
router.post('/pending/:id/review', requireRole('admin'), cropValueResearchController.review);

module.exports = router;
