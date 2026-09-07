// Express routes for Poultry Management (M123)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/flocks', controller.registerPoultryFlock);
router.put('/flocks/:id/health', controller.updateFlockHealth);
router.get('/flocks/:id/performance', controller.trackFlockPerformance);
router.get('/farmers/:farmerId/report', controller.generatePoultryReport);

module.exports = router;
