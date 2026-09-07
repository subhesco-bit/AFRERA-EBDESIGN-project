// Express routes for Animal Health Management (M127)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/health-records', controller.createHealthRecord);
router.post('/vaccinations', controller.scheduleVaccination);
router.get('/farmers/:farmerId/herd-health', controller.monitorHerdHealth);
router.get('/farmers/:farmerId/health-report', controller.generateHealthReport);

module.exports = router;
