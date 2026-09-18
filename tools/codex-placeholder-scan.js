#!/usr/bin/env node
/*
 * Per-module (not per-bare-filename) comparison: for each numbered module
 * (M0xx) in the canonical tree, checks whether it looks like a placeholder
 * skeleton and whether any historical source has a substantially larger/more
 * complete version of the SAME module number's SAME file role.
 *
 * This replaces bare-filename grouping (which wrongly treated every
 * module's service.js as a "version" of every other module's service.js)
 * with module-number-aware grouping, as it should be.
 */
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const CANONICAL_MODULES_DIR = path.join(root, 'backend', 'src', 'modules');
const FILE_MAP_CSV = path.join(root, 'docs', 'codex-file-map.csv');

const PLACEHOLDER_MARKERS = [
  /TODO/i,
  /PLACEHOLDER/i,
  /not[\s_-]?implemented/i,
  /coming soon/i,
  /stub/i,
  /skeleton/i
];
const ROLE_FILES = ['controller.js', 'service.js', 'routes.js', 'index.js', 'model.sql'];
const PLACEHOLDER_BYTES_THRESHOLD = 400; // a real controller/service/routes file is rarely this small

function isPlaceholderContent(text) {
  if (text.trim().length < PLACEHOLDER_BYTES_THRESHOLD) return true;
  return PLACEHOLDER_MARKERS.some((re) => re.test(text));
}

function scanCanonicalModules() {
  const modules = fs.readdirSync(CANONICAL_MODULES_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && /^M\d{3,4}/.test(d.name))
    .map((d) => d.name);

  const results = [];
  for (const modDir of modules) {
    const modNumMatch = modDir.match(/^M(\d{3,4})/);
    if (!modNumMatch) continue;
    const modNum = modNumMatch[1];
    const modPath = path.join(CANONICAL_MODULES_DIR, modDir);

    const roleStatus = {};
    for (const role of ROLE_FILES) {
      const filePath = path.join(modPath, role);
      if (!fs.existsSync(filePath)) { roleStatus[role] = 'missing'; continue; }
      const text = fs.readFileSync(filePath, 'utf8');
      roleStatus[role] = isPlaceholderContent(text) ? 'placeholder' : 'real';
    }
    const placeholderRoles = Object.entries(roleStatus).filter(([, v]) => v === 'placeholder').map(([k]) => k);
    const missingRoles = Object.entries(roleStatus).filter(([, v]) => v === 'missing').map(([k]) => k);
    if (placeholderRoles.length > 0 || missingRoles.length > 0) {
      results.push({ moduleDir: modDir, moduleNum: modNum, roleStatus, placeholderRoles, missingRoles });
    }
  }
  return results;
}

function findAlternateVersions(placeholderReport) {
  // For each flagged module+role, search the full file map for any OTHER
  // source path that contains the same module number AND the same role
  // filename, then compare sizes to see if a substantially larger version
  // exists elsewhere.
  const lines = fs.readFileSync(FILE_MAP_CSV, 'utf8').split(/\r?\n/);
  const rows = [];
  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) continue;
    const m = line.match(/^"((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)","((?:[^"]|"")*)"/);
    if (!m) continue;
    rows.push({ path: m[1].replace(/""/g, '"'), category: m[2], ext: m[3], bytes: Number(m[4]) });
  }

  for (const mod of placeholderReport) {
    mod.alternates = {};
    const needRoles = [...mod.placeholderRoles, ...mod.missingRoles];
    for (const role of needRoles) {
      const candidates = rows.filter((r) => {
        if (!r.path.toLowerCase().endsWith('/' + role)) return false;
        if (r.path.startsWith('backend/src/modules/')) return false; // that's the canonical one itself
        const modTokenRe = new RegExp(`M0*${mod.moduleNum}(?:[_/]|$)`, 'i');
        return modTokenRe.test(r.path);
      });
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.bytes - a.bytes);
        mod.alternates[role] = candidates.slice(0, 3).map((c) => ({ path: c.path, bytes: c.bytes }));
      }
    }
  }
  return placeholderReport;
}

function main() {
  const report = scanCanonicalModules();
  const withAlternates = findAlternateVersions(report);
  const actionable = withAlternates.filter((m) => Object.keys(m.alternates).length > 0);

  const outPath = path.join(root, '_MERGE_LAB', 'reports', 'placeholder-scan.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(withAlternates, null, 2));

  console.log(JSON.stringify({
    modulesScanned: fs.readdirSync(CANONICAL_MODULES_DIR).filter((d) => /^M\d{3,4}/.test(d)).length,
    modulesWithPlaceholderOrMissingRoles: report.length,
    modulesWithRealAlternateAvailable: actionable.length,
    outPath: path.relative(root, outPath)
  }, null, 2));
}

main();
