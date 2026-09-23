'use strict';
/** Faithful port of the one non-TanStack-wrapper function in pine-shadow's
 * src/lib/modules/fns.ts (getModuleOs/runModuleWorkflow/consultModule
 * there are createServerFn wrappers around boot.server.js's
 * ensureModuleOs/executeWorkflow, already exposed directly here and via
 * the afreraKernel.js API routes). */

const { diagnose } = require('../library');
const { WORKFLOWS } = require('./workflows');
const { MODULE_RUNTIME, runtimeStats } = require('./registry');

function moduleCatalog() {
  return { modules: MODULE_RUNTIME, workflows: WORKFLOWS, diagnosis: diagnose(), stats: runtimeStats() };
}

module.exports = { moduleCatalog };
