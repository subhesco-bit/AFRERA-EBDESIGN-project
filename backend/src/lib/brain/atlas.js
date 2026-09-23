'use strict';
/** AI atlas. Classify every named AI. Decision lives on the kernel.
 * Ported from pine-shadow src/lib/brain/atlas.ts */

const { AI_SYSTEMS } = require('../systems/catalog');
const { brainDecide } = require('./decide');

function u(id, name, analog, tissue, source, status, signal, href, present, missing) {
  return { id, name, analog, tissue, source, status, signal, href, present, missing };
}

const AI_UNITS = [
  u('cortex', 'Village cortex', 'One brain', 'cortex', 'lattice', 'living', 'remaining', '/brain', 'brainDecide is the only mouth. Twelve named signals. Decision passport.', 'Two brains on GitHub (orchestrator + AIBrainPage).'),
  u('frontier', 'Frontier AI', 'Edge gates', 'frontier', 'lattice', 'living', 'mill-heat', '/brain', 'millDecision names outage, alert, heat. Remaining gate conserves grams.', 'Model registry, drift.'),
  u('agentic', 'Agentic AI', 'Companion propose', 'agentic', 'lattice', 'living', 'harvest-propose', '/companion', 'Propose harvest / intake / settle. Clerk names kg and paymentRef.', 'GitHub M675100 WIRED skeleton. Zero live callers.'),
  u('physical', 'Physical AI', 'Mill, IoT, sack', 'physical', 'lattice', 'living', 'mill-clear', '/warehouse', 'Declared temp, kWh, remaining mass. Mill rests on heat.', 'Robot fleet. Humanoid teleop refused.'),
  u('security', 'AI security and trust', 'Firewall', 'security', 'lattice', 'living', 'remaining', '/charter', 'rupeeWrite false. Constitution E1–E9. Consent. Eval harness.', 'Pen-test, model-theft, incident playbook on GitHub.'),
  u('scientist', 'Artificial scientists', 'Declared-loss twin', 'scientist', 'lattice', 'living', 'hypothesis', '/library', 'Hypothesis on declared remaining and loss %. Yield null.', 'Invented yield, gazette twin, training loop.'),
  u('erp-manage', 'AI ERP management', 'Passport or named-missing', 'cortex', 'lattice', 'living', 'remaining', '/platform', 'manageErpModule: living/partial emit a passport. Missing named. Refused refuse.', 'SAP copilot, numeric AI writes.'),
  u('vet-coding', 'August AI veterinary coding', 'AFRERA-VET', 'agentic', 'lattice', 'living', 'vet-code', '/vet', 'proposeVet on cattle, buffalo, goat, pig, poultry, duck, fish, dog, cat. Clerk/vet confirms heads. ASF/AI named, not auto-confirm.', 'SNOMED-VET, WOAH lab, milk rupees.'),
  u('share-slot', 'Shared-muscle proposer', 'Village hours', 'agentic', 'lattice', 'living', 'share-slot', '/share', 'proposeSlot on cold, mill, process, pack, labs, dryer, polyhouse, equipment. Clerk confirms hours. Rent undeclared.', 'Rental rupees, GST invoice, kWh-priced booking.'),
  u('nerve', 'Governed nerve', 'Library consult', 'agentic', 'lattice', 'partial', 'harvest-propose', '/nerve', 'Consult memory first. Coordinator analog lives here.', 'Eval SLOs, cost/latency on GitHub.'),
  u('library', 'Library hippocampus', 'Cite or hide', 'scientist', 'lattice', 'partial', 'hypothesis', '/library', 'Named pulses fire on boot. No API key required.', 'OCR graph, permissioned retrieval.'),
  u('copilot', 'Copilot keystroke', 'Next gate on books', 'agentic', 'lattice', 'partial', 'harvest-propose', '/companion', 'Next keystroke inside Books. Never a second portal.', 'GitHub CopilotChat.jsx page.'),
  u('advisory', 'Advisory reflex', 'weather.alert', 'frontier', 'lattice', 'partial', 'mill-heat', '/warehouse', 'Claim window opens. EMI not frozen.', 'GitHub weatherAdvisory page.'),
  u('orchestrator', 'Orchestrator fold', 'One spinal cord', 'cortex', 'github', 'partial', 'remaining', '/brain', 'Lattice folds sixteen mouths into brainDecide.', 'GitHub 43KB switch. Default is log-and-forget.'),
  u('fabric', 'Intelligence fabric', '0 paise spend cap', 'security', 'lattice', 'partial', 'remaining', '/charter', 'Assertions spend 0 paise. Guardrail is the clerk boundary.', 'GitHub JSON of seven file names.'),
  u('eval-harness', 'Eval harness', 'Library-first eval', 'scientist', 'lattice', 'partial', 'hypothesis', '/library', 'Eval on named library cards. Rupee write fails.', 'Training loop, bias dashboard.'),
  u('farm-twin', 'Farm twin', 'Declared remaining after', 'scientist', 'lattice', 'partial', 'hypothesis', '/cells', 'Loss % declared → remaining after. Never auto-execute.', 'Soil/weather/water simulation.'),
  u('climate-reflex', 'Climate autopilot', 'Mill rest', 'frontier', 'lattice', 'partial', 'mill-heat', '/os', 'Alert + outage + 31.4 C blocks mill, opens claim.', 'Daily simulation on GitHub.'),
  u('constitution', 'AI constitution', 'E1–E9', 'security', 'lattice', 'partial', 'remaining', '/charter', 'Firewall on numeric writes. No inferred caste, religion, health.', 'Machine-enforced registry on GitHub.'),
  u('flows-decision', 'Decision flow chart', 'Swimlane of tissues', 'cortex', 'lattice', 'partial', 'harvest-propose', '/flows', 'Decision chart nodes are kernel gates. brain-decide algorithm.', 'A second invented OS.'),
  u('model-registry', 'Model registry', 'Named models', 'none', 'github', 'missing', null, '/systems', 'GitHub cadavers listed. No registry of weights.', 'Drift, versioning, rollback.'),
  u('ocr', 'Document OCR', 'Scan to remaining', 'none', 'github', 'missing', null, '/systems', 'Clerk types kilograms. OCR stays named.', 'Layout, compliance coords.'),
  u('vernacular-voice', 'Vernacular voice', 'Dictate harvest', 'none', 'github', 'missing', null, '/companion', 'Voice is a door on the companion, not a product.', 'Language pack, harvest dictation.'),
  u('finance-ai', 'Finance AI', 'Underwriting', 'none', 'github', 'missing', null, '/ledger', 'Hours-to-pay sits on the cell. No score.', 'Credit score, bank rails.'),
  u('procure-ai', 'Procure AI', 'RFQ / 3-way', 'none', 'github', 'missing', null, '/platform', 'Dealer cannot write. Purchasing named missing.', 'RFQ, 3-way match.'),
  u('language-adapt', 'Language adapt', 'Outcome feedback', 'none', 'github', 'missing', null, '/os', 'Domain vocabulary lives. Rupee laws never auto-translate.', 'Full locale packs, outcome loop.'),
  u('drift-monitor', 'Drift monitor', 'Model drift', 'none', 'github', 'missing', null, '/systems', 'Named. No live model to drift.', 'Feature store, monitors.'),
  u('incident-playbook', 'Incident playbook', 'AI incident', 'none', 'github', 'missing', null, '/charter', 'Clerk boundary is the control. Secrets out of repo.', 'Pen-test, theft, runbook.'),
  u('channel-timing', 'Channel timing', 'When to nag', 'none', 'github', 'missing', null, '/companion', 'Fatigue: no nag. Propose only.', 'Channel/timing engine.'),
  u('github-medical', 'GitHub human medical coding', 'ICD-10 / CPT / HCPCS', 'none', 'github', 'missing', null, '/vet', 'SUBH-DEEP completion report claimed 14 human systems. Dietitian and hospital codes are the wrong genome.', 'Do not paint a hospital coder living on a village herd.'),
  u('humanoid-teleop', 'Humanoid teleop', 'Robot mill', 'physical', 'lattice', 'refused', 'physical-teleop', '/warehouse', 'Physical AI is mill, IoT, sack.', 'Do not fake a robot fleet.'),
  u('ai-rupee', 'AI rupee write', 'Numeric write', 'security', 'lattice', 'refused', 'rupee-write', '/charter', 'Firewall holds. amountPaise always null.', 'Do not let a model post the journal.'),
  u('yield-forecast', 'Yield forecast', 'Invented kg', 'scientist', 'lattice', 'refused', 'hypothesis', '/library', 'Scientist hypothesizes remaining after declared loss. Yield stays null.', 'Do not invent a yield.'),
  u('tourism-ai', 'Tourism itinerary', 'Visitor planner', 'scientist', 'lattice', 'refused', 'tourism', '/os', 'Remaining journey is a different door.', 'Do not clone a tourism app.'),
  u('inferred-profile', 'Inferred profile', 'Silent dossier', 'security', 'lattice', 'refused', 'loan', '/os', 'Cell inspect lives. No login profile. Loan refused.', 'Do not infer caste, religion, health, or a credit score.'),
];

