#!/usr/bin/env node
'use strict';

/**
 * EBDESIGN Complete Library Indexer
 *
 * Purpose:
 *   Build a filesystem-level inventory of every project file and make the
 *   inventory durable, hash-addressable, diffable and AI-consumable.
 *
 * Design rule:
 *   A file is never silently ignored because it is unfamiliar, binary,
 *   generated, legacy, hidden or outside a known module. Every filesystem
 *   file is represented in the manifest. Only .git internals are outside the
 *   project artifact boundary.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, '_EBDESIGN_LIBRARY', '_CONTROL', 'FILE_INDEX');
const JSON_FILE = path.join(OUTPUT_DIR, 'COMPLETE_FILE_INDEX.json');
const CSV_FILE = path.join(OUTPUT_DIR, 'COMPLETE_FILE_INDEX.csv');
const SUMMARY_FILE = path.join(OUTPUT_DIR, 'LIBRARY_INDEX_SUMMARY.json');

const HASH_BUFFER = 1024 * 1024;
const TEXT_LINE_LIMIT = 5 * 1024 * 1024;
const EXCLUDED_ROOTS = new Set(['.git']);
const SECRET_NAME_RE = /(^|[._-])(env|secret|secrets|credential|credentials|private|key)([._-]|$)/i;
const GENERATED_NAME_RE = /(^|[._-])(dist|build|coverage|tmp|temp|cache|generated)([._-]|$)/i;
const VENDOR_PARTS = new Set(['node_modules', 'vendor', 'bower_components']);

const EXTENSIONS = new Map([
  ['.js', 'javascript'], ['.jsx', 'javascript-react'], ['.ts', 'typescript'], ['.tsx', 'typescript-react'],
  ['.mjs', 'javascript-module'], ['.cjs', 'javascript-commonjs'], ['.json', 'json'], ['.md', 'markdown'],
  ['.mdx', 'markdown-react'], ['.txt', 'text'], ['.csv', 'csv'], ['.xml', 'xml'], ['.yaml', 'yaml'],
  ['.yml', 'yaml'], ['.sql', 'sql'], ['.sh', 'shell'], ['.ps1', 'powershell'], ['.bat', 'batch'],
  ['.css', 'css'], ['.scss', 'scss'], ['.html', 'html'], ['.htm', 'html'], ['.vue', 'vue'], ['.graphql', 'graphql'],
  ['.gql', 'graphql'], ['.prisma', 'prisma'], ['.py', 'python'], ['.java', 'java'], ['.go', 'go'],
  ['.rs', 'rust'], ['.rb', 'ruby'], ['.php', 'php'], ['.c', 'c'], ['.cpp', 'cpp'], ['.h', 'c-header'],
  ['.hpp', 'cpp-header'], ['.lock', 'lockfile'], ['.dockerfile', 'dockerfile'], ['.toml', 'toml'],
]);

function normalize(p) {
  return p.split(path.sep).join('/');
}

function relative(p) {
  return normalize(path.relative(ROOT, p));
}

function categoryFor(rel, stat) {
  const parts = rel.split('/');
  const lower = rel.toLowerCase();
  if (parts.includes('node_modules') || parts.includes('vendor') || parts.includes('bower_components')) return 'vendor';
  if (lower.includes('/backup') || lower.startsWith('backup')) return 'backup';
  if (lower.includes('/test') || lower.includes('/tests') || /(^|[/_-])test[s]?([/_-]|$)/.test(lower)) return 'test';
  if (lower.startsWith('.ai/') || lower === '.ai') return 'ai-governance';
  if (lower.includes('_ebdesign_library')) return 'library';
  if (lower.includes('/backend/') || lower.startsWith('backend/')) return 'backend';
  if (lower.includes('/frontend/') || lower.startsWith('frontend/') || lower.includes('/src/pages/')) return 'frontend';
  if (lower.includes('/database/') || lower.includes('migration') || lower.endsWith('.sql')) return 'database';
  if (lower.includes('/docs/') || lower.endsWith('.md')) return 'documentation';
  if (stat.isSymbolicLink()) return 'symlink';
  return 'project';
}

function contentType(rel) {
  const base = path.basename(rel).toLowerCase();
  if (base === 'dockerfile') return 'dockerfile';
  return EXTENSIONS.get(path.extname(base)) || 'binary-or-unknown';
}

function isTextType(type) {
  return !['binary-or-unknown'].includes(type);
}

function hashFile(file) {
  const hash = crypto.createHash('sha256');
  const fd = fs.openSync(file, 'r');
  const buffer = Buffer.allocUnsafe(HASH_BUFFER);
  try {
    let bytesRead = 0;
    let total = 0;
    do {
      bytesRead = fs.readSync(fd, buffer, 0, buffer.length, total);
      if (bytesRead > 0) hash.update(buffer.subarray(0, bytesRead));
      total += bytesRead;
    } while (bytesRead > 0);
    return { sha256: hash.digest('hex'), bytes: total };
  } finally {
    fs.closeSync(fd);
  }
}

function countLines(file, size, type) {
  if (!isTextType(type) || size > TEXT_LINE_LIMIT) return null;
  try {
    const data = fs.readFileSync(file, 'utf8');
    if (data.includes('\u0000')) return null;
    return data.length === 0 ? 0 : data.split(/\r\n|\n|\r/).length;
  } catch (_) {
    return null;
  }
}

function walk(dir, records, errors) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (error) {
    errors.push({ path: relative(dir), error: error.message });
    return;
  }

  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    const rel = relative(full);
    if (!rel) continue;
    const first = rel.split('/')[0];
    if (EXCLUDED_ROOTS.has(first)) continue;

    let stat;
    try {
      stat = fs.lstatSync(full);
    } catch (error) {
      errors.push({ path: rel, error: error.message });
      continue;
    }

    if (stat.isDirectory()) {
      walk(full, records, errors);
      continue;
    }

    const record = {
      library_item_id: 'LIB-' + crypto.createHash('sha1').update(rel).digest('hex').slice(0, 16).toUpperCase(),
      path: rel,
      name: entry.name,
      parent: normalize(path.dirname(rel)),
      extension: path.extname(entry.name).toLowerCase(),
      content_type: contentType(rel),
      category: categoryFor(rel, stat),
      bytes: Number(stat.size),
      modified_at: stat.mtime.toISOString(),
      created_at: stat.birthtime.toISOString(),
      mode: (stat.mode & 0o777).toString(8),
      hidden: entry.name.startsWith('.'),
      vendor_or_dependency: rel.split('/').some(p => VENDOR_PARTS.has(p)),
      generated_candidate: GENERATED_NAME_RE.test(entry.name) || rel.split('/').some(p => GENERATED_NAME_RE.test(p)),
      secret_name_candidate: SECRET_NAME_RE.test(entry.name),
      symlink: stat.isSymbolicLink(),
      status: 'DISCOVERED',
      previous_status: null,
      sha256: null,
      line_count: null,
      hash_error: null,
    };

    if (stat.isSymbolicLink()) {
      try { record.link_target = fs.readlinkSync(full); } catch (error) { record.link_target_error = error.message; }
      record.status = 'INDEXED';
    } else {
      try {
        const result = hashFile(full);
        record.sha256 = result.sha256;
        record.bytes = result.bytes;
        record.line_count = countLines(full, record.bytes, record.content_type);
        record.status = 'INDEXED';
      } catch (error) {
        record.hash_error = error.message;
        record.status = 'INDEX_ERROR';
      }
    }

    records.push(record);
  }
}

function loadPrevious() {
  try {
    const previous = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    return new Map((previous.files || []).map(file => [file.path, file]));
  } catch (_) {
    return new Map();
  }
}

function classifyChanges(records, previous) {
  const current = new Set(records.map(r => r.path));
  for (const record of records) {
    const old = previous.get(record.path);
    if (!old) {
      record.change_state = 'ADDED';
      record.previous_sha256 = null;
      continue;
    }
    record.previous_sha256 = old.sha256 || null;
    record.change_state = old.sha256 === record.sha256 && old.bytes === record.bytes ? 'UNCHANGED' : 'MODIFIED';
    record.previous_status = old.status || null;
  }
  const deleted = [];
  for (const [filePath, old] of previous.entries()) {
    if (!current.has(filePath)) {
      deleted.push({ ...old, change_state: 'DELETED', status: 'MISSING_FROM_CURRENT_SCAN' });
    }
  }
  return deleted;
}

function csvEscape(value) {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\n\r]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
}

function writeCsv(records) {
  const columns = ['library_item_id','path','name','parent','extension','content_type','category','bytes','modified_at','created_at','mode','hidden','vendor_or_dependency','generated_candidate','secret_name_candidate','symlink','link_target','status','change_state','previous_sha256','sha256','line_count','hash_error'];
  const lines = [columns.join(',')];
  for (const record of records) lines.push(columns.map(c => csvEscape(record[c])).join(','));
  fs.writeFileSync(CSV_FILE, lines.join('\n') + '\n', 'utf8');
}

function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  const started = new Date();
  const records = [];
  const errors = [];
  const previous = loadPrevious();
  walk(ROOT, records, errors);
  records.sort((a, b) => a.path.localeCompare(b.path));
  const deleted = classifyChanges(records, previous);
  const allRecords = records.concat(deleted).sort((a, b) => a.path.localeCompare(b.path));

  const summary = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    started_at: started.toISOString(),
    repository_root: ROOT,
    scan_boundary: 'ENTIRE_PROJECT_FILESYSTEM_EXCEPT_.git_INTERNALS',
    excluded_roots: ['.git'],
    files_currently_present: records.length,
    files_indexed_successfully: records.filter(r => r.status === 'INDEXED').length,
    files_with_index_errors: records.filter(r => r.status === 'INDEX_ERROR').length,
    deleted_since_previous_scan: deleted.length,
    added_since_previous_scan: records.filter(r => r.change_state === 'ADDED').length,
    modified_since_previous_scan: records.filter(r => r.change_state === 'MODIFIED').length,
    unchanged_since_previous_scan: records.filter(r => r.change_state === 'UNCHANGED').length,
    total_bytes: records.reduce((n, r) => n + Number(r.bytes || 0), 0),
    errors,
    completeness_rule: errors.length === 0 && records.every(r => ['INDEXED'].includes(r.status)) ? 'PASS' : 'REVIEW_REQUIRED',
  };

  const manifest = {
    schema_version: '1.0.0',
    generated_at: summary.generated_at,
    completeness: summary.completeness_rule,
    summary,
    files: allRecords,
  };

  fs.writeFileSync(JSON_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  writeCsv(allRecords);
  fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2) + '\n', 'utf8');

  console.log(JSON.stringify({
    ok: summary.completeness_rule === 'PASS',
    ...summary,
    outputs: [relative(JSON_FILE), relative(CSV_FILE), relative(SUMMARY_FILE)],
  }, null, 2));

  if (summary.completeness_rule !== 'PASS') process.exitCode = 2;
}

main();
