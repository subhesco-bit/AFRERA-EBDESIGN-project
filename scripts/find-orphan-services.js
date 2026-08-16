#!/usr/bin/env node
/**
 * Orphan-service scanner — finds backend/src/services/*.js files with no
 * require() anywhere else in backend/src (routes, controllers, other
 * services, core, index.js).
 *
 * WHY THIS EXISTS
 * This session repeatedly rediscovered the same class of bug by hand: a
 * fully real, working service file sitting with zero route/controller,
 * unreachable from any HTTP request (productMediaAIService.js was the
 * clearest case — real DB-backed AI image/video logic, honest
 * not_configured provider states, just never wired to a route). Run this
 * instead of grepping for suspected orphans one at a time.
 *
 * LIMITATIONS (read before trusting a "0 orphans" result blindly)
 * - This proves REFERENCE, not REACHABILITY: a file required by another
 *   service that is itself never reached from index.js would still show as
 *   "referenced" here. It catches the common case (nobody requires this
 *   file at all) but not a fully disconnected sub-graph of 2+ files that
 *   only require each other.
 * - Dev-time code-generator/template files (e.g. advancedServiceGenerator.js,
 *   which returns route/service code as template strings for scaffolding —
 *   it is a tool, not a request-time capability) will correctly show as
 *   orphaned. That is not a bug; use judgement before "fixing" a hit here.
 *
 * Usage: node scripts/find-orphan-services.js
 */

const fs = require('fs');
const path = require('path');

const backendRoot = path.join(__dirname, '..', 'backend');
const srcDir = path.join(backendRoot, 'src');
const servicesDir = path.join(srcDir, 'services');

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.js')) files.push(full);
  }
  return files;
}

function haystackExcluding(allFiles, excludePath) {
  let text = '';
  for (const f of allFiles) {
    if (f === excludePath) continue;
    text += fs.readFileSync(f, 'utf8') + '\n';
  }
  return text;
}

function findOrphanServices() {
  const allFiles = walk(srcDir);
  const serviceFiles = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.js'));

  const orphans = [];
  for (const f of serviceFiles) {
    const full = path.join(servicesDir, f);
    const base = f.replace(/\.js$/, '');
    const hay = haystackExcluding(allFiles, full);
    const pattern = new RegExp(`require\\(['"\`][^'"\`]*${base}(\\.js)?['"\`]\\)`);
    if (!pattern.test(hay)) orphans.push(f);
  }
  return { scanned: serviceFiles.length, totalFiles: allFiles.length, orphans };
}

if (require.main === module) {
  const { scanned, totalFiles, orphans } = findOrphanServices();
  console.log(`Scanned ${scanned} service files against the full src tree (${totalFiles} files).`);
  if (orphans.length === 0) {
    console.log('No orphaned services found.');
  } else {
    console.log(`${orphans.length} file(s) have zero require() anywhere else in src/:\n`);
    orphans.forEach((o) => console.log(' -', o));
  }
}

module.exports = { findOrphanServices };
