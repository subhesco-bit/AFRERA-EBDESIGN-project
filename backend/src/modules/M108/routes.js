// Express routes for Fuel Management (M108)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/purchase', controller.recordFuelPurchase);
router.post('/consumption', controller.recordFuelConsumption);
router.get('/efficiency/:id', controller.trackFuelEfficiency);
router.get('/report/:farmerId', controller.generateFuelReport);

module.exports = router;
