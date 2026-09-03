'use strict';

const fs = require('fs');
const path = require('path');
const { buildModuleContract } = require('../src/core/moduleContract');

const modulesDir = path.join(__dirname, '..', 'src', 'modules');
const modules = fs.readdirSync(modulesDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && /^M\d+$/.test(entry.name))
  .map(entry => entry.name)
  .sort();

const report = modules.map(moduleId => {
  const servicePath = path.join(modulesDir, moduleId, 'service.js');
  const exists = fs.existsSync(servicePath);
  if (!exists) return { module_id: moduleId, ready: false, blockers: ['missing service.js'] };

  try {
    const service = require(servicePath);
    const contract = buildModuleContract(moduleId, service);
    const blockers = [];
    if (contract.operations.length === 0) blockers.push('no callable operations');
    if (!contract.ai_capabilities.includes('contextual_advisory')) blockers.push('missing AI advisory');
    return { module_id: moduleId, ready: blockers.length === 0, blockers, operation_count: contract.operations.length, decision_mode: contract.decision_mode };
  } catch (error) {
    return { module_id: moduleId, ready: false, blockers: [`load failure: ${error.message}`] };
  }
});

const summary = {
  generated_at: new Date().toISOString(),
  total_modules: report.length,
  ready_modules: report.filter(item => item.ready).length,
  blocked_modules: report.filter(item => !item.ready).length,
  modules: report
};

console.log(JSON.stringify(summary, null, 2));
process.exitCode = summary.blocked_modules > 0 ? 1 : 0;