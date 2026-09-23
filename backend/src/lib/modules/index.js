'use strict';
/** Real, complete port of pine-shadow src/lib/modules: registry,
 * workflows, charter, algorithms (ERP+firewall gates), engine (workflow
 * executor), companion (living agentic proposals), boot.server (real
 * Postgres persistence: module_runs/module_steps/module_messages/
 * module_state), companionServer, and fns (moduleCatalog). store.ts
 * (a Zustand client UI store) was not ported — see
 * .ai/COMPLETE_INTEGRATION_REPORT.html for why. Replaces the earlier
 * fabricated ModuleEngine class (generic register/load/dependency-
 * resolution engine with invented data). */
module.exports = {
  ...require('./registry'),
  ...require('./workflows'),
  ...require('./charter'),
  ...require('./algorithms'),
  ...require('./engine'),
  ...require('./companion'),
  ...require('./boot.server'),
  ...require('./companionServer'),
  ...require('./fns'),
};
