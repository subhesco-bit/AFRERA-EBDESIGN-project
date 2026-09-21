#!/usr/bin/env node
/**
 * deep-scan.js — canonical whole-tree inventory for EBDESIGN.
 *
 * Walks every folder and subfolder under the repo root and records one row per
 * file in a single SQLite database. This replaces the ~60 ad-hoc scanner
 * scripts in tools/ that each emitted their own CSV/JSON; everything they
 * reported is derivable from this one database with a query.
 *
 * Dependency trees (node_modules) and git internals are counted for size but
 * not hashed or parsed — they are not ours to clean.
 *
 * Output: .ai/inventory/inventory.db
 * Usage:  node tools/deep-scan.js [--root <dir>] [--out <db>]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(process.argv.includes('--root')
  ? process.argv[process.argv.indexOf('--root') + 1]
  : path.join(__dirname, '..'));

const OUT = path.resolve(process.argv.includes('--out')
  ? process.argv[process.argv.indexOf('--out') + 1]
  : path.join(ROOT, '.ai/inventory/inventory.db'));

/** Directories we count but never descend into for hashing/parsing. */
const OPAQUE_DIRS = new Set(['node_modules', '.git', '.vs', '__pycache__', 'dist', 'build', 'coverage', '.next', '.cache']);

/** Extensions we parse for symbols. */
const JS_EXT = new Set(['.js', '.jsx', '.mjs', '.cjs', '.ts', '.tsx']);
const TEXT_EXT = new Set([...JS_EXT, '.sql', '.json', '.md', '.txt', '.yml', '.yaml', '.css', '.scss', '.html', '.env', '.sh', '.ps1', '.py', '.csv']);

// ---------------------------------------------------------------- schema

