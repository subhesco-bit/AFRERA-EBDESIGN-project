// M077 - Water Quality Monitoring
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/measurements', controller.recordWaterQualityMeasurement);
router.get('/locations/:id/compliance', controller.getComplianceReport);
router.get('/locations/:id/monitor', controller.monitorWaterQuality);
router.post('/locations/:id/treatment', controller.generateTreatmentRecommendations);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
