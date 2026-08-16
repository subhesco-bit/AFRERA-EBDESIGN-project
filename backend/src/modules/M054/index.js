// M054 - Customer Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/customers', controller.create);
router.get('/customers', controller.list);
router.get('/customers/:id', controller.get);
router.put('/customers/:id', controller.update);
router.delete('/customers/:id', controller.remove);
router.get('/customers/:id/insights', controller.getCustomerInsights);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