fs.mkdirSync(path.dirname(OUT), { recursive: true });
if (fs.existsSync(OUT)) fs.rmSync(OUT);
const db = new DatabaseSync(OUT);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = OFF;

  CREATE TABLE files (
    id        INTEGER PRIMARY KEY,
    path      TEXT NOT NULL UNIQUE,   -- repo-relative, forward slashes
    dir       TEXT NOT NULL,
    name      TEXT NOT NULL,
    ext       TEXT,
    size      INTEGER NOT NULL,
    mtime     INTEGER NOT NULL,
    sha256    TEXT,                   -- null for opaque/binary-skipped
    loc       INTEGER,                -- non-blank lines, text files only
    category  TEXT NOT NULL,          -- source|migration|doc|config|generated|dependency|binary|data
    layer     TEXT,                   -- backend-service|backend-route|frontend-page|...
    module_id TEXT,                   -- M0xx when derivable
    is_stub   INTEGER NOT NULL DEFAULT 0,
    opaque    INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE edges (              -- import / require graph
    src_id   INTEGER NOT NULL,
    kind     TEXT NOT NULL,         -- require|import|dynamic-import
    spec     TEXT NOT NULL,         -- raw specifier as written
    resolved TEXT,                  -- repo-relative path when resolvable
    missing  INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE exports (
    src_id INTEGER NOT NULL,
    name   TEXT NOT NULL,
    kind   TEXT NOT NULL           -- commonjs|named|default
  );

  CREATE TABLE routes (            -- express route declarations
    src_id INTEGER NOT NULL,
    method TEXT NOT NULL,
    route  TEXT NOT NULL
  );

  CREATE TABLE sql_objects (       -- tables/indexes touched by migrations
    src_id INTEGER NOT NULL,
    op     TEXT NOT NULL,          -- create_table|alter_table|create_index
    name   TEXT NOT NULL
  );

  CREATE TABLE api_calls (         -- frontend -> backend endpoint references
    src_id INTEGER NOT NULL,
    url    TEXT NOT NULL
  );

  CREATE TABLE scan_meta (k TEXT PRIMARY KEY, v TEXT);
`);

const insFile = db.prepare(`INSERT INTO files
  (path,dir,name,ext,size,mtime,sha256,loc,category,layer,module_id,is_stub,opaque)
  VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`);
const insEdge = db.prepare(`INSERT INTO edges (src_id,kind,spec,resolved,missing) VALUES (?,?,?,?,?)`);
const insExport = db.prepare(`INSERT INTO exports (src_id,name,kind) VALUES (?,?,?)`);
const insRoute = db.prepare(`INSERT INTO routes (src_id,method,route) VALUES (?,?,?)`);
const insSql = db.prepare(`INSERT INTO sql_objects (src_id,op,name) VALUES (?,?,?)`);
const insApi = db.prepare(`INSERT INTO api_calls (src_id,url) VALUES (?,?)`);
const insMeta = db.prepare(`INSERT OR REPLACE INTO scan_meta (k,v) VALUES (?,?)`);

// ---------------------------------------------------------------- classify

function classify(rel, ext, size) {
  const p = rel.toLowerCase();
  let category = 'data';
  let layer = null;

  if (p.includes('/migrations/') && ext === '.sql') category = 'migration';
  else if (ext === '.md' || ext === '.txt') category = 'doc';
  else if (JS_EXT.has(ext)) category = 'source';
  else if (['.json', '.yml', '.yaml', '.env', '.conf'].includes(ext)) category = 'config';
  else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.pdf', '.ico', '.woff', '.woff2', '.ttf', '.mp4', '.zip'].includes(ext)) category = 'binary';
  else if (ext === '.csv') category = 'generated';

  // Layer assignment is path-driven; these are the real structural buckets.
  if (p.startsWith('backend/src/services/')) layer = 'backend-service';
  else if (p.startsWith('backend/src/routes/')) layer = 'backend-route';
  else if (p.startsWith('backend/src/modules/')) layer = 'backend-module';
  else if (p.startsWith('backend/src/middleware/')) layer = 'backend-middleware';
  else if (p.startsWith('backend/src/database/migrations/')) layer = 'migration';
  else if (p.startsWith('backend/src/database/')) layer = 'backend-database';
  else if (p.startsWith('backend/src/core/')) layer = 'backend-core';
  else if (p.startsWith('backend/src/models/')) layer = 'backend-model';
  else if (p.startsWith('frontend/src/pages/')) layer = 'frontend-page';
  else if (p.startsWith('frontend/src/components/')) layer = 'frontend-component';
  else if (p.startsWith('frontend/src/services/')) layer = 'frontend-service';
  else if (p.startsWith('frontend/src/')) layer = 'frontend-other';
  else if (p.startsWith('_ebdesign_library/')) layer = 'library-card';
  else if (p.startsWith('tools/')) layer = 'tooling';
  else if (p.startsWith('tests/') || p.includes('__tests__') || p.includes('.test.') || p.includes('.spec.')) layer = 'test';
  else if (p.startsWith('.ai/')) layer = 'intelligence';

  // Snapshot copies are duplicates by construction.
  if (p.startsWith('_active_project/') || p.startsWith('_unified_project/current/') || p.startsWith('_merge_lab/') || p.startsWith('new folder/')) {
    layer = 'snapshot-copy';
  }

  const moduleMatch = rel.match(/\b(M\d{3,5})[_/]/i);
  const module_id = moduleMatch ? moduleMatch[1].toUpperCase() : null;

  return { category, layer, module_id };
}

/** A stub is a file too small to hold behaviour, or an explicit placeholder. */
function detectStub(text, size, ext) {
  if (size < 200) return 1;
  if (!text) return 0;
  const body = text.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').trim();
  if (body.length < 150) return 1;
  if (/^\s*(TODO|PLACEHOLDER|NOT IMPLEMENTED|COMING SOON)/im.test(body) && body.length < 400) return 1;
  // A React page that renders only its own name is a scaffold.
  if (JS_EXT.has(ext) && /return\s*\(\s*<div[^>]*>\s*[\w\s]*\s*<\/div>\s*\)/.test(body) && body.length < 500) return 1;
  return 0;
}

// ---------------------------------------------------------------- parse

const RE_REQUIRE = /require\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_IMPORT = /import\s+(?:[\w*\s{},]+\s+from\s+)?['"]([^'"]+)['"]/g;
const RE_DYNIMPORT = /import\(\s*['"]([^'"]+)['"]\s*\)/g;
const RE_ROUTE = /\b(?:router|app)\.(get|post|put|patch|delete|all)\(\s*['"`]([^'"`]+)['"`]/g;
const RE_EXPORT_CJS = /module\.exports\s*=\s*\{([^}]*)\}/;
const RE_EXPORT_NAMED = /export\s+(?:const|function|class|let|var)\s+(\w+)/g;
const RE_EXPORT_DEFAULT = /export\s+default\s+(?:function\s+)?(\w+)?/;
const RE_SQL_CREATE = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([\w.]+)["`']?/gi;
const RE_SQL_ALTER = /ALTER\s+TABLE\s+["`']?([\w.]+)["`']?/gi;
const RE_SQL_INDEX = /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?["`']?([\w.]+)["`']?/gi;
const RE_API_URL = /['"`](\/api\/v\d+\/[^'"`\s?]+)['"`]/g;

/** Resolve a relative specifier the way Node would, against the repo tree. */
function resolveSpec(spec, fromRel) {
  if (!spec.startsWith('.')) return null; // package import, not ours
  const baseDir = path.dirname(path.join(ROOT, fromRel));
  const target = path.resolve(baseDir, spec);
  const candidates = [
    target,
    `${target}.js`, `${target}.jsx`, `${target}.mjs`, `${target}.cjs`,
    `${target}.ts`, `${target}.tsx`, `${target}.json`,
    path.join(target, 'index.js'), path.join(target, 'index.jsx'), path.join(target, 'index.ts'),
  ];
  for (const c of candidates) {
    try {
      if (fs.statSync(c).isFile()) return path.relative(ROOT, c).replace(/\\/g, '/');
    } catch { /* not this candidate */ }
  }
  return null;
}

function collect(re, text, group = 1) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) if (m[group]) out.push(m[group]);
  return out;
}

// ---------------------------------------------------------------- walk

let nFiles = 0, nDirs = 0, nOpaque = 0, bytesOpaque = 0, bytesLive = 0;
const t0 = Date.now();

function walk(absDir) {
  let entries;
  try {
    entries = fs.readdirSync(absDir, { withFileTypes: true });
  } catch {
    return; // unreadable (permissions, locked) — skip rather than abort the scan
  }
  nDirs++;

  for (const e of entries) {
    const abs = path.join(absDir, e.name);
    const rel = path.relative(ROOT, abs).replace(/\\/g, '/');

    if (e.isSymbolicLink()) continue;

    if (e.isDirectory()) {
      if (OPAQUE_DIRS.has(e.name)) {
        const agg = sizeOf(abs);
        nOpaque += agg.count;
        bytesOpaque += agg.bytes;
        recordOpaque(rel, agg);
        continue;
      }
      walk(abs);
      continue;
    }

    if (!e.isFile()) continue;

    let st;
    try { st = fs.statSync(abs); } catch { continue; }

    const ext = path.extname(e.name).toLowerCase();
    const { category, layer, module_id } = classify(rel, ext, st.size);
    bytesLive += st.size;

    // Read text files up to a sane cap; hash everything smaller than 64MB.
    let text = null, sha = null, loc = null;
    const readable = TEXT_EXT.has(ext) && st.size <= 4 * 1024 * 1024;
    try {
      if (st.size <= 64 * 1024 * 1024) {
        const buf = fs.readFileSync(abs);
        sha = crypto.createHash('sha256').update(buf).digest('hex');
        if (readable) {
          text = buf.toString('utf8');
          loc = text.split('\n').filter((l) => l.trim()).length;
        }
      }
    } catch { /* locked or vanished mid-scan */ }

    const is_stub = detectStub(text, st.size, ext);

    const info = insFile.run(rel, path.dirname(rel), e.name, ext, st.size,
      Math.floor(st.mtimeMs), sha, loc, category, layer, module_id, is_stub, 0);
    const id = Number(info.lastInsertRowid);
    nFiles++;

    if (text && JS_EXT.has(ext)) parseJs(id, rel, text);
    else if (text && ext === '.sql') parseSql(id, text);

    if (nFiles % 5000 === 0) {
      process.stderr.write(`  …${nFiles} files, ${nDirs} dirs (${Math.round((Date.now() - t0) / 1000)}s)\n`);
    }
  }
}

function parseJs(id, rel, text) {
  for (const [kind, re] of [['require', RE_REQUIRE], ['import', RE_IMPORT], ['dynamic-import', RE_DYNIMPORT]]) {
    for (const spec of collect(re, text)) {
      const resolved = resolveSpec(spec, rel);
      const missing = spec.startsWith('.') && !resolved ? 1 : 0;
      insEdge.run(id, kind, spec, resolved, missing);
    }
  }

  const cjs = text.match(RE_EXPORT_CJS);
  if (cjs) {
    for (const part of cjs[1].split(',')) {
      const name = part.split(':')[0].trim();
      if (/^\w+$/.test(name)) insExport.run(id, name, 'commonjs');
    }
  }
  for (const name of collect(RE_EXPORT_NAMED, text)) insExport.run(id, name, 'named');
  const def = text.match(RE_EXPORT_DEFAULT);
  if (def) insExport.run(id, def[1] || '(anonymous)', 'default');

  RE_ROUTE.lastIndex = 0;
  let m;
  while ((m = RE_ROUTE.exec(text)) !== null) insRoute.run(id, m[1].toUpperCase(), m[2]);

  for (const url of collect(RE_API_URL, text)) insApi.run(id, url);
}

function parseSql(id, text) {
  for (const n of collect(RE_SQL_CREATE, text)) insSql.run(id, 'create_table', n.toLowerCase());
  for (const n of collect(RE_SQL_ALTER, text)) insSql.run(id, 'alter_table', n.toLowerCase());
  for (const n of collect(RE_SQL_INDEX, text)) insSql.run(id, 'create_index', n.toLowerCase());
}

function recordOpaque(rel, agg) {
  insFile.run(rel, path.dirname(rel), path.basename(rel), null, agg.bytes, 0,
    null, null, 'dependency', 'opaque', null, 0, 1);
}

function sizeOf(absDir) {
  let bytes = 0, count = 0;
  const stack = [absDir];
  while (stack.length) {
    const d = stack.pop();
    let entries;
    try { entries = fs.readdirSync(d, { withFileTypes: true }); } catch { continue; }
    for (const e of entries) {
      const a = path.join(d, e.name);
      if (e.isDirectory()) stack.push(a);
      else if (e.isFile()) {
        count++;
        try { bytes += fs.statSync(a).size; } catch { /* vanished */ }
      }
    }
  }
  return { bytes, count };
}

// ---------------------------------------------------------------- run

process.stderr.write(`Deep scan of ${ROOT}\n`);
db.exec('BEGIN');
walk(ROOT);
db.exec('COMMIT');

db.exec(`
  CREATE INDEX idx_files_sha   ON files(sha256);
  CREATE INDEX idx_files_layer ON files(layer);
  CREATE INDEX idx_files_cat   ON files(category);
  CREATE INDEX idx_edges_src   ON edges(src_id);
  CREATE INDEX idx_edges_res   ON edges(resolved);
  CREATE INDEX idx_routes_src  ON routes(src_id);
`);

const elapsed = Math.round((Date.now() - t0) / 1000);
for (const [k, v] of [
  ['scanned_at', new Date().toISOString()],
  ['root', ROOT],
  ['files_indexed', String(nFiles)],
  ['dirs_walked', String(nDirs)],
  ['opaque_files', String(nOpaque)],
  ['opaque_bytes', String(bytesOpaque)],
  ['live_bytes', String(bytesLive)],
  ['elapsed_sec', String(elapsed)],
]) insMeta.run(k, v);

const q = (sql) => db.prepare(sql).all();
const one = (sql) => db.prepare(sql).get();

process.stdout.write(`
================ DEEP SCAN COMPLETE ================
database    ${path.relative(ROOT, OUT)}
files       ${nFiles.toLocaleString()} indexed  (+${nOpaque.toLocaleString()} in dependency trees)
dirs        ${nDirs.toLocaleString()}
live size   ${(bytesLive / 1048576).toFixed(0)} MB
dep size    ${(bytesOpaque / 1048576).toFixed(0)} MB
elapsed     ${elapsed}s

BY LAYER
${q(`SELECT layer, COUNT(*) n, SUM(is_stub) stubs, SUM(size)/1048576 mb
      FROM files WHERE opaque=0 AND layer IS NOT NULL
      GROUP BY layer ORDER BY n DESC`)
    .map((r) => `  ${String(r.layer).padEnd(22)} ${String(r.n).padStart(6)}  stubs:${String(r.stubs).padStart(5)}  ${r.mb}MB`)
    .join('\n')}

EXACT DUPLICATES (identical sha256, >1 copy)
${(() => {
    const d = one(`SELECT COUNT(*) groups, SUM(c-1) waste, SUM(bytes) bytes FROM
      (SELECT sha256, COUNT(*) c, SUM(size)-MIN(size) bytes FROM files
       WHERE opaque=0 AND sha256 IS NOT NULL GROUP BY sha256 HAVING c>1)`);
    return `  ${d.groups} groups, ${d.waste} redundant copies, ${((d.bytes || 0) / 1048576).toFixed(0)} MB reclaimable`;
  })()}

BROKEN IMPORTS
${(() => {
    const b = one(`SELECT COUNT(*) n FROM edges WHERE missing=1`);
    const f = one(`SELECT COUNT(DISTINCT src_id) n FROM edges WHERE missing=1`);
    return `  ${b.n} unresolved relative imports across ${f.n} files`;
  })()}

SURFACE
  express routes declared   ${one('SELECT COUNT(*) n FROM routes').n}
  distinct sql tables       ${one(`SELECT COUNT(DISTINCT name) n FROM sql_objects WHERE op='create_table'`).n}
  frontend api call sites   ${one('SELECT COUNT(*) n FROM api_calls').n}
====================================================
`);

db.close();
