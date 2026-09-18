#!/usr/bin/env node
/**
 * check-middleware-arity.js — catch middleware factories registered without
 * being called.
 *
 * Several modules here export a FACTORY: `function x() { return (req,res,next)
 * => {...} }`. Registering it as `app.use(x)` instead of `app.use(x())` is
 * silently fatal: Express sees arity 0, treats it as ordinary middleware,
 * invokes it, receives the inner function as a return value and never gets a
 * next() call — so every request through that layer hangs forever with no
 * error logged.
 *
 * This inspects each middleware named in an app.use() and reports the mismatch.
 *
 * Usage: node tools/check-middleware-arity.js
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '..', 'backend', 'src');
const src = fs.readFileSync(path.join(SRC, 'index.js'), 'utf8');

// Map identifiers to their module, both plain and destructured requires.
const origin = new Map();
let m;
const plain = /const\s+(\w+)\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
while ((m = plain.exec(src)) !== null) origin.set(m[1], { spec: m[2], key: null });
const destr = /const\s*\{([^}]+)\}\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\)/g;
while ((m = destr.exec(src)) !== null) {
  for (const part of m[1].split(',')) {
    const [o, a] = part.split(':').map((s) => s.trim());
    if (o) origin.set(a || o, { spec: m[2], key: o });
  }
}

// app.use(identifier)  — no call parens, no path argument
const bare = /app\.use\(\s*([A-Za-z_$][\w$]*)\s*\)/g;
// app.use(identifier())
const called = /app\.use\(\s*([A-Za-z_$][\w$]*)\s*\(\s*\)\s*\)/g;

const bareUses = [];
while ((m = bare.exec(src)) !== null) {
  bareUses.push({ name: m[1], line: src.slice(0, m.index).split('\n').length });
}
const calledNames = new Set();
while ((m = called.exec(src)) !== null) calledNames.add(m[1]);

/** Does this source define `name` as a factory returning a function? */
function classify(spec, key, name) {
  let file = path.resolve(SRC, spec);
  for (const ext of ['', '.js', '/index.js']) {
    try { if (fs.statSync(file + ext).isFile()) { file += ext; break; } } catch { /* next */ }
  }
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return { verdict: 'unreadable' }; }

  const target = key || name;
  // function target(...) { ... return (a, b, c) => / return function(
  const fnRe = new RegExp(`function\\s+${target}\\s*\\(([^)]*)\\)\\s*\\{`);
  const arrowRe = new RegExp(`const\\s+${target}\\s*=\\s*\\(([^)]*)\\)\\s*=>`);
  const fm = text.match(fnRe);
  const am = text.match(arrowRe);
  const decl = fm || am;
  if (!decl) return { verdict: 'not-found', file };

  const params = decl[1].split(',').map((s) => s.trim()).filter(Boolean);
  const bodyStart = text.indexOf(decl[0]) + decl[0].length;
  const body = text.slice(bodyStart, bodyStart + 900);
  const returnsFn = /return\s*(\(|function\s*\(|async\s*\()/.test(body);

  if (params.length === 0 && returnsFn) return { verdict: 'FACTORY', file, params };
  if (params.length >= 3) return { verdict: 'middleware', file, params };
  if (params.length === 0 && !returnsFn) return { verdict: 'zero-arg-nonfactory', file, params };
  return { verdict: `arity-${params.length}`, file, params };
}

const problems = [];
const fine = [];

for (const u of bareUses) {
  const o = origin.get(u.name);
  if (!o) continue;
  const c = classify(o.spec, o.key, u.name);
  if (c.verdict === 'FACTORY') problems.push({ ...u, ...c, spec: o.spec });
  else fine.push({ ...u, ...c });
}

console.log('\n══════════ MIDDLEWARE ARITY CHECK ══════════\n');
console.log(`  bare app.use(x) registrations : ${bareUses.length}`);
console.log(`  traced to a module            : ${bareUses.length - bareUses.filter((u) => !origin.get(u.name)).length}`);
console.log(`  FACTORIES REGISTERED UNCALLED : ${problems.length}\n`);

if (problems.length) {
  console.log('  Each of these hangs every request that reaches it:\n');
  for (const p of problems) {
    console.log(`    index.js:${p.line}   app.use(${p.name})   ->  should be app.use(${p.name}())`);
    console.log(`       ${p.spec}`);
  }
  console.log('');
}

const byVerdict = new Map();
for (const f of fine) byVerdict.set(f.verdict, (byVerdict.get(f.verdict) || 0) + 1);
console.log('  Other bare registrations by shape:');
for (const [v, n] of [...byVerdict].sort((a, b) => b[1] - a[1])) {
  console.log(`    ${String(n).padStart(3)}  ${v}`);
}
console.log('');
