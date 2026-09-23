'use strict';
/** Honest charter: every concept and module against decision, flow, and boundary.
 * Ported from pine-shadow src/lib/modules/charter.ts */

const { CONCEPTS, BRIDGES, isolatedConcepts, latticeStats, livingDegreeMap } = require('../lattice/index');
const { cardsForOrgan } = require('../library/match');
const { AI_SYSTEMS } = require('../systems/catalog');
const { MODULE_RUNTIME } = require('./registry');
const { WORKFLOWS } = require('./workflows');

const CRITERIA = [
  { id: 'ai', label: 'AI embedded', asks: 'Does this module speak as AI on a named organ, or only as a file?' },
  { id: 'erp-algo', label: 'ERP algorithm', asks: 'Remaining, waterfall, journal, FIFO, qty-weight — integer grams and paise.' },
  { id: 'comms', label: 'Communication', asks: 'Does it emit on the bus, or open a second mouth?' },
  { id: 'workflow', label: 'Workflow', asks: 'Named steps on a living walk, not a folder list.' },
  { id: 'ops-flow', label: 'Operational flow', asks: 'Harvest → godown → offtake → settle, or only a consult?' },
  { id: 'process-flow', label: 'Process flow', asks: 'Harvest to saleable. in = out + declared loss.' },
  { id: 'tracking', label: 'Tracking', asks: 'Every step persists. Signals name lotId.' },
  { id: 'criteria', label: 'Decision criteria', asks: 'Named tests: remaining, price, paymentRef, pledge, balance.' },
  { id: 'boundary', label: 'Decision boundary', asks: 'AI rupeeWrite is false. Clerk declares ₹, kg, loss.' },
  { id: 'decide', label: 'How decided', asks: 'pass / block / defer / propose — never silent.' },
  { id: 'communicate', label: 'How communicated', asks: 'Bus envelope: decision, organ, lotId.' },
  { id: 'coordinate', label: 'How coordinated', asks: 'One orchestrator route. Coordinator consults library first.' },
  { id: 'implement', label: 'Implementation', asks: 'Organism plug vs GitHub WIRED skeleton. Do not conflate.' },
  { id: 'interact', label: 'Module interaction', asks: 'Who else is on the same walk when a decision is taken.' },
  { id: 'algo-eff', label: 'Algorithm efficiency', asks: 'O(n) FIFO, integer paise, last cell absorbs remainder.' },
  { id: 'code-eff', label: 'Coding efficiency', asks: 'One engine. GitHub 1KB re-exports are waste.' },
  { id: 'features', label: 'Features', asks: 'Contract, organs, emits, human command.' },
  { id: 'character', label: 'Characteristics', asks: 'Family, layers, plug status, rupeeWrite.' },
];

const DECISION_LAWS = [
  { id: 'L1', organ: 'lot', law: 'remaining ≥ 0 and remaining ≤ minted grams. One body.' },
  { id: 'L2', organ: 'lot', law: 'Offtake qty cannot exceed remaining. All-or-nothing FIFO.' },
  { id: 'L3', organ: 'rupee', law: 'salePricePerUnit is declared. AI never writes it.' },
  { id: 'L4', organ: 'logistics', law: 'Freight is declared as zero or more. Never inferred.' },
  { id: 'L5', organ: 'rupee', law: 'Journal debit cash = credit farmgate + freight.' },
  { id: 'L6', organ: 'orders', law: 'paymentRef required to settle. Empty is a defer, not a guess.' },
  { id: 'L7', organ: 'warehouse', law: 'Pledged receipts cannot sell until the lien clears.' },
  { id: 'L8', organ: 'ai', law: 'AI rupeeWrite is forbidden. Propose only.' },
  { id: 'L9', organ: 'farmer', law: 'Human command before any write. Companion never executes alone.' },
  { id: 'L10', organ: 'lot', law: 'Process: in_grams = out_grams + declared loss.' },
  { id: 'L11', organ: 'fpo', law: 'Farmgate splits qty-weighted. Last cell absorbs paise remainder.' },
  { id: 'L12', organ: 'spine', law: 'Unknown events fail. They do not forget.' },
];

const ERP_ALGS = new Set(['remaining-gate', 'price-waterfall', 'price-declared', 'journal-balance', 'qty-weighted', 'pledge-gate', 'payment-ref']);
const OPS = new Set(['harvest-mint', 'warehouse-intake', 'offtake-settle']);

