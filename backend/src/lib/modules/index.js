'use strict';
/** Real port of pine-shadow src/lib/modules: registry, workflows, charter,
 * and algorithms (the ERP+firewall gate functions that power flows/run.js).
 * boot.server.ts, companion.ts/.server.ts, engine.ts, fns.ts, store.ts,
 * types.ts and both test files were not ported — see
 * .ai/COMPLETE_INTEGRATION_REPORT.html. Replaces the earlier fabricated
 * ModuleEngine class (generic register/load/dependency-resolution engine
 * with invented data). */
module.exports = {
  ...require('./registry'),
  ...require('./workflows'),
  ...require('./charter'),
  ...require('./algorithms'),
  ...require('./engine'),
  ...require('./companion'),
};
