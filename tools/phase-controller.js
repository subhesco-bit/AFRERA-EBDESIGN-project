#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const cp = require('child_process');

const root = path.resolve(__dirname, '..');
const programDir = path.join(root, '.ai', 'autonomous-program');
const phaseFile = path.join(programDir, 'PHASES.tsv');
const stateFile = path.join(programDir, 'STATE.json');

function now() { return new Date().toISOString(); }
function loadPhases() {
  const text = fs.readFileSync(phaseFile, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.shift() !== 'id\ttitle\tobjective') throw new Error('Invalid PHASES.tsv header');
  const phases = lines.map(line => {
    const parts = line.split('\t');
    if (parts.length < 3) throw new Error('Invalid phase row: ' + line);
    return { id: parts[0], title: parts[1], objective: parts.slice(2).join('\t') };
  });
  if (phases.length !== 101) throw new Error('Expected 101 numbered phases (000-100); found ' + phases.length);
  phases.forEach((p, i) => {
    const expected = String(i).padStart(3, '0');
    if (p.id !== expected) throw new Error('Expected phase ' + expected + '; found ' + p.id);
  });
  return phases;
}function defaultState(phases) {
  const states = {};
  phases.forEach(p => {
    states[p.id] = { status: 'PENDING', attempts: 0, maxAttempts: 3, dependsOn: p.id === '000' ? [] : [String(Number(p.id) - 1).padStart(3, '0')], evidence: [], blockers: [], history: [] };
  });
  return {
    program: 'AFRERA_EBDESIGN_100_PHASE_AUTO',
    version: 1,
    createdAt: now(),
    updatedAt: now(),
    currentPhase: '000',
    mode: 'AUTO_BOUNDED',
    phases: states
  };
}
function loadState(phases) {
  if (!fs.existsSync(stateFile)) return defaultState(phases);
  const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  let changed = false;
  phases.forEach((p, i) => {
    const s = state.phases[p.id] || (state.phases[p.id] = { status: 'PENDING', attempts: 0, evidence: [], blockers: [], history: [] });
    if (s.maxAttempts == null) { s.maxAttempts = 3; changed = true; }
    if (!Array.isArray(s.dependsOn)) { s.dependsOn = i === 0 ? [] : [phases[i - 1].id]; changed = true; }
  });
  if (changed) saveState(state);
  return state;
}
function saveState(state) {
  state.updatedAt = now();
  const tmp = stateFile + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2) + '\n');
  fs.renameSync(tmp, stateFile);
}
function requirePhase(phases, id) {
  const p = phases.find(x => x.id === id);
  if (!p) throw new Error('Unknown phase: ' + id);
  return p;
}
function nextId(phases, id) {
  const i = phases.findIndex(x => x.id === id);
  return i >= 0 && i < phases.length - 1 ? phases[i + 1].id : null;
}function statusSummary(phases, state) {
  const counts = {};
  Object.values(state.phases).forEach(s => { counts[s.status] = (counts[s.status] || 0) + 1; });
  const p = requirePhase(phases, state.currentPhase);
  console.log(JSON.stringify({
    program: state.program,
    mode: state.mode,
    currentPhase: p,
    currentState: state.phases[p.id],
    counts
  }, null, 2));
}
function startPhase(phases, state, id) {
  const p = requirePhase(phases, id || state.currentPhase);
  if (p.id !== state.currentPhase) throw new Error('AUTO controller can start only current phase ' + state.currentPhase);
  const s = state.phases[p.id];
  if (s.status === 'PASSED') throw new Error('Phase already passed');
  const unmet = (s.dependsOn || []).filter(dep => !state.phases[dep] || state.phases[dep].status !== 'PASSED');
  if (unmet.length) throw new Error('Unmet phase dependencies: ' + unmet.join(','));
  if (s.attempts >= s.maxAttempts) throw new Error('Retry budget exhausted (' + s.maxAttempts + '); phase must remain BLOCKED pending explicit remediation');
  s.status = 'RUNNING';
  s.attempts += 1;
  s.startedAt = now();
  s.history.push({ at: now(), event: 'START', attempt: s.attempts });
  saveState(state);
  console.log('STARTED ' + p.id + ' ' + p.title + ' attempt=' + s.attempts + '/' + s.maxAttempts);
}
function passPhase(phases, state, id, evidencePath) {
  const p = requirePhase(phases, id || state.currentPhase);
  if (p.id !== state.currentPhase) throw new Error('Can pass only current phase ' + state.currentPhase);
  const s = state.phases[p.id];
  if (s.status !== 'RUNNING') throw new Error('Phase must be RUNNING before PASS');
  if (!evidencePath) throw new Error('PASS requires evidence path');
  const absolute = path.isAbsolute(evidencePath) ? evidencePath : path.join(root, evidencePath);
  if (!fs.existsSync(absolute)) throw new Error('Evidence does not exist: ' + absolute);
  const sizeGuard = path.join(root, 'tools', 'file-size-guard.js');
  if (fs.existsSync(sizeGuard)) {
    cp.execFileSync(process.execPath, [sizeGuard], { cwd: root, stdio: 'inherit' });
  }
  s.status = 'PASSED';
  s.completedAt = now();
  s.evidence.push(path.relative(root, absolute).replace(/\\/g, '/'));  s.history.push({ at: now(), event: 'PASS', evidence: s.evidence[s.evidence.length - 1] });
  const next = nextId(phases, p.id);
  if (next) state.currentPhase = next;
  else state.completedAt = now();
  saveState(state);
  console.log('PASSED ' + p.id + ' ' + p.title + (next ? ' -> NEXT ' + next : ' -> PROGRAM COMPLETE'));
}
function failPhase(phases, state, id, reason, blocked) {
  const p = requirePhase(phases, id || state.currentPhase);
  if (p.id !== state.currentPhase) throw new Error('Can fail/block only current phase ' + state.currentPhase);
  const s = state.phases[p.id];
  const msg = reason || 'Unspecified failure';
  const exhausted = s.attempts >= s.maxAttempts;
  s.status = blocked || exhausted ? 'BLOCKED' : 'FAILED';
  s.blockers.push({ at: now(), reason: msg, attempt: s.attempts });
  s.history.push({ at: now(), event: blocked ? 'BLOCK' : exhausted ? 'RETRY_BUDGET_EXHAUSTED' : 'FAIL', reason: msg, attempt: s.attempts });
  saveState(state);
  console.log(s.status + ' ' + p.id + ' ' + p.title + ': ' + msg + (exhausted ? ' [retry budget exhausted]' : ''));
}
const phases = loadPhases();
const state = loadState(phases);
const cmd = process.argv[2] || 'status';
const id = process.argv[3] && /^\d{3}$/.test(process.argv[3]) ? process.argv[3] : undefined;
const tailIndex = id ? 4 : 3;
const tail = process.argv.slice(tailIndex);
try {
  if (!fs.existsSync(stateFile)) saveState(state);
  if (cmd === 'verify') {
    console.log(JSON.stringify({ ok: true, phaseCount: phases.length, first: phases[0], last: phases[100] }, null, 2));
  } else if (cmd === 'status') statusSummary(phases, state);
  else if (cmd === 'start') startPhase(phases, state, id);
  else if (cmd === 'pass') passPhase(phases, state, id, tail[0]);  else if (cmd === 'fail') failPhase(phases, state, id, tail.join(' '), false);
  else if (cmd === 'block') failPhase(phases, state, id, tail.join(' '), true);
  else throw new Error('Usage: node tools/phase-controller.js [verify|status|start|pass|fail|block] [phase-id] [evidence/reason]');
} catch (err) {
  console.error('PHASE_CONTROLLER_ERROR: ' + err.message);
  process.exitCode = 1;
}

