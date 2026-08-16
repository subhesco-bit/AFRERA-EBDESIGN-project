// Express routes for Implement Management (M102)
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/register', controller.registerImplement);
router.put('/maintenance/:id', controller.updateImplementMaintenance);
router.get('/usage/:id', controller.trackImplementUsage);
router.get('/report/:farmerId', controller.generateImplementReport);

module.exports = router;
