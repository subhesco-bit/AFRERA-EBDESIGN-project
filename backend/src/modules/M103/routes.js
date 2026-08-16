// Express routes for Equipment Inventory (M103)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/register', controller.registerEquipment);
router.put('/status/:id', controller.updateEquipmentStatus);
router.get('/utilization/:id', controller.trackEquipmentUtilization);
router.get('/report/:farmerId', controller.generateInventoryReport);

module.exports = router;
