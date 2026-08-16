// M032 - Soil Analysis
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/samples', controller.createSoilSample);
router.get('/farmers/:farmerId/parcels/:parcelId/recommendations', controller.getSoilRecommendations);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