const AI_BY_ID = Object.fromEntries(AI_UNITS.map((row) => [row.id, row]));

function aiScore() {
  return {
    units: AI_UNITS.length,
    living: AI_UNITS.filter((row) => row.status === 'living').length,
    partial: AI_UNITS.filter((row) => row.status === 'partial').length,
    missing: AI_UNITS.filter((row) => row.status === 'missing').length,
    refused: AI_UNITS.filter((row) => row.status === 'refused').length,
    classifiedPct: 100, aiParity: false, decisionCapable: true, rupeeWrite: false,
    githubLivingPlugs: 0, githubCadavers: AI_SYSTEMS.length, latticeTissues: 5, signals: 12,
    financeMissing: true, procureMissing: true, githubPct: 7, latticePct: 39,
  };
}

function unitsByStatus(status) {
  if (status === 'all') return AI_UNITS;
  return AI_UNITS.filter((row) => row.status === status);
}

function factsOf(partial) {
  return {
    signal: partial.signal ?? 'remaining', remainingGrams: partial.remainingGrams ?? 180000,
    outage: Boolean(partial.outage), alert: Boolean(partial.alert), iotTempC: partial.iotTempC ?? null,
    kwh: partial.kwh ?? null, balanced: partial.balanced ?? true, clerk: partial.clerk ?? 'Biren',
    rupeeWrite: Boolean(partial.rupeeWrite), lossPctDeclared: partial.lossPctDeclared ?? 10,
  };
}

