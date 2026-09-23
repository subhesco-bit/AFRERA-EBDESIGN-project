'use strict';
/** Rural ERP atlas. SAP/Baan/Oracle analogs classified. Not SAP parity.
 * Ported from pine-shadow src/lib/erp/atlas.ts */

const { brainDecide } = require('../brain/decide');
const { kitchenImplies } = require('./kernel');

function m(id, sap, analog, scale, status, stakeholders, kernel, ai, signal, href, present, missing) {
  return { id, sap, analog, scale, status, stakeholders, kernel, ai, signal, href, present, missing };
}

const STAKEHOLDERS = [
  { id: 'farmer', name: 'Farmer cell', scale: 'person', writes: 'remaining', present: 'Declares harvest kilograms on the cell.', missing: 'No login dossier.' },
  { id: 'household', name: 'Household', scale: 'home', writes: 'none', present: 'Home remaining is the sum of its cells.', missing: 'No household simulator.' },
  { id: 'clerk', name: 'Village clerk', scale: 'village', writes: 'rupee', present: 'Writes remaining, paymentRef, Magh close.', missing: 'Bank rec, GST.' },
  { id: 'fpo', name: 'FPO', scale: 'village', writes: 'remaining', present: 'Qty-weighted split. Last cell remainder. Shared hours on FPO muscle.', missing: 'Intercompany.' },
  { id: 'godown', name: 'Godown keeper', scale: 'village', writes: 'remaining', present: 'Same lot body inwards. Cold bay hours live.', missing: 'Cold-chain control tower.' },
  { id: 'mill', name: 'Mill operator', scale: 'village', writes: 'remaining', present: 'Process on declared loss. Mill rests on heat.', missing: 'Humanoid teleop.' },
  { id: 'buyer', name: 'Buyer', scale: 'village', writes: 'none', present: 'Offtake at declared ₹/kg.', missing: 'E-invoice, returns graph.' },
  { id: 'kitchen', name: 'Magh kitchen', scale: 'home', writes: 'none', present: 'Dish implies variety. Next Magh at last kg.', missing: 'Tourism itinerary.' },
  { id: 'vet', name: 'Veterinarian', scale: 'home', writes: 'propose', present: 'AFRERA-VET codes. Clerk/vet confirms heads. Herd cover binds.', missing: 'Livestock cashflow. Milk rupees.' },
  { id: 'scheme', name: 'Scheme officer', scale: 'village', writes: 'none', present: 'Eligibility on declared acres. Amount blank.', missing: 'Disbursement rails.' },
  { id: 'engineer', name: 'Engineer', scale: 'village', writes: 'none', present: 'BOQ stamp on declared qty+unit+standard.', missing: 'CFD refused.' },
  { id: 'companion', name: 'Companion', scale: 'person', writes: 'propose', present: 'Proposes next gate. Never executes alone.', missing: 'Delegated consent ledger.' },
  { id: 'brain', name: 'Village brain', scale: 'village', writes: 'propose', present: 'Five tissues. Decision passport. No rupee write.', missing: 'Model registry.' },
  { id: 'insurer', name: 'Insurer', scale: 'village', writes: 'none', present: 'Cover binds. Claim files.', missing: 'Payout rails.' },
  { id: 'logistics', name: 'Logistics runner', scale: 'village', writes: 'none', present: 'Declared freight. PoD is a clerk fact.', missing: 'ETA refused.' },
  { id: 'panchayat', name: 'Panchayat', scale: 'village', writes: 'none', present: 'Village is the cell of the map.', missing: 'National pool is null.' },
  { id: 'banker', name: 'Banker', scale: 'village', writes: 'none', present: 'Hours-to-pay sits on the cell. Pledge gate.', missing: 'Underwriting, credit score, bank rails.' },
  { id: 'dealer', name: 'Input dealer', scale: 'village', writes: 'none', present: 'Declared labour/seed/energy inputs if a clerk posts them.', missing: 'Procure loop, RFQ, 3-way match.' },
];

