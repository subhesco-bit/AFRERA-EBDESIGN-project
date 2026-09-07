// M122 - Cattle Registry
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/cattle', controller.registerCattle);
router.put('/cattle/:id/health', controller.updateCattleHealth);
router.get('/cattle/:id/performance', controller.trackCattlePerformance);
router.get('/farmer/:farmerId/report', controller.generateRegistryReport);
router.get('/cattle/:id/breeding', controller.getBreedingRecommendations);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
