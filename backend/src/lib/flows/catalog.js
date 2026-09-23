'use strict';
/** Eleven flow families. Map, do not metaphor. Finance and procure stay missing.
 * Ported from pine-shadow src/lib/flows/catalog.ts — the REAL flow taxonomy.
 *
 * This replaces the earlier fabricated backend/src/services/flows/ files
 * (loanFlow.js, insuranceClaimFlow.js, gstInvoiceFlow.js), which do not
 * correspond to anything in pine-shadow's actual source: pine-shadow has no
 * "loan flow" (loans are explicitly refused — see os/suitability.js) and no
 * generic GST invoice flow. The real flow catalog is these 11 process
 * families: strategy, work, process, payment, material, vision, decision,
 * command, coordination, algorithms, supply chain. Those three fabricated
 * files are left in place (additive, not deleted) but should not be
 * presented as pine-shadow ports. */

function n(id, name, algorithm, organ, status, opts) {
  const extra = typeof opts === 'string' ? { lane: opts } : (opts ?? {});
  return { id, name, algorithm, organ, status, lane: extra.lane, shape: extra.shape };
}

function flow(id, name, human, thesis, missing, href, layout, nodes, groups) {
  return { id, name, human, thesis, missing, href, layout, nodes, groups };
}

const FLOWS = [
  flow('strategy', 'Strategy', 'What the village will not fake',
    'Remaining-first. Dual-truth. Refuse loan, tourism, invented ₹. Clerk writes remaining. Lattice ~39%. GitHub 7%.',
    'National strategy, credit underwriting, gazette twins.', '/os', 'branch', [
      n('s-truth', 'Dual-truth', 'dual-truth', 'os', 'living', { shape: 'start' }),
      n('s-remain', 'Remaining first', 'remaining-gate', 'lot', 'living'),
      n('s-loan', 'Refuse loan', 'suit-loan', 'finance', 'living', { shape: 'decision' }),
      n('s-tour', 'Refuse tourism', 'suit-tourism', 'demand', 'living', { shape: 'decision' }),
      n('s-rupee', 'Refuse invented ₹', 'ai-firewall', 'rupee', 'living', { shape: 'decision' }),
      n('s-next', 'Next clerk act', 'copilot-next', 'farmer', 'living', { shape: 'end' }),
    ], [
      { label: 'Spine', ids: ['s-truth', 's-remain'], kind: 'stack' },
      { label: 'Refuse', ids: ['s-loan', 's-tour', 's-rupee'], kind: 'refuse' },
      { label: 'Act', ids: ['s-next'], kind: 'stack' },
    ]),
  flow('work', 'Work', 'Clerk walks the books',
    'Harvest mint → godown inward → offtake settle → claim file → Magh close. AI proposes. Clerk writes.',
    'Booking, RFQ, loan, subsidy, recall.', '/modules', 'pipeline', [
      n('w-mint', 'Harvest mint', 'remaining-gate', 'lot', 'living', { shape: 'start' }),
      n('w-in', 'Godown inward', 'remaining-gate', 'warehouse', 'living'),
      n('w-sell', 'Offtake', 'price-declared', 'orders', 'living'),
      n('w-claim', 'Claim file', 'weather-reflex', 'insurance', 'living'),
      n('w-close', 'Period close', 'journal-balance', 'erp', 'living', { shape: 'end' }),
    ], [{ label: 'Clerk walk', ids: ['w-mint', 'w-in', 'w-sell', 'w-claim', 'w-close'], kind: 'stack' }]),
  flow('process', 'Process', 'Mill muscle',
    'Mill contracts only when millDecision passes. Heat, alert, outage rest the mill. EMI not frozen. Remaining unmoved without clerk loss.',
    'Humanoid teleop. Factory twins. CFD.', '/warehouse', 'pipeline', [
      n('p-hear', 'Hear signals', 'weather-reflex', 'reflex', 'living', { shape: 'start' }),
      n('p-mill', 'Mill gate', 'mill-decision', 'warehouse', 'living', { shape: 'decision' }),
      n('p-energy', 'Energy window', 'energy-cloud', 'recie', 'partial'),
      n('p-hold', 'Hold remaining', 'remaining-gate', 'lot', 'living'),
      n('p-spoil', 'Spoilage cut', 'spoilage-mass', 'rcop', 'living', { shape: 'end' }),
    ], [{ label: 'Mill muscle', ids: ['p-hear', 'p-mill', 'p-energy', 'p-hold', 'p-spoil'], kind: 'stack' }]),
  flow('payment', 'Payment', 'Declared ₹ only',
    'Firewall → remaining → declared ₹/kg → freight (zero allowed) → waterfall → journal → paymentRef → qty-weighted split. AI cannot write rupees.',
    'Bank rails, GST, e-invoice, 3-way match, disbursement.', '/trade', 'pipeline', [
      n('pay-wall', 'Firewall', 'ai-firewall', 'rupee', 'living', { shape: 'start' }),
      n('pay-mass', 'Remaining holds', 'remaining-gate', 'lot', 'living'),
      n('pay-price', 'Price declared', 'price-declared', 'marketplace', 'living'),
      n('pay-fall', 'Waterfall', 'price-waterfall', 'rupee', 'living'),
      n('pay-gl', 'Journal', 'journal-balance', 'erp', 'living'),
      n('pay-ref', 'paymentRef', 'payment-ref', 'orders', 'living'),
      n('pay-split', 'Qty-weighted', 'qty-weighted', 'fpo', 'living'),
      n('pay-bank', 'Bank rails', 'bank-rails', 'finance', 'missing', { shape: 'missing' }),
    ], [
      { label: 'Declared ₹', ids: ['pay-wall', 'pay-mass', 'pay-price', 'pay-fall', 'pay-gl', 'pay-ref', 'pay-split'], kind: 'stack' },
      { label: 'Named missing', ids: ['pay-bank'], kind: 'row' },
    ]),
  flow('material', 'Material', 'The sack is one body',
    'Minted grams = remaining + offtake + spoilage. FIFO offtake. Same lotId. Never a negative remaining.',
    'Cold-km energy cost. Waste market.', '/lots', 'pipeline', [
      n('m-mint', 'Mint', 'remaining-gate', 'lot', 'living', { shape: 'start' }),
      n('m-store', 'Godown', 'remaining-gate', 'warehouse', 'living'),
      n('m-fifo', 'FIFO offtake', 'fifo-alloc', 'orders', 'living'),
      n('m-spoil', 'Spoilage', 'spoilage-mass', 'rcop', 'living'),
      n('m-conserve', 'Conserve', 'mass-conserve', 'lot', 'living', { shape: 'end' }),
    ], [{ label: 'One sack', ids: ['m-mint', 'm-store', 'm-fifo', 'm-spoil', 'm-conserve'], kind: 'stack' }]),
  flow('vision', 'Vision', 'See remaining, not a profile',
    'Cell inspect. Evidence passport. Farm twin on declared loss %. Infra twin on declared sensors. No login dossier.',
    'Soil/weather simulation. Login profile refused.', '/cells', 'pipeline', [
      n('v-eye', 'Inspect cell', 'inspect-cell', 'farmer', 'living', { shape: 'start' }),
      n('v-pass', 'Passport', 'passport', 'lot', 'living'),
      n('v-twin', 'Farm twin', 'farm-twin', 'crop', 'living'),
      n('v-infra', 'Infra twin', 'infra-twin', 'warehouse', 'living', { shape: 'end' }),
      n('v-login', 'Login profile', 'login-profile', 'farmer', 'missing', { shape: 'missing' }),
    ], [
      { label: 'See remaining', ids: ['v-eye', 'v-pass', 'v-twin', 'v-infra'], kind: 'stack' },
      { label: 'Refused', ids: ['v-login'], kind: 'row' },
    ]),
  flow('decision', 'Decision', 'One cortex, five tissues',
    'Named signal → tissues fire → decision passport. Clerk still writes remaining. Rupee write blocked.',
    'Two brains on GitHub. Model registry.', '/brain', 'fan', [
      n('d-sig', 'Named signal', 'brain-decide', 'ai', 'living', { shape: 'start' }),
      n('d-front', 'Frontier', 'brain-decide', 'reflex', 'living'),
      n('d-agent', 'Agentic', 'brain-decide', 'farmer', 'living'),
      n('d-phys', 'Physical', 'brain-decide', 'warehouse', 'living'),
      n('d-sec', 'Security', 'brain-decide', 'ai', 'living'),
      n('d-sci', 'Scientist', 'brain-decide', 'crop', 'living'),
      n('d-pass', 'Passport', 'brain-decide', 'os', 'living', { shape: 'end' }),
    ], [
      { label: 'Signal', ids: ['d-sig'], kind: 'stack' },
      { label: 'Five tissues', ids: ['d-front', 'd-agent', 'd-phys', 'd-sec', 'd-sci'], kind: 'row' },
      { label: 'Passport', ids: ['d-pass'], kind: 'stack' },
    ]),
  flow('command', 'Command', 'Human is the mouth',
    'Clerk names cell and mass. Companion proposes. Constitution E1–E9. Firewall on AI writes.',
    'Delegated consent ledger on GitHub.', '/charter', 'pipeline', [
      n('c-human', 'Human command', 'human-command', 'farmer', 'living', { shape: 'start' }),
      n('c-prop', 'Companion proposes', 'copilot-next', 'ai', 'living'),
      n('c-law', 'Constitution', 'constitution', 'os', 'living', { shape: 'decision' }),
      n('c-wall', 'Firewall', 'ai-firewall', 'rupee', 'living'),
      n('c-write', 'Clerk writes', 'remaining-gate', 'erp', 'living', { shape: 'end' }),
    ], [{ label: 'Human mouth', ids: ['c-human', 'c-prop', 'c-law', 'c-wall', 'c-write'], kind: 'stack' }]),
  flow('coordination', 'Coordination', 'One spine, many organs',
    'harvest.completed fans out to warehouse, GI, cover, market. Unknown events fail. Ligaments stay honest.',
    'Kafka. National pool. Marriage/illness fan-out.', '/pulse', 'fan', [
      n('k-pub', 'Publish harvest', 'spine-publish', 'spine', 'living', { shape: 'start' }),
      n('k-wh', 'Warehouse', 'remaining-gate', 'warehouse', 'living'),
      n('k-gi', 'GI mint', 'gi-frame', 'trace', 'living'),
      n('k-cover', 'Cover bind', 'herd-cover', 'insurance', 'partial'),
      n('k-unk', 'Unknown event', 'unknown-event', 'spine', 'living', { shape: 'decision' }),
    ], [
      { label: 'Publish', ids: ['k-pub'], kind: 'stack' },
      { label: 'Fan-out', ids: ['k-wh', 'k-gi', 'k-cover', 'k-unk'], kind: 'row' },
    ]),
  flow('algorithms', 'Algorithms', 'Named maths, declared numbers',
    'remaining-gate, FIFO, WAC on declared cost, qty-weighted split, millDecision, journal balance, firewall, waterfall. Never invent ₹.',
    'Credit score, CFD, predicted yield.', '/modules', 'plate', [
      n('a-rem', 'remaining-gate', 'remaining-gate', 'lot', 'living', { shape: 'start' }),
      n('a-fifo', 'FIFO', 'fifo-alloc', 'lot', 'living'),
      n('a-wac', 'WAC', 'wac-cost', 'erp', 'living'),
      n('a-qty', 'Qty-weighted', 'qty-weighted', 'fpo', 'living'),
      n('a-mill', 'millDecision', 'mill-decision', 'warehouse', 'living', { shape: 'decision' }),
      n('a-gl', 'Journal', 'journal-balance', 'erp', 'living'),
      n('a-wall', 'Firewall', 'ai-firewall', 'rupee', 'living'),
      n('a-fall', 'Waterfall', 'price-waterfall', 'rupee', 'living', { shape: 'end' }),
      n('a-pledge', 'Pledge gate', 'pledge-gate', 'warehouse', 'living'),
      n('a-lib', 'Library consult', 'library-consult', 'ai', 'living'),
      n('a-gi', 'GI claim', 'gi-claim', 'trace', 'living'),
      n('a-fus', 'FUS rank', 'fvie-rank', 'marketplace', 'living'),
      n('a-hours', 'Hours-to-pay', 'hours-to-pay', 'farmer', 'partial'),
      n('a-scheme', 'Scheme eligibility', 'scheme-gate', 'scheme', 'living'),
    ], [
      { label: 'Mass and money', ids: ['a-rem', 'a-fifo', 'a-wac', 'a-qty', 'a-mill', 'a-gl', 'a-wall', 'a-fall'], kind: 'stack' },
      { label: 'Named gates', ids: ['a-pledge', 'a-lib', 'a-gi', 'a-fus', 'a-hours', 'a-scheme'], kind: 'row' },
    ]),
  flow('supply', 'Supply chain', 'Plot to Magh, one sack',
    'Material: plot → harvest → godown → offtake → kitchen → next Magh. Payment: declared ₹ only. Finance and procure stay missing. 3-way match stays missing.',
    'Agriculture finance, procure, bank rails, 3-way match, ETA, tourism.', '/trade', 'lanes', [
      n('sc-plot', 'Plot', 'remaining-gate', 'crop', 'living', { lane: 'material', shape: 'start' }),
      n('sc-harv', 'Harvest', 'remaining-gate', 'lot', 'living', 'material'),
      n('sc-store', 'Godown', 'remaining-gate', 'warehouse', 'living', 'material'),
      n('sc-off', 'Offtake', 'fifo-alloc', 'orders', 'living', 'material'),
      n('sc-kit', 'Kitchen', 'kitchen', 'demand', 'living', 'material'),
      n('sc-magh', 'Next Magh', 'next-magh', 'contract', 'partial', { lane: 'material', shape: 'end' }),
      n('sc-pay', 'Declared ₹', 'price-declared', 'rupee', 'living', { lane: 'payment', shape: 'start' }),
      n('sc-ref', 'paymentRef', 'payment-ref', 'orders', 'living', 'payment'),
      n('sc-fin', 'Finance', 'finance-loop', 'finance', 'missing', { lane: 'payment', shape: 'missing' }),
      n('sc-proc', 'Procure', 'procure-loop', 'orders', 'missing', { lane: 'payment', shape: 'missing' }),
      n('sc-match', '3-way match', 'three-way', 'erp', 'missing', { lane: 'payment', shape: 'missing' }),
      n('sc-cmd', 'Clerk command', 'human-command', 'farmer', 'living', { lane: 'command', shape: 'start' }),
    ]),
];

const FLOW_BY_ID = Object.fromEntries(FLOWS.map((f) => [f.id, f]));

function flowStats() {
  const nodes = FLOWS.flatMap((f) => f.nodes);
  return {
    flows: FLOWS.length, nodes: nodes.length,
    living: nodes.filter((row) => row.status === 'living').length,
    partial: nodes.filter((row) => row.status === 'partial').length,
    missing: nodes.filter((row) => row.status === 'missing').length,
  };
}

module.exports = { FLOWS, FLOW_BY_ID, flowStats };