const ERP_MODULES = [
  m('fi-gl', 'FI-GL', 'Village journal', ['village'], 'living', ['clerk', 'fpo'], 'journalBalances', 'security', 'period', '/ledger', 'Paise journal, CoA, trial balance, Magh close with SoD.', 'GST, tax, intercompany.'),
  m('co-cca', 'CO-CCA', 'Nested remaining books', ['person', 'home', 'village'], 'living', ['farmer', 'household', 'clerk'], 'nestedRemaining', 'frontier', 'remaining', '/platform', 'Person remaining sums to home sums to village.', 'Profit-center simulation.'),
  m('mm-im', 'MM-IM', 'Lot remaining', ['person', 'village'], 'living', ['farmer', 'godown', 'clerk'], 'remainingAfterCommit', 'frontier', 'remaining', '/lots', 'Grams conserved. FIFO offtake. WAC on declared cost.', 'Negative remaining refused.'),
  m('sd-so', 'SD-SO', 'Offtake', ['village'], 'partial', ['buyer', 'clerk', 'fpo'], 'settlementAmounts', 'agentic', 'harvest-propose', '/trade', 'Declared ₹/kg. paymentRef required to settle.', 'E-invoice, returns.'),
  m('pp-pi', 'PP-PI', 'Mill process', ['village'], 'partial', ['mill', 'clerk'], 'processMass', 'physical', 'mill-heat', '/warehouse', 'Declared loss. Mill rests on heat/alert/outage.', 'Humanoid teleop refused.'),
  m('qm-ud', 'QM', 'Grade / GI / moisture', ['person', 'village'], 'partial', ['farmer', 'godown'], 'assertGiClaim', 'scientist', 'hypothesis', '/lots', 'GI mint on a marker. Moisture declared.', 'Lab twins.'),
  m('wm-bin', 'WM', 'Godown receipts', ['village'], 'living', ['godown', 'clerk'], 'remainingAfterCommit', 'physical', 'remaining', '/warehouse', 'Same lot body inwards. Pledge gate.', 'Cold-km energy cost.'),
  m('pm-mill', 'PM', 'Mill / IoT', ['village'], 'partial', ['mill', 'brain'], 'millDecision', 'physical', 'mill-heat', '/warehouse', 'Declared temp, kWh, remaining. EMI not frozen.', 'Robot fleet.'),
  m('tm-frt', 'TM', 'Freight / PoD', ['village'], 'partial', ['logistics', 'clerk'], 'settlementAmounts', 'frontier', null, '/trade', 'Freight declared (zero allowed). PoD is a clerk fact.', 'ETA refused.'),
  m('ehs-clm', 'EHS', 'Climate reflex', ['village'], 'partial', ['insurer', 'clerk'], 'weatherReflex', 'frontier', 'mill-heat', '/warehouse', 'Alert opens a claim window. Remaining unmoved without clerk loss.', 'EMI freeze refused.'),
  m('grc-sod', 'GRC', 'Constitution / SoD', ['village'], 'living', ['clerk', 'brain'], 'evaluateConstitution', 'security', 'rupee-write', '/charter', 'E1–E9. Unbalanced journal cannot close.', 'Pen-test playbook.'),
  m('crm-kit', 'CRM', 'Kitchen / buyer', ['home', 'village'], 'partial', ['kitchen', 'buyer'], 'kitchenImplies', 'scientist', 'hypothesis', '/trade', 'Magh dish implies variety. Next Magh at last kg.', 'Tourism itinerary refused.'),
  m('ps-sch', 'PS', 'Schemes', ['person', 'village'], 'partial', ['scheme', 'farmer'], 'schemeEligible', 'scientist', 'hypothesis', '/ledger', 'Eligibility on declared acres plus Operation Green / NE logistics. Amount blank.', 'Gazette twins, disbursement.'),
  m('hr-lab', 'HR', 'Declared labour', ['person', 'home'], 'partial', ['farmer', 'household'], 'inputJournal', 'agentic', null, '/ledger', 'Labour is a declared input kind.', 'Payroll, attendance.'),
  m('cs-svc', 'CS', 'Claims file', ['village'], 'partial', ['insurer', 'clerk'], 'weatherReflex', 'frontier', 'mill-heat', '/warehouse', 'Claim files without payout.', 'Survey, appeal, payout rails.'),
  m('esg-spl', 'EHS-ESG', 'Spoilage remaining', ['village'], 'partial', ['clerk', 'godown'], 'remainingAfterSpoilage', 'scientist', 'hypothesis', '/ledger', 'Spoilage cuts remaining. Emissions stay absent.', 'Invented emissions.'),
  m('wf-os', 'N/A', 'Module OS', ['village'], 'living', ['companion', 'brain', 'clerk'], 'runFlow', 'agentic', 'harvest-propose', '/modules', 'Durable steps. Unknown events fail.', 'Booking, RFQ, recall.'),
  m('ai-mgt', 'N/A', 'AI management', ['person', 'home', 'village'], 'living', ['brain', 'companion', 'clerk'], 'manageErpModule', 'security', 'rupee-write', '/brain', 'Five tissues. Passport. Propose only.', 'Model registry, AI rupee write.'),
  m('fi-ap', 'FI-AP', 'Accounts payable', ['village'], 'missing', ['dealer', 'clerk'], 'none', 'none', null, '/ledger', 'Named missing.', 'Procure invoices, 3-way match.'),
  m('fi-ar', 'FI-AR', 'Accounts receivable', ['village'], 'missing', ['buyer', 'banker'], 'paymentRefGate', 'none', null, '/trade', 'paymentRef defers until declared.', 'Bank rails, dunning.'),
  m('fi-bl', 'FI-BL / TR', 'Bank / treasury', ['village'], 'missing', ['banker'], 'none', 'none', 'loan', '/ledger', 'Hours-to-pay on the cell. Pledge gate.', 'Underwriting, disbursement, credit score.'),
  m('mm-pur', 'MM-PUR', 'Purchasing', ['village'], 'missing', ['dealer', 'clerk'], 'none', 'none', null, '/os', 'Named missing.', 'RFQ, PO, GR, 3-way.'),
  m('srm', 'SRM', 'Supplier relationship', ['village'], 'missing', ['dealer'], 'none', 'none', null, '/os', 'Named missing.', 'Vendor scorecards.'),
  m('tax-gst', 'FI-TAX', 'GST / e-invoice', ['village'], 'missing', ['clerk'], 'none', 'none', null, '/share', 'HSN analog named on shared pack. Village GL is enough to be honest.', 'GST, e-invoice.'),
  m('fi-aa', 'FI-AA', 'Asset accounting', ['village'], 'missing', ['engineer', 'clerk'], 'none', 'none', null, '/platform', 'BOQ stamp lives. Assets stay unnamed.', 'Fixed-asset register.'),
  m('py-pay', 'PY', 'Payroll', ['person', 'home'], 'missing', ['farmer', 'household'], 'none', 'none', null, '/ledger', 'Labour as declared input only.', 'Wages, PF, attendance.'),
  m('sd-bill', 'SD-BILL', 'Billing', ['village'], 'missing', ['buyer', 'clerk'], 'none', 'none', null, '/trade', 'Declared sale is the offtake.', 'E-invoice, GST billing.'),
  m('mm-mrp', 'PP-MRP', 'Yield forecast', ['person', 'village'], 'refused', ['farmer', 'brain'], 'farmTwin', 'scientist', 'hypothesis', '/cells', 'Farm twin on declared loss %. Yield stays null.', 'Invented yield.'),
  m('eng-cfd', 'PS-ENG', 'Engineering CFD', ['village'], 'refused', ['engineer'], 'engCalc', 'scientist', null, '/os', 'BOQ stamp on declared qty. CFD refused.', 'BIM, simulation.'),
  m('sd-tour', 'SD-TOUR', 'Tourism itinerary', ['person'], 'refused', ['kitchen', 'brain'], 'travelPlan', 'scientist', 'tourism', '/os', 'Village remaining journey lives.', 'Tourism itinerary refused.'),
  m('hr-bio', 'HCM', 'Inferred profile', ['person'], 'refused', ['farmer', 'brain'], 'evaluateConstitution', 'security', 'rupee-write', '/os', 'Cell inspect. Consent receipts. Auth off.', 'Caste, religion, health, login dossier.'),
  m('ai-rupee', 'FI-AI', 'AI rupee write', ['village'], 'refused', ['brain', 'companion'], 'aiFirewall', 'security', 'rupee-write', '/charter', 'Firewall. Constitution E3.', 'Numeric AI writes.'),
];

