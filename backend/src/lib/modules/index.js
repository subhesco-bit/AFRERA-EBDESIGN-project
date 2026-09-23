'use strict';
/** Real port of pine-shadow src/lib/modules's registry, workflows, and
 * charter (algorithms.ts, boot.server.ts, companion.ts/.server.ts, engine.ts,
 * fns.ts, store.ts, types.ts, and their two test files were not ported in
 * this pass — see .ai/COMPLETE_INTEGRATION_REPORT.html for the remaining
 * byte/line accounting). Replaces the earlier fabricated ModuleEngine class
 * (generic register/load/dependency-resolution engine with invented data). */
module.exports = {
  ...require('./registry'),
  ...require('./workflows'),
  ...require('./charter'),
};
