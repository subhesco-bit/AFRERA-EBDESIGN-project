'use strict';
/** Real port of pine-shadow src/lib/flows/index.ts (catalog fully ported;
 * run engine partially ported — see run.js header). This REPLACES the
 * fabricated backend/src/services/flows/loanFlow.js,
 * insuranceClaimFlow.js, and gstInvoiceFlow.js as the authoritative
 * pine-shadow flow source; those three files are kept (additive) but are
 * NOT pine-shadow ports and should not be described as such. */
module.exports = {
  ...require('./catalog'),
  ...require('./run'),
};
