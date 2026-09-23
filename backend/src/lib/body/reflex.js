'use strict';
/** Immediate reaction. Relax is the withdraw reflex, not inaction.
 * Ported from pine-shadow src/lib/body/reflex.ts */

const { actBody, relaxBody } = require('./actions');

const ISSUE_DEFS = [
  { id: 'rupee-write', severity: 100, label: 'Rupee write', human: 'Barrier reflex. Skin seals before the mill even hears.', sense: 'skin', posture: 'react', relax: 'seal-skin', part: 'skin', present: 'AI cannot write rupees. Remaining stays inside.', wrong: ['write-rupee', 'unclench', 'move-remaining', 'freeze-emi'], path: ['skin feels undeclared write', 'seal', 'remaining held', 'clerk still writes'] },
  { id: 'mass-leak', severity: 90, label: 'Mass leak', human: 'Vein clenches. Do not bleed remaining.', sense: 'vein', posture: 'react', relax: 'hold-remaining', part: 'vein', present: 'Offtake plus spoilage cannot exceed minted grams.', wrong: ['move-remaining', 'write-rupee', 'freeze-emi'], path: ['vein checks conservation', 'hold remaining', 'clerk names any cut'] },
  { id: 'heat', severity: 80, label: 'Heat ≥ 31 C', human: 'Withdraw reflex. Reciprocal inhibition. Do not force a hot mill.', sense: 'ear', posture: 'relax', relax: 'rest-mill', part: 'muscle', present: 'Muscle rests. Claim may open. EMI not frozen. Remaining unmoved.', wrong: ['unclench', 'freeze-emi', 'invent-kwh', 'move-remaining', 'write-rupee'], path: ['ear hears heat', 'muscle inhibits', 'vein holds remaining', 'EMI not frozen'] },
  { id: 'alert', severity: 75, label: 'Weather alert', human: 'Climate withdraw. Mill stops. Farmer cash is not a switch.', sense: 'ear', posture: 'relax', relax: 'rest-mill', part: 'muscle', present: 'Autopilot blocks mill, opens claim, does not freeze EMI.', wrong: ['unclench', 'freeze-emi', 'move-remaining', 'write-rupee'], path: ['ear hears alert', 'muscle rests', 'claim window open', 'EMI not frozen'] },
  { id: 'outage', severity: 70, label: 'Energy outage', human: 'No current, no contract. Wait. Do not invent kWh.', sense: 'ear', posture: 'relax', relax: 'rest-mill', part: 'muscle', present: 'Mill blocked on outage. kWh stays undeclared if absent.', wrong: ['unclench', 'invent-kwh', 'freeze-emi'], path: ['ear hears outage', 'muscle rests', 'energy undeclared stays blank'] },
  { id: 'tourism', severity: 60, label: 'Tourism itinerary', human: 'Feet refuse the wrong ground.', sense: 'feet', posture: 'refuse', relax: null, part: 'feet', present: 'Village remaining journey only. Budget undeclared.', wrong: ['invent-tourism', 'write-rupee', 'freeze-emi'], path: ['feet feel a tourism ask', 'refuse itinerary', 'stand on the cell'] },
  { id: 'no-clerk', severity: 50, label: 'No clerk', human: 'Hand waits. Companion does not hold the sack.', sense: 'hand', posture: 'wait', relax: 'hold-remaining', part: 'hand', present: 'Hand needs a named clerk. AI proposes only.', wrong: ['move-remaining', 'write-rupee'], path: ['hand finds no clerk', 'hold remaining', 'companion proposes'] },
  { id: 'empty-lot', severity: 45, label: 'Empty remaining', human: 'Nothing to grasp. Harvest first.', sense: 'hand', posture: 'wait', relax: 'hold-remaining', part: 'hand', present: 'Hand finds no remaining mass.', wrong: ['move-remaining', 'write-rupee'], path: ['finger reads 0 g', 'harvest first', 'do not sell an empty sack'] },
  { id: 'unbalanced', severity: 40, label: 'Unbalanced books', human: 'Heart will not close Magh on a tilted journal.', sense: 'heart', posture: 'wait', relax: 'period-rest', part: 'relax', present: 'Period rest needs a balanced journal and a clerk. SoD.', wrong: ['close-unbalanced', 'write-rupee', 'freeze-emi'], path: ['heart checks journal', 'period rest blocks', 'clerk rectifies'] },
  { id: 'undeclared-spoilage', severity: 35, label: 'Undeclared spoilage', human: 'Do not auto-cut the body. Clerk names the loss.', sense: 'vein', posture: 'relax', relax: 'hold-remaining', part: 'vein', present: 'Alert is not a loss gram. Remaining holds until clerk.', wrong: ['move-remaining', 'write-rupee', 'freeze-emi'], path: ['vein finds no clerk cut', 'hold remaining', 'claim may open'] },
  { id: 'undeclared-kwh', severity: 20, label: 'kWh undeclared', human: 'Muscle waits. Energy is a clerk fact, not a guess.', sense: 'ear', posture: 'wait', relax: null, part: 'muscle', present: 'Window open. kWh still undeclared. Mill defers.', wrong: ['invent-kwh', 'unclench', 'freeze-emi'], path: ['ear hears no kWh', 'muscle waits', 'do not invent energy'] },
  { id: 'clear', severity: 0, label: 'Signals clear', human: 'Recovery. Unclench only when heat, alert, and outage are absent.', sense: 'ear', posture: 'recover', relax: 'unclench', part: 'muscle', present: 'Mill may process. Remaining still unmoved until clerk.', wrong: ['write-rupee', 'move-remaining', 'freeze-emi', 'invent-tourism'], path: ['ear hears no danger', 'muscle unclenches', 'clerk still writes remaining'] },
];

