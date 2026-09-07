// M055 - Pricing Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/pricing-rules', controller.create);
router.get('/pricing-rules', controller.list);
router.get('/products/:id/dynamic-price', controller.get);
router.put('/pricing-rules/:id', controller.update);
router.delete('/pricing-rules/:id', controller.remove);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
