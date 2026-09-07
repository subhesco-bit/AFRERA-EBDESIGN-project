// Express routes for Spare Parts Management (M109)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.listSpareParts);
router.get('/:id', controller.getSparePart);
router.post('/register', controller.registerSparePart);
router.post('/consumption', controller.recordPartConsumption);
router.get('/status/:id', controller.trackInventoryStatus);
router.get('/report/:farmerId', controller.generateInventoryReport);

module.exports = router;
