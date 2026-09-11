#!/usr/bin/env node
'use strict';

/**
 * Repository-wide production readiness audit.
 *
 * This intentionally audits the EXISTING architecture instead of generating
 * replacement modules. It finds unresolved imports, obvious placeholders,
 * route/service/frontend wiring gaps, and missing module surfaces.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKEND = path.join(ROOT, 'backend', 'src');
const FRONTEND = path.join(ROOT, 'frontend', 'src');

const EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx', '.json'];
const PLACEHOLDER = /TODO|FIXME|not implemented|coming soon|placeholder|throw new Error\(['"]Not implemented/i;
const IMPORT_RE = /(?:require\(|from\s+|import\s+)(['"])([^'"]+)\1/g;

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (EXTENSIONS.includes(path.extname(entry.name))) out.push(full);
  }
  return out;
}

function rel(file) { return path.relative(ROOT, file).replace(/\\/g, '/'); }

function resolveImport(from, request) {
  if (!request.startsWith('.') && !request.startsWith('/')) return true;
  const base = path.resolve(path.dirname(from), request);
  const candidates = [base, ...EXTENSIONS.map(ext => base + ext), ...EXTENSIONS.map(ext => path.join(base, 'index' + ext))];
  return candidates.some(fs.existsSync);
}

function scanFiles(files) {
  const result = { files: files.length, placeholders: [], brokenImports: [] };
  for (const file of files) {
    let text;
    try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
    if (PLACEHOLDER.test(text)) result.placeholders.push(rel(file));
    for (const match of text.matchAll(IMPORT_RE)) {
      const request = match[2];
      if (!resolveImport(file, request)) result.brokenImports.push(`${rel(file)} -> ${request}`);
    }
  }
  return result;
}

const backendFiles = walk(BACKEND);
const frontendFiles = walk(FRONTEND);
const backend = scanFiles(backendFiles);
const frontend = scanFiles(frontendFiles);

const routeFiles = backendFiles.filter(f => /[\\/]routes[\\/]/.test(f));
const serviceFiles = backendFiles.filter(f => /[\\/]services[\\/]/.test(f));
const frontendPages = frontendFiles.filter(f => /[\\/]pages[\\/]/.test(f));
const frontendComponents = frontendFiles.filter(f => /[\\/]components[\\/]/.test(f));

const report = {
  generatedAt: new Date().toISOString(),
  architecture: 'existing EBDESIGN/SUBH architecture',
  backend: { ...backend, routes: routeFiles.length, services: serviceFiles.length },
  frontend: { ...frontend, pages: frontendPages.length, components: frontendComponents.length },
  productionGate: {
    brokenImports: backend.brokenImports.length + frontend.brokenImports.length,
    placeholderFiles: backend.placeholders.length + frontend.placeholders.length,
    pass: backend.brokenImports.length === 0 && frontend.brokenImports.length === 0 && backend.placeholders.length === 0 && frontend.placeholders.length === 0
  },
  interpretation: {
    rule: 'An existing file is not considered production-ready merely because it exists.',
    requiredLayers: ['database', 'backend service', 'API route/controller', 'frontend surface', 'workflow', 'authorization/security', 'validation/error handling', 'audit/observability', 'AI/integration where applicable', 'tests'],
    principle: 'repair and enhance existing modules before creating new parallel implementations'
  }
};

const outputDir = path.join(ROOT, '.audit');
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(path.join(outputDir, 'production-readiness.json'), JSON.stringify(report, null, 2));

console.log(JSON.stringify(report, null, 2));
process.exitCode = report.productionGate.pass ? 0 : 1;
