from pathlib import Path

# aiSystem integration
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\aiSystem.js')
t=p.read_text(encoding='utf-8')
anchor="""  // ---- 6. ERP agents ---------------------------------------------------
  // Not started — they are invoked on demand through aiOrchestrator's
  // workflow_engine entry. Recorded so the inventory is not silent about them.
  try {
    const erpAgents = require('../erpAgents');
    record('erpAgents', true, {
      agents: erpAgents.listAgents().length,
      note: 'on-demand via aiOrchestrator; not scheduled',
    });
  } catch (error) {
    record('erpAgents', false, { error: error.message });
  }

  state.started = true;
"""
replacement="""  // ---- 6. ERP proposal agents (legacy embedded compatibility) ----------
  try {
    const erpAgents = require('../erpAgents');
    record('erpAgents', true, {
      agents: erpAgents.listAgents().length,
      note: 'on-demand embedded proposal rules; execution authority remains outside AI',
    });
  } catch (error) {
    record('erpAgents', false, { error: error.message });
  }

  // ---- 7. isolated hybrid agent/domain backbone -----------------------
  try {
    const completion = require('./aiCompletionRegistry').build();
    record('agentTemplateRegistry', completion.codeComplete, {
      templates: completion.agents.templates,
      streams: completion.agents.streams,
      domains: completion.domains.coveredDomains,
      codeBlockers: completion.codeBlockers,
    });
    const dual = require('./dualBackboneOrchestrator').health();
    record('dualBackbone', dual.status === 'healthy', dual);
    record('memoryRouter', completion.memory.status === 'ready', completion.memory);
    record('evaluationRegistry', completion.evaluation.status === 'ready', completion.evaluation);
  } catch (error) {
    record('agentTemplateRegistry', false, { error: error.message });
  }

  state.started = true;
"""
if anchor not in t: raise RuntimeError('aiSystem ERP anchor missing')
t=t.replace(anchor,replacement,1)
old="""  return {
    started: state.started,
    startedAt: state.startedAt,
    healthy: state.started && degraded.length === 0,
    components,
    summary: { started, degraded },
    capabilities,
    integration,
  };
"""
new="""  let completion = null;
  try { completion = require('./aiCompletionRegistry').build(); } catch (error) { completion = { codeComplete: false, codeBlockers: ['completion_status_error'], error: error.message }; }

  return {
    started: state.started,
    startedAt: state.startedAt,
    healthy: state.started && degraded.length === 0 && completion.codeComplete === true,
    runtimeFullyOperational: completion.runtimeFullyOperational === true,
    components,
    summary: { started, degraded },
    capabilities,
    integration,
    completion,
  };
"""
if old not in t: raise RuntimeError('aiSystem status return missing')
t=t.replace(old,new,1)
p.write_text(t,encoding='utf-8')

# Audit IDs: cryptographic uniqueness instead of Math.random.
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\core\ai\aiAuditLogger.js')
t=p.read_text(encoding='utf-8')
if "require('crypto')" not in t:
    t=t.replace("const pool = require('../../database/pool');","const pool = require('../../database/pool');\nconst { randomUUID } = require('crypto');",1)
t=t.replace("return `AUD-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;","return `AUD-${randomUUID()}`;")
t=t.replace("return `TRACE-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;","return `TRACE-${randomUUID()}`;")
p.write_text(t,encoding='utf-8')
print('aiSystem completion integration and audit IDs patched')