const ERP_BY_ID = Object.fromEntries(ERP_MODULES.map((x) => [x.id, x]));
const STAKE_BY_ID = Object.fromEntries(STAKEHOLDERS.map((s) => [s.id, s]));

function atlasScore() {
  return {
    modules: ERP_MODULES.length,
    living: ERP_MODULES.filter((m) => m.status === 'living').length,
    partial: ERP_MODULES.filter((m) => m.status === 'partial').length,
    missing: ERP_MODULES.filter((m) => m.status === 'missing').length,
    refused: ERP_MODULES.filter((m) => m.status === 'refused').length,
    classifiedPct: 100, sapParity: false, financeMissing: true, procureMissing: true,
    githubPct: 7, latticePct: 39,
  };
}

function nestedRemaining(cells, lots = [], kitchen = []) {
  const person = cells.map((c) => ({ cellId: c.id, name: c.name, household: c.household, remainingGrams: c.remainingGrams }));
  const homes = new Map();
  for (const p of person) {
    const list = homes.get(p.household) ?? [];
    list.push(p);
    homes.set(p.household, list);
  }
  const home = [...homes.entries()].map(([household, members]) => ({
    household, remainingGrams: members.reduce((n, m) => n + m.remainingGrams, 0), cells: members,
  }));
  const villageGrams = person.reduce((n, p) => n + p.remainingGrams, 0);
  const homeGrams = home.reduce((n, h) => n + h.remainingGrams, 0);
  let kitchenBoundGrams = 0;
  for (const lot of lots) {
    if (kitchenImplies(kitchen, lot.variety).length) kitchenBoundGrams += lot.remainingGrams;
  }
  return {
    person, home,
    village: { remainingGrams: villageGrams, cellCount: person.length, homeCount: home.length },
    kitchenBoundGrams,
    conserved: villageGrams === homeGrams && homeGrams === person.reduce((n, p) => n + p.remainingGrams, 0),
  };
}

