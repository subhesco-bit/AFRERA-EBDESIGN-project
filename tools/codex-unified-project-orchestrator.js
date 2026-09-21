#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const libraryRoot = path.join(root, '_EBDESIGN_LIBRARY', '25_DISCOVERY_INDEX');
const indexCsv = path.join(libraryRoot, 'enterprise-project-library-files.csv');
const activeRoot = path.join(root, '_ACTIVE_PROJECT', 'current');
const unifiedRoot = path.join(root, '_UNIFIED_PROJECT');
const unifiedProjectRoot = path.join(unifiedRoot, 'current');
const auditRoot = path.join(unifiedRoot, 'audit');
const workspaceRoot = path.join(unifiedRoot, 'merge-workspace');

const outputs = {
  summary: path.join(auditRoot, 'orchestrator-summary.json'),
  progress: path.join(auditRoot, 'orchestrator-progress.json'),
  groups: path.join(auditRoot, 'duplicate-groups.jsonl'),
  studies: path.join(auditRoot, 'file-feature-study.jsonl'),
  renamePlan: path.join(auditRoot, 'rename-placement-plan.csv'),
  mergePlan: path.join(auditRoot, 'merge-plan.jsonl'),
  tests: path.join(auditRoot, 'test-results.jsonl'),
  cleanup: path.join(auditRoot, 'cleanup-plan.csv'),
  baseline: path.join(auditRoot, 'unified-project-baseline.csv'),
  report: path.join(auditRoot, 'FINAL_INTEGRATION_REPORT.md'),
  workspaceReadme: path.join(workspaceRoot, 'README.md'),
};

const EXCLUDED_CATEGORIES = new Set([
  'dependency_cache',
  'source_control_metadata',
  'build_output',
  'agent_workspace',
  'backup_or_archive',
  'library_generated_artifact',
]);

const SECRET_NAMES = new Set([
  '.env', '.env.local', '.env.production', '.npmrc', '.pypirc', 'id_rsa',
]);

const GENERATED_PREFIXES = [
  '_ACTIVE_PROJECT/', '_MERGE_LAB/', '_UNIFIED_PROJECT/', '_EBDESIGN_LIBRARY/',
];

const BATCH_SIZE = Math.max(Number(process.env.UNIFIED_ORCHESTRATOR_BATCH_SIZE) || 5000, 100);
const RUNTIME_OVERLAY_FILES = [
  'backend/src/services/libraryAIWorkspaceService.js',
  'backend/src/routes/libraryAIWorkspaceRoutes.js',
  'tools/codex-unified-project-orchestrator.js',
  'tools/codex-unified-merge-batch.js',
  'tools/codex-library-operational-smoke.js',
  'tools/codex-consolidate-project.js',
  'docs/codex-library-operational-smoke-report.md',
  'docs/codex-library-operational-smoke-report.json',
];

function normalizePath(value) {
  return String(value || '').replace(/\\/g, '/').replace(/^\/+/, '');
}

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        current += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
}

