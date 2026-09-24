#!/usr/bin/env node
/**
 * Documentation + helper: how stub routes get real logic.
 *
 * Pattern for any thin Mxxx router:
 *
 *   const { attachOperateRoutes } = require('../core/universalModuleRuntime');
 *   const router = express.Router();
 *   attachOperateRoutes(router, 'M826100_ECOMMERCE');
 *   module.exports = router;
 *
 * Or mount catch-all:
 *   app.use('/api/v1/modules/:moduleId', require('./routes/universalModuleRoutes'));
 *
 * Domain-critical paths (checkout, wallet, subsidy, insurance corporate,
 * dynamic pricing, engineering) keep specialized engines — they already
 * replaced stubs with full logic on consolidated/final.
 */

console.log(`
AFRERA anti-stub runtime
========================
Specialized real engines (do not overwrite):
  - ecommerce/checkoutOrchestrator + returns RMA
  - ecommerce/dynamicPricingEngine
  - commerce/wallet + preseason
  - farmer/contractFarming
  - insurance/corporateInsurancePlatform
  - research-grade/* (subsidy, ERP, logistics, MEP, AI gateway)
  - baseline platform (trust, events, registry scan)
  - engineering structural/solar/thermal

Universal fallback for remaining Mxxx:
  GET/POST /api/v1/modules/:moduleId/...
  → UniversalModuleRuntime (CRUD + state machine by domain keyword)

Every response includes stub:false and real_logic:true when using runtime.
`);
