'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const projectRoot = path.resolve(__dirname, '../../..');
const discoveryIndexRoot = path.join(projectRoot, '_EBDESIGN_LIBRARY', '25_DISCOVERY_INDEX');
const filesCsvPath = path.join(discoveryIndexRoot, 'enterprise-project-library-files.csv');
const summaryPath = path.join(discoveryIndexRoot, 'enterprise-project-library-summary.json');
const activitySummaryPath = path.join(discoveryIndexRoot, 'enterprise-file-activity-summary.json');
const activityLatestPath = path.join(discoveryIndexRoot, 'enterprise-file-activity-latest.json');
const workflowPath = path.join(discoveryIndexRoot, 'enterprise-project-workflow-ai.md');
const aiWorkflowPath = path.join(projectRoot, 'docs', 'codex-library-ai-workflow.md');
const aiDatabasePath = path.join(projectRoot, 'docs', 'codex-library-ai-database-recordkeeping.md');
const workspaceRunsPath = path.join(discoveryIndexRoot, 'library-ai-workspace-runs.jsonl');
const workspaceEventsPath = path.join(discoveryIndexRoot, 'library-ai-workspace-events.jsonl');
const unifiedAuditRoot = path.join(projectRoot, '_UNIFIED_PROJECT', 'audit');
const unifiedSummaryPath = path.join(unifiedAuditRoot, 'orchestrator-summary.json');
const unifiedGroupsPath = path.join(unifiedAuditRoot, 'duplicate-groups.jsonl');
const unifiedAssignmentsPath = path.join(unifiedAuditRoot, 'multi-agent-assignments.jsonl');

const TEXT_EXTENSIONS = new Set([
  '[none]', '.bat', '.c', '.cjs', '.conf', '.cpp', '.cs', '.css', '.csv', '.html',
  '.ini', '.java', '.js', '.jsx', '.json', '.jsonl', '.md', '.mjs', '.ps1', '.py',
  '.rs', '.scss', '.sh', '.sql', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml',
]);

const DENIED_BASENAMES = new Set([
  '.env', '.env.local', '.env.production', '.npmrc', '.pypirc', 'id_rsa',
]);

const DENIED_CATEGORIES = new Set([
  'dependency_cache',
  'source_control_metadata',
  'build_output',
]);

const DEFAULT_EXCLUDED_SEARCH_CATEGORIES = new Set([
  'dependency_cache',
  'source_control_metadata',
  'build_output',
  'agent_workspace',
  'backup_or_archive',
  'library_generated_artifact',
]);

function parseCsvLine(line) {
  const values = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (quoted) {
      if (char === '"' && next === '"') {
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

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return fallback;
  }
}

function readText(filePath, fallback = '') {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return fallback;
  }
}

function normalize(value) {
  return String(value || '').trim().toLowerCase();
}

function matchesFilters(row, filters) {
  if (!filters.includeAll && DEFAULT_EXCLUDED_SEARCH_CATEGORIES.has(row.category)) return false;
  if (!filters.includeBackups && row.source_role === 'local-backup-source') return false;
  if (!filters.includeAgentWorkspaces && row.category === 'agent_workspace') return false;
  for (const key of ['source_label', 'category', 'feature_key', 'workflow_role', 'file_type']) {
    if (filters[key] && normalize(row[key]) !== normalize(filters[key])) return false;
  }
  return true;
}

function scoreRow(row, query) {
  if (!query) return 1;
  const q = normalize(query);
  const tokens = q.split(/[^a-z0-9_.-]+/).filter((token) => token.length > 1);
  const fields = [
    row.library_id,
    row.basename,
    row.relative_path,
    row.file_type,
    row.category,
    row.feature_key,
    row.workflow_role,
    row.content_summary,
    row.text_preview,
  ].map(normalize);

  let score = 0;
  if (row.source_role === 'current-primary-project') score += 4;
  if (['backend_route', 'backend_service', 'frontend_api_client', 'frontend_page', 'frontend_component'].includes(row.category)) score += 4;
  if (row.relative_path?.startsWith('_MERGE_LAB/')) score -= 3;
  if (row.category === 'documentation') score -= 1;
  fields.forEach((field, index) => {
    if (!field) return;
    if (field === q) score += 20 - index;
    else if (field.includes(q)) score += 10 - Math.min(index, 7);
    for (const token of tokens) {
      if (field === token) score += 6;
      else if (field.includes(token)) score += 2;
    }
  });
  return score;
}

async function streamCsvRows(onRow) {
  if (!fs.existsSync(filesCsvPath)) return;

  const rl = readline.createInterface({
    input: fs.createReadStream(filesCsvPath),
    crlfDelay: Infinity,
  });

  let headers = null;
  for await (const line of rl) {
    if (!headers) {
      headers = parseCsvLine(line);
      continue;
    }

    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] ?? '';
    });

    const shouldStop = await onRow(row);
    if (shouldStop) {
      rl.close();
      break;
    }
  }
}

