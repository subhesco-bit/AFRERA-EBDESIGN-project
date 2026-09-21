#!/usr/bin/env node
/*
 * Scans for the passwordUtils.js-class bug found repeatedly this session:
 * a frontend page calls someAPI.methodName(...) but the exported someAPI
 * object in frontend/src/services/api.js doesn't have that method - would
 * throw "someAPI.methodName is not a function" at runtime.
 *
 * 1. Parse api.js for every `export const xxxAPI = { ... }` block and the
 *    method names defined inside it.
 * 2. Scan every page/component file for `xxxAPI.methodName(` calls.
 * 3. Report every (client, method) a page calls that isn't in that client's
 *    export.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const apiJsPath = path.join(root, 'frontend', 'src', 'services', 'api.js');
const scanDirs = ['frontend/src/pages', 'frontend/src/components'];

function parseApiExports(text) {
  const exports = new Map(); // clientName -> Set(methodNames)
  const exportRe = /export const (\w+API\w*)\s*=\s*\{/g;
  let m;
  while ((m = exportRe.exec(text)) !== null) {
    const name = m[1];
    const start = m.index + m[0].length;
    // find matching closing brace (simple depth counter, good enough for object literals)
    let depth = 1;
    let i = start;
    while (i < text.length && depth > 0) {
      if (text[i] === '{') depth += 1;
      else if (text[i] === '}') depth -= 1;
      i += 1;
    }
    const body = text.slice(start, i - 1);
    const methodRe = /(\w+)\s*:/g;
    const methods = new Set();
    let mm;
    while ((mm = methodRe.exec(body)) !== null) methods.add(mm[1]);
    exports.set(name, methods);
  }
  return exports;
}

function walk(dir, out) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { walk(full, out); continue; }
    if (!/\.(jsx?|tsx?)$/.test(e.name)) continue;
    out.push(full);
  }
}

function findUsages(text) {
  const usages = [];
  const callRe = /(\w+API\w*)\.(\w+)\s*\(/g;
  let m;
  while ((m = callRe.exec(text)) !== null) {
    usages.push({ client: m[1], method: m[2] });
  }
  return usages;
}

function main() {
  const apiJsText = fs.readFileSync(apiJsPath, 'utf8');
  const exportsMap = parseApiExports(apiJsText);

  const files = [];
  for (const d of scanDirs) walk(path.join(root, d), files);

  const mismatches = [];
  const seen = new Set();
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const usages = findUsages(text);
    for (const { client, method } of usages) {
      if (!exportsMap.has(client)) continue; // client not defined in api.js at all - separate issue
      const methods = exportsMap.get(client);
      if (!methods.has(method)) {
        const key = `${client}.${method}`;
        if (seen.has(key)) continue;
        seen.add(key);
        mismatches.push({ client, method, file: path.relative(root, file) });
      }
    }
  }

  const outPath = path.join(root, '_MERGE_LAB', 'reports', 'api-client-mismatches.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(mismatches, null, 2));

  console.log(JSON.stringify({
    filesScanned: files.length,
    apiClientsParsed: exportsMap.size,
    mismatchesFound: mismatches.length,
    outPath: path.relative(root, outPath)
  }, null, 2));
}

main();
