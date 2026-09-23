'use strict';
/** The AI-integrated library is the organism's long-term memory.
 * Ported from pine-shadow src/lib/library/catalog.ts. This is a real,
 * specific knowledge base documenting THIS repository's actual gap between
 * "WIRED" module claims and runtime reality — not generic placeholder text.
 * Replaces the earlier fabricated library/index.js (generic tag/search
 * catalog with invented entries). */

const { BRIDGES } = require('../lattice/bridges');
const { CONCEPTS } = require('../lattice/concepts');
const { WALK } = require('../lattice/walk');

const DOCTRINE = [
  { id: 'lib-dora', kind: 'doctrine', title: 'Organ + ligament + blood', body: 'DORA: the unit of design is not a page or a farmer_id. It is an organ, the ligaments that bind it, and the blood that moves. Modules without ligaments are cadavers. Foreign keys are not a nervous system.', source: 'AFRERA_DIGITAL_ORGANISM_REFERENCE_ARCHITECTURE_DORA.md', organs: ['ai', 'spine', 'farmer', 'lot'] },
  { id: 'lib-biea', kind: 'doctrine', title: 'Bio-inspired enterprise intelligence', body: 'BIEA: sense, decide, act, learn as one reflex. Sixteen sibling AI services are not a spinal cord. Intelligence that cannot name which organ it moved is decoration.', source: 'AFRERA_BIO_INSPIRED_ENTERPRISE_INTELLIGENCE_ARCHITECTURE_BIEA.md', organs: ['ai', 'reflex', 'rupee'] },
  { id: 'lib-memory', kind: 'doctrine', title: 'The library is memory, not a chatbot', body: 'An AI-integrated library is the hippocampus of the organism. Cards are indexed, bound to organs, and consulted automatically when a pulse fires. A coordinator that only answers chat is a mouth without memory. Auto-operation means: migrate, seed, bind, diagnose — without waiting for a prompt or an API key.', source: 'M645100_LIBRARYKNOWLEDGE', organs: ['ai', 'spine'], signal: 'library.boot → nerve.diagnose' },
  { id: 'lib-auto-op', kind: 'contract', title: 'Auto-operation contract', body: 'On boot the organism must: apply schema, upsert organs and ligaments, index library cards, write bindings, publish organism.booted on the spine, and fire one diagnosis pulse from the library itself. Claude/Grok may enrich a later consult. They must not be the on-switch. If the key is missing, the catalog still diagnoses.', source: 'M645100_LIBRARYKNOWLEDGE / claudeAICoordinator', organs: ['ai', 'spine', 'erp'], signal: 'organism.booted' },
  { id: 'lib-fifteen', kind: 'contract', title: 'Fifteen reflex queries', body: 'Auto-operation is not a search box. Named pulses must fire from the catalog on boot: harvest/lot, DORA, cell, spine, lot body, rupee path, weather reflex, FPO, scheme, energy cloud, Magh time, livestock, kitchen graph, hippocampus, boot-without-a-key, and the agentic module that never plugs into harvest. If any return empty, the library is not integrated. Grok may later enrich a consult; it must not be the on-switch.', source: 'M645100 queryLibraryKnowledge contract', organs: ['ai', 'spine', 'lot', 'farmer', 'rupee', 'reflex', 'fpo', 'scheme', 'cloud', 'foodgraph', 'livestock', 'module'], signal: 'library.reflex' },
  { id: 'lib-cell', kind: 'principle', title: 'Farmer is a cell, not a role', body: 'RBAC lists farmer next to admin. Roles are doors. Cells are lives. Every pulse that cannot name a farmer cell is talking to a login.', source: 'AFRERA_ORGANISM_LATTICE.md', organs: ['farmer', 'fpo', 'household', 'rupee'] },
  { id: 'lib-lot-body', kind: 'principle', title: 'The lot is one body', body: 'If two organs cannot point at the same lotId, they are not in the same organism. Moisture, GI marker, cover, freight, and listing are tissues of one sack — not six records in six modules.', source: 'AFRERA_ORGANISM_LATTICE.md', organs: ['lot', 'crop', 'warehouse', 'trace', 'marketplace'], signal: 'lot.mint' },
  { id: 'lib-blood', kind: 'principle', title: 'Blood is not bone', body: 'ERP may subscribe. It may not invent pulses. eventBus.js is not Kafka because it was named Section 23. harvest.completed must leave the page.', source: 'AFRERA_ORGANISM_LATTICE.md', organs: ['spine', 'erp', 'crop'], signal: 'spine.publish harvest.completed' },
  { id: 'lib-reflex-not-chat', kind: 'principle', title: 'A chatbot is not a reflex', body: 'Sense, decide, act, learn on one event — or hide it. weatherAdvisory as a page is gossip. The library must sit on the spine, not behind a search box.', source: 'AFRERA_ORGANISM_LATTICE.md', organs: ['ai', 'reflex', 'soil', 'insurance'], signal: 'weather.alert' },
  { id: 'lib-rupee-path', kind: 'principle', title: 'Every organ shows a rupee path', body: 'A recommendation only counts if it changes a farmer rupee — yield, price, cost, or risk — and can explain which organ it moved. The prosperity ledger is the bile that makes metabolism visible.', source: 'AFRERA master spec', organs: ['rupee', 'farmer', 'ai', 'rcop', 'finance'], signal: 'prosperity.post' },
  { id: 'lib-time', kind: 'principle', title: 'Time is a dimension', body: 'Lead time to sowing, hours-to-pay, cover window, festival spike. An organism that cannot remember last Magh will plant next Magh as a surprise.', source: 'AFRERA_ORGANISM_LATTICE.md', organs: ['foodgraph', 'demand', 'contract', 'household'] },
  { id: 'lib-broken-wire', kind: 'repair', title: 'Why auto-operation failed on GitHub', body: 'libraryKnowledgeService was gutted to generic CRUD and lost queryLibraryKnowledge. claudeAICoordinator still called it. M645100 could index, but syncDatabase was opt-in and migrations never ran. The catalog lived in memory; the spine never published; the nerve never fired without a prompt. Repair: persist the catalog, bind it to organs, diagnose on boot.', source: 'SUBH-DEEP main / M645100 / claudeAICoordinator.js', organs: ['ai', 'spine', 'erp'], signal: 'library.syncDatabase' },
  { id: 'lib-erp-bone', kind: 'contract', title: 'Rural ERP is bone, not a pulse inventor', body: 'Village books record farmer cells, living lots, warehouse receipts, declared farmgate, and settlement. salePricePerUnit is required — never invented. paymentRef is required to mark paid. Hours-to-pay land on the cell with the rupee. Freight is declared. ERP may subscribe to harvest.completed and lot.mint; it may not invent pulses. The nerve may read these books; it may not write them.', source: 'AFRERA rural ERP kernel', organs: ['erp', 'lot', 'warehouse', 'orders', 'rupee', 'farmer', 'fpo'], signal: 'order.settled' },
  { id: 'lib-erp-remaining', kind: 'principle', title: 'Remaining mass stays on the same lot body', body: 'A lot is one body from field to plate. Selling 400 kg of 840 kg leaves 440 kg on the same lotId. Settlement does not erase the remainder. Warehouse remaining and offtake remaining are tissues of one sack — moisture, GI marker, cover, freight, and listing included.', source: 'AFRERA_ORGANISM_LATTICE.md / lot body', organs: ['lot', 'warehouse', 'crop', 'trace', 'marketplace'], signal: 'lot.mint' },
  { id: 'lib-fpo-split', kind: 'principle', title: 'FPO payout is qty-weighted', body: "The FPO is tissue the farmer cell acts through, not a login. Collective offtake of a commodity splits farmgate after declared freight in proportion to each household cell's kilograms. Membership pools offtake; the cell remains a nucleus.", source: 'AFRERA FPO split_rule qty_weighted', organs: ['fpo', 'farmer', 'household', 'rupee', 'orders'], signal: 'fpo.member' },
  { id: 'lib-module-synapse', kind: 'doctrine', title: 'An AI system is a module, not a sibling file', body: '544 directories and a factory that lists SYS-M* are an inventory. Prefix classifiers are not DORA organs. Modules without a harvest subscribe are cadavers with a WIRED badge.', source: 'moduleSystemFactory.js / moduleContract.js / M675100', organs: ['module', 'ai', 'spine', 'farmer', 'lot'], signal: 'module.attach' },
  { id: 'lib-agentic-skeleton', kind: 'repair', title: 'Agentic companion is a WIRED skeleton', body: 'M675100_AIAGENTICCOMPANION declares status WIRED. analysis.isComplete is false, category SKELETON, hasMethods false. Canonical aiAgenticCompanionService.js is a 1.1KB re-export of legacy with zero live callers. It never plugs into harvest.completed or lot.mint. A companion that cannot propose a lot for the farmer cell is not agentic. It is another file.', source: 'backend/src/modules/M675100_AIAGENTICCOMPANION/module.json', organs: ['module', 'ai', 'farmer', 'lot', 'reflex'], signal: 'agentic.propose' },
  { id: 'lib-agentic-living', kind: 'contract', title: 'Living agentic companion proposes on Magh books', body: 'The living agentic companion reads Magh books and proposes the next gate: settle an open offtake, inward a minted lot, mint a harvest for an idle cell, declare process loss. A clerk approves. GitHub M675100 stays a WIRED skeleton; this organism runs the companion.', source: 'src/lib/modules/companion.ts', organs: ['module', 'ai', 'farmer', 'lot', 'orders', 'warehouse'], signal: 'agentic.propose' },
  { id: 'lib-wired-lie', kind: 'principle', title: 'WIRED is not complete', body: 'wiredVerification means the module loads and delegates to legacy. Copilot, backbone, advisory, voice, omnichannel, and advanced all say WIRED. Completeness: routes false, tests false, frontend often false. Canonical paths under 2KB. The word complete in M150100_COMPLETEAIINTEGRATION is the most dangerous word in the repo.', source: 'MODULES_REGISTRY.js / module.json status WIRED', organs: ['module', 'ai'], signal: 'philosophy.wired' },
  { id: 'lib-module-os', kind: 'contract', title: 'Module OS is the spinal cord', body: 'The Module OS is middleware for every named AI: orchestrator routes one signal, fabric caps spend at 0 paise on assertions, agentic proposes lot.mint, copilot names the next keystroke. GitHub files stay WIRED skeletons. This organism runs the process. AI may not write rupees.', source: 'AFRERA Module OS / DORA / BIEA', organs: ['module', 'ai', 'spine', 'lot', 'farmer', 'rupee', 'erp'], signal: 'module.bus' },
  { id: 'lib-charter', kind: 'contract', title: 'Charter scores every module against eighteen criteria', body: 'The charter names decision laws L1–L12 and scores each AI module for AI embedding, ERP algorithm, communication, workflow, operational flow, process flow, tracking, decision criteria and boundary. GitHub isComplete stays false. This organism counts living checks. It does not say complete.', source: 'src/lib/modules/charter.ts', organs: ['module', 'ai', 'spine', 'lot', 'rupee'], signal: 'module.charter' },
  { id: 'lib-token-economy', kind: 'contract', title: 'Token economy packs hits not cadavers', body: 'Naive send is the whole GitHub dump: systems, concepts, bridges, workflows, catalog. Compact send is three library hits, remaining grams, and twelve decision laws. Batch fires every reflex in one pass. llmCalls stay 0.', source: 'src/lib/tokens/economy.ts', organs: ['ai', 'module', 'spine', 'lot'], signal: 'ai.tokens' },
  { id: 'lib-cover-intake', kind: 'contract', title: 'Intake binds cover or raises a gap', body: 'Langthasa godown binds POL-LANGTHASA-GODOWN on warehouse.intake. Magh plantings bind POL-LANGTHASA-WEATHER. Ronghang herd binds POL-LANGTHASA-HERD. Premium is undeclared and never invented.', source: 'src/lib/erp/kernel.ts', organs: ['warehouse', 'insurance', 'lot'], signal: 'storage.covered' },
  { id: 'lib-kitchen-magh', kind: 'principle', title: 'Kitchen remembers why Chakhao exists', body: 'Chakhao pithas imply Chakhao Poireiton at Magh. Ginger pickle implies Nadia ginger. Harvest publishes graph.implies. FUS-v1 scores the grain on declared food axes. Household baskets still missing.', source: 'src/lib/erp/kernel.ts', organs: ['foodgraph', 'crop', 'household', 'gcip'], signal: 'graph.implies' },
  { id: 'lib-next-season', kind: 'contract', title: 'Settlement offers next Magh at the same kilograms', body: 'order.settled emits demand.observed and offers a Magh 2027 contract at settled grams. Price stays blank until a clerk declares a rupee per kg. AI cannot write the price.', source: 'src/lib/erp/boot.server.ts', organs: ['contract', 'demand', 'farmer', 'orders'], signal: 'contract.offer' },
  { id: 'lib-gi-mint', kind: 'contract', title: 'GI mint at birth, or it is not GI', body: 'Harvest mints a GI chain: handler, Langthasa geography, Magh season. A GI listing without the mint is blocked. GitHub still badges at checkout. No GI claim without the chain.', source: 'src/lib/erp/kernel.ts', organs: ['trace', 'crop', 'lot', 'marketplace'], signal: 'trace.mint' },
  { id: 'lib-village-tco', kind: 'principle', title: 'Village ledger books the fever', body: 'Declared energy, water, freight, and spoilage grams post to the Langthasa village ledger. A power cut that spoils 40 kg cuts remaining mass. kWh and premium stay blank until a clerk declares them. No 25-year TCO optimizer.', source: 'src/lib/erp/kernel.ts', organs: ['rcop', 'recie', 'water', 'insurance', 'logistics', 'village'], signal: 'spoilage.event' },
  { id: 'lib-fus-rank', kind: 'contract', title: 'FUS-v1 ranks the shelf from declared food axes', body: 'Food Utility Score is the mean of declared nutrition, satiety, taste, culture, and convenience. Affordability stays blank until a household budget is declared. Chakhao and ginger carry FUS-v1.', source: 'src/lib/erp/kernel.ts', organs: ['fvie', 'marketplace', 'crop', 'foodgraph'], signal: 'food.utility' },
  { id: 'lib-weather-reflex', kind: 'contract', title: 'weather.alert opens a claim window, never freezes EMI', body: 'A declared Magh rain hazard fires weather.alert. Insurance opens a claim window on POL-LANGTHASA-WEATHER. Finance may propose a moratorium. EMI is not auto-frozen. Premium stays undeclared.', source: 'src/lib/erp/kernel.ts', organs: ['soil', 'insurance', 'finance', 'crop'], signal: 'weather.alert' },
  { id: 'lib-herd-cover', kind: 'contract', title: 'Herd cover binds the same immune system', body: 'Ronghang cattle and goats are cell facts. POL-LANGTHASA-HERD binds on declared headcount. Outage that warms milk and disease that thins a herd share the claim pulse. Milk rupees still missing.', source: 'src/lib/erp/kernel.ts', organs: ['livestock', 'insurance', 'farmer'], signal: 'herd.covered' },
  { id: 'lib-vet-code', kind: 'contract', title: 'August AI codes the herd, never a hospital', body: 'AFRERA-VET names cattle, buffalo, goat, pig, poultry, duck, fish, dog, and cat. August AI proposes. A vet or clerk confirms heads. ASF and avian influenza stay named until a lab speaks. GitHub human ICD / CPT / HCPCS is the wrong genome.', source: 'src/lib/vet/code.ts', organs: ['livestock', 'ai', 'farmer'], signal: 'vet.coded' },
  { id: 'lib-share-hours', kind: 'contract', title: 'Village muscle books hours, never a rent', body: 'Cold bay, mill, mobile and static process, pack, food/soil/animal labs, dryer, polyhouse, and the equipment pool are FPO muscle. Hours remaining conserve like grams. AI proposes a slot. A clerk confirms. Rental rupees stay missing. GST invoice stays missing.', source: 'src/lib/share/book.ts', organs: ['shared', 'processing', 'warehouse', 'fpo'], signal: 'share.booked' },
  { id: 'lib-organic-trace', kind: 'principle', title: 'Organic is a declared path on the same sack', body: 'PGS or NPOP is a clerk fact on the lot body. The path is mint → intake → process → pack. A certificate rupee is not invented. Pack may name an HSN. The GST invoice stays missing.', source: 'src/lib/share/trace.ts', organs: ['trace', 'lot', 'shared'], signal: 'organic.traced' },
  { id: 'lib-gst-named', kind: 'principle', title: 'HSN may name the sack. GST does not post.', body: 'Packaging as per GST is an HSN analog with rate blank. Operation Green and NE logistics eligibility may compute. Amount stays undeclared. Disbursement rails stay missing.', source: 'src/lib/share/gst.ts', organs: ['erp', 'scheme', 'shared'], signal: 'gst.invoice' },
  { id: 'lib-os-matrix', kind: 'doctrine', title: 'Concept to runtime, nothing removed', body: 'AFRERA is an India-first economic operating system, not an agriculture website. Stage 0 classifies every concept as verified, partial, scaffolded, documented, disconnected, duplicated, blocked, proposed, or missing. Dual-truth: this kernel vs GitHub 7%.', source: 'OS registry / DORA', organs: ['os', 'erp', 'ai', 'farmer', 'lot', 'spine'], signal: 'os.classified' },
  { id: 'lib-os-constitution', kind: 'contract', title: 'Ethical constitution on the cell', body: 'E1 never infer caste religion health. E3 AI cannot write rupees. E5 non-personalized default. Voluntary constraints cannot set price credit employment insurance or eligibility.', source: 'src/lib/os/constitution.ts', organs: ['os', 'farmer', 'ai'], signal: 'os.constitution' },
  { id: 'lib-os-suit', kind: 'contract', title: 'Suitability refuses invented offers', body: 'Find a loan is a refusal. Do not invent a credit score or a premium. Cover may bind. Schemes stay missing until effective-dated. Travel is not this village.', source: 'src/lib/os/suitability.ts', organs: ['os', 'finance', 'insurance'], signal: 'os.suitability' },
];

