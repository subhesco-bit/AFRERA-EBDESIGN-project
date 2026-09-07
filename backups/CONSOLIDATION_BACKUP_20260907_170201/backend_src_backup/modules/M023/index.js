// M023 - Farmer Training
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/programs', controller.createTrainingProgram);
router.post('/sessions', controller.createTrainingSession);
router.post('/sessions/:sessionId/enroll', controller.enrollFarmer);
router.post('/sessions/:sessionId/attendance/:farmerId', controller.recordAttendance);
router.post('/assessments/:assessmentId/submit', controller.submitAssessment);
router.get('/farmers/:farmerId/recommendations', controller.getRecommendedPrograms);
router.get('/analytics', controller.getTrainingAnalytics);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
