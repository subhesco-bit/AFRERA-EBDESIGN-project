#!/usr/bin/env node
/**
 * Module-graph audit — static integrity checks that would have caught every
 * boot failure found on 21 Sep 2026.
 *
 * Two checks:
 *   1. Unresolvable relative require() paths.
 *   2. Destructured named imports that the target module does not export.
 *
 * Both skip requires that appear inside comments, so documentation examples
 * (e.g. "this used to require('../old/path')") are not reported as defects.
 *
 * Usage:  node tools/audit-module-graph.js [rootDir]
 * Exits non-zero when defects are found, so it can be used as a CI gate.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(process.argv[2] || path.join(__dirname, '..', 'backend', 'src'));

function collect(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!/^(node_modules|coverage|\.git)$/.test(entry.name)) collect(p, out);
    } else if (entry.name.endsWith('.js')) {
      out.push(p);
    }
  }
  return out;
}

const isFile = (p) => {
  try { return fs.statSync(p).isFile(); } catch { return false; }
};

/**
 * Blank out comments AND string/template bodies so that requires appearing
 * inside them are ignored. Both matter here: some files document old paths in
 * comments, and code generators embed `require(...)` inside template literals
 * that describe code they emit rather than code they run.
 */
function maskComments(src) {
  const out = src.split('');
  let i = 0;
  const n = src.length;
  while (i < n) {
    // Mask TEMPLATE LITERALS ONLY (backticks). Code generators embed
    // `require(...)` inside template literals describing code they emit, which
    // must not be audited as this file's own dependency.
    //
    // Quoted strings are deliberately NOT masked: a require's own path is a
    // quoted string, so masking those blinds this audit entirely (it then
    // finds zero requires and reports a meaningless PASS).
    if (src[i] === '`') {
      let j = i + 1;
      while (j < n && src[j] !== '`') {
        if (src[j] === '\\') j++;
        j++;
      }
      for (let k = i; k <= j && k < n; k++) if (out[k] !== '\n') out[k] = ' ';
      i = j + 1;
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '*') {
      let j = src.indexOf('*/', i + 2);
      j = j < 0 ? n : j + 2;
      for (let k = i; k < j; k++) if (out[k] !== '\n') out[k] = ' ';
      i = j;
      continue;
    }
    if (src[i] === '/' && src[i + 1] === '/') {
      let j = src.indexOf('\n', i);
      j = j < 0 ? n : j;
      for (let k = i; k < j; k++) out[k] = ' ';
      i = j;
      continue;
    }
    i++;
  }
  return out.join('');
}

function resolveSpec(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const candidate of [base, `${base}.js`, `${base}.json`, path.join(base, 'index.js')]) {
    if (isFile(candidate)) return candidate;
  }
  return null;
}

/**
 * Split an object-literal body into its top-level entry names.
 * Brace/bracket depth is tracked so nested object values do not leak their
 * own keys into the result, and delimiters are not consumed as separators
 * (a comma-separated line like `a, b, c` must yield all three names).
 */
function topLevelKeys(body) {
  const keys = [];
  let depth = 0;
  let token = '';
  let expectingKey = true;

  const flush = () => {
    const name = token.trim();
    if (expectingKey && /^[A-Za-z_$][\w$]*$/.test(name)) keys.push(name);
    token = '';
    expectingKey = true;
  };

  for (const ch of body) {
    if (ch === '{' || ch === '[' || ch === '(') { depth++; token += ch; continue; }
    if (ch === '}' || ch === ']' || ch === ')') { depth--; token += ch; continue; }
    if (depth > 0) { token += ch; continue; }
    if (ch === ',' || ch === '\n') { flush(); continue; }
    if (ch === ':') { flush(); expectingKey = false; continue; }
    token += ch;
  }
  flush();
  return keys;
}

/** Statically read a module's named exports; null when the pattern is not analysable. */
function namedExports(file) {
  const src = maskComments(fs.readFileSync(file, 'utf8'));
  const names = new Set();
  let analysable = false;

  const literal = src.match(/module\.exports\s*=\s*\{([\s\S]*)\n\};?\s*$/);
  if (literal) {
    analysable = true;
    for (const name of topLevelKeys(literal[1])) names.add(name);
    if (/(^|[^.])\.\.\./.test(literal[1])) analysable = false; // spread hides members
  }

  const assigned = src.match(/module\.exports\s*=\s*Object\.assign\([^,]+,\s*\{([\s\S]*?)\}\s*\)/);
  if (assigned) {
    analysable = true;
    for (const name of topLevelKeys(assigned[1])) names.add(name);
  }

  for (const m of src.matchAll(/(?:module\.)?exports\.([A-Za-z_$][\w$]*)\s*=/g)) {
    names.add(m[1]);
    analysable = true;
  }

  // A bare identifier, class or factory export tells us nothing about members.
  if (/module\.exports\s*=\s*([A-Za-z_$][\w$]*\s*;|class|function|new )/.test(src)) analysable = false;

  return analysable ? names : null;
}

const files = collect(ROOT);
const unresolved = [];
const missingNamed = [];
const exportCache = new Map();

for (const file of files) {
  const masked = maskComments(fs.readFileSync(file, 'utf8'));

  for (const m of masked.matchAll(/require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
    if (!resolveSpec(file, m[1])) {
      unresolved.push({ from: path.relative(ROOT, file), spec: m[1] });
    }
  }

  for (const m of masked.matchAll(/const\s*\{([^}]+)\}\s*=\s*require\(\s*['"](\.[^'"]+)['"]\s*\)/g)) {
    const target = resolveSpec(file, m[2]);
    if (!target) continue;
    if (!exportCache.has(target)) exportCache.set(target, namedExports(target));
    const exported = exportCache.get(target);
    if (!exported) continue; // not analysable -> do not guess

    const wanted = m[1]
      .split(',')
      .map((s) => s.split(':')[0].trim().replace(/^\.\.\./, ''))
      .filter((s) => /^[A-Za-z_$][\w$]*$/.test(s));

    for (const name of wanted) {
      if (!exported.has(name)) {
        missingNamed.push({
          from: path.relative(ROOT, file),
          spec: m[2],
          missing: name,
          available: [...exported].slice(0, 10),
        });
      }
    }
  }
}

console.log(`Module-graph audit of ${path.relative(process.cwd(), ROOT) || ROOT}`);
console.log(`  files scanned              : ${files.length}`);
console.log(`  unresolvable requires      : ${unresolved.length}`);
console.log(`  missing named imports      : ${missingNamed.length}`);

if (unresolved.length) {
  console.log('\nUnresolvable requires:');
  for (const u of unresolved) console.log(`  ${u.from} -> ${u.spec}`);
}
if (missingNamed.length) {
  console.log('\nMissing named imports:');
  for (const p of missingNamed) {
    console.log(`  ${p.from} -> ${p.spec} does not export '${p.missing}'`);
    console.log(`      available: ${p.available.join(', ')}`);
  }
}

const defects = unresolved.length + missingNamed.length;
console.log(defects === 0 ? '\nPASS: module graph is intact.' : `\nFAIL: ${defects} defect(s).`);
process.exit(defects === 0 ? 0 : 1);
