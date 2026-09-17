/**
 * Enterprise Route Support
 * Utility routes for enterprise features
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({
    success: true,
    module: 'enterpriseRouteSupport',
    status: 'operational'
  });
});

// 2026-09-16: index.js mounts this via `enterpriseRouteSupport.router`,
// but this file only ever exported the bare router - `.router` was
// undefined, and `app.use(path, undefined)` throws synchronously inside
// startup()'s try/catch, which calls process.exit(1) - this crashed the
// entire server at boot unconditionally, every time. Self-referencing
// `.router` keeps `require(...)` itself still usable as a plain router
// too (decisionSupportRoutes_merged.js/bulkOrderRoutes.js already
// destructure a separate, unused `protectRouter` from this same require
// - untouched here, still dead by design per their own comments).
module.exports = router;
module.exports.router = router;
