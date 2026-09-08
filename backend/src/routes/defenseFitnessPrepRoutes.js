/**
 * Defense/Police/Border-Security Fitness Prep Routes.
 * Self-prep comparison tool only — see services/defenseFitnessPrepService.js header.
 */

const express = require('express');
const defenseFitnessPrepController = require('../controllers/defenseFitnessPrepController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

router.get('/categories', defenseFitnessPrepController.getCategories);
router.get('/standards/:category', defenseFitnessPrepController.getStandards);
router.post('/attempts', defenseFitnessPrepController.recordAttempt);
router.get('/readiness/:category', defenseFitnessPrepController.getReadiness);

module.exports = router;
