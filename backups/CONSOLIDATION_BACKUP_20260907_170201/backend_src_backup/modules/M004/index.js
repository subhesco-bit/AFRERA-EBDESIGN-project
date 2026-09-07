// M004 - Organization Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/organizations', controller.createOrganization);
router.get('/organizations/:id', controller.getOrganization);
router.put('/organizations/:id', controller.updateOrganization);
router.get('/organizations', controller.listOrganizations);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