const ISSUE_BY_ID = Object.fromEntries(ISSUE_DEFS.map((d) => [d.id, d]));

const WRONG_ATTEMPTS = [
  { id: 'unclench', label: 'Force unclench', human: 'Push the mill while it is hot.' },
  { id: 'freeze-emi', label: 'Freeze EMI', human: 'Treat farmer cash as a mill switch.' },
  { id: 'write-rupee', label: 'Write rupees', human: 'Let AI invent a ₹.' },
  { id: 'move-remaining', label: 'Move remaining', human: 'Cut grams without a clerk.' },
  { id: 'invent-tourism', label: 'Invent tourism', human: 'Walk a tourist itinerary.' },
  { id: 'invent-kwh', label: 'Invent kWh', human: 'Guess energy to keep the mill running.' },
  { id: 'close-unbalanced', label: 'Close Magh anyway', human: 'Shut books on a tilted journal.' },
];

function massLeaks(facts) {
  if (facts.remainingGrams < 0) return true;
  if (facts.mintedGrams < 0 || facts.offtakeGrams < 0 || facts.spoilageGrams < 0) return true;
  return facts.offtakeGrams + facts.spoilageGrams > facts.mintedGrams;
}

function senseIssues(facts) {
  const live = [];
  if (facts.rupeeWrite) live.push({ ...ISSUE_BY_ID['rupee-write'], live: true });
  if (massLeaks(facts)) live.push({ ...ISSUE_BY_ID['mass-leak'], live: true });
  if (facts.iotTempC != null && facts.iotTempC >= 31) live.push({ ...ISSUE_BY_ID.heat, live: true });
  if (facts.alert) live.push({ ...ISSUE_BY_ID.alert, live: true });
  if (facts.outage) live.push({ ...ISSUE_BY_ID.outage, live: true });
  if (facts.tourism) live.push({ ...ISSUE_BY_ID.tourism, live: true });
  if (!facts.clerk.trim()) live.push({ ...ISSUE_BY_ID['no-clerk'], live: true });
  if (!(facts.remainingGrams > 0) && !massLeaks(facts)) live.push({ ...ISSUE_BY_ID['empty-lot'], live: true });
  if (!facts.balanced) live.push({ ...ISSUE_BY_ID.unbalanced, live: true });
  if (facts.alert && facts.spoilageGrams === 0) live.push({ ...ISSUE_BY_ID['undeclared-spoilage'], live: true });

  const danger = live.some((i) => i.posture === 'relax' || i.posture === 'react' || i.posture === 'refuse');
  if (!danger && facts.kwh == null && !facts.outage && !facts.alert && (facts.iotTempC == null || facts.iotTempC < 31)) {
    live.push({ ...ISSUE_BY_ID['undeclared-kwh'], live: true });
  }
  if (live.length === 0) live.push({ ...ISSUE_BY_ID.clear, live: true });
  live.sort((a, b) => b.severity - a.severity);
  return live;
}

function cleanBase(base) {
  return {
    ...base, alert: false, outage: false, iotTempC: 24, kwh: 12, rupeeWrite: false, tourism: false, balanced: true,
    clerk: base.clerk.trim() || 'Biren', remainingGrams: Math.max(base.remainingGrams, 1), offtakeGrams: 0, spoilageGrams: 0,
  };
}

function factsForIssue(base, id) {
  const c = cleanBase(base);
  switch (id) {
    case 'heat': return { ...c, alert: true, iotTempC: 31.4, kwh: null };
    case 'alert': return { ...c, alert: true, kwh: null };
    case 'outage': return { ...c, outage: true, kwh: null };
    case 'rupee-write': return { ...c, rupeeWrite: true };
    case 'tourism': return { ...c, tourism: true };
    case 'no-clerk': return { ...c, clerk: '' };
    case 'empty-lot': return { ...c, remainingGrams: 0 };
    case 'unbalanced': return { ...c, balanced: false };
    case 'mass-leak': return { ...c, mintedGrams: 100000, offtakeGrams: 90000, spoilageGrams: 20000, remainingGrams: 100000 };
    case 'undeclared-spoilage': return { ...c, alert: true, spoilageGrams: 0, kwh: null };
    case 'undeclared-kwh': return { ...c, kwh: null, iotTempC: 24 };
    case 'clear': return c;
    default: return c;
  }
}

