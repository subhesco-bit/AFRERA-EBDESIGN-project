// M041 - Village Registry
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/villages', controller.createVillage);
router.post('/villages/:villageId/resources', controller.addVillageResource);
router.get('/villages/:villageId/analytics', controller.getVillageAnalytics);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
