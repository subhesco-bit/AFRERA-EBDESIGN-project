'use strict';
/** Life-and-business event engine. Unknown events fail. They do not forget.
 * Ported from pine-shadow src/lib/os/events.ts */

const LIFE_EVENTS = [
  { id: 'harvest.completed', name: 'Harvest minted', status: 'living', signal: 'harvest.completed', muscle: 'lot.mint remaining = grams' },
  { id: 'warehouse.intake', name: 'Same body inwards', status: 'living', signal: 'warehouse.intake', muscle: 'receipt on lotId' },
  { id: 'offtake.settle', name: 'Declared price settled', status: 'living', signal: 'offtake.settle', muscle: 'journal + paymentRef' },
  { id: 'spoilage.event', name: 'Spoilage cuts remaining', status: 'living', signal: 'spoilage.event', muscle: 'remainingAfterCommit' },
  { id: 'cover.bound', name: 'Godown cover bound', status: 'living', signal: 'cover.bound', muscle: 'policyId on the lot' },
  { id: 'weather.alert', name: 'Weather claim window', status: 'living', signal: 'weather.alert', muscle: 'claim window + moratorium propose, no EMI freeze' },
  { id: 'herd.covered', name: 'Herd cover bound', status: 'living', signal: 'herd.covered', muscle: 'POL-LANGTHASA-HERD on declared headcount' },
  { id: 'vet.coded', name: 'Veterinary code proposed', status: 'living', signal: 'vet.coded', muscle: 'AFRERA-VET propose. Clerk confirms heads. Human ICD refused.' },
  { id: 'share.booked', name: 'Village muscle booked', status: 'living', signal: 'share.booked', muscle: 'Hours conserved. Clerk confirms. Rent undeclared.' },
  { id: 'organic.traced', name: 'Organic path named', status: 'living', signal: 'organic.traced', muscle: 'PGS/NPOP declared on the lot body. GST invoice missing.' },
  { id: 'gst.invoice', name: 'GST e-invoice', status: 'named', signal: 'gst.invoice', muscle: 'none — HSN may name the sack. Invoice stays missing.' },
  { id: 'scheme.eligible', name: 'Scheme eligibility', status: 'living', signal: 'scheme.eligible', muscle: 'computed, amount blank' },
  { id: 'food.utility', name: 'FUS rank', status: 'living', signal: 'food.utility', muscle: 'FUS-v1 on declared food axes' },
  { id: 'marriage', name: 'Household marriage', status: 'named', signal: 'life.marriage', muscle: 'none — do not fan out' },
  { id: 'illness', name: 'Illness', status: 'named', signal: 'life.illness', muscle: 'none — do not infer health' },
  { id: 'price-crash', name: 'Price crash', status: 'named', signal: 'market.crash', muscle: 'none — price stays declared' },
  { id: 'flood', name: 'Flood', status: 'living', signal: 'weather.flood', muscle: 'weather.alert claim window, EMI not frozen' },
  { id: 'offline.sync', name: 'Offline sync', status: 'living', signal: 'offline.sync', muscle: 'queue + receipt. No invented amounts.' },
  { id: 'period.close', name: 'Period close', status: 'living', signal: 'period.close', muscle: 'SoD: unbalanced journal cannot close' },
  { id: 'climate.reflex', name: 'Climate reflex', status: 'living', signal: 'climate.reflex', muscle: 'block mill, open claim, remaining moves only on clerk loss' },
  { id: 'scenario.whatif', name: 'Scenario what-if', status: 'living', signal: 'scenario.whatif', muscle: 'declared loss % → remaining after, rupee null, not live' },
];

function livingEvents() {
  return LIFE_EVENTS.filter((e) => e.status === 'living');
}

function eventById(id) {
  return LIFE_EVENTS.find((e) => e.id === id);
}

function unknownEventFails(id) {
  return !LIFE_EVENTS.some((e) => e.id === id);
}

module.exports = { LIFE_EVENTS, livingEvents, eventById, unknownEventFails };
