// Express routes for Village Registry (M041)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/villages', controller.createVillage);
router.post('/villages/:villageId/resources', controller.addVillageResource);
router.get('/villages/:villageId/analytics', controller.getVillageAnalytics);

module.exports = router;
