'use strict';
/** One cortex. Five tissues fire on a named signal. Clerk still writes remaining.
 * Ported from pine-shadow src/lib/brain/decide.ts */

const { millDecision } = require('../erp/kernel');
const { assessSuitability } = require('../os/suitability');
const { evaluateConstitution } = require('../os/constitution');
const { closePeriod, farmTwin, travelPlan } = require('../os/runtime');
const { TISSUES } = require('./tissues');

const ORGAN_FOR = {
  'mill-heat': 'reflex', 'mill-clear': 'reflex', remaining: 'lot', period: 'erp', loan: 'finance',
  tourism: 'demand', 'rupee-write': 'rupee', hypothesis: 'crop', 'physical-teleop': 'warehouse',
  'harvest-propose': 'lot', 'vet-code': 'livestock', 'share-slot': 'shared',
};

const ALGO_FOR = {
  'mill-heat': 'millDecision + climateAutopilot', 'mill-clear': 'millDecision', remaining: 'remainingGate',
  period: 'closePeriod SoD', loan: 'assessSuitability(loan)', tourism: 'travelPlan tourism refuse',
  'rupee-write': 'constitution E3', hypothesis: 'farmTwin declared loss %',
  'physical-teleop': 'physical AI mill/IoT only', 'harvest-propose': 'agentic propose, clerk mint',
  'vet-code': 'proposeVet + clerk confirm heads', 'share-slot': 'proposeSlot + clerk confirm hours',
};

function tissue(id, fired, verdict, reason) {
  const def = TISSUES.find((t) => t.id === id);
  return { id, name: def.name, fired, verdict, reason };
}

function rollup(tissues) {
  if (tissues.some((t) => t.fired && (t.verdict === 'block' || t.verdict === 'refuse'))) return 'block';
  if (tissues.some((t) => t.fired && t.verdict === 'defer')) return 'defer';
  if (tissues.some((t) => t.fired && t.verdict === 'propose')) return 'propose';
  return 'pass';
}

