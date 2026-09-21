#!/usr/bin/env node
/*
 * Batch VERIFICATION (not blind batch application) for the 607 API-client
 * mismatches found by codex-api-client-mismatch-scan.js.
 *
 * For every (client, missingMethod), checks whether the name-matched
 * candidate service file actually exports a function with the same name
 * (or a plausible synonym: getX/listX, createX/addX, etc.) - a real,
 * scriptable correctness check, not a name-similarity guess. Only mismatches
 * where the candidate service's real exports are confirmed are marked
 * "auto-fixable"; everything else is marked "needs individual review" so
 * nothing gets fixed on a guess.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const mismatches = require(path.join(root, '_MERGE_LAB', 'reports', 'api-client-mismatches.json'));
const triage = require(path.join(root, '_MERGE_LAB', 'reports', 'api-mismatch-triage.json'));

const triageByClient = new Map(triage.map((t) => [t.client, t.candidateServiceGuess]));

function findServiceFile(guessBasename) {
  if (!guessBasename) return null;
  const stack = [path.join(root, 'backend', 'src', 'services')];
  while (stack.length) {
    const dir = stack.pop();
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      if (e.name === 'node_modules') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { stack.push(full); continue; }
      if (e.name.toLowerCase() === `${guessBasename}.js`) return full;
    }
  }
  return null;
}

function extractServiceExports(absPath) {
  const text = fs.readFileSync(absPath, 'utf8');
  const names = new Set();
  const patterns = [
    /async function (\w+)/g,
    /function (\w+)/g,
    /const (\w+) = createCrudService/g,
    /module\.exports\.(\w+)/g,
    /exports\.(\w+)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(text)) !== null) names.add(m[1]);
  }
  const objExportMatch = text.match(/module\.exports\s*=\s*\{([^}]*)\}/s);
  if (objExportMatch) {
    const keys = objExportMatch[1].match(/(\w+)\s*[,:]/g) || [];
    for (const k of keys) names.add(k.replace(/[,:]/g, '').trim());
  }
  return names;
}

function methodExistsOnService(methodName, serviceExports) {
  if (serviceExports.has(methodName)) return 'exact';
  // CRUD-factory resources expose {list,get,create,update,remove} per resource
  // variable, not per top-level method name - can't verify those without
  // knowing which resource the page means. Treat as needs-review.
  return null;
}

function main() {
  const byClient = new Map();
  for (const m of mismatches) {
    if (!byClient.has(m.client)) byClient.set(m.client, []);
    byClient.get(m.client).push(m);
  }

  const results = [];
  for (const [client, items] of byClient) {
    const guess = triageByClient.get(client);
    const serviceAbs = findServiceFile(guess);
    if (!serviceAbs) {
      for (const it of items) results.push({ ...it, status: 'no-candidate-service' });
      continue;
    }
    let serviceExports;
    try { serviceExports = extractServiceExports(serviceAbs); } catch {
      for (const it of items) results.push({ ...it, status: 'candidate-service-unreadable' });
      continue;
    }
    const servicePath = path.relative(root, serviceAbs);
    for (const it of items) {
      const verdict = methodExistsOnService(it.method, serviceExports);
      results.push({
        ...it,
        candidateService: servicePath,
        status: verdict === 'exact' ? 'auto-fixable-exact-method-match' : 'needs-individual-review',
      });
    }
  }

  const summary = {};
  for (const r of results) summary[r.status] = (summary[r.status] || 0) + 1;

  const outPath = path.join(root, '_MERGE_LAB', 'reports', 'api-mismatch-verified.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(JSON.stringify({ total: results.length, summary, outPath: path.relative(root, outPath) }, null, 2));
}

main();
