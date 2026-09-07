// M056 - Payment Processing
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/payments/:id', controller.get);
router.post('/payments', controller.create);
router.put('/payments/:id/status', controller.updateStatus);
router.post('/payments/:id/refund', controller.refund);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
