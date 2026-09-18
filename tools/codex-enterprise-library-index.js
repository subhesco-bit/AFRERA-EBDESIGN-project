#!/usr/bin/env node
/**
 * Enterprise Project Library Index
 *
 * Creates a virtual library catalogue for all project-bearing roots without
 * copying their contents. This is safer on a low-disk machine and preserves
 * duplicate filenames with source identity, hash status, and workflow context.
 */

'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = process.cwd();
const homeRoot = path.resolve(projectRoot, '..', '..');
const outputDir = path.join(projectRoot, '_EBDESIGN_LIBRARY', '25_DISCOVERY_INDEX');
const docsDir = path.join(projectRoot, 'docs');
const summaryPath = path.join(outputDir, 'enterprise-project-library-summary.json');
const filesCsvPath = path.join(outputDir, 'enterprise-project-library-files.csv');
const filesCsvTempPath = `${filesCsvPath}.tmp`;
const workflowPath = path.join(outputDir, 'enterprise-project-workflow-ai.md');
const featureMatrixPath = path.join(outputDir, 'enterprise-feature-source-matrix.json');
const duplicatePath = path.join(outputDir, 'enterprise-duplicate-name-groups.csv');
const batchProgressPath = path.join(outputDir, 'enterprise-project-library-batch-progress.json');
const docsSummaryPath = path.join(docsDir, 'codex-enterprise-library-index-summary.json');
const docsWorkflowPath = path.join(docsDir, 'codex-enterprise-project-workflow-ai.md');

const HASH_MAX_BYTES = Number(process.env.ENTERPRISE_LIBRARY_HASH_MAX_BYTES || 256 * 1024);
const PREVIEW_MAX_BYTES = Number(process.env.ENTERPRISE_LIBRARY_PREVIEW_MAX_BYTES || 8192);
const BATCH_SIZE = Number(process.env.ENTERPRISE_LIBRARY_BATCH_SIZE || 25000);

const ROOTS = [
  {
    label: 'EBDESIGN',
    role: 'current-primary-project',
    root: projectRoot,
  },
  {
    label: 'EBDESIGN.local-backups',
    role: 'local-backup-source',
    root: path.join(path.dirname(projectRoot), 'EBDESIGN.local-backups'),
  },
  {
    label: 'EBDESIGN.worktrees',
    role: 'agent-worktree-source',
    root: path.join(path.dirname(projectRoot), 'EBDESIGN.worktrees'),
  },
  {
    label: 'Documents/GitHub',
    role: 'github-documents-source',
    root: path.join(homeRoot, 'Documents', 'GitHub'),
  },
];

const TEXT_EXTENSIONS = new Set([
  '.bat', '.c', '.cjs', '.conf', '.cpp', '.cs', '.css', '.csv', '.env', '.go',
  '.html', '.ini', '.java', '.js', '.jsx', '.json', '.jsonl', '.md', '.mjs',
  '.ps1', '.py', '.rs', '.scss', '.sh', '.sql', '.ts', '.tsx', '.txt', '.xml',
  '.yaml', '.yml',
]);

function normalizePath(value) {
  return value.replace(/\\/g, '/');
}

