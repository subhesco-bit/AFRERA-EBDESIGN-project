// M003 - Tenant Management
const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.post('/tenants', controller.createTenant);
router.get('/tenants/:id', controller.getTenant);
router.put('/tenants/:id', controller.updateTenant);
router.get('/tenants/:id/usage', controller.getTenantUsageMetrics);
router.get('/tenants', controller.listTenants);

module.exports = { 
  controller: require('./controller'), 
  service: require('./service'),
  router: router
};
