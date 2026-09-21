#!/usr/bin/env node
/**
 * Reconciles the physical EBDESIGN codebase with _EBDESIGN_LIBRARY.
 * Additive only: never deletes or silently overwrites existing records.
 * Run from repository root: node tools/library-production-readiness.js
 */
const fs=require('fs'); const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const LIB=path.join(ROOT,'_EBDESIGN_LIBRARY');
const OUT=path.join(LIB,'99_AUDIT');
const SKIP=new Set(['node_modules','.git','dist','build','coverage','backups','worktrees']);
const exists=p=>fs.existsSync(p); const rel=p=>path.relative(ROOT,p).replaceAll('\\','/');
function walk(dir){if(!exists(dir))return[];const out=[];for(const e of fs.readdirSync(dir,{withFileTypes:true})){if(SKIP.has(e.name))continue;const p=path.join(dir,e.name);e.isDirectory()?out.push(...walk(p)):out.push(p)}return out}
function files(dir,rx){return walk(dir).filter(p=>rx.test(p))}
function moduleDirs(){const roots=[path.join(ROOT,'backend','src','modules'),path.join(ROOT,'modules')];const m=new Map();for(const root of roots){if(!exists(root))continue;for(const e of fs.readdirSync(root,{withFileTypes:true})){if(e.isDirectory()&&/^M\d{3,}$/i.test(e.name))m.set(e.name.toUpperCase(),path.join(root,e.name))}}return [...m.entries()].sort((a,b)=>a[0].localeCompare(b[0],undefined,{numeric:true}))}
function has(dir,rx){return walk(dir).some(p=>rx.test(path.basename(p)))}
function record(id,dir){return{module_id:id,physical_path:rel(dir),file_count:walk(dir).length,controller:has(dir,/controller/i),service:has(dir,/service/i),routes:has(dir,/route/i),data:has(dir,/model|schema|migration/i),validation:has(dir,/valid|joi|zod/i),tests:has(dir,/test|spec/i),status:'DISCOVERED'}}
function main(){if(!exists(LIB))throw new Error('_EBDESIGN_LIBRARY not found');fs.mkdirSync(OUT,{recursive:true});const mods=moduleDirs().map(([id,d])=>record(id,d));const libraryFiles=walk(LIB);const report={generated_at:new Date().toISOString(),policy:'ADDITIVE_ONLY_NO_DELETION_NO_SILENT_OVERWRITE',source_of_truth:{execution:'physical_filesystem',intelligence:'_EBDESIGN_LIBRARY'},counts:{modules:mods.length,library_files:libraryFiles.length,services:files(path.join(ROOT,'backend','src','services'),/service\.(js|ts)$/i).length,routes:files(path.join(ROOT,'backend','src','routes'),/\.(js|ts)$/i).length,frontend_source:files(path.join(ROOT,'frontend','src'),/\.(js|jsx|ts|tsx)$/i).length,migrations:files(path.join(ROOT,'backend','src','database','migrations'),/\.sql$/i).length},modules:mods,production_gate:{component:['implemented','validated','tested','documented'],module:['business_logic','service','api','data','ui','security','workflow','tests'],system:['end_to_end','cross_module_contracts','failure_recovery','observability'],product:['usable','secure','reliable','performant','auditable','operationally_complete']}};for(const m of mods){const miss=['controller','service','routes','data','tests'].filter(k=>!m[k]);m.status=miss.length?'PARTIAL':'STRUCTURALLY_PRESENT';m.missing=miss}fs.writeFileSync(path.join(OUT,'LIBRARY_PRODUCTION_READINESS.json'),JSON.stringify(report,null,2)+'\n');const h=['module_id','physical_path','file_count','controller','service','routes','data','validation','tests','status','missing'];const csv=[h.join(',')];for(const m of mods)csv.push(h.map(k=>JSON.stringify(m[k]??(Array.isArray(m[k])?m[k].join('|'):''))).join(','));fs.writeFileSync(path.join(OUT,'LIBRARY_PRODUCTION_READINESS.csv'),csv.join('\n')+'\n');console.log(`Library reconciliation complete: ${mods.length} modules; reports written to ${rel(OUT)}`)}
main();
