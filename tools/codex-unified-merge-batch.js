#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const auditRoot = path.join(root, '_UNIFIED_PROJECT', 'audit');
const mergePlanPath = path.join(auditRoot, 'merge-plan.jsonl');
const summaryPath = path.join(auditRoot, 'orchestrator-summary.json');
const reportPath = path.join(auditRoot, 'FINAL_INTEGRATION_REPORT.md');
const validationPath = path.join(auditRoot, 'semantic-validation-results.jsonl');
const assignmentsPath = path.join(auditRoot, 'multi-agent-assignments.jsonl');

const TEXT_EXTENSIONS = new Set([
  '', '.bat', '.c', '.cjs', '.conf', '.cpp', '.cs', '.css', '.csv', '.html',
  '.ini', '.java', '.js', '.jsx', '.json', '.jsonl', '.md', '.mjs', '.ps1',
  '.py', '.rs', '.scss', '.sh', '.sql', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml',
]);
const MAX_FILE_BYTES = Math.max(Number(process.env.UNIFIED_MERGE_MAX_FILE_BYTES) || 2 * 1024 * 1024, 1024);

function hashBuffer(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function stableJson(value) {
  if (Array.isArray(value)) return value.map(stableJson);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, stableJson(value[key])]));
  }
  return value;
}

function normalizedHash(filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_FILE_BYTES || !TEXT_EXTENSIONS.has(extension)) return null;
  const raw = fs.readFileSync(filePath);
  let text = raw.toString('utf8').replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (extension === '.json') {
    try {
      return hashBuffer(Buffer.from(JSON.stringify(stableJson(JSON.parse(text)))));
    } catch {
      // Invalid or fragment JSON is compared as normalized text.
    }
  }
  text = text.split('\n').map((line) => line.replace(/[ \t]+$/g, '')).join('\n').trimEnd();
  return hashBuffer(Buffer.from(text));
}

function verifyCandidate(candidate) {
  if (!fs.existsSync(candidate.source)) return { ok: false, reason: 'missing-source' };
  const stat = fs.statSync(candidate.source);
  if (!stat.isFile()) return { ok: false, reason: 'not-a-file' };
  const raw = fs.readFileSync(candidate.source);
  const actualHash = hashBuffer(raw);
  if (candidate.expected_sha256 && actualHash !== candidate.expected_sha256) {
    return { ok: false, reason: 'source-hash-changed', actualHash };
  }
  return {
    ok: true,
    actualHash,
    normalizedHash: normalizedHash(candidate.source),
    bytes: stat.size,
  };
}

function atomicWrite(filePath, content) {
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, content);
  fs.renameSync(temporary, filePath);
}

