'use strict';
/** Eleven parts. Each is a named gate on this kernel, not a drawing.
 * Ported from pine-shadow src/lib/body/anatomy.ts */

const BODY_VIEW = { w: 240, h: 500 };

const BODY_PARTS = [
  { id: 'skin', name: 'Skin', human: 'Barrier and sensation', dora: 'Consent surface · rupee firewall', organ: 'farmer', status: 'living', present: 'Skin seals undeclared writes. Consent receipts. Remaining stays inside.', missing: 'National identity skin. Portable consent ledger on GitHub.', next: 'Firewall holds. Auth stays off. No login dossier.', href: '/os', cx: 120, cy: 22 },
  { id: 'eye', name: 'Eye', human: 'Sight', dora: 'Cell inspect · declared sensors', organ: 'farmer', status: 'living', present: 'Inspect cell remaining. Farm twin on declared loss %. Infra twin on declared temp/kWh/water.', missing: 'Soil/weather simulation. Login profile refused.', next: 'See remaining. Never a login dossier.', href: '/cells', cx: 108, cy: 44 },
  { id: 'ear', name: 'Ear', human: 'Hearing', dora: 'Mill signals · climate alert', organ: 'reflex', status: 'living', present: 'Listens for outage, alert, heat ≥ 31 C. Companion proposes. Nerve consults library-first.', missing: 'IVR, vernacular speech on GitHub.', next: 'Named signals. EMI is not a sound the ear can freeze.', href: '/nerve', cx: 86, cy: 50 },
  { id: 'heart', name: 'Heart', human: 'Pulse and circulation', dora: 'Harvest / intake / settle pulse', organ: 'spine', status: 'living', present: 'One lot body. Spine pulses harvest.completed, intake, settle. Trace correlates lotId.', missing: 'Payment rails as blood. Kafka on GitHub.', next: 'Pulse the same body. Do not invent a second lot.', href: '/pulse', cx: 128, cy: 138 },
  { id: 'vein', name: 'Vein', human: 'Carry remaining mass', dora: 'remaining_grams · FIFO path', organ: 'lot', status: 'living', present: 'Vein carries remaining harvest → godown → offtake. Mass conserved. Spoilage is a clerk cut.', missing: 'Bank circulation. Cold-km energy cost.', next: 'Same lot body. Never a negative remaining.', href: '/lots', cx: 168, cy: 170 },
  { id: 'muscle', name: 'Muscle', human: 'Contractile force', dora: 'Mill motor · process lot', organ: 'warehouse', status: 'living', present: 'Muscle contracts only when millDecision passes. Alert, outage, or heat rests the mill.', missing: 'Humanoid teleop. Factory twins.', next: 'Weather moves the muscle by stopping it. Remaining moves only on clerk loss.', href: '/warehouse', cx: 64, cy: 168 },
  { id: 'relax', name: 'Relax', human: 'Rest and recovery', dora: 'Mill rest · remaining unmoved · EMI not frozen', organ: 'reflex', status: 'living', present: 'Climate autopilot blocks mill, opens claim, does not freeze EMI. Remaining holds without clerk. Rest is the withdraw reflex when heat, alert, or outage arises.', missing: 'Daily climate simulation on GitHub.', next: 'Rest is a gate. It is not a freeze of farmer cash.', href: '/os', cx: 120, cy: 210 },
  { id: 'ligament', name: 'Ligament', human: 'Join organ to organ', dora: '140 named joints · 39% living', organ: 'os', status: 'partial', present: 'Ligament catalog names every joint. Living fire. Missing stay dashed.', missing: '73 missing joints. Village energy cloud, scheme blood, aquifer twin.', next: 'Do not paint a missing ligament living.', href: '/ligaments', cx: 88, cy: 118 },
  { id: 'hand', name: 'Hand', human: 'Grasp and manipulate', dora: 'Clerk writes · harvest mint · intake · settle · claim', organ: 'erp', status: 'living', present: 'Hand grasps remaining. Clerk declares kg, ₹, loss, paymentRef. Companion only proposes.', missing: 'Delegated consent, recorded assistance on GitHub.', next: 'AI does not hold the sack.', href: '/lots', cx: 40, cy: 268 },
  { id: 'finger', name: 'Finger', human: 'Fine motor', dora: 'Grams · FIFO · qty-weighted split · BOQ stamp', organ: 'erp', status: 'living', present: 'Precision is grams, not kg. Last cell absorbs remainder. BOQ stamps declared qty+unit.', missing: 'BIM, CFD. Engineering simulation refused.', next: 'Do not fake CFD. Do not round remaining into a story.', href: '/os', cx: 28, cy: 292 },
  { id: 'feet', name: 'Feet', human: 'Stand and ground', dora: 'Village cells · declared acres · remaining journey', organ: 'village', status: 'living', present: 'Feet stand on Langthasa. Village remaining journey: plot → harvest → godown → kitchen → next Magh.', missing: 'Tourism itinerary. Invented budget.', next: 'Ground the cell. Refuse tourism. Do not invent ₹.', href: '/cells', cx: 102, cy: 468 },
];

const BODY_BY_ID = Object.fromEntries(BODY_PARTS.map((p) => [p.id, p]));

const RELAX_ACTIONS = [
  { id: 'rest-mill', label: 'Rest mill', human: 'Muscle releases', present: 'Block mill on named signals. Immediate correct reaction. EMI not frozen.' },
  { id: 'hold-remaining', label: 'Hold remaining', human: 'Do not move mass', present: 'Remaining stays on the same body until a clerk declares loss.' },
  { id: 'period-rest', label: 'Period rest', human: 'Books close and rest', present: 'Magh closes on a balanced journal. SoD: clerk required.' },
  { id: 'unclench', label: 'Unclench', human: 'Muscle may contract', present: 'Mill passes only when outage, alert, and heat are absent. Forced unclench during danger is refused.' },
  { id: 'seal-skin', label: 'Seal skin', human: 'Barrier holds', present: 'Rupee-write firewall. Consent surface. Auth off.' },
];

module.exports = { BODY_VIEW, BODY_PARTS, BODY_BY_ID, RELAX_ACTIONS };
