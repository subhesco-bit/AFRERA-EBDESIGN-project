/**
 * Digital Product Passport Service
 * CAP-269 to CAP-280: Unique Product ID, Lot/Batch Tracking, Farm Information,
 * Farmer Information, Certification Information, Processing History, Logistics History,
 * Sustainability Data, Carbon Data, Quality Reports, Recall Status, QR Code Generation
 *
 * (M11) Split from the former single-file services/digitalProductPassportService.js
 * into this directory, purely for code organization - behavior is unchanged.
 * Node module resolution treats `require('./services/digitalProductPassportService')`
 * as `./services/digitalProductPassportService.js` OR
 * `./services/digitalProductPassportService/index.js`, whichever exists, so
 * every existing caller anywhere in the codebase continues to resolve here
 * identically, unchanged.
 *
 * Each sub-module below is a fully-formed express.Router() covering one or
 * two CAP areas; mounting them with `router.use(subRouter)` (no path prefix)
 * preserves the exact same absolute paths (e.g. POST /product-id, GET
 * /passport/:product_id/:batch_id) that the original single-file router
 * served directly.
 *
 * Sub-modules:
 *  - coreIdentity.js   Unique Product ID (CAP-269), Lot/Batch Tracking (CAP-270)
 *  - provenance.js      Farm Info (CAP-271), Farmer Info (CAP-272), Certification Info (CAP-273)
 *  - lifecycle.js        Processing History (CAP-274), Logistics History (CAP-275)
 *  - impact.js            Sustainability Data (CAP-276), Carbon Data (CAP-277)
 *  - quality.js            Quality Reports (CAP-278), Recall Status (CAP-279)
 *  - qrAndPassport.js       QR Code Generation (CAP-280), aggregate passport lookup
 */

const express = require('express');

const router = express.Router();

router.use(require('./coreIdentity'));
router.use(require('./provenance'));
router.use(require('./lifecycle'));
router.use(require('./impact'));
router.use(require('./quality'));
router.use(require('./qrAndPassport'));

// Health check
function isHealthy() {
  return true;
}

module.exports = {
  router,
  isHealthy
};
