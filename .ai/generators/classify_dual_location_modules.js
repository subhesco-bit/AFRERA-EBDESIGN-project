// For every module id present in BOTH modules/ and backend/src/modules/,
// compare the two copies and classify: which is more substantial (keep-signal),
// and whether either is referenced anywhere in the live route/service tree.
'use strict';
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');
const all = JSON.parse(fs.readFileSync(path.join(__dirname, 'all_modules_data.json'), 'utf8'));
const dualIds = all.dualLocationIds;

function findDirsForId(id) {
  return all.entries.filter((e) => e.id === id);
}

function isReferenced(dirName) {
  try {
    const out = execSync(
      `grep -rl "${dirName}" --include="*.js" "${path.join(ROOT, 'backend', 'src', 'routes')}" "${path.join(ROOT, 'backend', 'src', 'services')}" "${path.join(ROOT, 'backend', 'src', 'index.js')}" 2>/dev/null`,
      { encoding: 'utf8', shell: 'C:\\Program Files\\Git\\bin\\bash.exe' },
    ).trim();
    return out.length > 0 ? out.split('\n') : [];
  } catch {
    return [];
  }
}

const results = [];
for (const id of dualIds) {
  const copies = findDirsForId(id);
  const withRefs = copies.map((c) => ({ ...c, referencedBy: isReferenced(c.dirName) }));
  results.push({ id, copies: withRefs });
}

const summary = {
  total: results.length,
  neitherReferenced: results.filter((r) => r.copies.every((c) => c.referencedBy.length === 0)).length,
  oneReferenced: results.filter((r) => r.copies.filter((c) => c.referencedBy.length > 0).length === 1).length,
  bothReferenced: results.filter((r) => r.copies.filter((c) => c.referencedBy.length > 0).length > 1).length,
};

console.error('SUMMARY:', JSON.stringify(summary));
console.log(JSON.stringify(results, null, 2));
