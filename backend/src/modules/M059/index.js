// M059 - Discount Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/discounts', controller.create);
router.get('/discounts/:id', controller.get);
router.put('/discounts/:id', controller.update);
router.delete('/discounts/:id', controller.remove);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
