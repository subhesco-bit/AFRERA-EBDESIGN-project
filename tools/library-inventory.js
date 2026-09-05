#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT_DIR = path.join(ROOT, '_EBDESIGN_LIBRARY', '25_DISCOVERY_INDEX');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build', 'coverage', 'target', 'worktrees']);
const TEXT_EXTENSIONS = new Set([
  '.bat', '.cjs', '.conf', '.css', '.csv', '.csproj', '.html', '.ini', '.js', '.jsx', '.json',
  '.md', '.mjs', '.ps1', '.rs', '.scss', '.sh', '.sql', '.ts', '.tsx', '.txt', '.xml', '.yaml', '.yml'
]);

function walk(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && SKIP_DIRS.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolutePath, files);
    else files.push(absolutePath);
  }
  return files;
}

function relative(absolutePath) {
  return path.relative(ROOT, absolutePath).replace(/\\/g, '/');
}

function classify(filePath) {
  const normalized = relative(filePath);
  const name = path.basename(filePath).toLowerCase();
  if (normalized.startsWith('_EBDESIGN_LIBRARY/')) return 'library';
  if (normalized.startsWith('backend/src/database/')) return 'database';
  if (normalized.startsWith('backend/src/routes/') || name.includes('route')) return 'route';
  if (normalized.startsWith('backend/src/services/') || name.includes('service')) return 'service';
  if (normalized.startsWith('frontend/src/')) return 'frontend';
  if (name.includes('test') || name.includes('spec')) return 'test';
  if (name.endsWith('.md') || name.startsWith('readme')) return 'documentation';
  if (name.includes('package') || name.includes('lock')) return 'dependency';
  if (name.includes('config') || name.includes('manifest')) return 'configuration';
  return 'other';
}

function readText(filePath) {
  if (!TEXT_EXTENSIONS.has(path.extname(filePath).toLowerCase())) return '';
  try {
    const stat = fs.statSync(filePath);
    if (stat.size > 2 * 1024 * 1024) return '';
    return fs.readFileSync(filePath, 'utf8');
  } catch {
    return '';
  }
}

function csvCell(value) {
  const text = Array.isArray(value) ? value.join('|') : String(value ?? '');
  return `"${text.replace(/"/g, '""')}"`;
}

function main() {
  const files = walk(ROOT);
  const corpus = files.map((filePath) => ({ filePath, relativePath: relative(filePath), text: readText(filePath) }));
  const sourceCorpus = corpus.filter((item) => item.text);

  const records = corpus.map((item) => {
    const baseName = path.basename(item.filePath);
    const stem = baseName.replace(path.extname(baseName), '');
    const references = sourceCorpus
      .filter((candidate) => candidate.filePath !== item.filePath && (
        candidate.text.includes(item.relativePath) || candidate.text.includes(baseName)
      ))
      .map((candidate) => candidate.relativePath)
      .slice(0, 50);
    const category = classify(item.filePath);
    const likelyOrphan = ['route', 'service', 'frontend'].includes(category)
      && references.length === 0
      && !/^index\.|^main\.|^app\./i.test(baseName)
      && !/^README/i.test(baseName);

    return {
      path: item.relativePath,
      name: baseName,
      stem,
      category,
      extension: path.extname(item.filePath).toLowerCase() || '[none]',
      bytes: fs.statSync(item.filePath).size,
      references: references.length,
      referencedBy: references,
      staticEvidence: references.length ? 'referenced by path or basename' : 'no static path/basename evidence',
      orphanCandidate: likelyOrphan,
    };
  });

  const byCategory = records.reduce((counts, record) => {
    counts[record.category] = (counts[record.category] || 0) + 1;
    return counts;
  }, {});
  const orphanCandidates = records.filter((record) => record.orphanCandidate);
  const summary = {
    generatedAt: new Date().toISOString(),
    root: ROOT,
    scannedFiles: records.length,
    textFiles: sourceCorpus.length,
    byCategory,
    orphanCandidates: orphanCandidates.length,
    method: 'Filesystem walk excluding generated/dependency directories; references are static path or basename evidence only.',
    limitations: [
      'Dynamic imports, runtime registration, reflection, and database relationships are not proven by this map.',
      'A basename reference can be a false positive; orphanCandidate requires manual or runtime confirmation.',
      'Missing files require comparison with a declared manifest or contract; absence of a reference is not proof of a required file.'
    ],
  };

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, 'library-file-map.json'), JSON.stringify({ summary, records }, null, 2) + '\n');
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'library-file-map.csv'),
    [
      ['path', 'name', 'category', 'extension', 'bytes', 'references', 'staticEvidence', 'orphanCandidate'],
      ...records.map((record) => [record.path, record.name, record.category, record.extension, record.bytes, record.references, record.staticEvidence, record.orphanCandidate])
    ].map((row) => row.map(csvCell).join(',')).join('\n') + '\n'
  );
  fs.writeFileSync(
    path.join(OUTPUT_DIR, 'orphan-candidates.md'),
    `# Orphan Candidates\n\nGenerated: ${summary.generatedAt}\n\n` +
      'These are heuristic candidates with no static path or basename evidence. They require runtime or contract confirmation before deletion.\n\n' +
      orphanCandidates.map((record) => `- [ ] ${record.path} (${record.category})`).join('\n') + '\n'
  );
  fs.writeFileSync(path.join(OUTPUT_DIR, 'library-inventory-summary.json'), JSON.stringify(summary, null, 2) + '\n');
  process.stdout.write(JSON.stringify(summary, null, 2) + '\n');
}

main();