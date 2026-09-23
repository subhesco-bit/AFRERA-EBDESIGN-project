/**
 * AFRERA Kernel Routes
 *
 * Real REST endpoints over the pine-shadow kernel ported into
 * backend/src/lib/ this session (105/105 Jest tests passing). Exists so
 * the frontend can render real data instead of the Phase 2C placeholder
 * pages — see frontend/src/pages/README.md for the fuller context on
 * why those pages were never wired up before this route existed.
 *
 * Auto-mounted by DynamicRouteLoader at /api/v1/afrera-kernel (filename
 * "afreraKernel" -> kebab-case, no "Routes" suffix to strip).
 *
 * Read-only. No route here writes state — consistent with the kernel's
 * own constitution (E3: "AI cannot write rupees. Propose only.") and
 * with this being demonstration/reference wiring, not this project's
 * transactional API surface.
 */

const express = require('express');
const router = express.Router();

const lattice = require('../lib/lattice');
const brain = require('../lib/brain');
const body = require('../lib/body');
const vet = require('../lib/vet');
const erp = require('../lib/erp');
const os = require('../lib/os');
const library = require('../lib/library');
const tokens = require('../lib/tokens');
const systems = require('../lib/systems');
const modules = require('../lib/modules');
const share = require('../lib/share');
const flows = require('../lib/flows');
const organism = require('../lib/organism');

function ok(res, data) {
  res.json({ success: true, data });
}

function fail(res, err, status = 400) {
  res.status(status).json({ success: false, error: err instanceof Error ? err.message : String(err) });
}

router.get('/health', (req, res) => {
  ok(res, { module: 'afrera-kernel', status: 'operational', ported: true });
});

// --- lattice: the organism map ---
router.get('/lattice/stats', (req, res) => ok(res, lattice.latticeStats()));
router.get('/lattice/concepts', (req, res) => ok(res, lattice.CONCEPTS));
router.get('/lattice/concepts/:id', (req, res) => {
  const c = lattice.CONCEPT_BY_ID[req.params.id];
  if (!c) return fail(res, 'Unknown concept', 404);
  ok(res, { concept: c, bridges: lattice.bridgesFor(req.params.id) });
});
router.get('/lattice/bridges', (req, res) => {
  const { status = 'all', kind = 'all', query = '' } = req.query;
  ok(res, lattice.filterBridges({ status, kind, query, conceptId: req.query.conceptId || null }));
});
router.get('/lattice/walk', (req, res) => ok(res, { title: lattice.WALK_TITLE, lede: lattice.WALK_LEDE, hops: lattice.WALK }));

// --- brain: five-tissue decision cortex ---
router.get('/brain/tissues', (req, res) => ok(res, brain.TISSUES));
router.get('/brain/signals', (req, res) => ok(res, brain.BRAIN_SIGNALS));
router.get('/brain/ai-atlas', (req, res) => ok(res, { score: brain.aiScore(), units: brain.AI_UNITS }));
router.post('/brain/decide', (req, res) => {
  try {
    ok(res, brain.brainDecide(req.body));
  } catch (err) { fail(res, err); }
});

// --- body: 11-part reflex kernel ---
router.get('/body/parts', (req, res) => ok(res, body.BODY_PARTS));
router.get('/body/tone', (req, res) => ok(res, body.bodyTone(body.defaultFacts(req.query))));
router.post('/body/react', (req, res) => {
  try {
    ok(res, body.reactNow(body.defaultFacts(req.body)));
  } catch (err) { fail(res, err); }
});

// --- vet: AFRERA-VET veterinary coding ---
router.get('/vet/species', (req, res) => ok(res, vet.SPECIES));
router.get('/vet/species/:id/codes', (req, res) => ok(res, vet.codesForSpecies(req.params.id)));
router.post('/vet/propose', (req, res) => ok(res, vet.proposeVet(req.body)));

