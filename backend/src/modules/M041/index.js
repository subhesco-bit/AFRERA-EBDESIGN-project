// M041 - Village Registry
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/villages', controller.getVillages);
router.get('/villages/:villageId', controller.getVillage);
router.post('/villages', controller.createVillage);
router.put('/villages/:villageId', controller.updateVillage);
router.delete('/villages/:villageId', controller.deleteVillage);
router.post('/villages/:villageId/resources', controller.addVillageResource);
router.get('/villages/:villageId/analytics', controller.getVillageAnalytics);

module.exports = {
  controller: require('./controller'),
  service: require('./service'),
  router,
};
