'use strict';
/** Ported from pine-shadow src/lib/modules/workflows.ts */

function step(code, moduleId, name, kind, organ, algorithm, emits, rupeeWrite = false) {
  return { code, moduleId, name, kind, organ, algorithm, emits, rupeeWrite };
}

const WORKFLOWS = [
  { id: 'platform-bus', name: 'Platform bus', thesis: 'Attach every named AI as a module of one nerve. Count plugs. Do not say complete.', organ: 'module', enterprise: 'platform', steps: [
    step('P1', 'backbone', 'Attach backbone', 'platform', 'spine', 'human-command', 'backbone.attach'),
    step('P2', 'core', 'Core is fabric', 'platform', 'ai', 'ai-firewall', 'core.fold'),
    step('P3', 'factory', 'Plug directories', 'platform', 'module', 'count-plugs', 'factory.plug'),
    step('P4', 'contract', 'Bind organs', 'platform', 'module', 'human-command', 'contract.bind'),
    step('P5', 'nervous', 'Register events', 'platform', 'spine', 'human-command', 'nervous.register'),
    step('P6', 'complete', 'Count living plugs', 'platform', 'ai', 'count-plugs', 'complete.count'),
    step('P7', 'selfheal', 'Heal missing harvest pulse', 'platform', 'spine', 'library-consult', 'selfheal.repair'),
  ] },
  { id: 'harvest-mint', name: 'Harvest mint', thesis: 'A harvest names a cell and mints one lot. AI proposes. The clerk declares mass. Remaining = grams.', organ: 'lot', enterprise: 'rural-erp', steps: [
    step('H1', 'contract', 'Human command', 'gate', 'farmer', 'human-command', 'contract.command'),
    step('H2', 'gateway', 'One door', 'middleware', 'spine', 'ai-firewall', 'gateway.ingress'),
    step('H3', 'orchestrator', 'Route harvest', 'middleware', 'spine', 'orchestrator-route', 'orchestrator.route'),
    step('H4', 'fabric', 'Cost cap 0 paise', 'decision', 'rupee', 'ai-firewall', 'fabric.allow'),
    step('H5', 'coordinator', 'Consult library', 'ai', 'ai', 'library-consult', 'coordinator.consult'),
    step('H6', 'nervous', 'Subscribe harvest.completed', 'middleware', 'spine', 'human-command', 'nervous.subscribe'),
    step('H7', 'decision', 'Mass is declared', 'algorithm', 'lot', 'remaining-gate', 'decision.act'),
    step('H8', 'erp-agents', 'Propose lot.mint', 'ai', 'lot', 'human-command', 'erpAgent.propose'),
    step('H9', 'agentic', 'Companion proposes', 'ai', 'farmer', 'copilot-next', 'agentic.propose'),
    step('H10', 'opsintel', 'Read village books', 'algorithm', 'erp', 'remaining-gate', 'opsintel.read'),
    step('H11', 'copilot', 'Next keystroke', 'ai', 'erp', 'copilot-next', 'copilot.suggest'),
  ] },
  { id: 'warehouse-intake', name: 'Warehouse intake', thesis: 'The same lot body inwards. Media frames the GI marker. Channels share the sack.', organ: 'warehouse', enterprise: 'rural-erp', steps: [
    step('W1', 'decision', 'Remaining mass', 'gate', 'lot', 'remaining-gate', 'decision.remaining'),
    step('W2', 'erp-agents', 'Inward receipt', 'erp', 'warehouse', 'remaining-gate', 'warehouse.intake'),
    step('W3', 'media', 'GI in the frame', 'ai', 'trace', 'gi-frame', 'media.attach'),
    step('W4', 'omnichannel', 'Same sack, many doors', 'comms', 'marketplace', 'gi-frame', 'omnichannel.list'),
    step('W5', 'decision', 'Lien gate', 'gate', 'warehouse', 'pledge-gate', 'decision.lien'),
    step('W6', 'copilot', 'Next keystroke', 'ai', 'erp', 'copilot-next', 'copilot.suggest'),
  ] },
  { id: 'offtake-settle', name: 'Offtake settle', thesis: 'Declared ₹/kg. Freight declared (zero allowed). Journal balances. paymentRef required.', organ: 'orders', enterprise: 'rural-erp', steps: [
    step('T1', 'decision', 'Remaining holds', 'gate', 'lot', 'remaining-gate', 'decision.hold'),
    step('T1b', 'media', 'GI claim needs a mint', 'gate', 'trace', 'gi-claim', 'trace.claim'),
    step('T2', 'fabric', 'AI cannot write price', 'decision', 'rupee', 'ai-firewall', 'fabric.allow'),
    step('T3', 'erp-agents', 'Price declared', 'erp', 'marketplace', 'price-declared', 'orders.price'),
    step('T4', 'decision', 'Price waterfall', 'algorithm', 'rupee', 'price-waterfall', 'decision.waterfall'),
    step('T5', 'ecommerce', 'Rank by declared FUS', 'ai', 'marketplace', 'fvie-rank', 'ecom.rank'),
    step('T6', 'brain', 'Name the organ moved', 'ai', 'rupee', 'fvie-rank', 'brain.decide'),
    step('T7', 'backbone', 'Journal balance', 'algorithm', 'rupee', 'journal-balance', 'backbone.journal'),
    step('T8', 'erp-agents', 'paymentRef', 'gate', 'orders', 'payment-ref', 'orders.settle'),
    step('T9', 'decision', 'Qty-weighted payout', 'algorithm', 'fpo', 'qty-weighted', 'fpo.payout'),
    step('T10', 'advisory', 'Hours-to-pay', 'ai', 'farmer', 'hours-to-pay', 'advisory.explain'),
    step('T11', 'copilot', 'Next keystroke', 'ai', 'erp', 'copilot-next', 'copilot.suggest'),
  ] },
  { id: 'nerve-consult', name: 'Nerve consult', thesis: 'Gateway, coordinator, library. Mouths are tissues of the companion. No rupee write.', organ: 'ai', enterprise: 'intelligence', steps: [
    step('N1', 'gateway', 'Ingress consult', 'middleware', 'spine', 'ai-firewall', 'gateway.ingress'),
    step('N2', 'coordinator', 'Library first', 'ai', 'ai', 'library-consult', 'coordinator.consult'),
    step('N3', 'conversational', 'Mouth of companion', 'comms', 'farmer', 'library-consult', 'conversational.say'),
    step('N4', 'voice', 'Door in the cell language', 'comms', 'household', 'copilot-next', 'voice.dictate'),
    step('N5', 'agentic', 'Propose next gate', 'ai', 'farmer', 'copilot-next', 'agentic.propose'),
    step('N6', 'complete', 'Count plugs', 'platform', 'ai', 'count-plugs', 'complete.count'),
    step('N7', 'copilot', 'Next keystroke', 'ai', 'erp', 'copilot-next', 'copilot.suggest'),
  ] },
  { id: 'domain-advise', name: 'Domain advise', thesis: 'Variety, weather, forecast as positioning. EMI pause is a rupee path. Prices stay declared.', organ: 'crop', enterprise: 'intelligence', steps: [
    step('D1', 'agricultural', 'Genome organ', 'domain', 'crop', 'library-consult', 'agri.advise'),
    step('D2', 'advisory', 'Weather reflex', 'ai', 'soil', 'weather-reflex', 'advisory.weather'),
    step('D3', 'advanced', 'Forecast as positioning', 'ai', 'ai', 'ai-firewall', 'advanced.score'),
    step('D4', 'fabric', 'No invented ₹', 'decision', 'rupee', 'ai-firewall', 'fabric.allow'),
    step('D5', 'decision', 'Scheme eligibility, rupees blank', 'decision', 'finance', 'scheme-eligible', 'decision.act'),
  ] },
  { id: 'claim-file', name: 'Claim file', thesis: 'Weather alert opens a claim. Payout stays undeclared. EMI is not frozen.', organ: 'insurance', enterprise: 'rural-erp', steps: [
    step('C1', 'advisory', 'Hazard declared', 'gate', 'soil', 'weather-reflex', 'advisory.weather'),
    step('C2', 'fabric', 'No invented payout', 'decision', 'rupee', 'ai-firewall', 'fabric.allow'),
    step('C3', 'decision', 'File claim window', 'algorithm', 'insurance', 'human-command', 'claim.file'),
    step('C4', 'agentic', 'Propose only', 'ai', 'farmer', 'copilot-next', 'agentic.propose'),
  ] },
  { id: 'period-close', name: 'Period close', thesis: 'Clerk closes Magh. Unbalanced journal cannot close. No invented ₹.', organ: 'erp', enterprise: 'rural-erp', steps: [
    step('R1', 'decision', 'Journal balanced', 'gate', 'erp', 'journal-balance', 'decision.balance'),
    step('R2', 'fabric', 'SoD clerk', 'decision', 'rupee', 'ai-firewall', 'fabric.allow'),
    step('R3', 'opsintel', 'Close season', 'algorithm', 'erp', 'human-command', 'period.close'),
  ] },
  { id: 'climate-reflex', name: 'Climate reflex', thesis: 'Alert + outage blocks the mill. Remaining moves only on clerk-declared loss.', organ: 'reflex', enterprise: 'intelligence', steps: [
    step('X1', 'advisory', 'Weather + energy', 'gate', 'soil', 'weather-reflex', 'advisory.weather'),
    step('X2', 'decision', 'Block mill on outage', 'gate', 'recie', 'energy-cloud', 'decision.block'),
    step('X3', 'agentic', 'Propose spoilage', 'ai', 'farmer', 'copilot-next', 'agentic.propose'),
    step('X4', 'decision', 'Clerk names grams', 'algorithm', 'lot', 'remaining-gate', 'decision.act'),
  ] },
];

const WORKFLOW_BY_ID = Object.fromEntries(WORKFLOWS.map((w) => [w.id, w]));

function workflowsForModule(moduleId) {
  return WORKFLOWS.filter((w) => w.steps.some((s) => s.moduleId === moduleId));
}

module.exports = { WORKFLOWS, WORKFLOW_BY_ID, workflowsForModule };