function ackAi(unitId, facts = {}) {
  const def = AI_BY_ID[unitId];
  if (!def) {
    return { unitId, name: 'Unknown', analog: 'Unknown', status: 'missing', decision: 'named', rupeeWrite: false, clerkRequired: true, remainingGrams: facts.remainingGrams ?? null, amountPaise: null, yield: null, humanoid: false, reason: 'Unknown AI. Do not invent a second brain.', passport: null };
  }
  if (def.status === 'missing') {
    return { unitId: def.id, name: def.name, analog: def.analog, status: 'missing', decision: 'named', rupeeWrite: false, clerkRequired: true, remainingGrams: facts.remainingGrams ?? null, amountPaise: null, yield: null, humanoid: false, reason: `${def.name} is named missing. ${def.missing} Do not paint it living.`, passport: null };
  }
  if (def.status === 'refused') {
    const passport = def.signal ? brainDecide(factsOf({ ...facts, signal: def.signal, rupeeWrite: def.id === 'ai-rupee' ? true : facts.rupeeWrite })) : null;
    return { unitId: def.id, name: def.name, analog: def.analog, status: 'refused', decision: 'refuse', rupeeWrite: false, clerkRequired: true, remainingGrams: facts.remainingGrams ?? passport?.remainingGrams ?? null, amountPaise: null, yield: null, humanoid: false, reason: `${def.name} stays refused. ${def.missing}`, passport };
  }
  const signal = def.signal ?? 'remaining';
  const passport = brainDecide(factsOf({ ...facts, signal, rupeeWrite: def.id === 'ai-rupee' ? true : facts.rupeeWrite }));
  return { unitId: def.id, name: def.name, analog: def.analog, status: def.status, decision: passport.decision === 'block' ? 'block' : passport.decision, rupeeWrite: false, clerkRequired: passport.clerkRequired, remainingGrams: passport.remainingGrams, amountPaise: null, yield: null, humanoid: false, reason: passport.reason, passport };
}

function ackAllAi(facts = {}) {
  const results = AI_UNITS.map((row) => ackAi(row.id, facts));
  return {
    classified: 100, rupeeWrites: 0,
    livingPassports: results.filter((r) => r.status === 'living' && r.passport != null).length,
    named: results.filter((r) => r.decision === 'named').length,
    refused: results.filter((r) => r.decision === 'refuse').length,
    unknownNamed: ackAi('not-a-real-ai').decision === 'named',
    results,
  };
}

module.exports = { AI_UNITS, AI_BY_ID, ackAi, ackAllAi, aiScore, unitsByStatus };
