// Express routes for Breakdown Maintenance (M107)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.listBreakdowns);
router.get('/:id', controller.getBreakdown);
router.post('/report', controller.reportBreakdown);
router.post('/repair/:id', controller.scheduleEmergencyRepair);
router.get('/downtime/:id', controller.trackDowntime);
router.get('/report/:farmerId', controller.generateBreakdownReport);

module.exports = router;