function pack(def, act, hold, reason) {
  return {
    issue: def.id, posture: def.posture, sense: def.sense, part: def.part, relax: def.relax, act, hold,
    remainingHeld: true, freezeEmi: false, rupee: null, wrong: def.wrong, path: def.path, human: def.human, reason,
  };
}

function reactToIssue(id, facts) {
  const def = ISSUE_BY_ID[id];
  if (!def) throw new Error('Unknown issue.');
  const hold = relaxBody('hold-remaining', facts);

  if (id === 'rupee-write') {
    const act = relaxBody('seal-skin', facts);
    return pack(def, act, hold, act.reason);
  }
  if (id === 'mass-leak') {
    const act = actBody('vein', facts);
    return pack(def, act, hold, `${act.reason} Remaining held. EMI not frozen.`);
  }
  if (id === 'heat' || id === 'alert' || id === 'outage') {
    const act = relaxBody('rest-mill', facts);
    return pack(def, act, hold, act.reason);
  }
  if (id === 'tourism') {
    const act = actBody('feet', facts);
    return pack(def, act, hold, act.reason);
  }
  if (id === 'no-clerk' || id === 'empty-lot') {
    const act = actBody('hand', facts);
    return pack(def, act, hold, act.reason);
  }
  if (id === 'unbalanced') {
    const act = relaxBody('period-rest', facts);
    return pack(def, act, hold, act.reason);
  }
  if (id === 'undeclared-spoilage') return pack(def, hold, hold, hold.reason);
  if (id === 'undeclared-kwh') {
    const act = actBody('muscle', facts);
    return pack(def, act, hold, act.reason);
  }
  const act = relaxBody('unclench', facts);
  return pack(def, act, hold, act.reason);
}

function reactNow(facts) {
  const issues = senseIssues(facts);
  const primary = issues[0] ?? { ...ISSUE_BY_ID.clear, live: true };
  const reflex = reactToIssue(primary.id, facts);
  return { issues, primary, reflex, remainingHeld: true, freezeEmi: false, rupee: null };
}

function correctRelax(facts) {
  const issues = senseIssues(facts);
  const kinds = new Set();
  for (const i of issues) if (i.relax) kinds.add(i.relax);
  kinds.add('hold-remaining');
  kinds.add('seal-skin');
  const primary = issues[0];
  if (primary?.posture === 'relax' || primary?.id === 'heat' || primary?.id === 'alert' || primary?.id === 'outage') {
    kinds.delete('unclench');
  }
  return [...kinds];
}

function attemptWrong(kind, facts) {
  const report = reactNow(facts);
  const hold = relaxBody('hold-remaining', facts);
  const refuse = (reason, part = 'relax') => ({
    ...report.reflex, posture: 'refuse', part,
    act: { part, decision: 'refuse', moved: false, remainingGrams: facts.remainingGrams, rupee: null, freezeEmi: false, reason, signals: report.reflex.act.signals },
    hold, remainingHeld: true, freezeEmi: false, rupee: null, reason,
  });

  if (kind === 'freeze-emi') return refuse('Wrong reaction refused. EMI is not a muscle. Climate rest does not freeze farmer cash.');
  if (kind === 'write-rupee') {
    const sealed = reactToIssue('rupee-write', { ...facts, rupeeWrite: true });
    return { ...sealed, posture: 'refuse', reason: `Wrong reaction refused. ${sealed.act.reason}` };
  }
  if (kind === 'move-remaining') {
    return refuse(`Wrong reaction refused. Remaining ${facts.remainingGrams} g held. Clerk has not declared loss.`, 'vein');
  }
  if (kind === 'invent-tourism') {
    const feet = reactToIssue('tourism', { ...facts, tourism: true });
    return { ...feet, posture: 'refuse', reason: `Wrong reaction refused. ${feet.act.reason}` };
  }
  if (kind === 'invent-kwh') {
    const mill = actBody('muscle', facts);
    return refuse(`Wrong reaction refused. Do not invent kWh. ${mill.reason}`, 'muscle');
  }
  if (kind === 'close-unbalanced') {
    const rest = relaxBody('period-rest', { ...facts, balanced: false });
    return refuse(`Wrong reaction refused. ${rest.reason}`, 'relax');
  }
  const unclench = relaxBody('unclench', facts);
  if (unclench.decision === 'pass') return reactToIssue('clear', facts);
  return refuse(`Wrong reaction refused. ${unclench.reason}`, 'muscle');
}

module.exports = { ISSUE_DEFS, ISSUE_BY_ID, WRONG_ATTEMPTS, senseIssues, factsForIssue, reactToIssue, reactNow, correctRelax, attemptWrong };
