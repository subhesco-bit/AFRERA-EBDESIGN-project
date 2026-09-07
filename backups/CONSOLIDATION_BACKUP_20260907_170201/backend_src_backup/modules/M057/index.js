// M057 - Shipping Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/shipments', controller.create);
router.get('/shipments/:id', controller.track);
router.put('/shipments/:id/status', controller.updateStatus);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