function stakeholderMayWrite(role, kind) {
  const s = STAKE_BY_ID[role];
  if (!s) return { allowed: false, reason: 'Unknown stakeholder.', rupee: null };
  if (role === 'banker') return { allowed: false, reason: 'Agriculture finance stays missing. No invented credit score.', rupee: null };
  if (role === 'dealer') return { allowed: false, reason: 'Agriculture procure stays missing. No invented SKU catalogue.', rupee: null };
  if (kind === 'propose') {
    const ok = s.writes === 'propose';
    return { allowed: ok, reason: ok ? `${s.name} may propose. Clerk still writes remaining.` : `${s.name} does not propose.`, rupee: null };
  }
  if (kind === 'rupee') {
    const ok = s.writes === 'rupee';
    return { allowed: ok, reason: ok ? `${s.name} may declare ₹. AI cannot.` : `${s.name} cannot write rupees. ${s.writes === 'remaining' ? 'Remaining only.' : 'No write.'}`, rupee: null };
  }
  if (kind === 'remaining') {
    const ok = s.writes === 'remaining' || s.writes === 'rupee';
    return { allowed: ok, reason: ok ? `${s.name} may move remaining grams.` : `${s.name} cannot move remaining.`, rupee: null };
  }
  return { allowed: false, reason: `${s.name} has no write on this kernel.`, rupee: null };
}

function manageErpModule(moduleId, facts = {}) {
  const def = ERP_BY_ID[moduleId];
  if (!def) {
    return { moduleId, sap: '?', analog: 'Unknown', status: 'missing', decision: 'named', rupeeWrite: false, clerkRequired: true, remainingGrams: facts.remainingGrams ?? null, amountPaise: null, reason: 'Unknown ERP module. Do not invent a second OS.', passport: null };
  }
  if (def.status === 'missing') {
    return { moduleId: def.id, sap: def.sap, analog: def.analog, status: 'missing', decision: 'named', rupeeWrite: false, clerkRequired: true, remainingGrams: facts.remainingGrams ?? null, amountPaise: null, reason: `${def.analog} (${def.sap}) is named missing. ${def.missing} Do not paint it living.`, passport: null };
  }
  if (def.status === 'refused') {
    return { moduleId: def.id, sap: def.sap, analog: def.analog, status: 'refused', decision: 'refuse', rupeeWrite: false, clerkRequired: true, remainingGrams: facts.remainingGrams ?? null, amountPaise: null, reason: `${def.analog} stays refused. ${def.missing}`, passport: null };
  }
  const signal = def.signal ?? 'remaining';
  const passport = brainDecide({
    signal, remainingGrams: facts.remainingGrams ?? 180000, outage: Boolean(facts.outage), alert: Boolean(facts.alert),
    iotTempC: facts.iotTempC ?? null, balanced: facts.balanced ?? true, clerk: facts.clerk ?? 'Biren',
    rupeeWrite: Boolean(facts.rupeeWrite), lossPctDeclared: facts.lossPctDeclared ?? 10,
  });
  return {
    moduleId: def.id, sap: def.sap, analog: def.analog, status: def.status,
    decision: passport.decision === 'block' ? 'block' : passport.decision, rupeeWrite: false,
    clerkRequired: passport.clerkRequired, remainingGrams: passport.remainingGrams, amountPaise: null,
    reason: passport.reason, passport,
  };
}

function modulesForScale(scale) {
  return ERP_MODULES.filter((m) => m.scale.includes(scale));
}

function modulesByStatus(status) {
  if (status === 'all') return ERP_MODULES;
  return ERP_MODULES.filter((m) => m.status === status);
}

module.exports = {
  STAKEHOLDERS, ERP_MODULES, ERP_BY_ID, STAKE_BY_ID, atlasScore, nestedRemaining,
  stakeholderMayWrite, manageErpModule, modulesForScale, modulesByStatus,
};
