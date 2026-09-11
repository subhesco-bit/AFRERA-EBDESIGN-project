#!/usr/bin/env node
/**
 * Unified production-hardening orchestrator for the ChatGPT clone.
 *
 * This command is intentionally NON-DESTRUCTIVE. It never replaces business
 * logic with generated placeholders. It inventories the entire repository,
 * runs the existing technical audit, and emits a deterministic implementation
 * queue covering code, pages, ERP, rural/corporate workflows, AI, medical /
 * biological domains, business, strategy, planning, stakeholders, UX and
 * visualisation.
 *
 * The output is the execution contract for the subsequent repair pass.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.audit', 'complete-production-hardening');
const IGNORE = new Set(['.git','node_modules','dist','build','coverage','.next','.vite','.cache','vendor','.audit']);
const SOURCE_EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.vue','.svelte','.css','.scss','.json','.sql','.yml','.yaml']);
const DOC_EXT = new Set(['.md','.txt']);

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (SOURCE_EXT.has(path.extname(ent.name).toLowerCase()) || DOC_EXT.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}
function rel(p) { return path.relative(ROOT, p).replaceAll('\\','/'); }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function safeRead(p) { try { return fs.readFileSync(p, 'utf8'); } catch { return ''; } }
function classify(r, text) {
  if (/page|pages|screen|view|dashboard|portal/i.test(r) || /<Route\b|RouterProvider|createBrowserRouter/i.test(text)) return 'page';
  if (/backend|server|api|controller|service|repository|model|middleware|migration|database/i.test(r)) return 'backend';
  if (/frontend|client|components|views/i.test(r) || /react|jsx|tsx|useState|useEffect/i.test(text)) return 'frontend';
  return 'other';
}
function dimensions(r, text) {
  const d = new Set();
  const add = (name, re) => { if (re.test(r) || re.test(text)) d.add(name); };
  add('business', /sales|market|commerce|customer|business|revenue|pricing|order|payment|contract|retail/i);
  add('strategy', /strategy|capability|competitive|roadmap|ecosystem|scale/i);
  add('planning', /plan|schedule|capacity|project|milestone|dependency|resource/i);
  add('stakeholder', /farmer|household|village|panchayat|fpo|rwa|consumer|corporate|buyer|government|defen[cs]e|police|processor|labour|worker|logistics|transporter|doctor|dietitian|veterin|supplier|admin/i);
  add('ui-ux', /frontend|pages|components|screen|view|dashboard|portal|navigation|form/i);
  add('visualisation', /dashboard|chart|graph|map|visual|analytics|kpi|report/i);
  add('erp', /erp|finance|accounting|procurement|inventory|warehouse|supply.?chain|crm|hr|payroll|asset|production|manufactur/i);
  add('ai', /\bai\b|artificial.?intelligence|agent|agentic|autonom|generative|llm|rag|embedding|vector|copilot|multimodal|prompt/i);
  add('medical-biological', /medical|clinical|health|doctor|veterinary|nutrition|nutrient|diet|biology|biolog|laboratory|\blab\b|therapy|fish|poultry|animal/i);
  add('security', /auth|security|permission|role|token|password|secret|payment|identity|privacy/i);
  add('operations', /logistics|warehouse|cold.?storage|pre.?cool|packaging|transport|monitor|queue|workflow/i);
  add('data', /database|migration|schema|model|repository|analytics|data|json|sql/i);
  return [...d].sort();
}
function findings(r, text, kind) {
  const f = [];
  const push = (name, test) => { if (test) f.push(name); };
  push('unfinished-marker', /TODO|FIXME|HACK|XXX/.test(text));
  push('placeholder-or-stub', /Not implemented|coming soon|return null\s*;|return undefined\s*;|dummy data|mock data|hardcoded data/i.test(text));
  push('debug-output', /console\.(log|debug|info)\s*\(/.test(text));
  push('secret-review', /(password|secret|api[_-]?key|private[_-]?key)\s*[:=]\s*["'][^"']{8,}/i.test(text));
  push('network-error-review', /(fetch\(|axios\.|\.get\(|\.post\(|\.put\(|\.delete\()/i.test(text) && !/(catch|finally|error|retry)/i.test(text));
  push('async-error-review', kind === 'backend' && /async\s+(function|\()/i.test(text) && !/catch\s*\(/.test(text));
  push('accessibility-review', kind === 'page' && /<button\b/i.test(text) && !/aria-|type\s*=/.test(text));
  push('image-accessibility-review', kind !== 'backend' && /<img\b/i.test(text) && !/\balt\s*=/.test(text));
  push('workflow-state-review', kind === 'page' && !/(loading|error|empty|pending|success|retry|skeleton)/i.test(text));
  push('transaction-control-review', /(checkout|order|payment|invoice|settlement|procurement|contract)/i.test(r) && !/(idempot|transaction|audit|reconcil|rollback)/i.test(text));
  push('erp-control-review', /erp|accounting|finance|procurement|inventory|warehouse|crm|supply.?chain/i.test(r) && !/(workflow|approval|audit|transaction|reconcil|role)/i.test(text));
  push('ai-governance-review', /\bai\b|agent|generative|llm|rag|autonom/i.test(r) && !/(guardrail|permission|audit|tool|memory|timeout|fallback|confidence|approval)/i.test(text));
  push('medical-biological-safety-review', /medical|clinical|nutrition|nutrient|biology|biolog|laboratory|veterinary|therapy/i.test(r) && !/(validation|provenance|audit|privacy|consent|source|confidence|safety)/i.test(text));
  push('stakeholder-workflow-review', /farmer|household|village|panchayat|fpo|rwa|consumer|corporate|buyer|government|worker|labour|logistics|doctor|dietitian|veterin/i.test(r) && !/(role|permission|authorization|access|workflow)/i.test(text));
  push('visualisation-review', kind === 'page' && !/(chart|graph|map|visual|dashboard|kpi|analytics|report)/i.test(text));
  return f;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const files = walk(ROOT);
  const records = files.map(file => {
    const buf = fs.readFileSync(file);
    const text = buf.toString('utf8');
    const r = rel(file);
    const kind = classify(r, text);
    const ds = dimensions(r, text);
    const fsx = findings(r, text, kind);
    return { path:r, kind, bytes:buf.length, lines:text.split(/\r?\n/).length, sha256:sha256(buf), dimensions:ds, findings:fsx };
  });

  const queue = records.filter(x => x.findings.length).sort((a,b) => b.findings.length-a.findings.length || a.path.localeCompare(b.path));
  const summary = {
    generatedAt: new Date().toISOString(),
    totalFiles: records.length,
    pages: records.filter(x=>x.kind==='page').length,
    backend: records.filter(x=>x.kind==='backend').length,
    frontend: records.filter(x=>x.kind==='frontend').length,
    filesRequiringReview: queue.length,
    totalFindings: queue.reduce((n,x)=>n+x.findings.length,0),
    byDimension: Object.fromEntries([...new Set(records.flatMap(x=>x.dimensions))].sort().map(d=>[d,records.filter(x=>x.dimensions.includes(d)).length])),
    byFinding: Object.fromEntries([...new Set(queue.flatMap(x=>x.findings))].sort().map(f=>[f,queue.filter(x=>x.findings.includes(f)).length]))
  };

  fs.writeFileSync(path.join(OUT,'SUMMARY.json'), JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(OUT,'FILE_INVENTORY.json'), JSON.stringify(records,null,2));
  fs.writeFileSync(path.join(OUT,'IMPLEMENTATION_QUEUE.json'), JSON.stringify(queue,null,2));
  fs.writeFileSync(path.join(OUT,'IMPLEMENTATION_QUEUE.csv'), ['path,kind,bytes,lines,dimensions,findings'].concat(queue.map(x=>[x.path,x.kind,x.bytes,x.lines,`"${x.dimensions.join(';')}"`,`"${x.findings.join(';')}"`].join(','))).join('\n'));
  fs.writeFileSync(path.join(OUT,'ACCEPTANCE.md'), `# Complete Production Hardening Acceptance\n\nA file/page is complete only after applicable findings are resolved and tests pass.\n\n## Required dimensions\n\n- Technical and reliability\n- Functional completeness\n- Integration and workflow integrity\n- Business and commercial capability\n- Strategy and planning\n- Stakeholder journeys\n- UI/UX and accessibility\n- Digital visualisation and decision support\n- ERP and accounting controls\n- Security, privacy and auditability\n- Data integrity and provenance\n- Advanced generative AI\n- Agentic/autonomous AI with governed tool access\n- Medical/biological safety, validation and provenance where applicable\n\n## Non-destructive rule\n\nExisting business logic must be preserved. Skeletons may be completed, but generic placeholder replacement is prohibited.\n`);

  const audit = spawnSync(process.execPath, [path.join(ROOT,'tools','re-audit-production.js')], {cwd:ROOT, encoding:'utf8'});
  fs.writeFileSync(path.join(OUT,'RE_AUDIT_STDOUT.txt'), audit.stdout || '');
  fs.writeFileSync(path.join(OUT,'RE_AUDIT_STDERR.txt'), audit.stderr || '');
  fs.writeFileSync(path.join(OUT,'RE_AUDIT_EXIT_CODE.txt'), String(audit.status ?? 'unknown'));
  console.log(JSON.stringify(summary,null,2));
  // The orchestrator is a discovery/execution contract; unresolved findings
  // are expected until the actual source repair pass is completed.
}
main();
