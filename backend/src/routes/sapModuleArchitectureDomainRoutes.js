/**
 * Real backend routes for SAPModuleArchitecturePage.jsx's 19 action cards,
 * backed by services/legacy/sapModuleArchitectureService.js (an in-memory
 * module registry - no DB dependency, synchronous methods).
 *
 * Every entry verified 1:1 against actual onRun calls in the page. The
 * service has no getServiceHealth method - implemented as a simple inline
 * check rather than inventing service-level behavior that doesn't exist.
 */
'use strict';

const express = require('express');
const router = express.Router();
const sapArch = require('../services/legacy/sapModuleArchitectureService');

try {
  const { authMiddleware } = require('../middleware/auth');
  router.use(authMiddleware);
} catch (e) {
  // Auth optional
}

const wrap = (fn) => (req, res) => {
  try {
    res.json({ success: true, data: fn(req) });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/sap-module-architecture/overview', wrap(() => sapArch.getArchitectureOverview()));
router.get('/sap-module-architecture/dependency-graph', wrap(() => sapArch.getDependencyGraph()));
router.get('/sap-module-architecture/modules', wrap(() => sapArch.getAllModules()));
router.get('/sap-module-architecture/modules/by-type/:type', wrap((req) => sapArch.getModulesByType(req.params.type)));
router.post('/sap-module-architecture/module', wrap((req) => sapArch.registerModule(req.body.id, req.body)));
router.get('/sap-module-architecture/module/:id', wrap((req) => sapArch.getModule(req.params.id)));
router.put('/sap-module-architecture/module/:id', wrap((req) => sapArch.updateModule(req.params.id, req.body)));
router.delete('/sap-module-architecture/module/:id', wrap((req) => sapArch.deleteModule(req.params.id)));
router.post('/sap-module-architecture/module/:id/transition', wrap((req) => sapArch.transitionModuleState(req.params.id, req.body.new_state)));
router.get('/sap-module-architecture/module/:id/dependencies', wrap((req) => sapArch.getModuleDependencies(req.params.id)));
router.get('/sap-module-architecture/module/:id/resolve-dependencies', wrap((req) => sapArch.resolveDependencies(req.params.id)));
router.get('/sap-module-architecture/module/:id/configuration', wrap((req) => sapArch.getModuleConfiguration(req.params.id)));
router.put('/sap-module-architecture/module/:id/configuration', wrap((req) => sapArch.setModuleConfiguration(req.params.id, req.body)));
router.get('/sap-module-architecture/module/:id/version', wrap((req) => sapArch.getModuleVersion(req.params.id)));
router.put('/sap-module-architecture/module/:id/version', wrap((req) => sapArch.updateModuleVersion(req.params.id, req.body.version)));
router.get('/sap-module-architecture/module/:id/compatibility', wrap((req) => sapArch.getModuleCompatibility(req.params.id)));
router.get('/sap-module-architecture/module/:id/mta-descriptor', wrap((req) => sapArch.generateMTADescriptor(req.params.id)));
router.get('/sap-module-architecture/module/:id/lifecycle', wrap((req) => sapArch.getModuleLifecycle(req.params.id)));
router.get('/sap-module-architecture/health', wrap(() => ({ status: 'healthy', service: 'sapModuleArchitectureService' })));

module.exports = router;
