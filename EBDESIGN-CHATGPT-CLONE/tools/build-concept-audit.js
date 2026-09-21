const fs = require('fs');
const path = require('path');

const cloneRoot = path.resolve(__dirname, '..');
const projectRoot = path.resolve(cloneRoot, '..');
const registry = JSON.parse(fs.readFileSync(path.join(cloneRoot, 'registry', 'capabilities.json'), 'utf8'));
const classification = JSON.parse(fs.readFileSync(path.join(cloneRoot, 'registry', 'classification.json'), 'utf8'));

function walk(relative, limit = 25000) {
  const start = path.join(projectRoot, relative);
  const found = [];
  if (!fs.existsSync(start)) return found;
  const queue = [start];
  while (queue.length && found.length < limit) {
    const current = queue.shift();
    let entries;
    try { entries = fs.readdirSync(current, { withFileTypes: true }); } catch { continue; }
    for (const entry of entries) {
      if (['node_modules', '.git', 'dist', 'coverage'].includes(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) queue.push(absolute);
      else found.push(path.relative(projectRoot, absolute).replaceAll('\\', '/'));
    }
  }
  return found;
}

const inventory = [...new Set(['backend/src', 'frontend/src', 'modules', 'database', 'workflows', '.ai'].flatMap(walk))];
const normalized = inventory.map(file => ({ file, token: file.toLowerCase().replace(/[^a-z0-9]+/g, ' ') }));

function matchesFor(capability) {
  const ignored = new Set(['unified', 'canonical', 'governed', 'system', 'journey', 'platform']);
  const terms = capability.name.toLowerCase().split(/\s+/).filter(term => term.length > 4 && !ignored.has(term));
  const hinted = capability.evidenceHints.flatMap(hint => inventory.filter(file => file === hint || file.startsWith(`${hint}/`))).slice(0, 20);
  const semantic = normalized.filter(item => terms.some(term => item.token.includes(term))).map(item => item.file).slice(0, 20);
  return [...new Set([...hinted, ...semantic])].slice(0, 30);
}

const audited = registry.capabilities.map(capability => {
  const candidates = matchesFor(capability);
  return {
    ...capability,
    completion: false,
    evidence: Object.fromEntries(classification.requiredEvidenceGates.map(gate => [gate, { status: 'unverified', references: [] }])),
    candidateEvidence: candidates,
    auditNote: candidates.length
      ? 'Candidate files found; runtime claims remain unverified until gate evidence is recorded.'
      : 'No candidate repository evidence found by deterministic path/name scan.'
  };
});

const outDir = path.join(cloneRoot, 'generated');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'concept-runtime-audit.json'), JSON.stringify({
  generatedAt: new Date().toISOString(), inventoryCount: inventory.length,
  requiredEvidenceGates: classification.requiredEvidenceGates, capabilities: audited
}, null, 2));

const todo = [
  '# AFRERA Evidence Based Completion Backlog', '',
  `Generated from ${audited.length} canonical capabilities and ${inventory.length} inventoried repository files.`, '',
  'A candidate file is discovery evidence only. Completion requires verified evidence for every gate.', ''
];
for (const stage of [...new Set(audited.map(item => item.stage))].sort()) {
  todo.push(`## Stage ${stage}`, '');
  for (const item of audited.filter(candidate => candidate.stage === stage)) {
    todo.push(
      `### ${item.id} ${item.name}`, '', `- Status: ${item.status}`, `- Priority: ${item.priority}`,
      `- Owner: ${item.owner}`, `- Outcome: ${item.outcome}`, `- Next action: ${item.nextAction}`,
      `- Candidate evidence: ${item.candidateEvidence.length ? item.candidateEvidence.slice(0, 8).join(', ') : 'none found'}`,
      '- [ ] Source evidence verified', '- [ ] Runtime reachability verified',
      '- [ ] Persistence and transactional integrity verified', '- [ ] Authorization verified',
      '- [ ] API or event contract verified', '- [ ] Complete journey and exceptions verified',
      '- [ ] Automated test evidence verified', '- [ ] Telemetry and outcome evidence verified', ''
    );
  }
}
fs.writeFileSync(path.join(outDir, 'TODO.md'), `${todo.join('\n')}\n`);
console.log(`Wrote ${audited.length} capability records using ${inventory.length} repository files.`);
