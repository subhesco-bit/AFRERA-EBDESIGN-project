#!/usr/bin/env node
/*
 * Applies the placeholder-scan report: for every module+role flagged as
 * placeholder/missing with a real alternate available, copies the largest
 * verified-real alternate over the placeholder file in the canonical tree.
 *
 * Safety: only ever touches a file already independently confirmed to be a
 * placeholder or missing (never a file already judged "real"), and only
 * writes content already confirmed larger/substantive. .js files are
 * syntax-checked immediately after write; any failure is reverted and
 * reported rather than left broken.
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = process.cwd();
const reportPath = path.join(root, '_MERGE_LAB', 'reports', 'placeholder-scan.json');
const CANONICAL_MODULES_DIR = path.join(root, 'backend', 'src', 'modules');

function main() {
  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const results = { filled: [], skippedNoAlt: 0, skippedAltTooSmall: 0, syntaxFailed: [] };

  for (const mod of report) {
    if (!mod.alternates || Object.keys(mod.alternates).length === 0) continue;
    const modPath = path.join(CANONICAL_MODULES_DIR, mod.moduleDir);

    for (const [role, alts] of Object.entries(mod.alternates)) {
      const best = alts[0];
      const altAbs = path.join(root, best.path);
      if (!fs.existsSync(altAbs)) { results.skippedNoAlt += 1; continue; }
      if (best.bytes < 400) { results.skippedAltTooSmall += 1; continue; }

      const targetAbs = path.join(modPath, role);
      const backupContent = fs.existsSync(targetAbs) ? fs.readFileSync(targetAbs) : null;

      fs.mkdirSync(path.dirname(targetAbs), { recursive: true });
      fs.copyFileSync(altAbs, targetAbs);

      if (path.extname(role) === '.js') {
        try {
          execFileSync(process.execPath, ['--check', targetAbs], { stdio: 'pipe' });
        } catch (error) {
          if (backupContent !== null) fs.writeFileSync(targetAbs, backupContent);
          else fs.rmSync(targetAbs);
          results.syntaxFailed.push({ module: mod.moduleDir, role, source: best.path, error: error.message.split('\n')[0] });
          continue;
        }
      }

      results.filled.push({ module: mod.moduleDir, role, source: best.path, bytes: best.bytes });
    }
  }

  const outPath = path.join(root, '_MERGE_LAB', 'reports', 'placeholder-fill-results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log(JSON.stringify({
    filled: results.filled.length,
    skippedNoAlt: results.skippedNoAlt,
    skippedAltTooSmall: results.skippedAltTooSmall,
    syntaxFailed: results.syntaxFailed.length,
    outPath: path.relative(root, outPath)
  }, null, 2));
}

main();
