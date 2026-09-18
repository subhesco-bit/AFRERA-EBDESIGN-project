#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const mapCsv = path.join(docsDir, 'codex-file-map.csv');
const targetRoot = path.join(root, '_ACTIVE_PROJECT', 'current');
const manifestPath = path.join(targetRoot, 'CONSOLIDATION_MANIFEST.csv');
const reportPath = path.join(targetRoot, 'CONSOLIDATION_REPORT.md');

if (!fs.existsSync(mapCsv)) {
  console.error(`Missing ${mapCsv}. Run tools/codex-project-map.js first.`);
  process.exit(1);
}

const KEEP_CATEGORIES = new Set([
  'backend_module',
  'backend_route',
  'backend_service',
  'backend_database',
  'backend_runtime',
  'backend_middleware',
  'frontend_page',
  'frontend_component',
  'frontend_runtime',
  'frontend_api_client',
  'frontend_routing_config',
  'frontend_state',
  'mobile_android_wrapper',
  'desktop_tauri_wrapper',
  'infra_deployment',
  'database_asset',
  'shared_config_or_manifest',
  'project_documentation',
  'registry_documentation',
  'backend_tests',
  'frontend_tests'
]);

const EXCLUDED_PREFIXES = [
  '.git/',
  '.claude/',
  '.ai/',
  '.vs/',
  '.vscode/',
  '.cursor/',
  '.system-audit/',
  '.audit/',
  '.vibecheck/',
  '_ACTIVE_PROJECT/',
  '_CONSOLIDATED_PROJECT/',
  '_QUARANTINE/',
  'backups/',
  'blobs/',
  'node_modules/',
  'New folder/',
  'frontend/node_modules/',
  'frontend/dist/',
  'frontend/build/',
  'frontend/coverage/',
  'backend/node_modules/',
  'backend/coverage/',
  'backend/dist/',
  'backend/build/'
];

const EXCLUDED_FILES = new Set([
  'docs/codex-file-map.csv',
  'docs/codex-junk-quarantine-manifest.csv',
  'docs/codex-production-hardening-audit.csv'
]);

const EXPLICIT_KEEP = [
  '.github/workflows/ci.yml',
  '.github/workflows/deploy.yml',
  '.github/workflows/production-hardening.yml',
  '.github/workflows/pages-preview.yml',
  'tools/codex-project-map.js',
  'tools/codex-hardening-audit.js',
  'tools/codex-consolidate-project.js',
  'tools/codex-extract-variety-docx.py',
  'tools/codex-generate-variety-products-js.js',
  'tools/codex-ai-feature-smoke.js',
  'tools/codex-merge-lab-inventory.js',
  'tools/codex-library-operational-smoke.js',
  'tools/codex-library-ops-server.js',
  'tools/codex-enterprise-library-index.js',
  'tools/codex-library-activity-track.js',
  'tools/codex-unified-project-orchestrator.js',
  'tools/codex-unified-merge-batch.js',
  'tools/codex-prepare-github-remotes.ps1',
  'backend/src/database/migrations/055_library_ai_recordkeeping_schema.sql',
  'frontend/src/data/northEastVarietyProducts.js',
  'docs/codex-project-map.md',
  'docs/codex-project-map.json',
  'docs/codex-modular-systems-integration.md',
  'docs/codex-junk-separation-plan.md',
  'docs/codex-production-hardening-audit.md',
  'docs/codex-production-hardening-audit.json',
  'docs/codex-gpt6-product-enhancement-blueprint.md',
  'docs/north-east-variety-products.json',
  'docs/north-east-variety-products.csv',
  'docs/codex-ai-feature-smoke-report.md',
  'docs/codex-ai-feature-smoke-report.json',
  'docs/codex-unified-project-conversion.md',
  'docs/codex-feature-merge-matrix.md',
  'docs/codex-feature-merge-matrix.json',
  'docs/codex-duplicate-filename-conflicts.csv',
  'docs/codex-duplicate-rename-plan.csv',
  'docs/codex-library-operational-smoke-report.md',
  'docs/codex-library-operational-smoke-report.json',
  'docs/codex-enterprise-library-index-summary.json',
  'docs/codex-enterprise-project-workflow-ai.md',
  'docs/codex-enterprise-personal-repo-sync-strategy.md',
  'docs/codex-library-ai-workflow.md',
  'docs/codex-library-ai-database-recordkeeping.md',
  'docs/codex-library-project-integration.md',
  'backend/src/services/libraryAIWorkspaceService.js',
  'backend/src/routes/libraryAIWorkspaceRoutes.js',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-project-library-summary.json',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-project-workflow-ai.md',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-feature-source-matrix.json',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-duplicate-name-groups.csv',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-summary.json',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-latest.json',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-ledger.jsonl',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-project-library-batch-progress.json',
  '_EBDESIGN_LIBRARY/25_DISCOVERY_INDEX/enterprise-file-activity-progress.json'
];