// --- erp: mass-conservation kernel ---
router.get('/erp/atlas', (req, res) => ok(res, { score: erp.atlasScore(), modules: erp.ERP_MODULES }));
router.get('/erp/stakeholders', (req, res) => ok(res, erp.STAKEHOLDERS));
router.post('/erp/fus', (req, res) => {
  const fus = erp.fusForVariety(req.body.variety || '');
  fus ? ok(res, fus) : fail(res, 'No declared FUS axes for that variety.', 404);
});
// Demo books snapshot (no live DB-backed books yet) so /erp/platform.js's real
// composePlatform() has something to compose over — mirrors the pattern
// flows/run.js's defaultFlowFacts() already uses for flow demos.
function demoBooks() {
  const cell = { id: 'c-enghi', name: 'Enghi Teron', household: 'Teron house', fpoId: 'fpo-langthasa', village: 'Langthasa', acresCenti: 250, notes: '', lotCount: 1, kgOnBooks: 180000, remainingGrams: 180000, rupeeCreditPaise: 0, rupeeDebitPaise: 0 };
  const lot = { id: 'lot-chakhao', cellId: cell.id, cellName: cell.name, fpoId: cell.fpoId, variety: 'Chakhao Poireiton', commodity: 'rice', grams: 180000, remainingGrams: 180000, grade: null, giMarker: 'GI-CHAKHAO', moistureBp: null, status: 'minted', coverStatus: 'bound', policyId: 'POL-LANGTHASA-GODOWN', plantingId: null, giMinted: true, mintedAt: '2026-01-01', fusScore: null, fusComplete: false };
  return {
    fpo: { id: 'fpo-langthasa', name: 'Langthasa FPO', village: 'Langthasa', district: 'Karbi Anglong', splitRule: 'qty_weighted' },
    kpis: { journalBalanced: true }, cells: [cell], lots: [lot], receipts: [], orders: [],
    journal: [{ id: 1, entryId: 'je1', cellId: cell.id, lotId: lot.id, organId: 'rupee', account: 'cash', side: 'debit', amountPaise: 1530000, memo: 'demo', createdAt: '' }],
    inputs: [], payouts: [], poolable: [], kitchen: [], contracts: [], plantings: [], giChain: [], villageLedger: [], herd: [], weatherAlerts: [], energyWindows: [], iotReadings: [], schemes: [], fus: [],
  };
}
router.get('/erp/platform-demo', (req, res) => {
  try {
    ok(res, erp.composePlatform(demoBooks(), { season: { id: 's1', name: 'Magh 2026', village: 'Langthasa', status: 'open' }, documents: [], processes: [] }));
  } catch (err) { fail(res, err, 500); }
});

// --- os: governance kernel ---
router.get('/os/catalog', (req, res) => ok(res, os.composeOs()));
router.get('/os/constitution', (req, res) => ok(res, os.CONSTITUTION));
router.get('/os/todos', (req, res) => ok(res, os.remainingWork(Number(req.query.limit) || 12)));

// --- library: the doctrine knowledge base ---
router.get('/library/diagnose', (req, res) => ok(res, library.diagnose()));
router.get('/library/search', (req, res) => ok(res, library.queryLibraryKnowledge(req.query.q || '', { limit: Number(req.query.limit) || 12 })));

// --- tokens: library-first token economy ---
router.get('/tokens/economy', (req, res) => ok(res, tokens.composeEconomy()));

// --- systems: byte-verified AI subsystem audit ---
router.get('/systems/audit', (req, res) => ok(res, { stats: systems.systemStats(), systems: systems.AI_SYSTEMS }));

// --- modules: charter + workflows ---
router.get('/modules/charter', (req, res) => ok(res, modules.composeCharter()));
router.get('/modules/workflows', (req, res) => ok(res, modules.WORKFLOWS));
router.post('/modules/run/:workflowId', (req, res) => {
  try {
    ok(res, modules.runWorkflow(req.params.workflowId, req.body));
  } catch (err) { fail(res, err, 404); }
});

// --- share: village shared-asset booking ---
router.get('/share/assets', (req, res) => ok(res, share.ASSETS));
router.post('/share/propose-slot', (req, res) => ok(res, share.proposeSlot(req.body)));

// --- flows: 11 real process families ---
router.get('/flows', (req, res) => ok(res, { flows: flows.FLOWS, stats: flows.flowStats() }));
router.get('/flows/:id/run', (req, res) => {
  try {
    ok(res, flows.runFlow(req.params.id, flows.defaultFlowFacts(req.query)));
  } catch (err) { fail(res, err, 404); }
});

// --- organism: boot/diagnose/consult, Postgres-backed with in-memory fallback ---
router.get('/organism', async (req, res) => {
  try {
    ok(res, await organism.getOrganism());
  } catch (err) { fail(res, err, 500); }
});
router.post('/organism/consult', async (req, res) => {
  try {
    ok(res, await organism.consultLibrary(req.body));
  } catch (err) { fail(res, err, 500); }
});

// --- companion: the living agentic companion (proposes, never writes ₹) ---
router.post('/companion/propose', (req, res) => {
  try {
    ok(res, modules.proposeCompanion(req.body.books, req.body.gates || []));
  } catch (err) { fail(res, err); }
});

module.exports = router;
