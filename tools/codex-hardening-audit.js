#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const root = process.cwd();
const docsDir = path.join(root, 'docs');
const mapCsv = path.join(docsDir, 'codex-file-map.csv');

if (!fs.existsSync(mapCsv)) {
  console.error(`Missing ${mapCsv}. Run tools/codex-project-map.js first.`);
  process.exit(1);
}

const CORE_CATEGORIES = new Set([
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
  'backend_tests',
  'frontend_tests'
]);

const JUNK_CATEGORIES = new Set([
  'dependency_cache',
  'backup_or_archive',
  'agent_workspace_noise',
  'build_output',
  'log_or_report_output',
  'historical_report'
]);

const REVIEW_CATEGORIES = new Set([
  'automation_tooling',
  'data_or_registry',
  'project_documentation',
  'registry_documentation',
  'shared_config_or_manifest',
  'uncategorized'
]);

const SOURCE_EXTS = new Set([
  '.js',
  '.jsx',
  '.ts',
  '.tsx',
  '.mjs',
  '.cjs',
  '.json',
  '.sql',
  '.java',
  '.kt',
  '.rs',
  '.py',
  '.yml',
  '.yaml',
  '.env',
  '.md'
]);

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

async function eachCsvRow(onRow) {
  const stream = fs.createReadStream(mapCsv, { encoding: 'utf8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let idx = null;
  for await (const line of rl) {
    if (!line) continue;
    if (!idx) {
      const header = parseCsvLine(line);
      idx = Object.fromEntries(header.map((name, i) => [name, i]));
      continue;
    }
    const cols = parseCsvLine(line);
    await onRow({
      path: cols[idx.path],
      category: cols[idx.category],
      ext: cols[idx.ext],
      bytes: Number(cols[idx.bytes] || 0),
      modified: cols[idx.modified],
      note: cols[idx.note]
    });
  }
}

function isLikelyGenerated(relativePath) {
  return /(^|[\\/])(node_modules|dist|build|coverage|\.next|\.vite|android[\\/]app[\\/]build|target)([\\/]|$)/i.test(relativePath);
}

function hasSiblingTest(relativePath, allPathSet) {
  const ext = path.extname(relativePath);
  const withoutExt = relativePath.slice(0, -ext.length);
  const candidates = [
    `${withoutExt}.test${ext}`,
    `${withoutExt}.spec${ext}`,
    `${withoutExt}.test.jsx`,
    `${withoutExt}.test.js`,
    `${withoutExt}.spec.jsx`,
    `${withoutExt}.spec.js`,
    `${withoutExt}.test.ts`,
    `${withoutExt}.spec.ts`,
    `${withoutExt}.test.tsx`,
    `${withoutExt}.spec.tsx`
  ];
  return candidates.some((candidate) => allPathSet.has(candidate.replace(/\\/g, '/')));
}

function scanFile(row, allPathSet) {
  const relativePath = row.path.replace(/\\/g, '/');
  const abs = path.join(root, relativePath);
  const issues = [];
  const ext = path.extname(relativePath).toLowerCase();

  if (!SOURCE_EXTS.has(ext)) {
    return issues;
  }

  if (row.bytes > 1024 * 1024) {
    issues.push({
      severity: 'medium',
      code: 'large_core_file',
      message: 'Large core file should be split, generated, or explicitly documented.'
    });
    return issues;
  }

  let content = '';
  try {
    content = fs.readFileSync(abs, 'utf8');
  } catch (error) {
    issues.push({
      severity: 'low',
      code: 'unreadable_file',
      message: `Could not read file during audit: ${error.message}`
    });
    return issues;
  }

  const secretPattern = /\b(api[_-]?key|client[_-]?secret|jwt[_-]?secret|access[_-]?token|refresh[_-]?token|password_hash|password)\b\s*[:=]\s*['"]([^'"]{12,})['"]/gi;
  let secretMatch = secretPattern.exec(content);
  while (secretMatch) {
    const [, key, value] = secretMatch;
    const isTestFixture = /(^|[\\/])(__tests__|tests?|test)([\\/]|$)|\.(test|spec)\./i.test(relativePath);
    const isHumanLabel = /(locales|i18n|translations?)/i.test(relativePath) && /^[\p{L}\p{N}\s?.,'!-]+$/u.test(value);
    if (isHumanLabel) {
      // Translation labels like "Confirm Password" are not secrets.
    } else if (isTestFixture) {
      issues.push({
        severity: 'medium',
        code: 'test_secret_fixture',
        message: `Test fixture contains a ${key} literal. Keep fixtures synthetic and out of production config.`
      });
    } else {
      issues.push({
        severity: 'critical',
        code: 'possible_secret_literal',
        message: `Possible hardcoded ${key} literal. Move to secret manager or environment variable.`
      });
    }
    secretMatch = secretPattern.exec(content);
  }

  const checks = [
    {
      severity: 'high',
      code: 'unsafe_dynamic_execution',
      regex: /\b(eval|Function)\s*\(/,
      message: 'Dynamic code execution found. Replace with explicit parsing or safe dispatch.'
    },
    {
      severity: 'high',
      code: 'raw_html_injection',
      regex: /(dangerouslySetInnerHTML|\.innerHTML\s*=)/,
      message: 'Raw HTML injection surface found. Sanitize input or replace with safe rendering.'
    },
    {
      severity: 'high',
      code: 'sql_interpolation_risk',
      regex: /(pool|client|db|connection)\.query\s*\(\s*`[\s\S]*\$\{/,
      message: 'SQL template interpolation found. Use parameterized queries.'
    },
    {
      severity: 'medium',
      code: 'placeholder_or_todo',
      regex: /\b(TODO|FIXME|stub|placeholder|not implemented|coming soon)\b/i,
      message: 'Placeholder or unfinished implementation marker found.'
    },
    {
      severity: 'medium',
      code: 'localhost_reference',
      regex: /http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i,
      message: 'Localhost URL found. Production builds should use environment configuration.'
    },
    {
      severity: 'low',
      code: 'console_logging',
      regex: /\bconsole\.(log|debug|warn|error)\s*\(/,
      message: 'Console logging found. Route production logs through a structured logger.'
    }
  ];

  checks.forEach((check) => {
    if (check.regex.test(content)) {
      issues.push({
        severity: check.severity,
        code: check.code,
        message: check.message
      });
    }
  });

  if (row.category === 'backend_route' && !/(authMiddleware|authenticate|authorize|requireAuth|verifyToken|jwt|permission|role)/i.test(content)) {
    issues.push({
      severity: 'high',
      code: 'route_auth_not_obvious',
      message: 'Route auth/permission enforcement is not obvious in this file.'
    });
  }

  if (/frontend_(page|component|runtime|state|api_client)/.test(row.category) && /\.(jsx|tsx|js|ts)$/.test(relativePath)) {
    if (!hasSiblingTest(relativePath, allPathSet) && !/(test|spec)\./i.test(relativePath)) {
      issues.push({
        severity: 'low',
        code: 'missing_adjacent_test',
        message: 'No adjacent test file found for this frontend unit.'
      });
    }
  }

  if (/backend_(module|route|service|runtime|middleware)/.test(row.category) && /\.(js|ts)$/.test(relativePath)) {
    if (!hasSiblingTest(relativePath, allPathSet) && !/(test|spec)\./i.test(relativePath)) {
      issues.push({
        severity: 'low',
        code: 'missing_adjacent_test',
        message: 'No adjacent test file found for this backend unit.'
      });
    }
  }

  return issues;
}

function topEntries(map, limit = 20) {
  return [...map.entries()]
    .sort((a, b) => b[1].files - a[1].files || b[1].bytes - a[1].bytes)
    .slice(0, limit);
}

function formatBytes(bytes) {
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit += 1;
  }
  return `${value.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function highestSeverity(issues) {
  if (issues.some((i) => i.severity === 'critical')) return 'critical';
  if (issues.some((i) => i.severity === 'high')) return 'high';
  if (issues.some((i) => i.severity === 'medium')) return 'medium';
  if (issues.some((i) => i.severity === 'low')) return 'low';
  return 'clean';
}

async function main() {
  fs.mkdirSync(docsDir, { recursive: true });

  const allPathSet = new Set();
  const categoryStats = new Map();
  const topLevelStats = new Map();
  const coreRows = [];
  let allFileCount = 0;
  let junkCandidateCount = 0;
  let reviewRequiredCount = 0;

  await eachCsvRow((row) => {
    allFileCount += 1;
    allPathSet.add(row.path.replace(/\\/g, '/'));

    const categoryStat = categoryStats.get(row.category) || { files: 0, bytes: 0 };
    categoryStat.files += 1;
    categoryStat.bytes += row.bytes;
    categoryStats.set(row.category, categoryStat);

    const topLevel = row.path.split(/[\\/]/)[0] || '.';
    const topLevelStat = topLevelStats.get(topLevel) || { files: 0, bytes: 0 };
    topLevelStat.files += 1;
    topLevelStat.bytes += row.bytes;
    topLevelStats.set(topLevel, topLevelStat);

    if (CORE_CATEGORIES.has(row.category)) {
      coreRows.push(row);
    } else if (JUNK_CATEGORIES.has(row.category) || isLikelyGenerated(row.path)) {
      junkCandidateCount += 1;
    } else if (REVIEW_CATEGORIES.has(row.category)) {
      reviewRequiredCount += 1;
    }
  });

  const junkStream = fs.createWriteStream(path.join(docsDir, 'codex-junk-quarantine-manifest.csv'));
  junkStream.write(`${['path', 'category', 'bytes', 'modified', 'reason'].map(csvEscape).join(',')}\n`);
  await eachCsvRow((row) => {
    if (!(JUNK_CATEGORIES.has(row.category) || isLikelyGenerated(row.path))) {
      return;
    }
    junkStream.write(`${[
      row.path,
      row.category,
      row.bytes,
      row.modified,
      JUNK_CATEGORIES.has(row.category) ? `category:${row.category}` : 'generated_or_dependency_path'
    ].map(csvEscape).join(',')}\n`);
  });
  await new Promise((resolve, reject) => {
    junkStream.end(resolve);
    junkStream.on('error', reject);
  });

  const auditRows = [];
  const issueStats = new Map();
  const severityStats = new Map();
  let filesWithIssues = 0;
  let cleanFileCount = 0;

  coreRows.forEach((row) => {
    const issues = scanFile(row, allPathSet);
    issues.forEach((issue) => {
      issueStats.set(issue.code, (issueStats.get(issue.code) || 0) + 1);
      severityStats.set(issue.severity, (severityStats.get(issue.severity) || 0) + 1);
    });
    if (issues.length > 0) {
      filesWithIssues += 1;
    } else {
      cleanFileCount += 1;
    }
    auditRows.push({
      path: row.path,
      category: row.category,
      bytes: row.bytes,
      issue_count: issues.length,
      highest_severity: highestSeverity(issues),
      issue_codes: issues.map((issue) => issue.code),
      issue_messages: issues.map((issue) => issue.message)
    });
  });

  const auditCsv = [
    ['path', 'category', 'bytes', 'issue_count', 'highest_severity', 'issue_codes'].map(csvEscape).join(','),
    ...auditRows.map((row) => [
      row.path,
      row.category,
      row.bytes,
      row.issue_count,
      row.highest_severity,
      row.issue_codes.join(';')
    ].map(csvEscape).join(','))
  ].join('\n');

  const priorityRows = auditRows
    .filter((row) => row.issue_count > 0)
    .sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1, clean: 0 };
      return order[b.highest_severity] - order[a.highest_severity] || b.issue_count - a.issue_count;
    });

  const auditJson = {
    generated_at: new Date().toISOString(),
    totals: {
      all_files: allFileCount,
      core_files: coreRows.length,
      junk_candidate_files: junkCandidateCount,
      review_required_files: reviewRequiredCount,
      audited_core_files: auditRows.length,
      files_with_issues: filesWithIssues,
      clean_files: cleanFileCount
    },
    severities: Object.fromEntries(severityStats),
    issue_types: Object.fromEntries([...issueStats.entries()].sort((a, b) => b[1] - a[1])),
    highest_priority_files: priorityRows.slice(0, 250)
  };

  const hardeningMd = [
  '# Codex Production Hardening Audit',
  '',
  `Generated: ${auditJson.generated_at}`,
  '',
  '## Executive Summary',
  '',
  `- Total repository files in map: ${allFileCount.toLocaleString()}`,
  `- Core/runtime files audited: ${auditRows.length.toLocaleString()}`,
  `- Junk/quarantine candidates identified: ${junkCandidateCount.toLocaleString()}`,
  `- Review-required support files: ${reviewRequiredCount.toLocaleString()}`,
  `- Core files with at least one hardening finding: ${filesWithIssues.toLocaleString()}`,
  '',
  '## Severity Counts',
  '',
  ...['critical', 'high', 'medium', 'low'].map((severity) => `- ${severity}: ${(severityStats.get(severity) || 0).toLocaleString()}`),
  '',
  '## Top Finding Types',
  '',
  ...[...issueStats.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25).map(([code, count]) => `- ${code}: ${count.toLocaleString()}`),
  '',
  '## Highest Priority Files',
  '',
  '| Severity | Issues | Path |',
  '| --- | ---: | --- |',
  ...priorityRows
    .slice(0, 100)
    .map((row) => `| ${row.highest_severity} | ${row.issue_count} | \`${row.path}\` |`),
  '',
  '## Immediate Production Rules',
  '',
  '- Critical findings must block release until secrets/dynamic execution risks are removed.',
  '- High findings need owner review before production exposure, especially route authorization and SQL interpolation risks.',
  '- Medium findings should be folded into the next hardening sprint.',
  '- Low findings are mostly test and logging quality debt; track them continuously instead of treating them as release blockers.',
  '',
  'Detailed machine-readable data is in `docs/codex-production-hardening-audit.json` and `docs/codex-production-hardening-audit.csv`.'
].join('\n');

  const separationMd = [
  '# Codex Junk Separation Plan',
  '',
  `Generated: ${auditJson.generated_at}`,
  '',
  '## Answer',
  '',
  'Yes, this repository contains a very large amount of non-core material. The first pass identifies it as quarantine candidates, not deletion candidates. That distinction matters because dependency folders, generated outputs, backups, and agent workspaces can be removed only after CI can rebuild the project from source.',
  '',
  '## File Buckets',
  '',
  `- Keep and harden: ${coreRows.length.toLocaleString()} core/runtime files`,
  `- Quarantine candidates: ${junkCandidateCount.toLocaleString()} files`,
  `- Human review before moving: ${reviewRequiredCount.toLocaleString()} files`,
  '',
  '## Quarantine Candidate Categories',
  '',
  ...[...categoryStats.entries()]
    .filter(([category]) => JUNK_CATEGORIES.has(category))
    .sort((a, b) => b[1].files - a[1].files)
    .map(([category, stat]) => `- ${category}: ${stat.files.toLocaleString()} files, ${formatBytes(stat.bytes)}`),
  '',
  '## Largest Top-Level Areas',
  '',
  '| Folder | Files | Size |',
  '| --- | ---: | ---: |',
  ...topEntries(topLevelStats, 25).map(([folder, stat]) => `| \`${folder}\` | ${stat.files.toLocaleString()} | ${formatBytes(stat.bytes)} |`),
  '',
  '## Recommended Separation Order',
  '',
  '1. Keep source folders active: `frontend`, `backend`, `modules`, `_SQL_INFRA`, Android wrapper, Tauri wrapper, CI, and documentation that explains current architecture.',
  '2. Convert dependency caches such as `node_modules`, generated build outputs, caches, and logs into rebuild-only artifacts.',
  '3. Move backups, historical reports, and old agent workspaces into a quarantine archive after confirming no runtime imports point into them.',
  '4. Review `automation_tooling`, registries, and uncategorized files before moving because some may encode module metadata or business workflows.',
  '5. Only after a successful clean checkout, install, build, and test should the quarantine folders be deleted or excluded from the main branch.',
  '',
  '## Generated Manifest',
  '',
  'The file `docs/codex-junk-quarantine-manifest.csv` lists every quarantine candidate with path, category, size, modified time, and reason. It is intentionally non-destructive.'
].join('\n');

  fs.writeFileSync(path.join(docsDir, 'codex-production-hardening-audit.csv'), `${auditCsv}\n`);
  fs.writeFileSync(path.join(docsDir, 'codex-production-hardening-audit.json'), `${JSON.stringify(auditJson, null, 2)}\n`);
  fs.writeFileSync(path.join(docsDir, 'codex-production-hardening-audit.md'), `${hardeningMd}\n`);
  fs.writeFileSync(path.join(docsDir, 'codex-junk-separation-plan.md'), `${separationMd}\n`);

  console.log(JSON.stringify(auditJson.totals, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