async function searchFiles(options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const query = String(options.query || options.q || '');
  const filters = {
    source_label: options.source_label || options.sourceLabel,
    category: options.category,
    feature_key: options.feature_key || options.featureKey,
    workflow_role: options.workflow_role || options.workflowRole,
    file_type: options.file_type || options.fileType,
    includeAll: options.includeAll === true || options.includeAll === 'true',
    includeBackups: options.includeBackups === true || options.includeBackups === 'true',
    includeAgentWorkspaces: options.includeAgentWorkspaces === true || options.includeAgentWorkspaces === 'true',
  };

  const matches = [];
  await streamCsvRows((row) => {
    if (!matchesFilters(row, filters)) return false;
    const score = scoreRow(row, query);
    if (query && score <= 0) return false;

    matches.push({ ...row, relevance_score: score });
    matches.sort((a, b) => b.relevance_score - a.relevance_score);
    if (matches.length > limit) matches.length = limit;
    return false;
  });

  return matches;
}

async function findByLibraryId(libraryId) {
  const requestedId = normalize(libraryId);
  let found = null;
  await streamCsvRows((row) => {
    if (normalize(row.library_id) === requestedId) {
      found = row;
      return true;
    }
    return false;
  });
  return found;
}

function isSafeReadable(row) {
  const basename = normalize(row.basename);
  const extension = row.extension || '[none]';

  if (!row.absolute_path) return false;
  if (DENIED_BASENAMES.has(basename)) return false;
  if (basename.endsWith('.key') || basename.endsWith('.pem') || basename.endsWith('.pfx')) return false;
  if (DENIED_CATEGORIES.has(row.category)) return false;
  if (!TEXT_EXTENSIONS.has(extension)) return false;
  return true;
}

async function readFileContent(libraryId, options = {}) {
  const row = await findByLibraryId(libraryId);
  if (!row) {
    return { found: false, readable: false, reason: 'library_id_not_found' };
  }

  if (!isSafeReadable(row)) {
    return { found: true, readable: false, reason: 'file_not_safe_for_content_access', file: row };
  }

  const maxBytes = Math.min(Math.max(Number(options.maxBytes) || 12000, 1), 50000);
  let fd = null;
  try {
    const stat = fs.statSync(row.absolute_path);
    fd = fs.openSync(row.absolute_path, 'r');
    const buffer = Buffer.alloc(Math.min(stat.size, maxBytes));
    const bytesRead = fs.readSync(fd, buffer, 0, buffer.length, 0);
    return {
      found: true,
      readable: true,
      truncated: stat.size > bytesRead,
      bytesRead,
      file: row,
      content: buffer.subarray(0, bytesRead).toString('utf8'),
    };
  } catch (error) {
    return { found: true, readable: false, reason: error.message, file: row };
  } finally {
    if (fd !== null) fs.closeSync(fd);
  }
}

function appendJsonLine(filePath, record) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${JSON.stringify(record)}\n`);
}

function makeRunId() {
  return `LIBAI-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
}

async function buildWorkspace(options = {}) {
  const startedAt = Date.now();
  const agent = options.agent || options.agentType || 'coding-agent';
  const objective = options.objective || 'Project improvement using EBDESIGN Library';
  const query = options.query || options.featureKey || objective;
  const files = await searchFiles({
    query,
    featureKey: options.featureKey,
    category: options.category,
    workflowRole: options.workflowRole,
    fileType: options.fileType,
    limit: options.limit || 20,
  });
  const summary = readJson(summaryPath, { totals: { files: 0 }, roots: [] });
  const activity = readJson(activitySummaryPath, { eventsRecordedThisRun: 0, eventCounts: {} });
  const latest = readJson(activityLatestPath, { events: [] });
  const runId = makeRunId();

  const workspace = {
    run_id: runId,
    mode: 'library-ai-workspace',
    agent,
    objective,
    query,
    created_at: new Date().toISOString(),
    library_contract: {
      source_of_truth: filesCsvPath,
      total_indexed_files: summary.totals?.files || 0,
      activity_snapshot_files: activity.filesInCurrentSnapshot || 0,
      last_activity_events: activity.eventsRecordedThisRun || 0,
      required_agent_loop: [
        'search_library',
        'inspect_file_records',
        'read_safe_content_only_when_needed',
        'check_activity_ledger',
        'plan_merge_or_improvement',
        'edit_project_files',
        'run_tests_or_build',
        'regenerate_index',
        'run_activity_tracker',
        'refresh_active_project',
      ],
    },
    retrieved_files: files,
    recent_activity: (latest.events || []).slice(0, 20),
    workflow_markdown: readText(workflowPath).slice(0, 12000),
    ai_workflow_markdown: readText(aiWorkflowPath).slice(0, 12000),
    database_recordkeeping_markdown: readText(aiDatabasePath).slice(0, 12000),
    guardrails: {
      noBlindMergeByName: true,
      duplicateNamesRequireHashOrPurposeReview: true,
      contentAccessIsBounded: true,
      secretsAndDependencyCachesDenied: true,
      everyAgentActionMustBeRecorded: true,
    },
    response_speed_strategy: [
      'Use summary artifacts for dashboards.',
      'Use bounded CSV streaming for file lookup.',
      'Use library_id before reading any file.',
      'Use activity ledger instead of rescanning everything for every request.',
      'Send only top retrieved snippets into AI or coding agents.',
    ],
  };

  appendJsonLine(workspaceRunsPath, {
    run_id: runId,
    agent,
    objective,
    query,
    retrieved_file_count: files.length,
    started_at: new Date(startedAt).toISOString(),
    completed_at: new Date().toISOString(),
    latency_ms: Date.now() - startedAt,
    status: 'completed',
  });

  return workspace;
}

