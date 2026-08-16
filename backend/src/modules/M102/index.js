// M102 - Implement Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/register', controller.registerImplement);
router.put('/maintenance/:id', controller.updateImplementMaintenance);
router.get('/usage/:id', controller.trackImplementUsage);
router.get('/report/:farmerId', controller.generateImplementReport);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
