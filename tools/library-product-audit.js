#!/usr/bin/env node
'use strict';

/**
 * EBDESIGN Product Library Auditor
 *
 * Consumes COMPLETE_FILE_INDEX.json and derives a second-level product map:
 * files -> pages -> modules -> systems/domains (where names can be inferred).
 * It never declares a component complete merely because a file exists.
 * Missing evidence is reported as REVIEW_REQUIRED.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const INDEX = path.join(ROOT, '_EBDESIGN_LIBRARY', '_CONTROL', 'FILE_INDEX', 'COMPLETE_FILE_INDEX.json');
const OUT_DIR = path.join(ROOT, '_EBDESIGN_LIBRARY', '_CONTROL', 'PRODUCT_AUDIT');
const JSON_OUT = path.join(OUT_DIR, 'PRODUCT_COMPLETENESS_AUDIT.json');
const CSV_OUT = path.join(OUT_DIR, 'PRODUCT_FILE_PAGE_REGISTER.csv');

function readIndex() {
  if (!fs.existsSync(INDEX)) {
    throw new Error('COMPLETE_FILE_INDEX.json not found. Run: npm run library:index:complete');
  }
  const data = JSON.parse(fs.readFileSync(INDEX, 'utf8'));
  if (data.completeness !== 'PASS') {
    throw new Error('Library file index is not complete: ' + data.completeness);
  }
  return data.files || [];
}

function pageCandidate(file) {
  const p = file.path.toLowerCase();
  const n = file.name.toLowerCase();
  if (!['javascript', 'javascript-react', 'typescript', 'typescript-react', 'vue'].includes(file.content_type)) return false;
  return p.includes('/pages/') || p.includes('/app/') || /(^|[-_.])(page|screen|view|route)([-_.]|$)/i.test(n);
}

function moduleCandidate(file) {
  return /(^|[/\\])m\d{3}([/_\\-]|$)/i.test(file.path) || /module/i.test(file.path);
}

function inferModule(file) {
  const m = file.path.match(/(^|[/\\])(M\d{3})([/\\]|$)/i);
  return m ? m[2].toUpperCase() : null;
}

function inferLayer(file) {
  const p = file.path.toLowerCase();
  if (p.includes('controller')) return 'controller';
  if (p.includes('service')) return 'service';
  if (p.includes('route')) return 'route';
  if (p.includes('model') || p.includes('schema')) return 'model';
  if (p.includes('migration') || p.includes('/database/')) return 'database';
  if (pageCandidate(file)) return 'frontend-page';
  if (p.includes('component')) return 'frontend-component';
  if (p.includes('test') || p.includes('spec')) return 'test';
  if (p.startsWith('_ebdesign_library/')) return 'library';
  return 'other';
}

function csv(value) {
  const s = value == null ? '' : String(value);
  return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function main() {
  const files = readIndex().filter(f => f.change_state !== 'DELETED');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pages = files.filter(pageCandidate).map(f => ({
    library_item_id: f.library_item_id,
    path: f.path,
    name: f.name,
    module: inferModule(f),
    layer: inferLayer(f),
    status: 'DISCOVERED',
  }));

  const modules = new Map();
  for (const f of files) {
    const module = inferModule(f);
    if (!module) continue;
    if (!modules.has(module)) modules.set(module, { module, files: [], layers: new Set(), pages: 0 });
    const item = modules.get(module);
    item.files.push(f.path);
    item.layers.add(inferLayer(f));
  }
  for (const page of pages) if (page.module && modules.has(page.module)) modules.get(page.module).pages++;

  const moduleRows = [...modules.values()].map(m => {
    const layers = [...m.layers];
    const required = ['controller', 'service', 'route', 'model', 'test'];
    const missing = required.filter(x => !layers.includes(x));
    return {
      module: m.module,
      file_count: m.files.length,
      page_count: m.pages,
      layers,
      missing_evidence: missing,
      status: missing.length === 0 ? 'EVIDENCE_COMPLETE' : 'REVIEW_REQUIRED',
    };
  }).sort((a, b) => a.module.localeCompare(b.module));

  const pageRows = pages.sort((a, b) => a.path.localeCompare(b.path));
  const register = files.map(f => ({
    library_item_id: f.library_item_id,
    path: f.path,
    category: f.category,
    content_type: f.content_type,
    layer: inferLayer(f),
    module: inferModule(f),
    page: pageCandidate(f),
    sha256: f.sha256,
    status: f.status,
  }));

  const missingPageModuleLinks = moduleRows.filter(m => m.page_count === 0).map(m => m.module);
  const summary = {
    schema_version: '1.0.0',
    generated_at: new Date().toISOString(),
    library_index_required: 'PASS',
    files_in_register: register.length,
    frontend_pages_discovered: pageRows.length,
    modules_discovered: moduleRows.length,
    modules_with_complete_structural_evidence: moduleRows.filter(m => m.status === 'EVIDENCE_COMPLETE').length,
    modules_requiring_review: moduleRows.filter(m => m.status !== 'EVIDENCE_COMPLETE').length,
    modules_without_discovered_pages: missingPageModuleLinks.length,
    modules_without_pages: missingPageModuleLinks,
    product_status: moduleRows.some(m => m.status !== 'EVIDENCE_COMPLETE') ? 'REVIEW_REQUIRED' : 'EVIDENCE_COMPLETE',
    note: 'This audit measures evidence and wiring coverage; it does not claim business functionality is production-ready solely from file presence.',
  };

  const output = { summary, modules: moduleRows, pages: pageRows, files: register };
  fs.writeFileSync(JSON_OUT, JSON.stringify(output, null, 2) + '\n', 'utf8');
  const cols = ['library_item_id','path','category','content_type','layer','module','page','sha256','status'];
  fs.writeFileSync(CSV_OUT, cols.join(',') + '\n' + register.map(r => cols.map(c => csv(r[c])).join(',')).join('\n') + '\n', 'utf8');

  console.log(JSON.stringify({ ...summary, outputs: [JSON_OUT, CSV_OUT] }, null, 2));
  if (summary.product_status !== 'EVIDENCE_COMPLETE') process.exitCode = 2;
}

main();