function recordAgentEvent(event = {}) {
  const record = {
    event_id: makeRunId(),
    event_type: event.eventType || event.event_type || 'agent_library_event',
    observed_at: new Date().toISOString(),
    agent: event.agent || 'coding-agent',
    objective: event.objective || '',
    library_ids: Array.isArray(event.libraryIds) ? event.libraryIds : [],
    files: Array.isArray(event.files) ? event.files : [],
    outcome: event.outcome || '',
    metadata: event.metadata || {},
  };
  appendJsonLine(workspaceEventsPath, record);
  return record;
}

function getStatus() {
  const summary = readJson(summaryPath, { totals: { files: 0 }, roots: [] });
  const activity = readJson(activitySummaryPath, { filesInCurrentSnapshot: 0, eventsRecordedThisRun: 0 });

  return {
    status: 'operational',
    module: 'library-ai-workspace',
    providerNeutral: true,
    liveProviderKeyRequired: false,
    supportedAgents: ['chatgpt-codex', 'claude', 'copilot', 'devin', 'visual-studio-agent', 'human-reviewer'],
    indexedFiles: summary.totals?.files || 0,
    featureTracks: summary.featureTracks || Object.keys(summary.byFeature || {}).length,
    activitySnapshotFiles: activity.filesInCurrentSnapshot || 0,
    lastActivityEvents: activity.eventsRecordedThisRun || 0,
    endpoints: [
      'GET /status',
      'GET /files/search',
      'GET /files/:libraryId',
      'GET /files/:libraryId/content',
      'POST /context',
      'POST /improvement-workspace',
      'POST /events',
      'GET /orchestrator/status',
      'GET /orchestrator/groups/search',
      'GET /orchestrator/tasks',
    ],
  };
}

function getOrchestratorStatus() {
  const summary = readJson(unifiedSummaryPath, null);
  if (!summary) {
    return {
      status: 'not_prepared',
      sourcePreserved: true,
      message: 'Run tools/codex-unified-project-orchestrator.js to prepare the unified project.',
    };
  }
  return {
    status: summary.state,
    sourcePreserved: summary.source_preservation?.originals_modified === 0
      && summary.source_preservation?.originals_deleted === 0,
    ...summary,
  };
}

async function searchOrchestratorGroups(options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const query = normalize(options.query || options.q || '');
  const classification = normalize(options.classification || '');
  const status = normalize(options.status || '');
  const rows = [];
  if (!fs.existsSync(unifiedGroupsPath)) return rows;

  const rl = readline.createInterface({
    input: fs.createReadStream(unifiedGroupsPath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let group;
    try {
      group = JSON.parse(line);
    } catch {
      continue;
    }
    if (classification && normalize(group.classification) !== classification) continue;
    if (status && normalize(group.status) !== status) continue;
    const haystack = normalize([
      group.group_id,
      group.basename,
      group.classification,
      group.status,
      ...(group.feature_coverage || []),
      ...(group.dependencies || []),
    ].join(' '));
    if (query && !haystack.includes(query)) continue;
    rows.push({
      group_id: group.group_id,
      basename: group.basename,
      classification: group.classification,
      status: group.status,
      file_count: group.file_count,
      distinct_known_hashes: group.distinct_known_hashes,
      distinct_purposes: group.distinct_purposes,
      canonical_library_id: group.canonical_library_id,
      target_placement: group.target_placement,
      feature_coverage: group.feature_coverage,
      dependencies: group.dependencies,
    });
    if (rows.length >= limit) break;
  }
  return rows;
}

async function searchOrchestratorAssignments(options = {}) {
  const limit = Math.min(Math.max(Number(options.limit) || 20, 1), 100);
  const query = normalize(options.query || options.q || '');
  const state = normalize(options.state || '');
  const rows = [];
  if (!fs.existsSync(unifiedAssignmentsPath)) return rows;

  const rl = readline.createInterface({
    input: fs.createReadStream(unifiedAssignmentsPath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (!line.trim()) continue;
    let task;
    try {
      task = JSON.parse(line);
    } catch {
      continue;
    }
    if (state && normalize(task.state) !== state) continue;
    const haystack = normalize([task.task_id, task.group_id, task.basename, ...(task.candidates || [])].join(' '));
    if (query && !haystack.includes(query)) continue;
    rows.push(task);
    if (rows.length >= limit) break;
  }
  return rows;
}

module.exports = {
  getStatus,
  searchFiles,
  findByLibraryId,
  readFileContent,
  buildWorkspace,
  recordAgentEvent,
  getOrchestratorStatus,
  searchOrchestratorGroups,
  searchOrchestratorAssignments,
};
