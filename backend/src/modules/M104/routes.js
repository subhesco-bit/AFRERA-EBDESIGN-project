// Express routes for Equipment Rental (M104)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/list', controller.listEquipmentForRental);
router.post('/book', controller.bookEquipmentRental);
router.get('/performance/:id', controller.trackRentalPerformance);
router.get('/report/:ownerId', controller.generateRentalReport);

module.exports = router;
