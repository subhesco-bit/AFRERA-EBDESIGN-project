#!/usr/bin/env node
'use strict';

/**
 * EBDESIGN Library Control Plane
 *
 * One non-destructive pass over the repository. It inventories files and
 * frontend pages, computes content identity, builds file/module/page links,
 * and emits a machine-readable control manifest for subsequent hardening.
 *
 * Design rule: discover first, classify second, change nothing implicitly.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '_EBDESIGN_LIBRARY', '_CONTROL', 'UNIFIED_INDEX');
const IGNORED = new Set(['.git']);
const PAGE_EXT = new Set(['.jsx', '.tsx', '.vue', '.svelte', '.html']);
const SOURCE_EXT = new Set(['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.vue', '.svelte', '.py', '.java', '.go', '.rb', '.php']);

function walk(dir, out = []) {
  let entries;
  try { entries = fs.readdirSync(dir, { withFileTypes: true }); }
  catch (error) { out.push({ error: error.message, path: dir }); return out; }
  for (const entry of entries) {
    if (IGNORED.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else out.push(full);
  }
  return out;
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  const stream = fs.createReadStream(file);
  return new Promise((resolve, reject) => {
    stream.on('data', chunk => hash.update(chunk));
    stream.on('error', reject);
    stream.on('end', () => resolve(hash.digest('hex')));
  });
}

function idFor(relative, hash) {
  return `LIB-${crypto.createHash('sha256').update(`${relative}:${hash}`).digest('hex').slice(0, 20).toUpperCase()}`;
}

function classify(relative) {
  const p = relative.replace(/\\/g, '/');
  const ext = path.extname(p).toLowerCase();
  const name = path.basename(p).toLowerCase();
  const page = PAGE_EXT.has(ext) && /(page|pages|screen|view|route|app|component|ui)/i.test(p);
  const source = SOURCE_EXT.has(ext);
  let type = 'other';
  if (page) type = 'frontend-page';
  else if (source) type = 'source';
  else if (['.json', '.yaml', '.yml', '.toml'].includes(ext)) type = 'configuration';
  else if (['.sql'].includes(ext)) type = 'database';
  else if (['.md', '.mdx', '.txt'].includes(ext)) type = 'documentation';
  else if (['.css', '.scss', '.less'].includes(ext)) type = 'frontend-style';
  else if (['.png', '.jpg', '.jpeg', '.webp', '.svg', '.gif', '.ico'].includes(ext)) type = 'asset';
  else if (name.includes('test') || name.includes('spec')) type = 'test';
  return { type, extension: ext || null };
}

function moduleHint(relative) {
  const m = relative.match(/(?:^|[\\/])(M\d{3,4})(?:[\\/]|$)/i);
  return m ? m[1].toUpperCase() : null;
}

function pageKey(relative) {
  const normalized = relative.replace(/\\/g, '/');
  if (!PAGE_EXT.has(path.extname(normalized).toLowerCase())) return null;
  return normalized.replace(/\.(jsx|tsx|vue|svelte|html)$/i, '');
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const physical = walk(ROOT).filter(v => typeof v === 'string');
  const errors = physical.filter(v => !fs.existsSync(v));
  const files = [];

  for (const full of physical) {
    try {
      const stat = fs.statSync(full);
      if (!stat.isFile()) continue;
      const relative = path.relative(ROOT, full).replace(/\\/g, '/');
      const hash = await sha256(full);
      const classification = classify(relative);
      files.push({
        libraryItemId: idFor(relative, hash),
        path: relative,
        name: path.basename(full),
        parent: path.dirname(relative).replace(/\\/g, '/'),
        bytes: stat.size,
        modifiedAt: stat.mtime.toISOString(),
        createdAt: stat.birthtime.toISOString(),
        sha256: hash,
        module: moduleHint(relative),
        pageKey: pageKey(relative),
        ...classification
      });
    } catch (error) {
      errors.push({ path: path.relative(ROOT, full).replace(/\\/g, '/'), error: error.message });
    }
  }

  const pages = files.filter(f => f.type === 'frontend-page');
  const modules = new Map();
  for (const file of files) {
    if (!file.module) continue;
    if (!modules.has(file.module)) modules.set(file.module, { module: file.module, files: [], pages: [] });
    const item = modules.get(file.module);
    item.files.push(file.libraryItemId);
    if (file.pageKey) item.pages.push(file.libraryItemId);
  }

  const manifest = {
    schemaVersion: '1.0.0',
    generatedAt: new Date().toISOString(),
    repositoryRoot: ROOT,
    policy: {
      destructiveOperations: false,
      gitInternalObjectsExcluded: true,
      unreadableFilesBlockCompleteness: true,
      existingFilesPreserved: true,
      pagesAreIndexedAsFirstClassArtifacts: true
    },
    summary: {
      filesDiscovered: physical.length,
      filesIndexed: files.length,
      scanErrors: errors.length,
      pagesIndexed: pages.length,
      modulesDiscovered: modules.size,
      completeness: errors.length === 0 && physical.length === files.length ? '100% indexed' : 'REVIEW REQUIRED'
    },
    files,
    pages: pages.map(p => ({ libraryItemId: p.libraryItemId, path: p.path, module: p.module, pageKey: p.pageKey, sha256: p.sha256 })),
    modules: [...modules.values()],
    errors
  };

  fs.writeFileSync(path.join(OUT, 'UNIFIED_LIBRARY_INDEX.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(OUT, 'UNIFIED_LIBRARY_INDEX.csv'), [
    'libraryItemId,path,type,module,pageKey,bytes,sha256,modifiedAt',
    ...files.map(f => [f.libraryItemId, f.path, f.type, f.module || '', f.pageKey || '', f.bytes, f.sha256, f.modifiedAt].map(v => JSON.stringify(String(v))).join(','))
  ].join('\n'));

  const queue = files
    .filter(f => ['source', 'frontend-page', 'configuration', 'database'].includes(f.type))
    .map(f => ({ libraryItemId: f.libraryItemId, path: f.path, type: f.type, module: f.module, pageKey: f.pageKey, hardeningStatus: 'PENDING' }));
  fs.writeFileSync(path.join(OUT, 'PRODUCTION_HARDENING_QUEUE.json'), JSON.stringify({ generatedAt: new Date().toISOString(), total: queue.length, items: queue }, null, 2));

  console.log(JSON.stringify(manifest.summary, null, 2));
  if (errors.length) process.exitCode = 2;
}

main().catch(error => { console.error(error.stack || error.message); process.exitCode = 1; });
