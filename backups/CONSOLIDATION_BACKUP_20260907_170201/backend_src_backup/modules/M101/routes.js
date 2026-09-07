// Express routes for Tractor Management (M101)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/register', controller.registerTractor);
router.put('/maintenance/:id', controller.updateTractorMaintenance);
router.get('/performance/:id', controller.trackTractorPerformance);
router.get('/report/:farmerId', controller.generateTractorReport);

module.exports = router;
