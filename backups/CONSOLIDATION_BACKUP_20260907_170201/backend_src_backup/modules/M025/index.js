// M025 - Farmer Subsidies
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/schemes', controller.createSubsidyScheme);
router.post('/schemes/:schemeId/apply', controller.applyForSubsidy);
router.get('/farmers/:farmerId/recommendations', controller.getRecommendedSubsidies);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
