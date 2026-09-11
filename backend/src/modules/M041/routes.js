// Express routes for Village Registry (M041)
const express = require('express');
const router = express.Router();
const controller = require('./controller');
const connectivityController = require('./connectivityController');

router.post('/villages', controller.createVillage);
router.post('/villages/:villageId/resources', controller.addVillageResource);
router.get('/villages/:villageId/analytics', controller.getVillageAnalytics);

// Village connectivity: postal, roads, railway, airport, logistics and market access.
router.post('/connectivity/nodes', connectivityController.createNode);
router.post('/villages/:villageId/connectivity', connectivityController.linkVillage);
router.post('/villages/:villageId/roads', connectivityController.addRoad);
router.get('/villages/:villageId/connectivity', connectivityController.getMap);
router.post('/villages/:villageId/connectivity/assessment', connectivityController.upsertAssessment);
router.get('/villages/:villageId/connectivity/assessment', connectivityController.getAssessment);

module.exports = router;
