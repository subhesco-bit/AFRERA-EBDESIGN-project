// M031 - Land Registry
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/parcels', controller.createLandParcel);
router.post('/parcels/:parcelId/transfer', controller.transferLandOwnership);
router.get('/farmers/:farmerId/land', controller.getLandByFarmer);
router.get('/analytics', controller.getLandAnalytics);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