function stepsOf(id) {
  return WORKFLOWS.flatMap((w) => w.steps.filter((s) => s.moduleId === id));
}

function coordinationHops() {
  const hops = [];
  for (const w of WORKFLOWS) {
    for (let i = 0; i < w.steps.length - 1; i++) {
      const a = w.steps[i];
      const b = w.steps[i + 1];
      hops.push({ workflowId: w.id, from: a.moduleId, to: b.moduleId, fromKind: a.kind, toKind: b.kind, organ: b.organ, emits: a.emits });
    }
  }
  return hops;
}

function workflowsOf(id) {
  return WORKFLOWS.filter((w) => w.steps.some((s) => s.moduleId === id)).map((w) => w.id);
}

function peers(id) {
  const set = new Set();
  for (const w of WORKFLOWS) {
    if (!w.steps.some((s) => s.moduleId === id)) continue;
    for (const s of w.steps) if (s.moduleId !== id) set.add(s.moduleId);
  }
  return [...set];
}

function check(id, status, evidence) {
  const meta = CRITERIA.find((c) => c.id === id);
  return { id, label: meta.label, status, evidence };
}

function auditModule(sys, runtime) {
  const steps = stepsOf(sys.id);
  const wfs = workflowsOf(sys.id);
  const other = peers(sys.id);
  const kinds = new Set(steps.map((s) => s.kind));
  const algs = new Set(steps.map((s) => s.algorithm));
  const hasAi = kinds.has('ai') || kinds.has('decision');
  const hasErp = [...algs].some((a) => ERP_ALGS.has(a)) || kinds.has('erp') || kinds.has('algorithm');
  const hasComms = runtime.layers.includes('comms') || kinds.has('comms') || kinds.has('message');
  const ops = wfs.some((w) => OPS.has(w));
  const process = algs.has('remaining-gate') || sys.id === 'decision' || sys.id === 'erp-agents';
  const coords = other.some((p) => p === 'orchestrator' || p === 'coordinator' || p === 'gateway' || p === 'fabric');
  const githubDead = sys.actual === 'skeleton' || sys.actual === 'stub' || sys.liveCallers === 0;

  return [
    check('ai', hasAi ? 'living' : sys.family === 'agent' ? 'partial' : 'missing', hasAi ? `${steps.filter((s) => s.kind === 'ai' || s.kind === 'decision').length} AI/decision steps` : 'No AI step on the bus'),
    check('erp-algo', hasErp ? 'living' : sys.organs.some((o) => ['lot', 'rupee', 'erp', 'farmer'].includes(o)) ? 'partial' : 'missing', hasErp ? [...algs].filter((a) => ERP_ALGS.has(a)).join(', ') || 'algorithm/erp kind' : 'No ERP algorithm'),
    check('comms', hasComms || runtime.emits.length > 0 ? (hasComms ? 'living' : 'partial') : 'missing', hasComms ? 'comms layer or step' : `${runtime.emits.length} emits`),
    check('workflow', wfs.length ? 'living' : 'missing', wfs.length ? wfs.join(', ') : 'unplugged'),
    check('ops-flow', ops ? 'living' : wfs.length ? 'partial' : 'missing', ops ? 'On harvest/godown/offtake' : wfs.length ? 'Consult/platform only' : 'No walk'),
    check('process-flow', process ? 'living' : algs.has('ai-firewall') ? 'partial' : 'missing', process ? 'remaining-gate / ERP agent on the body' : 'Does not shrink remaining'),
    check('tracking', wfs.length ? 'living' : 'missing', wfs.length ? 'module_steps persist every run' : 'No run to track'),
    check('criteria', kinds.has('gate') || [...algs].some((a) => ERP_ALGS.has(a)) ? 'living' : kinds.has('decision') ? 'partial' : 'missing', [...algs].join(', ') || 'none'),
    check('boundary', runtime.rupeeWrite ? 'missing' : 'living', runtime.rupeeWrite ? 'ILLEGAL rupeeWrite' : 'AI cannot write rupees'),
    check('decide', kinds.has('gate') || kinds.has('algorithm') || kinds.has('decision') ? 'living' : kinds.has('ai') ? 'partial' : 'missing', 'pass / block / defer / propose'),
    check('communicate', wfs.length ? 'living' : 'missing', 'Bus envelope decision+organ+lotId'),
    check('coordinate', coords ? 'living' : other.length ? 'partial' : 'missing', coords ? 'Shares a walk with orchestrator/coordinator/gateway/fabric' : `${other.length} peers`),
    check('implement', runtime.plug === 'living' && sys.isComplete ? 'living' : runtime.plug === 'living' ? 'partial' : 'missing', `Organism ${runtime.plug}. GitHub ${sys.actual}, isComplete ${sys.isComplete}, ${sys.liveCallers} callers, ${sys.bytesCanonical}B canonical.`),
    check('interact', other.length >= 2 ? 'living' : other.length === 1 ? 'partial' : 'missing', other.length ? other.slice(0, 8).join(', ') : 'solitary'),
    check('algo-eff', hasErp ? 'living' : algs.has('library-consult') ? 'partial' : 'missing', hasErp ? 'Integer grams/paise, O(n) FIFO, remainder on last cell' : 'Catalog scan or no numeric kernel'),
    check('code-eff', runtime.plug === 'living' && githubDead ? 'partial' : runtime.plug === 'living' ? 'living' : 'missing', githubDead ? 'Living kernel here; GitHub re-export is waste' : 'No living plug'),
    check('features', sys.contract.length > 40 ? 'living' : 'partial', sys.contract.slice(0, 120)),
    check('character', 'living', `${sys.family} · ${runtime.layers.join('/')} · organs ${sys.organs.join(',')}`),
  ];
}

