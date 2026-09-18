#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const mapCsv = path.join(docsDir, 'codex-file-map.csv');
const mergeLabDir = path.join(root, '_MERGE_LAB');
const reportsDir = path.join(mergeLabDir, 'reports');

const outMatrixJson = path.join(docsDir, 'codex-feature-merge-matrix.json');
const outMatrixMd = path.join(docsDir, 'codex-feature-merge-matrix.md');
const outDuplicateCsv = path.join(docsDir, 'codex-duplicate-filename-conflicts.csv');
const outRenamePlanCsv = path.join(docsDir, 'codex-duplicate-rename-plan.csv');
const mergeLabReadme = path.join(mergeLabDir, 'README.md');

const EXCLUDED_CATEGORIES = new Set([
  'dependency_cache',
  'build_output',
  'log_or_report_output'
]);

const FEATURE_CATEGORIES = new Set([
  'frontend_page',
  'frontend_component',
  'frontend_api_client',
  'frontend_state',
  'frontend_routing_config',
  'frontend_runtime',
  'backend_route',
  'backend_service',
  'backend_module',
  'backend_database',
  'backend_middleware',
  'backend_runtime',
  'database_asset',
  'shared_config_or_manifest',
  'project_documentation',
  'registry_documentation',
  'automation_tooling',
  'agent_workspace_noise',
  'backup_or_archive',
  'data_or_registry',
  'uncategorized',
  'historical_report',
  'backend_tests',
  'frontend_tests',
  'infra_deployment',
  'mobile_android_wrapper',
  'desktop_tauri_wrapper'
]);

