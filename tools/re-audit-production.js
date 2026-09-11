#!/usr/bin/env node
/**
 * EBDESIGN clone — repository-wide production re-audit.
 * Read-only: never rewrites application files. Produces actionable inventories.
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, '.audit', 'production-re-audit');
const IGNORE = new Set(['.git','node_modules','dist','build','coverage','.next','.vite','.cache','vendor']);
const CODE_EXT = new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.vue','.svelte','.css','.scss','.json','.sql']);
const PAGE_HINT = /(page|pages|screen|view|route|routes)/i;
const BACKEND_HINT = /(backend|server|api|controller|service|repository|model|middleware|migration|database)/i;
const FRONTEND_HINT = /(frontend|client|src|components|pages|views)/i;

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
function auditFile(file){
  const buf=fs.readFileSync(file); const text=buf.toString('utf8'); const r=rel(file);
  const ext=path.extname(file).toLowerCase();
  const isPage=PAGE_HINT.test(r) || /<Route\b|createBrowserRouter|RouterProvider/i.test(text);
  const isBackend=BACKEND_HINT.test(r);
  const isFrontend=FRONTEND_HINT.test(r) || /react|jsx|tsx|useState|useEffect/i.test(text);
  const findings=[];
  if (/TODO|FIXME|HACK|XXX/.test(text)) findings.push('unfinished-marker');
  if (/console\.(log|debug|info)\s*\(/.test(text)) findings.push('console-output');
  if (/(password|secret|api[_-]?key|private[_-]?key)\s*[:=]\s*["'][^"']{8,}/i.test(text)) findings.push('possible-secret-literal');
  if (/process\.env\.[A-Z0-9_]+/.test(text) && ext !== '.json') findings.push('runtime-config');
  if (isBackend && /async\s+function|async\s*\(/.test(text) && !/catch\s*\(/.test(text)) findings.push('async-without-local-catch-review');
  if (isFrontend && /<img\b/i.test(text) && !/\balt\s*=/.test(text)) findings.push('image-alt-review');
  if (isPage && /<button\b/i.test(text) && !/aria-|type\s*=/.test(text)) findings.push('interactive-accessibility-review');
  if (/(fetch\(|axios\.|\.get\(|\.post\(|\.put\(|\.delete\()/i.test(text) && !/(catch|finally|ErrorBoundary|error)/i.test(text)) findings.push('network-error-state-review');
  return {
    path:r, bytes:buf.length, sha256:hash(buf), extension:ext,
    kind:isPage?'page':isBackend?'backend':isFrontend?'frontend':'other',
    findings, todoCount:count(text,/TODO|FIXME|HACK|XXX/g),
    lines:text.split(/\r?\n/).length
  };
}
function main(){
  fs.mkdirSync(OUT,{recursive:true});
  const files=walk(ROOT).filter(f=>!f.startsWith(OUT));
  const records=files.map(auditFile);
  const summary={
    generatedAt:new Date().toISOString(), root:ROOT,
    totalFiles:records.length,
    pages:records.filter(x=>x.kind==='page').length,
    backend:records.filter(x=>x.kind==='backend').length,
    frontend:records.filter(x=>x.kind==='frontend').length,
    findings:records.reduce((n,x)=>n+x.findings.length,0),
    byFinding:Object.fromEntries([...new Set(records.flatMap(x=>x.findings))].map(k=>[k,records.filter(x=>x.findings.includes(k)).length]))
  };
  fs.writeFileSync(path.join(OUT,'SUMMARY.json'),JSON.stringify(summary,null,2));
  fs.writeFileSync(path.join(OUT,'FILE_AUDIT.json'),JSON.stringify(records,null,2));
  fs.writeFileSync(path.join(OUT,'FILE_AUDIT.csv'),['path,kind,bytes,sha256,lines,findings'].concat(records.map(x=>[x.path,x.kind,x.bytes,x.sha256,x.lines,`"${x.findings.join(';')}"`].join(','))).join('\n'));
  const pages=records.filter(x=>x.kind==='page').map(x=>x.path);
  fs.writeFileSync(path.join(OUT,'PAGE_INVENTORY.txt'),pages.join('\n')+'\n');
  console.log(JSON.stringify(summary,null,2));
  if (records.some(x=>x.findings.includes('possible-secret-literal'))) process.exitCode=2;
}
main();