function csvEscape(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function atomicWrite(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const tempPath = `${filePath}.tmp`;
  fs.writeFileSync(tempPath, content);
  fs.renameSync(tempPath, filePath);
}

function sha256File(filePath) {
  const hash = crypto.createHash('sha256');
  hash.update(fs.readFileSync(filePath));
  return hash.digest('hex');
}

function isInside(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function exclusionReason(row) {
  const relativePath = normalizePath(row.relative_path);
  const basename = String(row.basename || '').toLowerCase();
  if (EXCLUDED_CATEGORIES.has(row.category)) return row.category;
  if (SECRET_NAMES.has(basename) || /\.(?:pem|key|pfx|p12)$/i.test(basename)) return 'secret_or_credential';
  if (GENERATED_PREFIXES.some((prefix) => relativePath.startsWith(prefix))) return 'generated_project_artifact';
  if (/(^|\/)node_modules\//i.test(relativePath)) return 'dependency_cache';
  if (/(^|\/)\.git\//.test(relativePath)) return 'source_control_metadata';
  return '';
}

function extractDependencies(preview) {
  const dependencies = new Set();
  const text = String(preview || '').slice(0, 8192);
  const patterns = [
    /\b(?:from|require\s*\()\s*['"]([^'"]+)['"]/g,
    /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
    /\bREFERENCES\s+([a-zA-Z0-9_."]+)/gi,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) && dependencies.size < 30) dependencies.add(match[1]);
  }
  return [...dependencies];
}

function purposeKey(row) {
  return [row.feature_key || 'unknown-feature', row.category || 'uncategorized', row.workflow_role || 'unknown-role'].join('|');
}

function placementFor(row) {
  const feature = String(row.feature_key || 'shared').replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  if (row.category?.startsWith('frontend')) return `frontend/src/features/${feature}`;
  if (row.category?.startsWith('backend')) return `backend/src/features/${feature}`;
  if (row.category === 'database') return `backend/src/database/features/${feature}`;
  if (row.category === 'test') return `tests/${feature}`;
  if (row.category === 'documentation') return `docs/features/${feature}`;
  if (row.category === 'mobile_android') return `mobile/android/features/${feature}`;
  if (row.category === 'desktop_tauri') return `desktop/tauri/features/${feature}`;
  return `shared/features/${feature}`;
}

function canonicalScore(row) {
  let score = 0;
  const rel = normalizePath(row.relative_path);
  if (row.source_role === 'current-primary-project') score += 100;
  if (/^(backend|frontend|database|modules|docs|tools)\//.test(rel)) score += 50;
  if (!/(backup|archive|old|copy|new folder)/i.test(rel)) score += 20;
  if (row.workflow_role === 'runtime-source') score += 15;
  if (row.hash_status === 'hashed') score += 5;
  return score;
}

function safeVariantName(row) {
  const ext = path.extname(row.basename || '');
  const stem = path.basename(row.basename || 'file', ext).replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  const source = String(row.source_label || 'source').replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  const purpose = String(row.feature_key || row.category || 'variant').replace(/[^a-z0-9.-]+/gi, '-').toLowerCase();
  const identity = (row.sha256 || row.library_id || 'unhashed').slice(0, 12).toLowerCase();
  return `${stem}__${purpose}__${source}__${identity}${ext.toLowerCase()}`;
}

function compactRow(row) {
  return {
    library_id: row.library_id,
    source_label: row.source_label,
    source_role: row.source_role,
    absolute_path: row.absolute_path,
    relative_path: normalizePath(row.relative_path),
    basename: row.basename,
    extension: row.extension,
    bytes: Number(row.bytes || 0),
    modified: row.modified,
    category: row.category,
    feature_key: row.feature_key,
    workflow_role: row.workflow_role,
    hash_status: row.hash_status,
    sha256: row.sha256,
    content_summary: row.content_summary,
    dependencies: extractDependencies(row.text_preview),
  };
}

async function scanLibrary() {
  const groups = new Map();
  const stats = {
    totalScanned: 0,
    eligibleFiles: 0,
    excludedFiles: 0,
    excludedByReason: {},
  };
  const studyStream = fs.createWriteStream(outputs.studies);
  const rl = readline.createInterface({ input: fs.createReadStream(indexCsv), crlfDelay: Infinity });
  let headers = null;

  for await (const line of rl) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }
    if (!line.trim()) continue;
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => { row[header] = values[index] ?? ''; });
    stats.totalScanned += 1;
    const reason = exclusionReason(row);
    if (reason) {
      stats.excludedFiles += 1;
      stats.excludedByReason[reason] = (stats.excludedByReason[reason] || 0) + 1;
    } else {
      stats.eligibleFiles += 1;
      const compact = compactRow(row);
      const key = String(compact.basename || '').toLowerCase();
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(compact);
      studyStream.write(`${JSON.stringify({
        ...compact,
        purpose: `${compact.feature_key}; ${compact.category}; ${compact.workflow_role}`,
        placement: placementFor(compact),
        duplicate_group_key: key,
      })}\n`);
    }

    if (stats.totalScanned % BATCH_SIZE === 0) {
      atomicWrite(outputs.progress, `${JSON.stringify({
        phase: 'library_scan',
        processed: stats.totalScanned,
        eligible: stats.eligibleFiles,
        excluded: stats.excludedFiles,
        updated_at: new Date().toISOString(),
      }, null, 2)}\n`);
    }
  }

  await new Promise((resolve, reject) => {
    studyStream.end(resolve);
    studyStream.on('error', reject);
  });
  return { groups, stats };
}

function copyActiveProject() {
  if (!fs.existsSync(activeRoot)) throw new Error(`Missing active project: ${activeRoot}`);
  fs.mkdirSync(unifiedRoot, { recursive: true });
  if (!fs.existsSync(unifiedProjectRoot)) {
    fs.cpSync(activeRoot, unifiedProjectRoot, { recursive: true, errorOnExist: true });
    return 'created-independent-copy';
  }
  return 'existing-copy-preserved';
}

function walkFiles(directory, found = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walkFiles(absolutePath, found);
    else if (entry.isFile()) found.push(absolutePath);
  }
  return found;
}

function createBaseline() {
  const rows = [['relative_path', 'bytes', 'target_sha256', 'source_sha256', 'copy_status']];
  let verified = 0;
  let mismatched = 0;
  let missingFromSource = 0;
  for (const filePath of walkFiles(unifiedProjectRoot)) {
    const relativePath = normalizePath(path.relative(unifiedProjectRoot, filePath));
    const stat = fs.statSync(filePath);
    const targetHash = sha256File(filePath);
    const sourcePath = path.resolve(activeRoot, relativePath);
    let sourceHash = '';
    let copyStatus = 'missing-source';
    if (isInside(activeRoot, sourcePath) && fs.existsSync(sourcePath) && fs.statSync(sourcePath).isFile()) {
      sourceHash = sha256File(sourcePath);
      copyStatus = sourceHash === targetHash ? 'verified-identical' : 'hash-mismatch';
      if (copyStatus === 'verified-identical') verified += 1;
      else mismatched += 1;
    } else {
      missingFromSource += 1;
    }
    rows.push([relativePath, stat.size, targetHash, sourceHash, copyStatus]);
  }
  atomicWrite(outputs.baseline, `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);
  return {
    target_files: rows.length - 1,
    verified_identical: verified,
    hash_mismatches: mismatched,
    missing_from_source: missingFromSource,
    passed: mismatched === 0 && missingFromSource === 0,
  };
}

function syncRuntimeOverlay() {
  if (!fs.existsSync(unifiedProjectRoot)) throw new Error(`Missing unified project: ${unifiedProjectRoot}`);
  const records = [];
  for (const relativePath of RUNTIME_OVERLAY_FILES) {
    const sourcePath = path.resolve(root, relativePath);
    const targetPath = path.resolve(unifiedProjectRoot, relativePath);
    if (!isInside(root, sourcePath) || !isInside(unifiedProjectRoot, targetPath)) {
      throw new Error(`Unsafe runtime overlay path: ${relativePath}`);
    }
    if (!fs.existsSync(sourcePath) || !fs.statSync(sourcePath).isFile()) continue;
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.copyFileSync(sourcePath, targetPath);
    records.push({
      relative_path: normalizePath(relativePath),
      sha256: sha256File(targetPath),
      bytes: fs.statSync(targetPath).size,
      status: 'integrated',
    });
  }
  const manifestPath = path.join(auditRoot, 'runtime-overlay-manifest.json');
  atomicWrite(manifestPath, `${JSON.stringify({
    integrated_at: new Date().toISOString(),
    target: unifiedProjectRoot,
    files: records,
  }, null, 2)}\n`);
  if (fs.existsSync(outputs.summary)) {
    const summary = JSON.parse(fs.readFileSync(outputs.summary, 'utf8'));
    summary.runtime_overlay = {
      integrated_at: new Date().toISOString(),
      files_integrated: records.length,
      manifest: manifestPath,
    };
    atomicWrite(outputs.summary, `${JSON.stringify(summary, null, 2)}\n`);
  }
  return { files_integrated: records.length, manifest: manifestPath };
}

function classifyGroups(groups) {
  const groupStream = fs.createWriteStream(outputs.groups);
  const mergeStream = fs.createWriteStream(outputs.mergePlan);
  const testStream = fs.createWriteStream(outputs.tests);
  const renameRows = [['group_id', 'library_id', 'original_path', 'purpose', 'dependencies', 'proposed_name', 'placement', 'decision', 'confidence', 'rationale', 'status']];
  const cleanupRows = [['group_id', 'library_id', 'original_path', 'sha256', 'action', 'precondition']];
  const counts = {
    duplicateGroups: 0,
    duplicateFiles: 0,
    exactDuplicateGroups: 0,
    divergentGroups: 0,
    purposeConflictGroups: 0,
    filesRenamedAndPlaced: 0,
    redundantCandidatesCollapsed: 0,
    unifiedFilesFrozen: 0,
    mergeTasksQueued: 0,
    placementTasksQueued: 0,
    testCyclesExecuted: 0,
    testPasses: 0,
    testFailures: 0,
  };

  for (const [basename, files] of groups) {
    if (files.length < 2) continue;
    counts.duplicateGroups += 1;
    counts.duplicateFiles += files.length;
    const groupId = `MERGE-${crypto.createHash('sha256').update(basename).digest('hex').slice(0, 16).toUpperCase()}`;
    const knownHashes = new Set(files.map((file) => file.sha256).filter(Boolean));
    const purposes = new Set(files.map(purposeKey));
    const allHashed = files.every((file) => file.hash_status === 'hashed' && file.sha256);
    const exact = allHashed && knownHashes.size === 1;
    const purposeConflict = purposes.size > 1;
    const canonical = [...files].sort((a, b) => canonicalScore(b) - canonicalScore(a) || b.bytes - a.bytes)[0];
    const classification = exact ? 'exact-content-duplicate' : purposeConflict ? 'same-name-different-purpose' : 'same-purpose-different-content';
    const status = exact ? 'frozen-equivalent' : 'queued-for-multi-agent-merge';

    if (exact) {
      counts.exactDuplicateGroups += 1;
      counts.unifiedFilesFrozen += 1;
    } else {
      counts.divergentGroups += 1;
      if (purposeConflict) counts.purposeConflictGroups += 1;
    }

    const groupRecord = {
      group_id: groupId,
      basename,
      classification,
      status,
      file_count: files.length,
      distinct_known_hashes: knownHashes.size,
      distinct_purposes: purposes.size,
      canonical_library_id: canonical.library_id,
      canonical_path: canonical.absolute_path,
      target_placement: placementFor(canonical),
      feature_coverage: [...new Set(files.map((file) => file.feature_key))].sort(),
      dependencies: [...new Set(files.flatMap((file) => file.dependencies))].sort(),
      files,
    };
    groupStream.write(`${JSON.stringify(groupRecord)}\n`);

    if (exact) {
      counts.testCyclesExecuted += 1;
      counts.testPasses += 1;
      testStream.write(`${JSON.stringify({
        group_id: groupId,
        test: 'sha256-content-equivalence',
        status: 'pass',
        evidence: [...knownHashes][0],
        tested_at: new Date().toISOString(),
      })}\n`);
      for (const file of files) {
        if (file.library_id === canonical.library_id) continue;
        cleanupRows.push([
          groupId,
          file.library_id,
          file.absolute_path,
          file.sha256,
          'exclude-from-new-unified-project',
          'canonical hash verified; original source remains untouched',
        ]);
      }
    } else {
      const variantMap = new Map();
      for (const file of files) {
        const identity = `${purposeKey(file)}|${file.sha256 || file.library_id}`;
        if (!variantMap.has(identity)) {
          variantMap.set(identity, { representative: file, aliases: [] });
        } else {
          variantMap.get(identity).aliases.push(file);
          counts.redundantCandidatesCollapsed += 1;
        }
      }

      const candidates = [...variantMap.values()].map(({ representative: file, aliases }) => {
        const proposedName = safeVariantName(file);
        const placement = placementFor(file);
        const decisionConfidence = file.feature_key && !file.feature_key.startsWith('uncategorized')
          && file.category && file.workflow_role ? 'high' : 'review-required';
        const rationale = purposeConflict
          ? 'Same filename has different feature/category/workflow purpose; preserve as a separately named purpose variant.'
          : 'Same filename and purpose has different content; preserve as an implementation variant until feature tests prove a merge.';
        renameRows.push([
          groupId,
          file.library_id,
          file.absolute_path,
          purposeKey(file),
          file.dependencies.join('|'),
          proposedName,
          placement,
          'rename-in-virtual-workspace-only',
          decisionConfidence,
          rationale,
          'virtual-working-copy-ready',
        ]);
        counts.filesRenamedAndPlaced += 1;
        return {
          library_id: file.library_id,
          source: file.absolute_path,
          virtual_working_copy: normalizePath(path.join('merge-workspace', placement, proposedName)),
          expected_sha256: file.sha256 || null,
          purpose: purposeKey(file),
          dependencies: file.dependencies,
          rename_decision: {
            action: 'rename-in-virtual-workspace-only',
            confidence: decisionConfidence,
            rationale,
            physical_source_renamed: false,
          },
          alias_library_ids: aliases.map((alias) => alias.library_id),
          alias_source_paths: aliases.map((alias) => alias.absolute_path),
        };
      });
      const purposeSegments = new Map();
      for (const candidate of candidates) {
        if (!purposeSegments.has(candidate.purpose)) purposeSegments.set(candidate.purpose, []);
        purposeSegments.get(candidate.purpose).push(candidate);
      }
      for (const [purpose, scopedCandidates] of purposeSegments) {
        if (scopedCandidates.length > 1) counts.mergeTasksQueued += 1;
        else counts.placementTasksQueued += 1;
        const purposeId = crypto.createHash('sha256').update(purpose).digest('hex').slice(0, 8).toUpperCase();
        mergeStream.write(`${JSON.stringify({
          group_id: purposeConflict ? `${groupId}-${purposeId}` : groupId,
          parent_group_id: groupId,
          basename,
          purpose_scope: purpose,
          state: scopedCandidates.length > 1 ? 'awaiting-feature-merge' : 'awaiting-placement-validation',
          strategy: scopedCandidates.length > 1 ? 'merge-implementations-within-same-purpose' : 'place-renamed-purpose-variant',
          prohibited_action: 'Do not merge candidates from a different purpose_scope.',
          required_reviewers: ['codex-orchestrator', 'feature-agent', 'test-agent'],
          canonical_candidate: scopedCandidates.find((item) => item.library_id === canonical.library_id)?.library_id
            || scopedCandidates[0].library_id,
          candidates: scopedCandidates,
          acceptance: [
            'purpose scope confirmed from path, feature, category, workflow role, dependencies, and content',
            'all unique behavior mapped to tests',
            'dependencies resolved in canonical project',
            'security and data-boundary checks pass',
            'build and feature tests pass',
            'merge event recorded before freeze',
          ],
        })}\n`);
      }
    }
  }

  groupStream.end();
  mergeStream.end();
  testStream.end();
  atomicWrite(outputs.renamePlan, `${renameRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);
  atomicWrite(outputs.cleanup, `${cleanupRows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`);
  return counts;
}

function writeDocumentation(copyStatus, copyVerification, scanStats, groupStats) {
  const summary = {
    generated_at: new Date().toISOString(),
    mode: 'provider-neutral-multi-agent-orchestrator',
    source_preservation: {
      originals_modified: 0,
      originals_deleted: 0,
      policy: 'Source roots are immutable evidence. Cleanup applies only to the new unified project after validation.',
    },
    project: {
      source: activeRoot,
      target: unifiedProjectRoot,
      copy_status: copyStatus,
      baseline_files: copyVerification.target_files,
      copy_verification: copyVerification,
    },
    scan: scanStats,
    grouping: groupStats,
    state: groupStats.divergentGroups === 0 ? 'fully-frozen' : 'operational-merge-queue-created',
    next_action: 'Process divergent merge tasks in bounded feature batches, test each result, then freeze it.',
    outputs,
  };
  atomicWrite(outputs.summary, `${JSON.stringify(summary, null, 2)}\n`);

  const excludedRows = Object.entries(scanStats.excludedByReason)
    .sort((a, b) => b[1] - a[1])
    .map(([reason, count]) => `| ${reason} | ${count.toLocaleString()} |`)
    .join('\n');

  const report = `# Unified Project Integration Report

Generated: ${summary.generated_at}

## Preservation Guarantee

- Original source roots modified: 0
- Original files deleted: 0
- New independent project: \`_UNIFIED_PROJECT/current\`
- Baseline manifest: \`_UNIFIED_PROJECT/audit/unified-project-baseline.csv\`
- Source-to-target files verified by SHA-256: ${copyVerification.verified_identical.toLocaleString()}
- Copy hash mismatches: ${copyVerification.hash_mismatches.toLocaleString()}
- Target files missing from source baseline: ${copyVerification.missing_from_source.toLocaleString()}

## Scan

- Total Library records scanned: ${scanStats.totalScanned.toLocaleString()}
- Merge-eligible project files studied: ${scanStats.eligibleFiles.toLocaleString()}
- Generated, dependency, backup, build, source-control, or sensitive records excluded from feature merging: ${scanStats.excludedFiles.toLocaleString()}

| Exclusion class | Files |
| --- | ---: |
${excludedRows}

## Grouping And Merge State

- Same-name groups formed: ${groupStats.duplicateGroups.toLocaleString()}
- Files represented in those groups: ${groupStats.duplicateFiles.toLocaleString()}
- Exact-content groups tested and frozen: ${groupStats.exactDuplicateGroups.toLocaleString()}
- Different-content groups queued: ${groupStats.divergentGroups.toLocaleString()}
- Same-name/different-purpose groups: ${groupStats.purposeConflictGroups.toLocaleString()}
- Descriptive virtual renames and placements: ${groupStats.filesRenamedAndPlaced.toLocaleString()}
- Repeated candidate copies collapsed to audited aliases: ${groupStats.redundantCandidatesCollapsed.toLocaleString()}
- Same-purpose implementation merge tasks: ${groupStats.mergeTasksQueued.toLocaleString()}
- Separate-purpose placement-only tasks: ${groupStats.placementTasksQueued.toLocaleString()}
- Test cycles executed: ${groupStats.testCyclesExecuted.toLocaleString()}
- Test passes: ${groupStats.testPasses.toLocaleString()}
- Test failures: ${groupStats.testFailures.toLocaleString()}

## Audit Artifacts

- \`duplicate-groups.jsonl\`: complete group evidence and canonical selection
- \`file-feature-study.jsonl\`: purpose, dependency, placement, and identity for every eligible file
- \`rename-placement-plan.csv\`: non-destructive names for differing files
- \`merge-plan.jsonl\`: bounded multi-agent merge queue
- \`test-results.jsonl\`: reproducible validation results
- \`cleanup-plan.csv\`: exclusions permitted only inside the new unified project

## Freeze Rule

Exact duplicates are frozen by SHA-256 equivalence. Different-content files are not declared merged until their feature tests, project build, security checks, and audit event all pass. This prevents a filename-based merge from losing behavior.
`;
  atomicWrite(outputs.report, report);
  atomicWrite(outputs.workspaceReadme, `# Virtual Merge Workspace

This workspace is represented by Library IDs and immutable source paths in the audit manifests. It avoids duplicating gigabytes of data on a disk with limited free space. Agents must verify each expected SHA-256 before reading a candidate and write merged implementations only to \`_UNIFIED_PROJECT/current\`.
`);
  atomicWrite(outputs.progress, `${JSON.stringify({
    phase: 'prepared',
    state: summary.state,
    processed: scanStats.totalScanned,
    updated_at: new Date().toISOString(),
  }, null, 2)}\n`);
  return summary;
}

async function main() {
  if (process.argv.includes('--sync-runtime')) {
    console.log(JSON.stringify(syncRuntimeOverlay(), null, 2));
    return;
  }
  if (!fs.existsSync(indexCsv)) throw new Error(`Missing enterprise Library index: ${indexCsv}`);
  fs.mkdirSync(auditRoot, { recursive: true });
  fs.mkdirSync(workspaceRoot, { recursive: true });

  const copyStatus = copyActiveProject();
  const copyVerification = createBaseline();
  const { groups, stats } = await scanLibrary();
  const groupStats = classifyGroups(groups);
  const summary = writeDocumentation(copyStatus, copyVerification, stats, groupStats);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