function csv(value) {
  const text = String(value ?? '');
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

function libraryId(sourceLabel, relativePath) {
  const identity = `${sourceLabel}\0${normalizePath(relativePath).toLowerCase()}`;
  const digest = crypto.createHash('sha256').update(identity).digest('hex').slice(0, 16);
  return `EBDLIB-${digest.toUpperCase()}`;
}

function fileType(ext, category) {
  if (category === 'frontend_page') return 'frontend-page';
  if (category === 'frontend_component') return 'frontend-component';
  if (category === 'frontend_api_client') return 'frontend-api-client';
  if (category === 'frontend_state') return 'frontend-state';
  if (category === 'backend_route') return 'backend-route';
  if (category === 'backend_service') return 'backend-service';
  if (category === 'backend_module') return 'backend-module';
  if (category === 'database') return 'database-artifact';
  if (category === 'infra_workflow') return 'infrastructure-workflow';
  if (category === 'test') return 'test-or-spec';
  if (category === 'documentation') return 'documentation';
  if (category === 'dependency_cache') return 'dependency-cache';
  if (category === 'build_output') return 'generated-build-output';
  if (category === 'source_control_metadata') return 'source-control-metadata';
  if (category === 'agent_workspace') return 'agent-workspace-artifact';
  if (category === 'backup_or_archive') return 'backup-or-archive';
  if (ext) return `${ext.replace(/^\./, '')}-file`;
  return 'file';
}

function contentSummary({ category, feature, role, ext, preview }) {
  const parts = [
    `type=${fileType(ext, category)}`,
    `category=${category}`,
    `feature=${feature}`,
    `workflow=${role}`,
  ];
  const safePreview = String(preview || '').slice(0, 240);
  if (safePreview) parts.push(`preview=${safePreview}`);
  return parts.join('; ');
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function readPreview(filePath, ext, size) {
  if (!TEXT_EXTENSIONS.has(ext) || size <= 0) return '';
  const bytesToRead = Math.min(size, PREVIEW_MAX_BYTES);
  let fd = null;
  try {
    fd = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(bytesToRead);
    const bytesRead = fs.readSync(fd, buffer, 0, bytesToRead, 0);
    return buffer.subarray(0, bytesRead).toString('utf8').replace(/\s+/g, ' ').trim();
  } catch {
    return '';
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

function classify(relativePath, ext) {
  const lower = relativePath.toLowerCase();
  const name = path.basename(lower);

  if (lower.includes('/_ebdesign_library/25_discovery_index/')) return 'library_generated_artifact';
  if (lower.includes('/node_modules/')) return 'dependency_cache';
  if (lower.includes('/.git/')) return 'source_control_metadata';
  if (lower.includes('/dist/') || lower.includes('/build/') || lower.includes('/coverage/')) return 'build_output';
  if (lower.includes('/backup') || lower.includes('/local-backups/')) return 'backup_or_archive';
  if (lower.includes('/.claude/') || lower.includes('/.devin/') || lower.includes('/.ai/') || lower.includes('/.cursor/') || lower.includes('/.vs/')) return 'agent_workspace';
  if (lower.includes('/frontend/src/pages/')) return 'frontend_page';
  if (lower.includes('/frontend/src/components/')) return 'frontend_component';
  if (lower.includes('/frontend/src/services/')) return 'frontend_api_client';
  if (lower.includes('/frontend/src/store') || lower.includes('/frontend/src/stores/')) return 'frontend_state';
  if (lower.includes('/frontend/android/')) return 'mobile_android';
  if (lower.includes('/frontend/src-tauri/')) return 'desktop_tauri';
  if (lower.includes('/backend/src/routes/')) return 'backend_route';
  if (lower.includes('/backend/src/services/')) return 'backend_service';
  if (lower.includes('/backend/src/modules/')) return 'backend_module';
  if (lower.includes('/backend/src/database/') || lower.includes('/database/')) return 'database';
  if (lower.includes('/.github/workflows/') || ['.yml', '.yaml'].includes(ext) || name === 'dockerfile' || name.startsWith('docker')) return 'infra_workflow';
  if (name.includes('test') || name.includes('spec')) return 'test';
  if (ext === '.md' || name.startsWith('readme')) return 'documentation';
  if (['.json', '.csv', '.sql'].includes(ext)) return 'data_or_registry';
  if (['.js', '.jsx', '.ts', '.tsx', '.py', '.ps1', '.sh', '.bat'].includes(ext)) return 'automation_or_source';
  return 'uncategorized';
}

function featureKey(relativePath, category) {
  const compact = relativePath.toLowerCase().replace(/[^a-z0-9]+/g, '');
  const rules = [
    ['library-knowledge', ['libraryknowledge', 'librarybrowser', 'ebdesignlibrary', 'discoveryindex']],
    ['ai-chat-copilot', ['chat', 'copilot', 'assistant', 'conversation']],
    ['ai-image-cartoon', ['imagegeneration', 'productmedia', 'cartoon', 'imagecreator']],
    ['dietitian-nutrition', ['diet', 'nutrition', 'nutrient', 'wellness', 'recipe']],
    ['dynamic-pricing', ['dynamicpricing', 'marketprice', 'pricing']],
    ['public-price-extraction', ['publicdata', 'extraction', 'scrape', 'onlineprice']],
    ['ecommerce-marketplace', ['ecommerce', 'marketplace', 'product', 'cart', 'order']],
    ['farm-costing', ['farmcost', 'costing', 'costcontrol']],
    ['voice-farmer', ['voice', 'speech', 'audio', 'ivr']],
    ['mobile-app', ['android', 'capacitor', 'mobile']],
    ['desktop-app', ['tauri', 'desktop']],
    ['database-platform', ['migration', 'database', 'postgres', 'schema']],
    ['security-auth', ['auth', 'jwt', 'oauth', 'saml', 'security']],
    ['workflow-ci-cd', ['githubworkflows', 'docker', 'deploy', 'ci', 'workflow']],
  ];

  for (const [feature, tokens] of rules) {
    if (tokens.some((token) => compact.includes(token))) return feature;
  }

  const stem = path.basename(relativePath, path.extname(relativePath))
    .toLowerCase()
    .replace(/page$|routes?$|services?$|controllers?$|components?$/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (category.startsWith('frontend')) return `frontend-${stem || 'runtime'}`;
  if (category.startsWith('backend')) return `backend-${stem || 'runtime'}`;
  return `${category}-${stem || 'misc'}`;
}

function workflowRole(relativePath, category) {
  if (category === 'frontend_page') return 'user-experience-surface';
  if (category === 'frontend_component') return 'reusable-ui-block';
  if (category === 'frontend_api_client') return 'ui-to-api-contract';
  if (category === 'backend_route') return 'api-entrypoint';
  if (category === 'backend_service') return 'business-logic';
  if (category === 'backend_module') return 'domain-module';
  if (category === 'database') return 'data-model-or-migration';
  if (category === 'infra_workflow') return 'delivery-or-deployment';
  if (category === 'test') return 'verification';
  if (category === 'documentation') return 'project-knowledge';
  if (relativePath.toLowerCase().includes('package.json')) return 'dependency-manifest';
  return 'supporting-artifact';
}

function shouldReview(category) {
  return !['dependency_cache', 'build_output', 'source_control_metadata', 'library_generated_artifact'].includes(category);
}

async function scanRoots() {
  fs.mkdirSync(outputDir, { recursive: true });
  fs.mkdirSync(docsDir, { recursive: true });

  const csvStream = fs.createWriteStream(filesCsvTempPath, { encoding: 'utf8' });
  csvStream.write([
    'library_id',
    'source_label',
    'source_role',
    'absolute_path',
    'relative_path',
    'basename',
    'file_type',
    'extension',
    'bytes',
    'modified',
    'category',
    'feature_key',
    'workflow_role',
    'hash_status',
    'sha256',
    'review_required',
    'content_summary',
    'text_preview',
  ].join(',') + '\n');

  const summary = {
    generatedAt: new Date().toISOString(),
    method: 'Virtual library index. Files remain in their source folders; this catalog records paths, metadata, content hashes for bounded-size files, and workflow roles.',
    hashMaxBytes: HASH_MAX_BYTES,
    previewMaxBytes: PREVIEW_MAX_BYTES,
    roots: [],
    totals: {
      files: 0,
      bytes: 0,
      hashedFiles: 0,
      largeHashDeferred: 0,
      unreadable: 0,
      reviewRequired: 0,
    },
    byCategory: {},
    byFeature: {},
    byWorkflowRole: {},
    duplicateBasenames: {},
    topLargeFiles: [],
  };

  const featureSources = new Map();
  const basenameGroups = new Map();
  let batchNumber = 0;

  function writeBatchProgress(source, directory) {
    batchNumber += 1;
    const payload = {
      generatedAt: new Date().toISOString(),
      status: 'running',
      batchNumber,
      batchSize: BATCH_SIZE,
      filesProcessed: summary.totals.files,
      bytesProcessed: summary.totals.bytes,
      currentSource: source?.label || null,
      currentDirectory: directory || null,
      tempCsvPath: filesCsvTempPath,
      finalCsvPath: filesCsvPath,
    };
    fs.writeFileSync(batchProgressPath, `${JSON.stringify(payload, null, 2)}\n`);
    console.log(JSON.stringify({
      batch: batchNumber,
      filesProcessed: summary.totals.files,
      currentSource: source?.label || null,
    }));
  }

  for (const source of ROOTS) {
    const rootInfo = {
      label: source.label,
      role: source.role,
      root: source.root,
      exists: fs.existsSync(source.root),
      files: 0,
      bytes: 0,
      byCategory: {},
    };
    summary.roots.push(rootInfo);
    if (!rootInfo.exists) continue;

    const stack = [source.root];
    while (stack.length) {
      const directory = stack.pop();
      let entries = [];
      try {
        entries = fs.readdirSync(directory, { withFileTypes: true });
      } catch {
        summary.totals.unreadable += 1;
        continue;
      }

      for (const entry of entries) {
        const absolutePath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          stack.push(absolutePath);
          continue;
        }
        if (!entry.isFile()) continue;

        const stat = safeStat(absolutePath);
        if (!stat) {
          summary.totals.unreadable += 1;
          continue;
        }

        const relativePath = normalizePath(path.relative(source.root, absolutePath));
        const ext = path.extname(entry.name).toLowerCase();
        const category = classify(`${source.label}/${relativePath}`, ext);
        const feature = featureKey(relativePath, category);
        const role = workflowRole(relativePath, category);
        const reviewRequired = shouldReview(category);
        const id = libraryId(source.label, relativePath);
        const type = fileType(ext, category);

        let hash = '';
        let hashStatus = 'deferred_large_file';
        if (!reviewRequired) {
          hashStatus = 'metadata_only';
        } else if (stat.size <= HASH_MAX_BYTES) {
          try {
            hash = sha256File(absolutePath);
            hashStatus = 'hashed';
            summary.totals.hashedFiles += 1;
          } catch {
            hashStatus = 'unreadable';
            summary.totals.unreadable += 1;
          }
        } else {
          summary.totals.largeHashDeferred += 1;
        }

        const preview = reviewRequired ? readPreview(absolutePath, ext, stat.size).slice(0, 500) : '';
        const summaryText = contentSummary({ category, feature, role, ext, preview });

        csvStream.write([
          id,
          source.label,
          source.role,
          absolutePath,
          relativePath,
          entry.name,
          type,
          ext || '[none]',
          stat.size,
          stat.mtime.toISOString(),
          category,
          feature,
          role,
          hashStatus,
          hash,
          reviewRequired,
          summaryText,
          preview,
        ].map(csv).join(',') + '\n');

        rootInfo.files += 1;
        rootInfo.bytes += stat.size;
        rootInfo.byCategory[category] = (rootInfo.byCategory[category] || 0) + 1;
        summary.totals.files += 1;
        summary.totals.bytes += stat.size;
        if (reviewRequired) summary.totals.reviewRequired += 1;
        summary.byCategory[category] = (summary.byCategory[category] || 0) + 1;
        summary.byFeature[feature] = (summary.byFeature[feature] || 0) + 1;
        summary.byWorkflowRole[role] = (summary.byWorkflowRole[role] || 0) + 1;

        if (!featureSources.has(feature)) featureSources.set(feature, new Set());
        featureSources.get(feature).add(source.label);

        const basenameKey = entry.name.toLowerCase();
        if (!basenameGroups.has(basenameKey)) basenameGroups.set(basenameKey, {
          count: 0,
          sources: new Set(),
          hashes: new Set(),
          examples: [],
        });
        const group = basenameGroups.get(basenameKey);
        group.count += 1;
        group.sources.add(source.label);
        if (hash) group.hashes.add(hash);
        if (group.examples.length < 5) group.examples.push(`${source.label}/${relativePath}`);

        summary.topLargeFiles.push({
          source: source.label,
          path: relativePath,
          bytes: stat.size,
          category,
        });
        summary.topLargeFiles.sort((a, b) => b.bytes - a.bytes);
        if (summary.topLargeFiles.length > 25) summary.topLargeFiles.length = 25;

        if (summary.totals.files > 0 && summary.totals.files % BATCH_SIZE === 0) {
          writeBatchProgress(source, directory);
        }
      }
    }
  }

  await new Promise((resolve) => csvStream.end(resolve));
  fs.renameSync(filesCsvTempPath, filesCsvPath);

  const duplicateRows = [['basename', 'count', 'sources', 'known_hashes', 'examples']];
  for (const [basename, group] of basenameGroups) {
    if (group.count < 2) continue;
    const sourceCount = group.sources.size;
    const hashCount = group.hashes.size;
    if (sourceCount < 2 && hashCount < 2) continue;
    summary.duplicateBasenames[basename] = {
      count: group.count,
      sources: sourceCount,
      knownHashes: hashCount,
      examples: group.examples,
    };
    duplicateRows.push([
      basename,
      group.count,
      Array.from(group.sources).join('|'),
      hashCount,
      group.examples.join('|'),
    ]);
  }

  fs.writeFileSync(duplicatePath, duplicateRows.map(row => row.map(csv).join(',')).join('\n') + '\n');

  const featureMatrix = Object.entries(summary.byFeature)
    .map(([feature, files]) => ({
      feature,
      files,
      sources: Array.from(featureSources.get(feature) || []).sort(),
      sourceCount: (featureSources.get(feature) || new Set()).size,
      recommendedAction: files > 20 || (featureSources.get(feature) || new Set()).size > 1 ?
        'evaluate-merge-enhance-test' :
        'catalogue-and-monitor',
    }))
    .sort((a, b) => b.sourceCount - a.sourceCount || b.files - a.files);

  fs.writeFileSync(featureMatrixPath, JSON.stringify({
    generatedAt: summary.generatedAt,
    featureTracks: featureMatrix.length,
    features: featureMatrix,
  }, null, 2) + '\n');

  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2) + '\n');
  fs.copyFileSync(summaryPath, docsSummaryPath);

  const topCategories = Object.entries(summary.byCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([category, count]) => `| ${category} | ${count} |`)
    .join('\n');

  const topFeatures = featureMatrix
    .slice(0, 25)
    .map((item) => `| ${item.feature} | ${item.files} | ${item.sourceCount} | ${item.recommendedAction} |`)
    .join('\n');

  const workflow = `# AFRERA Enterprise Project Library Workflow

Generated: ${summary.generatedAt}

## Operational Principle

All project-bearing folders are now represented in the EBDESIGN Library as an active catalogue. Every file row records a stable \`library_id\`, name, source, path, size, file type, category, workflow role, feature key, content summary, safe preview text where available, and content hash for bounded-size files. Files are not blindly copied, because the machine has limited free disk and duplicate copying would increase risk.

## Indexed Sources

${summary.roots.map(root => `- ${root.label}: ${root.exists ? root.files : 0} files, role ${root.role}, path \`${root.root}\``).join('\n')}

## Industry-Standard Workflow

1. Ingest every project source into the virtual library index.
2. Classify files into UI, API, service, database, tests, infra, docs, agent workspace, backups, dependency caches, and build outputs.
3. Detect duplicate filenames by source and content hash. Same name is not treated as same purpose.
4. Promote useful candidates into \`_MERGE_LAB/features/<feature>/\` with renamed safe identities.
5. Ask Application AI to retrieve library context before every feature enhancement.
6. Use agentic AI to compare variants, generate a merge plan, implement one final production module, and write tests.
7. Use generative AI only through governed routes with cost tracking, moderation, provenance, and fallback behavior.
8. Validate web, API, mobile shell, desktop shell, database migration, CI, and security before marking a feature production-ready.
9. Run \`node tools/codex-library-activity-track.js\` after indexing, agent work, merges, cleanup, and deployments so created, changed, deleted, and moved-or-renamed candidate files are recorded in the Library ledger.

## Totals

- Files indexed: ${summary.totals.files}
- Bytes represented: ${summary.totals.bytes}
- Files hashed: ${summary.totals.hashedFiles}
- Large-file hashes deferred: ${summary.totals.largeHashDeferred}
- Review-required files: ${summary.totals.reviewRequired}
- Duplicate basename groups: ${Object.keys(summary.duplicateBasenames).length}

## Top Categories

| Category | Files |
| --- | ---: |
${topCategories}

## Top Feature Tracks

| Feature | Files | Sources | Recommended Action |
| --- | ---: | ---: | --- |
${topFeatures}

## Application AI Support

The Library API should use this index as authoritative retrieval context for project questions, feature-gap detection, merge decisions, and workflow explanation. AI answers must cite source paths from the index rather than inventing project structure.

## Active File Ledger

The Library is an active project-system module. The file catalogue is the identity register, while \`enterprise-file-activity-snapshot.jsonl\` and \`enterprise-file-activity-ledger.jsonl\` track what happens over time. Any file entering the system, changing in place, leaving the system, or appearing as a moved/renamed candidate should be represented by a ledger event with its unique ID, name, type, size, source, workflow role, feature key, path, hash status, and content summary.

## Agentic AI Support

Agents should execute feature work through a controlled loop: retrieve context, compare duplicate variants, propose merge, implement, test, document, update library, and refresh active project.

## Next-Gen Generative AI Support

Generative features such as image creation, cartoon generation, dietitian flows, voice workflows, and dynamic pricing must be connected to this library context so outputs respect project modules, farmer usability, product data, domain policy, cost limits, and safety guardrails.
`;

  fs.writeFileSync(workflowPath, workflow);
  fs.copyFileSync(workflowPath, docsWorkflowPath);

  fs.writeFileSync(batchProgressPath, `${JSON.stringify({
    generatedAt: new Date().toISOString(),
    status: 'complete',
    batchNumber,
    batchSize: BATCH_SIZE,
    filesProcessed: summary.totals.files,
    bytesProcessed: summary.totals.bytes,
    finalCsvPath: filesCsvPath,
  }, null, 2)}\n`);

  return {
    summary,
    featureTracks: featureMatrix.length,
    duplicateBasenameGroups: Object.keys(summary.duplicateBasenames).length,
    outputs: {
      summary: summaryPath,
      filesCsv: filesCsvPath,
      workflow: workflowPath,
      featureMatrix: featureMatrixPath,
      duplicates: duplicatePath,
    },
  };
}

scanRoots()
  .then((result) => {
    console.log(JSON.stringify({
      filesIndexed: result.summary.totals.files,
      roots: result.summary.roots.map(root => ({
        label: root.label,
        exists: root.exists,
        files: root.files,
      })),
      featureTracks: result.featureTracks,
      duplicateBasenameGroups: result.duplicateBasenameGroups,
      outputs: Object.fromEntries(Object.entries(result.outputs).map(([key, value]) => [key, path.relative(projectRoot, value)])),
    }, null, 2));
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
