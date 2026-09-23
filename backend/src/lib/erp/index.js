'use strict';
/** Real port of pine-shadow src/lib/erp's pure kernel (kernel.ts, money.ts,
 * ids.ts, atlas.ts). This is additive to, and distinct from, the Phase 1B
 * generic double-entry files (chartOfAccounts.js, doubleEntryPosting.js,
 * subledgerManager.js, taxEngine.js, periodClose.js, bankReconciliation.js)
 * created before this repository's real source was compared line-by-line.
 * Those Phase 1B files model conventional accounting; this kernel models
 * pine-shadow's actual grams/paise mass-conservation ERP for Northeast India
 * rice/ginger. Both are kept — see .ai/COMPLETE_INTEGRATION_REPORT.html. */
module.exports = {
  ...require('./kernel'),
  ...require('./money'),
  ...require('./ids'),
  ...require('./atlas'),
};