function normalizePath(value) {
  return value.replace(/\\/g, '/').replace(/^\/+/, '');
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

function csvEscape(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function isExcluded(relativePath) {
  const normalized = normalizePath(relativePath);
  if (EXCLUDED_FILES.has(normalized)) return true;
  return EXCLUDED_PREFIXES.some((prefix) => normalized.startsWith(prefix));
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!!relative && !relative.startsWith('..') && !path.isAbsolute(relative));
}

function copyFile(relativePath, category, manifestStream, stats) {
  const normalized = normalizePath(relativePath);
  const source = path.resolve(root, normalized);
  const destination = path.resolve(targetRoot, normalized);
  if (!isInside(root, source) || !isInside(targetRoot, destination)) {
    stats.skippedUnsafe += 1;
    return;
  }
  if (!fs.existsSync(source) || !fs.statSync(source).isFile()) {
    stats.skippedMissing += 1;
    return;
  }
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
  const size = fs.statSync(source).size;
  manifestStream.write(`${[normalized, category, size].map(csvEscape).join(',')}\n`);
  stats.copied += 1;
  stats.bytes += size;
  stats.byCategory.set(category, (stats.byCategory.get(category) || 0) + 1);
}

async function main() {
  fs.mkdirSync(targetRoot, { recursive: true });
  const manifestStream = fs.createWriteStream(manifestPath);
  manifestStream.write(`${['path', 'category', 'bytes'].map(csvEscape).join(',')}\n`);

  const stats = {
    copied: 0,
    bytes: 0,
    skippedMissing: 0,
    skippedUnsafe: 0,
    byCategory: new Map()
  };
  const copied = new Set();

  const rl = readline.createInterface({
    input: fs.createReadStream(mapCsv, { encoding: 'utf8' }),
    crlfDelay: Infinity
  });
  let idx = null;
  for await (const line of rl) {
    if (!line) continue;
    if (!idx) {
      const header = parseCsvLine(line);
      idx = Object.fromEntries(header.map((name, index) => [name, index]));
      continue;
    }
    const cols = parseCsvLine(line);
    const row = {
      path: normalizePath(cols[idx.path]),
      category: cols[idx.category]
    };
    if (!KEEP_CATEGORIES.has(row.category) || isExcluded(row.path) || copied.has(row.path)) {
      continue;
    }
    copyFile(row.path, row.category, manifestStream, stats);
    copied.add(row.path);
  }

  EXPLICIT_KEEP.forEach((relativePath) => {
    const normalized = normalizePath(relativePath);
    if (!copied.has(normalized) && !isExcluded(normalized)) {
      copyFile(normalized, 'explicit_keep', manifestStream, stats);
      copied.add(normalized);
    }
  });

  await new Promise((resolve, reject) => {
    manifestStream.end(resolve);
    manifestStream.on('error', reject);
  });

  const topCategories = [...stats.byCategory.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => `- ${category}: ${count.toLocaleString()} files`);

  const report = [
    '# AFRERA EBDESIGN Active Project Consolidation',
    '',
    `Generated: ${new Date().toISOString()}`,
    '',
    '## Result',
    '',
    `- Consolidated source folder: \`${path.relative(root, targetRoot).replace(/\\/g, '/')}\``,
    `- Files copied: ${stats.copied.toLocaleString()}`,
    `- Approximate copied size: ${(stats.bytes / 1024 / 1024).toFixed(1)} MB`,
    `- Missing/skipped files: ${stats.skippedMissing.toLocaleString()}`,
    `- Unsafe path skips: ${stats.skippedUnsafe.toLocaleString()}`,
    '',
    '## What Was Kept',
    '',
    ...topCategories,
    '',
    '## What Was Excluded',
    '',
    '- Dependency caches: `node_modules` and package manager cache outputs',
    '- Generated builds: `dist`, `build`, `coverage`, temporary artifacts',
    '- Backups and local worktrees',
    '- Agent/cache folders such as `.claude`, `.ai`, `.cursor`, `.vs`',
    '- Large blob/archive folders and old `New folder` material',
    '',
    '## Next Step',
    '',
    'Run install/build/test from this active source tree or push it to a clean branch after confirming no runtime imports point back to excluded folders.',
    ''
  ].join('\n');

  fs.writeFileSync(reportPath, report);
  console.log(JSON.stringify({
    target: path.relative(root, targetRoot).replace(/\\/g, '/'),
    files_copied: stats.copied,
    megabytes_copied: Number((stats.bytes / 1024 / 1024).toFixed(1)),
    skipped_missing: stats.skippedMissing,
    skipped_unsafe: stats.skippedUnsafe
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
