// M005 - Environment Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/environments', controller.createEnvironment);
router.get('/environments/:id', controller.getEnvironment);
router.put('/environments/:id', controller.updateEnvironment);
router.get('/environments', controller.listEnvironments);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
