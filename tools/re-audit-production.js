#!/usr/bin/env node
/**
 * EBDESIGN clone — repository-wide production/product re-audit.
 * Read-only: never rewrites application files.
 *
 * Audits technical, functional, integration, business, strategy, planning,
 * stakeholder, UX/UI, visualisation, data, ERP, AI, safety and operational
 * readiness. It is deliberately conservative: findings are review signals,
 * not automatic declarations that business logic is wrong.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.audit', 'production-re-audit');
const IGNORE = new Set(['.git','node_modules','dist','build','coverage','.next','.vite','.cache','vendor']);
const CODE_EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.vue','.svelte','.css','.scss','.json','.sql','.md','.yml','.yaml']);
const PAGE_HINT = /(page|pages|screen|view|route|routes|dashboard|portal)/i;
const BACKEND_HINT = /(backend|server|api|controller|service|repository|model|middleware|migration|database)/i;
const FRONTEND_HINT = /(frontend|client|src|components|pages|views)/i;
const AI_HINT = /(\bai\b|artificial.?intelligence|agent|agentic|autonom|generative|llm|rag|embedding|vector|copilot|multimodal|prompt)/i;
const ERP_HINT = /(erp|enterprise|procurement|inventory|warehouse|finance|accounting|crm|workflow|approval|manufactur|supply.?chain)/i;
const MEDICAL_HINT = /(medical|clinical|health|doctor|veterinary|nutrition|nutrient|diet|biology|biolog|lab|laboratory|therapy|fish|poultry|animal)/i;
const STAKEHOLDER_HINT = /(farmer|household|village|panchayat|fpo|rwa|consumer|corporate|buyer|government|defen[cs]e|police|processor|worker|labour|logistics|transporter|warehouse|doctor|dietitian|veterin|laboratory|supplier|admin)/i;

function walk(dir, out=[]) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, {withFileTypes:true})) {
    if (IGNORE.has(ent.name)) continue;
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p, out);
    else if (CODE_EXT.has(path.extname(ent.name).toLowerCase())) out.push(p);
  }
  return out;
}
function rel(p){return path.relative(ROOT,p).replaceAll('\\','/');}
function hash(buf){return crypto.createHash('sha256').update(buf).digest('hex');}
function count(text,re){return (text.match(re)||[]).length;}
function hasAny(text, patterns){return patterns.some(p=>p.test(text));}
function auditFile(file){
  const buf=fs.readFileSync(file); const text=buf.toString('utf8'); const r=rel(file);
  const ext=path.extname(file).toLowerCase();
  const isPage=PAGE_HINT.test(r) || /<Route\b|createBrowserRouter|RouterProvider/i.test(text);
  const isBackend=BACKEND_HINT.test(r);
  const isFrontend=FRONTEND_HINT.test(r) || /react|jsx|tsx|useState|useEffect/i.test(text);
  const findings=[];
  const dimensions=new Set();

  if (/TODO|FIXME|HACK|XXX/.test(text)) { findings.push('unfinished-marker'); dimensions.add('functional'); }
  if (/console\.(log|debug|info)\s*\(/.test(text)) { findings.push('console-output'); dimensions.add('observability'); }
  if (/(password|secret|api[_-]?key|private[_-]?key)\s*[:=]\s*["'][^"']{8,}/i.test(text)) { findings.push('possible-secret-literal'); dimensions.add('security'); }
  if (/process\.env\.[A-Z0-9_]+/.test(text) && ext !== '.json') { findings.push('runtime-config'); dimensions.add('operations'); }
  if (isBackend && /async\s+function|async\s*\(/.test(text) && !/catch\s*\(/.test(text)) { findings.push('async-without-local-catch-review'); dimensions.add('reliability'); }
  if (isFrontend && /<img\b/i.test(text) && !/\balt\s*=/.test(text)) { findings.push('image-alt-review'); dimensions.add('ui'); }
  if (isPage && /<button\b/i.test(text) && !/aria-|type\s*=/.test(text)) { findings.push('interactive-accessibility-review'); dimensions.add('ui'); }
  if (/(fetch\(|axios\.|\.get\(|\.post\(|\.put\(|\.delete\()/i.test(text) && !/(catch|finally|ErrorBoundary|error)/i.test(text)) { findings.push('network-error-state-review'); dimensions.add('integration'); dimensions.add('ui'); }

  // Functional completeness signals.
  if (/(return\s+null|return\s+undefined|throw\s+new\s+Error\(['"](TODO|Not implemented)|Not implemented|coming soon)/i.test(text)) {
    findings.push('implementation-completeness-review'); dimensions.add('functional');
  }
  if (/mock(ed)?\s*(data|api)|dummy\s*(data|response)|hardcoded\s*(data|response)/i.test(text)) {
    findings.push('mock-or-hardcoded-runtime-data-review'); dimensions.add('functional'); dimensions.add('integration');
  }

  // Business / strategy / planning / stakeholder signals.
  if (isPage && !/(success|error|loading|empty|pending|retry|skeleton)/i.test(text)) {
    findings.push('workflow-state-review'); dimensions.add('workflow'); dimensions.add('ui');
  }
  if (isPage && !/(analytics|metric|kpi|dashboard|report|chart|graph|map|visual)/i.test(text)) {
    findings.push('decision-visualisation-review'); dimensions.add('visualisation');
  }
  if (STAKEHOLDER_HINT.test(r) && !/(role|permission|authorization|access|tenant)/i.test(text)) {
    findings.push('stakeholder-access-review'); dimensions.add('stakeholder'); dimensions.add('security');
  }
  if (/(checkout|order|payment|invoice|settlement|procurement|contract)/i.test(r) && !/(audit|transaction|idempot|reconcil|rollback)/i.test(text)) {
    findings.push('transaction-integrity-review'); dimensions.add('business'); dimensions.add('financial');
  }
  if (ERP_HINT.test(r) && !/(workflow|approval|audit|transaction|reconcil|role)/i.test(text)) {
    findings.push('erp-control-review'); dimensions.add('erp'); dimensions.add('business');
  }
  if (AI_HINT.test(r) && !/(guardrail|permission|audit|tool|memory|timeout|fallback|confidence|approval)/i.test(text)) {
    findings.push('ai-governance-review'); dimensions.add('ai'); dimensions.add('security');
  }
  if (MEDICAL_HINT.test(r) && !/(validation|provenance|audit|privacy|consent|source|confidence|safety)/i.test(text)) {
    findings.push('medical-biological-safety-review'); dimensions.add('medical-biological'); dimensions.add('safety');
  }
  if (AI_HINT.test(r) && !/(agent|orchestrat|tool|workflow|autonom)/i.test(text)) {
    findings.push('agentic-opportunity-review'); dimensions.add('ai');
  }
  if (isPage && !/(aria-|role=|label=|keyboard|focus)/i.test(text)) {
    findings.push('accessibility-depth-review'); dimensions.add('ui');
  }

  const critical=findings.filter(x=>/secret|transaction|medical-biological|implementation-completeness/i.test(x));
  return {
    path:r, bytes:buf.length, sha256:hash(buf), extension:ext,
    kind:isPage?'page':isBackend?'backend':isFrontend?'frontend':'other',
    findings, dimensions:[...dimensions].sort(), criticalFindings:critical,
    todoCount:count(text,/TODO|FIXME|HACK|XXX/g),
    lines:text.split(/\r?\n/).length
  };
}
function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const files=walk(ROOT).filter(f=>!f.startsWith(OUT));
  const records=files.map(auditFile);
  const dimensionNames=[...new Set(records.flatMap(x=>x.dimensions))].sort();
  const summary={
    generatedAt:new Date().toISOString(), root:ROOT,
    totalFiles:records.length,
    pages:records.filter(x=>x.kind==='page').length,
    backend:records.filter(x=>x.kind==='backend').length,
    frontend:records.filter(x=>x.kind==='frontend').length,
    filesWithFindings:records.filter(x=>x.findings.length).length,
    totalFindings:records.reduce((n,x)=>n+x.findings.length,0),
    criticalFindings:records.reduce((n,x)=>n+x.criticalFindings.length,0),
    byDimension:Object.fromEntries(dimensionNames.map(k=>[k,records.filter(x=>x.dimensions.includes(k)).length])),
    byFinding:Object.fromEntries([...new Set(records.flatMap(x=>x.findings))].sort().map(k=>[k,records.filter(x=>x.findings.includes(k)).length]))
  };
  fs.writeFileSync(path.join(OUT,'SUMMARY.json'),JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(OUT,'FILE_AUDIT.json'),JSON.stringify(records,null,2));
  fs.writeFileSync(path.join(OUT,'FILE_AUDIT.csv'),['path,kind,bytes,sha256,lines,dimensions,findings'].concat(records.map(x=>[x.path,x.kind,x.bytes,x.sha256,x.lines,`"${x.dimensions.join(';')}"`,`"${x.findings.join(';')}"`].join(','))).join('\n'));
  fs.writeFileSync(path.join(OUT,'PAGE_INVENTORY.txt'),records.filter(x=>x.kind==='page').map(x=>x.path).join('\n')+'\n');
  fs.writeFileSync(path.join(OUT,'GAP_REGISTER.json'),JSON.stringify(records.filter(x=>x.findings.length).map(x=>({path:x.path,kind:x.kind,dimensions:x.dimensions,findings:x.findings,critical:x.criticalFindings})),null,2));
  fs.writeFileSync(path.join(OUT,'STAKEHOLDER_GAP_REVIEW.md'),`# Stakeholder Gap Review\n\nThis is a repository-level review signal. Each finding requires domain-owner validation before implementation.\n\n## Stakeholder coverage signals\n\n${records.filter(x=>x.dimensions.includes('stakeholder')).map(x=>`- ${x.path}: ${x.findings.join(', ')}`).join('\n') || '- No automated stakeholder signals found.'}\n`);
  console.log(JSON.stringify(summary,null,2));
  if (summary.criticalFindings>0) process.exitCode=2;
}
main();