function brainDecide(input) {
  const mill = millDecision({ outage: input.outage, alert: input.alert, iotTempC: input.iotTempC, kwh: input.kwh ?? null });
  const period = closePeriod({ season: 'Magh 2026', balanced: input.balanced, clerk: input.clerk });
  const constitution = evaluateConstitution({ rupeeWrite: Boolean(input.rupeeWrite) });
  const loan = assessSuitability('loan');
  const tourism = travelPlan({
    remainingGrams: input.remainingGrams, weatherAlert: input.alert, millBlocked: mill.decision === 'block',
    kitchenAccess: true, tourism: input.signal === 'tourism', budgetPaise: null,
  });
  const lossPct = input.lossPctDeclared ?? 10;
  const twin = input.remainingGrams >= 0 ? farmTwin({ remainingGrams: input.remainingGrams, lossPctDeclared: lossPct }) : null;

  const signal = input.signal;
  const tissues = [
    tissue('frontier',
      signal === 'mill-heat' || signal === 'mill-clear' || signal === 'remaining',
      signal === 'remaining' ? (input.remainingGrams > 0 ? 'pass' : 'block') : (mill.decision === 'block' ? 'block' : mill.decision === 'defer' ? 'defer' : 'pass'),
      signal === 'remaining' ? (input.remainingGrams > 0 ? `Remaining ${input.remainingGrams} g on the same body.` : 'No remaining mass.') : mill.reason),
    tissue('agentic',
      signal === 'harvest-propose' || signal === 'period' || signal === 'vet-code' || signal === 'share-slot',
      signal === 'period' ? (period.status === 'closed' ? 'propose' : 'block') : 'propose',
      signal === 'period' ? period.reason
        : signal === 'vet-code' ? 'August AI proposes AFRERA-VET. Clerk/vet confirms heads. Human ICD refused. Milk rupees stay undeclared.'
        : signal === 'share-slot' ? 'Propose hours on village muscle. Clerk confirms. Rent undeclared. GST invoice refused.'
        : 'Propose harvest mint. Clerk names kilograms. Companion never writes a rupee.'),
    tissue('physical',
      signal === 'physical-teleop' || signal === 'mill-heat' || signal === 'mill-clear',
      signal === 'physical-teleop' ? 'refuse' : (mill.decision === 'block' ? 'block' : mill.decision === 'defer' ? 'defer' : 'pass'),
      signal === 'physical-teleop' ? 'Humanoid teleop refused. Physical AI is the mill, the IoT reading, the sack.' : `Mill ${mill.decision}. Sensors declared. No robot fleet.`),
    tissue('security', true,
      !constitution.allowed || signal === 'rupee-write' || signal === 'loan' ? 'block' : 'pass',
      signal === 'loan' ? loan.reason
        : signal === 'rupee-write' || !constitution.allowed ? 'AI cannot write rupees. Constitution E3. Clerk boundary holds.'
        : 'Firewall open. Secrets out of repo. Consent default is non-personalized.'),
    tissue('scientist',
      signal === 'hypothesis' || signal === 'tourism' || signal === 'vet-code' || signal === 'share-slot',
      signal === 'tourism' ? 'refuse' : 'hypothesis',
      signal === 'tourism' ? tourism.reason
        : signal === 'vet-code' ? 'Named analog on the herd. Not a licensed ICD dump. Yield undeclared. Rupee null.'
        : signal === 'share-slot' ? 'Hours conserved like remaining grams. Operation Green amount blank. GST named missing.'
        : twin ? `What-if ${lossPct}% declared loss → ${twin.remainingAfter} g remaining. Yield undeclared. Rupee null.`
        : 'Hypothesis waits on declared remaining.'),
  ];

  if (signal === 'tourism') {
    tissues[0] = tissue('frontier', false, 'pass', 'Frontier idle. Tourism is not a mill signal.');
  }

  const decision = rollup(tissues);
  const fired = tissues.filter((t) => t.fired);
  const reason =
    fired.find((t) => t.verdict === 'block' || t.verdict === 'refuse')?.reason ??
    fired.find((t) => t.verdict === 'propose')?.reason ??
    fired[0]?.reason ??
    'No tissue fired.';

  return {
    id: `pass-${signal}`, signal, organ: ORGAN_FOR[signal], decision, tissues, rupeeWrite: false,
    clerkRequired: decision !== 'pass' || signal === 'harvest-propose' || signal === 'period',
    remainingGrams: input.remainingGrams, amountPaise: null, yield: null, humanoid: false, reason,
    algorithm: ALGO_FOR[signal],
  };
}

const BRAIN_SIGNALS = [
  { id: 'mill-heat', label: 'Mill heat', body: 'Alert + outage + 31.4 C. Block mill. EMI not frozen.' },
  { id: 'mill-clear', label: 'Mill clear', body: 'No outage, no alert. Mill runs only when kWh is declared.' },
  { id: 'remaining', label: 'Remaining', body: 'Mass conservation. Empty remaining blocks the gate.' },
  { id: 'period', label: 'Period close', body: 'SoD. Unbalanced journal cannot close Magh.' },
  { id: 'harvest-propose', label: 'Harvest propose', body: 'Agentic proposes mint. Clerk names kg.' },
  { id: 'loan', label: 'Loan', body: 'Refuse. No underwriting. No invented score.' },
  { id: 'tourism', label: 'Tourism', body: 'Refuse itinerary. Remaining journey is a different door.' },
  { id: 'rupee-write', label: 'Rupee write', body: 'Firewall. AI numeric writes are forbidden.' },
  { id: 'hypothesis', label: 'Hypothesis', body: 'Declared loss % → remaining after. Yield stays null.' },
  { id: 'physical-teleop', label: 'Humanoid', body: 'Teleop refused. Physical AI is mill and sack.' },
  { id: 'vet-code', label: 'Vet code', body: 'August AI proposes AFRERA-VET. Clerk confirms heads. Human ICD refused.' },
  { id: 'share-slot', label: 'Share slot', body: 'Propose hours on village muscle. Clerk confirms. Rent and GST invoice refused.' },
];

module.exports = { brainDecide, BRAIN_SIGNALS };
