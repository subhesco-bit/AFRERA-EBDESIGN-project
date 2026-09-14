/**
 * Farmer Training Routes
 * REST API routes for farmer training operations
 */

const express = require('express');
const farmerTrainingController = require('../controllers/farmerTrainingController');
const { authMiddleware } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const { logger } = require('../utils/logger');

const router = express.Router();

router.use(authMiddleware);
router.use(apiLimiter);

// Training Program Management
router.post('/programs', farmerTrainingController.createTrainingProgram);
router.post('/register', farmerTrainingController.registerForTraining);
router.get('/progress/:registrationId', farmerTrainingController.trackTrainingProgress);

// Compliance and Sustainability
router.post('/folu-assessment', farmerTrainingController.assessFOLUCompliance);
router.get('/carbon-footprint/:farmerId', farmerTrainingController.trackCarbonFootprint);
router.post('/compliance-report', farmerTrainingController.generateComplianceReport);

// Tracking and Analysis
router.get('/northeast-organic', farmerTrainingController.getNortheastOrganicTracking);

// Certifications and Recommendations
router.post('/certificates/:registrationId', farmerTrainingController.issueTrainingCertificate);
router.get('/recommendations/:farmerId', farmerTrainingController.getTrainingRecommendations);

module.exports = router;
