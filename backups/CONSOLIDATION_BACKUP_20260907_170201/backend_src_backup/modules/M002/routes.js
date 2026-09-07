// Express routes for Platform Configuration (M002)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/configurations', controller.createConfiguration);
router.get('/configurations/:key', controller.getConfiguration);
router.put('/configurations/:id', controller.updateConfiguration);
router.post('/configurations/bulk', controller.bulkUpdateConfigurations);
router.get('/configurations/:id/history', controller.getConfigurationHistory);

module.exports = router;