async function main() {
  if (!fs.existsSync(mergePlanPath)) throw new Error(`Missing merge plan: ${mergePlanPath}`);
  const validationStream = fs.createWriteStream(validationPath);
  const assignmentStream = fs.createWriteStream(assignmentsPath);
  const rl = readline.createInterface({ input: fs.createReadStream(mergePlanPath), crlfDelay: Infinity });
  const stats = {
    groupsProcessed: 0,
    candidatesVerified: 0,
    candidateFailures: 0,
    semanticEquivalentGroupsFrozen: 0,
    placementOnlyTasksValidated: 0,
    groupsRequiringFeatureMerge: 0,
    unsupportedOrOversizeGroups: 0,
  };

  for await (const line of rl) {
    if (!line.trim()) continue;
    const task = JSON.parse(line);
    stats.groupsProcessed += 1;
    const checks = task.candidates.map((candidate) => ({ candidate, result: verifyCandidate(candidate) }));
    stats.candidatesVerified += checks.filter((check) => check.result.ok).length;
    stats.candidateFailures += checks.filter((check) => !check.result.ok).length;
    const failures = checks.filter((check) => !check.result.ok);
    const normalized = new Set(checks.map((check) => check.result.normalizedHash).filter(Boolean));
    const allNormalizable = failures.length === 0 && checks.every((check) => check.result.normalizedHash);
    const equivalent = allNormalizable && normalized.size === 1;
    const placementOnly = task.state === 'awaiting-placement-validation' && checks.length === 1;
    let status;
    if (placementOnly && failures.length === 0) {
      status = 'placement-validated-no-cross-purpose-merge';
      stats.placementOnlyTasksValidated += 1;
    } else if (equivalent) {
      status = 'frozen-semantic-equivalent';
      stats.semanticEquivalentGroupsFrozen += 1;
    } else if (!allNormalizable && failures.length === 0) {
      status = 'requires-specialized-binary-or-large-file-review';
      stats.unsupportedOrOversizeGroups += 1;
    } else {
      status = 'requires-feature-merge';
      stats.groupsRequiringFeatureMerge += 1;
    }

    validationStream.write(`${JSON.stringify({
      group_id: task.group_id,
      basename: task.basename,
      status,
      test: 'source-hash-and-normalized-semantic-equivalence',
      candidate_count: checks.length,
      candidates_verified: checks.filter((check) => check.result.ok).length,
      failures: failures.map((check) => ({
        library_id: check.candidate.library_id,
        source: check.candidate.source,
        reason: check.result.reason,
      })),
      normalized_hashes: [...normalized],
      tested_at: new Date().toISOString(),
    })}\n`);

    if (!equivalent && !placementOnly) {
      assignmentStream.write(`${JSON.stringify({
        task_id: `TASK-${task.group_id}`,
        group_id: task.group_id,
        basename: task.basename,
        state: 'ready',
        coordinator: 'codex-orchestrator',
        feature_review: 'feature-agent',
        validation: 'test-agent',
        candidates: task.candidates.map((candidate) => candidate.library_id),
        acceptance: task.acceptance,
      })}\n`);
    }
  }

  await Promise.all([
    new Promise((resolve, reject) => { validationStream.end(resolve); validationStream.on('error', reject); }),
    new Promise((resolve, reject) => { assignmentStream.end(resolve); assignmentStream.on('error', reject); }),
  ]);

  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
  summary.semantic_validation = {
    ...stats,
    completed_at: new Date().toISOString(),
    validation_log: validationPath,
    multi_agent_assignments: assignmentsPath,
  };
  summary.state = stats.groupsRequiringFeatureMerge === 0 && stats.unsupportedOrOversizeGroups === 0
    ? 'all-merge-groups-frozen'
    : 'feature-merge-batches-ready';
  summary.next_action = 'Merge assigned groups by feature, add behavior tests, and freeze only passing implementations.';
  atomicWrite(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);

  const section = `
## Semantic Validation Cycle

- Divergent groups processed: ${stats.groupsProcessed.toLocaleString()}
- Candidate files hash-verified: ${stats.candidatesVerified.toLocaleString()}
- Candidate verification failures: ${stats.candidateFailures.toLocaleString()}
- Formatting or JSON-equivalent groups additionally frozen: ${stats.semanticEquivalentGroupsFrozen.toLocaleString()}
- Separate-purpose placement tasks validated without cross-purpose merging: ${stats.placementOnlyTasksValidated.toLocaleString()}
- Groups requiring feature-level merge: ${stats.groupsRequiringFeatureMerge.toLocaleString()}
- Binary or oversized groups requiring specialized review: ${stats.unsupportedOrOversizeGroups.toLocaleString()}
- Multi-agent assignment log: \`_UNIFIED_PROJECT/audit/multi-agent-assignments.jsonl\`
`;
  const report = fs.readFileSync(reportPath, 'utf8').replace(/\n## Semantic Validation Cycle[\s\S]*$/m, '').trimEnd();
  atomicWrite(reportPath, `${report}\n${section}`);
  console.log(JSON.stringify({ ...stats, state: summary.state }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
