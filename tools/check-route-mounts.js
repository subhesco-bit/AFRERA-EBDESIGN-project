#!/usr/bin/env node
/**
 * check-route-mounts.js — find every app.use() in index.js that would mount
 * something Express cannot use.
 *
 * Express fails one mount at a time, so a broken router costs a whole boot
 * cycle to discover. This resolves every mounted identifier back to its
 * require() and loads it, reporting the entire class in one pass.
 *
 * Usage: node tools/check-route-mounts.js
 */

const fs = require('fs');
const path = require('path');

// Load the same env the server loads, or modules that validate their config at
// import time throw here and report as broken mounts when they are actually fine.
const BACKEND = path.join(__dirname, '..', 'backend');
try {
  require(path.join(BACKEND, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND, '.env.local') });
  require(path.join(BACKEND, 'node_modules', 'dotenv')).config({ path: path.join(BACKEND, '.env') });
} catch {
  console.warn('  (dotenv unavailable — config-validating modules may report false failures)');
}

const SRC = path.join(__dirname, '..', 'backend', 'src');
const INDEX = path.join(SRC, 'index.js');
const src = fs.readFileSync(INDEX, 'utf8');

// identifier -> require specifier, from `const X = require('...')`
const requires = new Map();
const reqRe = /const\s+(\w+)\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
let m;
while ((m = reqRe.exec(src)) !== null) requires.set(m[1], m[2]);

// destructured: const { a, b: c } = require('...')
const destructRe = /const\s*\{([^}]+)\}\s*=\s*require\(\s*['"]([^'"]+)['"]\s*\)/g;
const destructured = new Map();
while ((m = destructRe.exec(src)) !== null) {
  for (const part of m[1].split(',')) {
    const [orig, alias] = part.split(':').map((s) => s.trim());
    if (orig) destructured.set(alias || orig, { spec: m[2], key: orig });
  }
}

// app.use('<path>', <expr>)
const useRe = /app\.use\(\s*['"]([^'"]+)['"]\s*,\s*([\w.]+)\s*\)/g;
const mounts = [];
while ((m = useRe.exec(src)) !== null) {
  const line = src.slice(0, m.index).split('\n').length;
  mounts.push({ route: m[1], expr: m[2], line });
}

const isMountable = (v) => typeof v === 'function' || (v && typeof v === 'object' && typeof v.handle === 'function');

const broken = [];
const unknown = [];
let ok = 0;

for (const mount of mounts) {
  const [base, prop] = mount.expr.split('.');
  let spec = requires.get(base);
  let key = null;
  if (!spec && destructured.has(base)) {
    spec = destructured.get(base).spec;
    key = destructured.get(base).key;
  }
  if (!spec) { unknown.push({ ...mount, why: 'identifier not from a require()' }); continue; }
  if (!spec.startsWith('.')) { ok++; continue; } // package middleware

  let mod;
  try {
    mod = require(path.resolve(SRC, spec));
  } catch (e) {
    broken.push({ ...mod, ...mount, spec, why: `require threw: ${e.message.split('\n')[0]}` });
    continue;
  }

  let value = mod;
  if (key) value = mod?.[key];
  if (prop) value = value?.[prop];

  if (isMountable(value)) { ok++; continue; }

  const shape = value === undefined ? 'undefined'
    : value === null ? 'null'
      : Array.isArray(value) ? 'array'
        : typeof value;
  const exported = mod && typeof mod === 'object' ? Object.keys(mod).slice(0, 8) : [];
  // Suggest a sibling export that IS mountable.
  let suggestion = null;
  if (mod && typeof mod === 'object') {
    for (const k of Object.keys(mod)) {
      if (isMountable(mod[k])) { suggestion = k; break; }
    }
  }
  if (!prop && isMountable(mod)) suggestion = '(module itself)';
  broken.push({ ...mount, spec, why: `resolves to ${shape}`, exported, suggestion });
}

console.log(`\n══════════ ROUTE MOUNT CHECK ══════════\n`);
console.log(`  app.use() mounts found : ${mounts.length}`);
console.log(`  mountable              : ${ok}`);
console.log(`  BROKEN                 : ${broken.length}`);
console.log(`  unresolved identifiers : ${unknown.length}\n`);

if (broken.length) {
  console.log('  BROKEN MOUNTS (Express will throw on each):\n');
  for (const b of broken) {
    console.log(`    index.js:${b.line}  app.use('${b.route}', ${b.expr})`);
    console.log(`      module    ${b.spec}`);
    console.log(`      problem   ${b.why}`);
    if (b.exported && b.exported.length) console.log(`      exports   ${b.exported.join(', ')}`);
    if (b.suggestion) console.log(`      try       ${b.suggestion}`);
    console.log('');
  }
}

if (unknown.length) {
  console.log('  UNRESOLVED (could not trace to a require):');
  for (const u of unknown.slice(0, 20)) console.log(`    index.js:${u.line}  ${u.expr}`);
}