function organCards() {
  return CONCEPTS.map((c) => {
    const role = c.role ?? 'organ';
    return {
      id: `lib-organ-${c.id}`, kind: role === 'bridge' ? 'bridge' : 'organ', title: c.name,
      body: `${c.thesis} Silo today: ${c.silo} Prosperity: ${c.prosperity}`,
      source: `lattice/${c.id}`, organs: role === 'bridge' ? [c.id, ...(c.binds ?? [])] : [c.id],
    };
  });
}

function repairCards() {
  return WALK.map((hop) => ({
    id: `lib-repair-${hop.id}`, kind: 'repair', title: hop.title,
    body: `Today: ${hop.today} Should: ${hop.should}`, source: 'pulse-walk/chakhao', signal: hop.signal, organs: [hop.organId],
  }));
}

function contractCards() {
  const priority = BRIDGES.filter((b) => b.status !== 'living' && (
    b.signal.includes('harvest.completed') || b.signal.includes('lot.mint') || b.signal.includes('order.settled') ||
    b.signal.includes('fdi.') || b.signal.includes('weather') || b.signal.includes('scheme.') ||
    b.signal.includes('energy.cloud') || b.signal.includes('graph.') || b.signal.includes('module.') || b.signal.includes('agentic.')
  )).slice(0, 16);
  return priority.map((b) => ({
    id: `lib-contract-${b.id}`, kind: 'contract', title: b.name,
    body: `Signal ${b.signal}. Today: ${b.today} Intended: ${b.contract} Thought: ${b.thought}`,
    source: `ligament/${b.id}`, signal: b.signal, organs: [b.from, b.to],
  }));
}

let cached = null;

function libraryCatalog() {
  if (cached) return cached;
  const cards = [...DOCTRINE, ...organCards(), ...repairCards(), ...contractCards()];
  const seen = new Set();
  cached = cards.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });
  return cached;
}

function libraryCardById(id) {
  return libraryCatalog().find((c) => c.id === id);
}

module.exports = { libraryCatalog, libraryCardById };
