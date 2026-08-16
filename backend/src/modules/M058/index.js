// M058 - Returns Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/returns', controller.create);
router.get('/returns/:id', controller.get);
router.put('/returns/:id/status', controller.updateStatus);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
