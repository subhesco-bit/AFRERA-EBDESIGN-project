#!/usr/bin/env node
/**
 * signal-graph-audit.js — does the nervous system actually carry anything?
 *
 * The platform has a signal bus, a reflex engine, a decision engine and agents.
 * Modules emit signals like `commerce.order.placed`. That is only integration
 * if something listens: an emitted signal with no handler is a decision the
 * platform reached and then discarded.
 *
 * Signals are referenced two ways — as string literals, and through the frozen
 * SIGNAL constant table in core/signalBus.js (`SIGNAL.ORDER_PLACED`). The bus
 * also fans each emit out to three channels: the exact type, `<domain>.*`, and
 * `*`. All of that is resolved here; a first version of this tool matched only
 * string literals and wrongly reported zero subscribers.
 *
 * Usage: node tools/signal-graph-audit.js [--json <out>]
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BE = path.join(ROOT, 'backend', 'src');
const JSON_OUT = process.argv.includes('--json') ? process.argv[process.argv.indexOf('--json') + 1] : null;

// ---------------------------------------------------------------- SIGNAL map

const busSrc = fs.readFileSync(path.join(BE, 'core', 'signalBus.js'), 'utf8');
const SIGNAL = new Map(); // KEY -> 'dotted.name'
for (const m of busSrc.matchAll(/^\s*([A-Z][A-Z0-9_]*)\s*:\s*['"`]([a-z][a-z0-9_.]*)['"`]/gm)) {
  SIGNAL.set(m[1], m[2]);
}

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const abs = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (!['node_modules', '.git', '__tests__'].includes(e.name)) walk(abs, out);
    } else if (e.isFile() && e.name.endsWith('.js')) out.push(abs);
  }
  return out;
}

/** Resolve one argument expression to a signal name, or null. */
function resolveArg(arg) {
  const a = arg.trim();
  const lit = a.match(/^['"`]([a-zA-Z][a-zA-Z0-9_.*]*)['"`]$/);
  if (lit) return lit[1];
  const konst = a.match(/^SIGNAL\.([A-Z][A-Z0-9_]*)$/);
  if (konst) return SIGNAL.get(konst[1]) || null;
  return null;
}

const publishers = new Map();
const subscribers = new Map();
const add = (map, sig, file) => {
  if (!sig) return;
  if (!map.has(sig)) map.set(sig, new Set());
  map.get(sig).add(file);
};

// emitSignal(X, ...) / publishSignal(X, ...) / bus.emit(X, ...)
const EMIT_RE = /(?:emitSignal|publishSignal)\s*\(\s*([^,)]+)/g;
// onSignal(X, handler) / subscribe(X, handler)
const ON_RE = /(?:onSignal|\.subscribe)\s*\(\s*([^,)]+)/g;
// subscribedSignals: [ ... ] declarations
const LIST_RE = /subscribedSignals\s*[:=]\s*\[([^\]]*)\]/g;

for (const f of walk(BE)) {
  let src;
  try { src = fs.readFileSync(f, 'utf8'); } catch { continue; }
  if (!/emitSignal|publishSignal|onSignal|subscribe/.test(src)) continue;
  const rel = path.relative(ROOT, f).replace(/\\/g, '/');
  // The bus itself defines the mechanism; it is not a participant.
  if (rel.endsWith('core/signalBus.js')) continue;

  for (const m of src.matchAll(EMIT_RE)) add(publishers, resolveArg(m[1]), rel);
  for (const m of src.matchAll(ON_RE)) add(subscribers, resolveArg(m[1]), rel);
  for (const m of src.matchAll(LIST_RE)) {
    for (const raw of m[1].split(',')) add(subscribers, resolveArg(raw), rel);
  }
}

/**
 * emitSignal fans out to the exact type, `<domain>.*` and `*`, so a handler on
 * any of those three channels hears the signal.
 */
const subKeys = [...subscribers.keys()];
const hasWildcardAll = subKeys.includes('*');
function handlersFor(sig) {
  const out = new Set();
  for (const k of subKeys) {
    if (k === sig || k === '*' || k === `${sig.split('.')[0]}.*`) {
      for (const f of subscribers.get(k)) out.add(f);
    }
  }
  return out;
}

const connected = [];
const orphanPubs = [];
for (const sig of publishers.keys()) {
  (handlersFor(sig).size ? connected : orphanPubs).push(sig);
}
connected.sort();
orphanPubs.sort();

const orphanSubs = subKeys
  .filter((s) => !s.includes('*') && !publishers.has(s))
  .sort();

const pct = (a, b) => (b ? Math.round((a / b) * 100) : 0);
const domainOf = (s) => s.split('.')[0];

const byDomain = new Map();
for (const s of publishers.keys()) {
  const d = domainOf(s);
  const e = byDomain.get(d) || { pub: 0, wired: 0 };
  e.pub += 1;
  if (handlersFor(s).size) e.wired += 1;
  byDomain.set(d, e);
}

console.log('\n══════════ SIGNAL GRAPH — INTER-MODULE COMMUNICATION ══════════\n');
console.log(`  SIGNAL constants defined   : ${SIGNAL.size}`);
console.log(`  distinct signals emitted   : ${publishers.size}`);
console.log(`  distinct channels listened : ${subscribers.size}${hasWildcardAll ? "  (includes a '*' catch-all)" : ''}`);
console.log(`  emitter files              : ${new Set([...publishers.values()].flatMap((s) => [...s])).size}`);
console.log(`  handler files              : ${new Set([...subscribers.values()].flatMap((s) => [...s])).size}`);
console.log('');
console.log(`  CONNECTED  (emitted and heard) : ${connected.length}  (${pct(connected.length, publishers.size)}%)`);
console.log(`  ORPHAN EMIT (heard by nobody)  : ${orphanPubs.length}  (${pct(orphanPubs.length, publishers.size)}%)`);
console.log(`  ORPHAN HANDLER (never fired)   : ${orphanSubs.length}`);

console.log('\n\n  BY DOMAIN — how much of what is decided gets acted on\n');
console.log(`    ${'domain'.padEnd(16)}${'emitted'.padStart(9)}${'heard'.padStart(7)}${'coverage'.padStart(10)}`);
console.log('    ' + '─'.repeat(44));
for (const [d, v] of [...byDomain].sort((a, b) => b[1].pub - a[1].pub)) {
  const p = pct(v.wired, v.pub);
  console.log(`    ${d.padEnd(16)}${String(v.pub).padStart(9)}${String(v.wired).padStart(7)}${(p + '%').padStart(9)} ${p ? '█'.repeat(Math.max(1, Math.round(p / 10))) : ''}`);
}

console.log('\n\n  CHANNELS WITH HANDLERS\n');
for (const k of subKeys.sort()) {
  const files = [...subscribers.get(k)].map((f) => f.split('/').slice(-1)[0]);
  console.log(`    ${k.padEnd(40)} ${files.slice(0, 3).join(', ')}${files.length > 3 ? ` +${files.length - 3}` : ''}`);
}

if (orphanSubs.length) {
  console.log('\n\n  HANDLERS FOR A SIGNAL NOTHING EMITS\n');
  for (const s of orphanSubs.slice(0, 15)) console.log(`    ${s.padEnd(40)} ${[...subscribers.get(s)][0]}`);
}

if (orphanPubs.length) {
  console.log('\n\n  DECISIONS DISCARDED — emitted, no handler\n');
  const grouped = new Map();
  for (const s of orphanPubs) {
    const d = domainOf(s);
    if (!grouped.has(d)) grouped.set(d, []);
    grouped.get(d).push(s);
  }
  for (const [d, list] of [...grouped].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`    ${d}  (${list.length})`);
    for (const s of list.slice(0, 5)) console.log(`      ${s}`);
    if (list.length > 5) console.log(`      … ${list.length - 5} more`);
  }
}
console.log('');

if (JSON_OUT) {
  fs.mkdirSync(path.dirname(JSON_OUT), { recursive: true });
  fs.writeFileSync(JSON_OUT, JSON.stringify({
    signalConstants: Object.fromEntries(SIGNAL),
    publishers: Object.fromEntries([...publishers].map(([k, v]) => [k, [...v]])),
    subscribers: Object.fromEntries([...subscribers].map(([k, v]) => [k, [...v]])),
    connected, orphanPubs, orphanSubs,
  }, null, 2));
  console.log(`  json -> ${path.relative(ROOT, JSON_OUT)}\n`);
}
