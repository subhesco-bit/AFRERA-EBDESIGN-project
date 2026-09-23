'use strict';
/** Ported from pine-shadow src/lib/modules/registry.ts */

const { AI_SYSTEMS } = require('../systems/catalog');
const { WORKFLOWS } = require('./workflows');

const LAYERS = {
  orchestrator: ['middleware', 'workflow', 'api', 'platform'], coordinator: ['decision', 'comms', 'service'],
  fabric: ['middleware', 'decision', 'platform', 'api'], backbone: ['platform', 'service', 'middleware'],
  core: ['platform', 'service'], gateway: ['middleware', 'comms', 'api'], nervous: ['platform', 'middleware', 'workflow'],
  decision: ['decision', 'algorithm', 'workflow'], 'erp-agents': ['domain', 'workflow', 'algorithm', 'service'],
  factory: ['platform', 'api'], contract: ['platform', 'api', 'domain'], agentic: ['workflow', 'decision', 'ui'],
  copilot: ['ui', 'workflow', 'comms'], brain: ['decision', 'algorithm'], conversational: ['comms', 'ui'],
  voice: ['comms', 'ui'], advisory: ['domain', 'decision'], agricultural: ['domain', 'algorithm'],
  omnichannel: ['comms', 'domain'], selfheal: ['platform', 'workflow'], opsintel: ['domain', 'algorithm', 'ui'],
  complete: ['platform'], ecommerce: ['domain', 'algorithm'], media: ['domain', 'ui'], advanced: ['algorithm', 'decision'],
};

const ENTERPRISE = {
  orchestrator: 'Route one signal to one module. Sixteen mouths is a tumour.',
  coordinator: 'Consult the library, name an organ, then a model may speak.',
  fabric: 'Cost cap and guardrail under every organ. Spend on assertions is 0 paise.',
  backbone: 'Domain AIs attach once. Duplicate IDs are a fracture.',
  core: 'Core is fabric. Two modules sharing M400 is neither a module.',
  gateway: 'One door, one audit, one cost cap.', nervous: 'Unknown events fail. They do not forget.',
  decision: 'Sense, decide, act. A decision that cannot name a rupee path is decoration.',
  'erp-agents': 'Subscribe to harvest.completed. Human approves. ERP records.',
  factory: 'Plug moduleId to organs and events. A list of folders is not a nervous system.',
  contract: 'Operations, organs, emits, human command. Prefixes are doors.',
  agentic: 'Propose lot.mint on harvest. Cell approves. Companion never executes alone.',
  copilot: 'Next keystroke inside Books, not beside them.', brain: 'One brain. Scoring that names the organ it moved.',
  conversational: 'Voice of the companion. Not a product.', voice: "Dictate harvest in the cell's language, into agentic.",
  advisory: 'weather.alert that does not freeze EMI is gossip.', agricultural: 'Variety and season write the genome organ.',
  omnichannel: 'Same sack, many doors. Never a second catalog.', selfheal: 'Repair missing harvest.completed or do not use the word heal.',
  opsintel: 'Read village books. One ledger, one fever.', complete: 'Count living plugs. Do not claim complete.',
  ecommerce: 'Rank by declared farmer rupee, not SKU affinity.', media: 'GI marker in the frame of the same lot body.',
  advanced: 'Forecast as positioning. Fold into fabric. Never invent ₹.',
};

function layersFor(id) {
  return LAYERS[id] ?? ['service'];
}

const MODULE_RUNTIME = AI_SYSTEMS.map((s) => {
  const workflowIds = WORKFLOWS.filter((w) => w.steps.some((st) => st.moduleId === s.id)).map((w) => w.id);
  const rupeeWrite = false;
  const plug = workflowIds.length ? 'living' : 'missing';
  return {
    id: s.id, layers: layersFor(s.id), subscribes: s.organs.map((o) => `${o}.*`),
    emits: workflowIds.map((id) => `${s.id}.${id}`), rupeeWrite, workflowIds, plug,
    enterprise: ENTERPRISE[s.id] ?? s.contract,
  };
});

const MODULE_BY_ID = Object.fromEntries(MODULE_RUNTIME.map((m) => [m.id, m]));

function runtimeStats() {
  const living = MODULE_RUNTIME.filter((m) => m.plug === 'living').length;
  const partial = MODULE_RUNTIME.filter((m) => m.plug === 'partial').length;
  return { modules: MODULE_RUNTIME.length, livingPlugs: living, partialPlugs: partial, missingPlugs: MODULE_RUNTIME.length - living - partial, workflows: WORKFLOWS.length };
}

module.exports = { MODULE_RUNTIME, MODULE_BY_ID, runtimeStats };