function moduleCharter(sys) {
  const runtime = MODULE_RUNTIME.find((m) => m.id === sys.id);
  if (!runtime) throw new Error(`No runtime for ${sys.id}`);
  const checks = auditModule(sys, runtime);
  return {
    id: sys.id, name: sys.name, short: sys.short, family: sys.family, github: sys.actual, plug: runtime.plug,
    organs: sys.organs, workflows: workflowsOf(sys.id), peers: peers(sys.id),
    living: checks.filter((c) => c.status === 'living').length, partial: checks.filter((c) => c.status === 'partial').length,
    missing: checks.filter((c) => c.status === 'missing').length, checks, enterprise: runtime.enterprise,
  };
}

function conceptCharter(c, liveDeg) {
  const modules = AI_SYSTEMS.filter((s) => s.organs.includes(c.id)).map((s) => s.id);
  const workflows = WORKFLOWS.filter((w) => w.organ === c.id || w.steps.some((s) => s.organ === c.id)).map((w) => w.id);
  const laws = DECISION_LAWS.filter((l) => l.organ === c.id).map((l) => l.id);
  return {
    id: c.id, name: c.name, role: c.role ?? 'organ', status: c.status, layer: c.layer, degree: liveDeg[c.id] ?? 0,
    isolated: (liveDeg[c.id] ?? 0) === 0, modules, workflows: [...new Set(workflows)], library: cardsForOrgan(c.id).length,
    laws, thesis: c.thesis, silo: c.silo,
  };
}

function composeCharter() {
  const liveDeg = livingDegreeMap();
  const modules = AI_SYSTEMS.map(moduleCharter);
  const concepts = CONCEPTS.map((c) => conceptCharter(c, liveDeg));
  const criterionTotals = Object.fromEntries(CRITERIA.map((c) => [c.id, {
    living: modules.filter((m) => m.checks.find((x) => x.id === c.id)?.status === 'living').length,
    partial: modules.filter((m) => m.checks.find((x) => x.id === c.id)?.status === 'partial').length,
    missing: modules.filter((m) => m.checks.find((x) => x.id === c.id)?.status === 'missing').length,
  }]));
  const unpluggedOrgans = concepts.filter((c) => c.role === 'organ' && c.modules.length === 0 && c.workflows.length === 0).map((c) => c.id);
  return {
    criteria: CRITERIA, laws: DECISION_LAWS, modules, concepts, lattice: latticeStats(), isolated: isolatedConcepts().length,
    bridgesMissing: BRIDGES.filter((b) => b.status === 'missing').length,
    moduleLivingChecks: modules.reduce((n, m) => n + m.living, 0), modulePartialChecks: modules.reduce((n, m) => n + m.partial, 0),
    moduleMissingChecks: modules.reduce((n, m) => n + m.missing, 0), criterionTotals, unpluggedOrgans, hops: coordinationHops(),
  };
}

module.exports = { CRITERIA, DECISION_LAWS, coordinationHops, auditModule, moduleCharter, conceptCharter, composeCharter };
