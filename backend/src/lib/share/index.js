'use strict';
/** Real port of pine-shadow src/lib/share/index.ts. This is distinct from,
 * and more faithful than, the Phase 1A backend/src/services/share/ files
 * (gstEngine.js, tradingLedger.js, supplyChainTrace.js), which modeled
 * generic Indian GST slabs and buy/sell ledgers rather than pine-shadow's
 * actual "village shared-asset hour booking + HSN naming + organic trace"
 * model. Both are kept; see .ai/COMPLETE_INTEGRATION_REPORT.html. */
module.exports = {
  ...require('./catalog'),
  ...require('./book'),
  ...require('./gst'),
  ...require('./trace'),
};
