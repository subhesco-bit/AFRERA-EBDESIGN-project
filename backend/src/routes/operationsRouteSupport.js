/**
 * Operations Route Support
 */

const express = require('express');
const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ success: true, module: 'operationsRouteSupport' });
});

// 2026-09-16: index.js mounts this via `operationsRouteSupport.router`,
// but this file only ever exported the bare router - `.router` was
// undefined, and `app.use(path, undefined)` throws synchronously inside
// startup()'s try/catch, which calls process.exit(1) - this crashed the
// entire server at boot unconditionally (not behind any env-var check),
// every time. Self-referencing `.router` keeps `require(...)` itself
// still usable as a plain router too (untouched, still used elsewhere).
module.exports = router;
module.exports.router = router;
