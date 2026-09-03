'use strict';

const READ_PREFIXES = ['get', 'list', 'search', 'find', 'calculate', 'analyze', 'check', 'validate', 'preview'];
const WRITE_PREFIXES = ['create', 'add', 'update', 'edit', 'delete', 'remove', 'submit', 'approve', 'reject', 'execute', 'assign', 'record'];

function classifyOperation(name) {
  const lower = name.toLowerCase();
  if (WRITE_PREFIXES.some(prefix => lower.startsWith(prefix))) return 'command';
  if (READ_PREFIXES.some(prefix => lower.startsWith(prefix))) return 'query';
  return 'capability';
}

function buildModuleContract(moduleId, moduleExports, metadata = {}) {
  const operations = Object.keys(moduleExports || {})
    .filter(key => typeof moduleExports[key] === 'function')
    .map(name => ({ name, kind: classifyOperation(name), arity: moduleExports[name].length }));
  return {
    contract_version: '1.0',
    module_id: moduleId,
    domain: metadata.domain || moduleId.toLowerCase(),
    operations,
    decision_mode: operations.some(operation => operation.kind === 'command') ? 'ai_proposes_human_approves' : 'advisory_only',
    dependencies: Array.isArray(metadata.dependencies) ? metadata.dependencies : [],
    emits: `${moduleId.toLowerCase()}.*`,
    ai_capabilities: ['contextual_advisory', 'operation_selection', 'risk_flagging'],
    safety: {
      executes_commands: false,
      requires_human_approval_for_commands: true,
      provenance_required: true
    }
  };
}

module.exports = { classifyOperation, buildModuleContract };