const AGENT_HINTS = [
  ['claude', /\.claude\//i],
  ['devin', /\.devin\//i],
  ['cursor', /\.cursor\//i],
  ['visual-studio', /\.vs\//i],
  ['codex-or-ai-workspace', /^\.ai\//i],
  ['backup', /^backups\//i],
  ['old-new-folder', /^New folder\//i],
  ['frontend-current', /^frontend\//i],
  ['backend-current', /^backend\//i],
  ['database-current', /^database\//i],
  ['root-current', /^[^/]+$/i]
];

const FEATURE_KEYWORDS = [
  ['ai-image-cartoon', ['image', 'cartoon', 'productmedia', 'mediaai', 'studio']],
  ['ai-chat-copilot', ['chat', 'copilot', 'assistant', 'conversation']],
  ['dietitian-nutrition', ['diet', 'nutrition', 'nutrient', 'wellness', 'recipe']],
  ['dynamic-pricing', ['dynamicpricing', 'pricing', 'price', 'marketprice']],
  ['public-price-extraction', ['publicdata', 'extract', 'scrape', 'onlineprice']],
  ['ecommerce-marketplace', ['ecommerce', 'marketplace', 'cart', 'order', 'product']],
  ['farm-costing', ['farmcost', 'costing', 'costcontrol', 'expense']],
  ['voice-farmer', ['voice', 'speech', 'audio', 'ivr']],
  ['mobile-shell', ['mobile', 'android', 'capacitor']],
  ['desktop-shell', ['tauri', 'desktop']],
  ['database-model', ['migration', 'schema', 'database', 'postgres', 'sql']],
  ['security-auth', ['auth', 'jwt', 'oauth', 'saml', 'security', 'permission']]
];

function normalizePath(value) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
}

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (quoted) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i += 1;
      } else if (ch === '"') {
        quoted = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      quoted = true;
    } else if (ch === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function agentSource(relPath) {
  for (const [name, pattern] of AGENT_HINTS) {
    if (pattern.test(relPath)) return name;
  }
  return relPath.split('/')[0] || 'unknown';
}

function featureKey(file) {
  const lower = `${file.path} ${file.category}`.toLowerCase().replace(/[^a-z0-9]+/g, '');
  for (const [key, words] of FEATURE_KEYWORDS) {
    if (words.some((word) => lower.includes(word))) return key;
  }

  const base = path.basename(file.path, path.extname(file.path))
    .toLowerCase()
    .replace(/page$|routes?$|services?$|controllers?$|components?$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (file.category.startsWith('frontend')) return `frontend-${base || 'runtime'}`;
  if (file.category.startsWith('backend')) return `backend-${base || 'runtime'}`;
  if (file.category.includes('database')) return 'database-model';
  if (file.category.includes('documentation')) return `docs-${base || 'project'}`;
  return `support-${base || 'misc'}`;
}

function fileHash(absPath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(absPath));
  return hash.digest('hex');
}

async function readMap() {
  const files = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(mapCsv),
    crlfDelay: Infinity
  });

  let headerSeen = false;
  for await (const line of rl) {
    if (!line.trim()) continue;
    if (!headerSeen) {
      headerSeen = true;
      continue;
    }
    const [relPath, category, extension, bytes, modified, note] = parseCsvLine(line);
    if (!relPath || EXCLUDED_CATEGORIES.has(category) || !FEATURE_CATEGORIES.has(category)) continue;
    files.push({
      path: normalizePath(relPath),
      category,
      extension,
      bytes: Number(bytes || 0),
      modified,
      note
    });
  }
  return files;
}

function safeCandidateName(file, hash) {
  const source = agentSource(file.path).replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  const ext = path.extname(file.path);
  const stem = path.basename(file.path, ext).replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  return `${source}__${hash.slice(0, 12)}__${stem}${ext.toLowerCase()}`;
}

function buildReports(files) {
  const existingFiles = [];
  for (const file of files) {
    const absPath = path.join(root, file.path);
    if (!fs.existsSync(absPath)) continue;
    try {
      const hash = fileHash(absPath);
      existingFiles.push({
        ...file,
        hash,
        basename: path.basename(file.path).toLowerCase(),
        source: agentSource(file.path),
        feature: featureKey(file)
      });
    } catch (error) {
      existingFiles.push({
        ...file,
        hash: `unreadable:${error.code || 'error'}`,
        basename: path.basename(file.path).toLowerCase(),
        source: agentSource(file.path),
        feature: featureKey(file)
      });
    }
  }

  const byBasename = new Map();
  const byFeature = new Map();

  for (const file of existingFiles) {
    if (!byBasename.has(file.basename)) byBasename.set(file.basename, []);
    byBasename.get(file.basename).push(file);

    if (!byFeature.has(file.feature)) {
      byFeature.set(file.feature, {
        feature: file.feature,
        files: 0,
        sources: new Set(),
        frontend: 0,
        backend: 0,
        database: 0,
        docs: 0,
        support: 0,
        duplicateFilenameConflicts: 0,
        suggestedAction: 'evaluate'
      });
    }
    const feature = byFeature.get(file.feature);
    feature.files += 1;
    feature.sources.add(file.source);
    if (file.category.startsWith('frontend')) feature.frontend += 1;
    else if (file.category.startsWith('backend')) feature.backend += 1;
    else if (file.category.includes('database')) feature.database += 1;
    else if (file.category.includes('documentation') || file.category === 'historical_report') feature.docs += 1;
    else feature.support += 1;
  }

  const conflicts = [];
  const renamePlan = [];

  for (const [, group] of byBasename) {
    const uniqueHashes = new Set(group.map((file) => file.hash));
    if (group.length < 2 || uniqueHashes.size < 2) continue;
    const sorted = group.sort((a, b) => b.bytes - a.bytes || a.path.localeCompare(b.path));
    for (const file of sorted) {
      const proposed = `_MERGE_LAB/features/${file.feature}/${safeCandidateName(file, file.hash)}`;
      renamePlan.push({ ...file, proposed });
      conflicts.push(file);
      const feature = byFeature.get(file.feature);
      if (feature) feature.duplicateFilenameConflicts += 1;
    }
  }

  const matrix = Array.from(byFeature.values())
    .map((feature) => {
      const sourceCount = feature.sources.size;
      let suggestedAction = 'keep-as-supporting-source';
      if (feature.duplicateFilenameConflicts > 0 || sourceCount > 1) suggestedAction = 'merge-lab-required';
      if (feature.frontend && feature.backend) suggestedAction = 'full-stack-merge-and-test';
      if (feature.feature.startsWith('ai-') || ['dietitian-nutrition', 'dynamic-pricing', 'ecommerce-marketplace', 'farm-costing'].includes(feature.feature)) {
        suggestedAction = 'priority-enhancement-track';
      }
      return {
        feature: feature.feature,
        files: feature.files,
        sourceCount,
        sources: Array.from(feature.sources).sort(),
        frontend: feature.frontend,
        backend: feature.backend,
        database: feature.database,
        docs: feature.docs,
        support: feature.support,
        duplicateFilenameConflicts: feature.duplicateFilenameConflicts,
        suggestedAction
      };
    })
    .sort((a, b) => {
      const priority = (item) => item.suggestedAction === 'priority-enhancement-track' ? 0 : item.duplicateFilenameConflicts > 0 ? 1 : 2;
      return priority(a) - priority(b) || b.duplicateFilenameConflicts - a.duplicateFilenameConflicts || b.files - a.files;
    });

  return {
    generatedAt: new Date().toISOString(),
    scannedFiles: existingFiles.length,
    duplicateFilenameConflictFiles: conflicts.length,
    duplicateFilenameGroups: new Set(conflicts.map((file) => file.basename)).size,
    matrix,
    conflicts,
    renamePlan
  };
}

function writeReports(report) {
  fs.mkdirSync(docsDir, { recursive: true });
  fs.mkdirSync(reportsDir, { recursive: true });

  fs.writeFileSync(outMatrixJson, `${JSON.stringify({
    generatedAt: report.generatedAt,
    scannedFiles: report.scannedFiles,
    duplicateFilenameConflictFiles: report.duplicateFilenameConflictFiles,
    duplicateFilenameGroups: report.duplicateFilenameGroups,
    matrix: report.matrix
  }, null, 2)}\n`);

  const duplicateRows = [
    ['basename', 'feature', 'source', 'category', 'bytes', 'hash', 'path'],
    ...report.conflicts.map((file) => [file.basename, file.feature, file.source, file.category, file.bytes, file.hash, file.path])
  ].map((row) => row.map(csvEscape).join(',')).join('\n');
  fs.writeFileSync(outDuplicateCsv, `${duplicateRows}\n`);

  const renameRows = [
    ['feature', 'source', 'original_path', 'sha256', 'proposed_merge_lab_path'],
    ...report.renamePlan.map((file) => [file.feature, file.source, file.path, file.hash, file.proposed])
  ].map((row) => row.map(csvEscape).join(',')).join('\n');
  fs.writeFileSync(outRenamePlanCsv, `${renameRows}\n`);

  const topRows = report.matrix.slice(0, 80).map((item) => (
    `| ${item.feature} | ${item.files} | ${item.sourceCount} | ${item.duplicateFilenameConflicts} | ${item.frontend} | ${item.backend} | ${item.database} | ${item.suggestedAction} |`
  )).join('\n');

  const md = `# Codex Feature Merge Matrix

Generated: ${report.generatedAt}

## Purpose

This report prevents destructive merging. Same filenames can contain different content and different feature ideas, so duplicate names must be renamed in the merge lab before evaluation.

## Summary

- Scanned merge candidates: ${report.scannedFiles}
- Same-name/different-content conflict files: ${report.duplicateFilenameConflictFiles}
- Conflict filename groups: ${report.duplicateFilenameGroups}
- Rename plan: \`docs/codex-duplicate-rename-plan.csv\`
- Conflict evidence: \`docs/codex-duplicate-filename-conflicts.csv\`

## Merge Rule

1. Copy candidate versions into \`_MERGE_LAB/features/<feature>/\` using the generated renamed path.
2. Evaluate all versions for UI, API, service logic, database, security, cost, mobile, desktop, and tests.
3. Build one new production version in the canonical project.
4. Run feature tests and production build.
5. Delete or archive temporary merge-lab copies only after the merged feature is proven.

## Top Feature Tracks

| Feature | Files | Sources | Name Conflicts | Frontend | Backend | Database | Action |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | --- |
${topRows}
`;

  fs.writeFileSync(outMatrixMd, md);

  const readme = `# AFRERA Merge Lab

This folder is for temporary feature comparison only.

Do not merge duplicate filenames by overwriting. Use \`docs/codex-duplicate-rename-plan.csv\` so each version is copied with this pattern:

\`_MERGE_LAB/features/<feature>/<source>__<sha12>__<original-name>\`

After a final feature is created, integrated, and tested in the canonical project, temporary copies can be removed from this lab.
`;

  fs.writeFileSync(mergeLabReadme, readme);
  fs.copyFileSync(outMatrixJson, path.join(reportsDir, 'codex-feature-merge-matrix.json'));
  fs.copyFileSync(outMatrixMd, path.join(reportsDir, 'codex-feature-merge-matrix.md'));
  fs.copyFileSync(outDuplicateCsv, path.join(reportsDir, 'codex-duplicate-filename-conflicts.csv'));
  fs.copyFileSync(outRenamePlanCsv, path.join(reportsDir, 'codex-duplicate-rename-plan.csv'));
}

async function main() {
  if (!fs.existsSync(mapCsv)) {
    console.error(`Missing ${mapCsv}. Run tools/codex-project-map.js first.`);
    process.exit(1);
  }
  const files = await readMap();
  const report = buildReports(files);
  writeReports(report);
  console.log(JSON.stringify({
    scannedFiles: report.scannedFiles,
    duplicateFilenameConflictFiles: report.duplicateFilenameConflictFiles,
    duplicateFilenameGroups: report.duplicateFilenameGroups,
    featureTracks: report.matrix.length,
    matrix: path.relative(root, outMatrixMd),
    renamePlan: path.relative(root, outRenamePlanCsv)
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
