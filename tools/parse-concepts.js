#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(__dirname,'..');
const outDir=path.join(root,'.audit','phase-program','concept-sections');
const MAX=20*1024*1024, MAX_SECTION=120000;
fs.mkdirSync(outDir,{recursive:true});
const sources=[
 {id:'LOCAL.EBDESIGN',root:'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN'},
 {id:'LOCAL.CONSOLIDATED',root:'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN-consolidated'}
];
const skipDirs=new Set(['.git','node_modules','dist','build','coverage','.cache','.vite','.next','out','.audit','_audit','.system-audit','_EBDESIGN_LIBRARY']);
const includeName=/(concept|architecture|specification|blueprint|directive|strategy|operating.?system|anatomy|intelligence|framework|roadmap|design|requirement|workflow|integration|vision|constitution|decision|deepak|deep concept)/i;
const excludeName=/(index|inventory|audit|report|status|summary|cache|manifest|file.?map|junk|certificate)/i;
function sha(text){return crypto.createHash('sha256').update(text).digest('hex');}
function list(dir,base,sourceId,out){
 let ents;try{ents=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
 for(const ent of ents){
  const p=path.join(dir,ent.name), rel=(base?path.join(base,ent.name):ent.name).replace(/\\/g,'/');
  if(ent.isDirectory()){if(!skipDirs.has(ent.name))list(p,rel,sourceId,out);continue;}
  if(!ent.isFile())continue;
  const ext=path.extname(ent.name).toLowerCase();
  if(!['.md','.txt'].includes(ext))continue;
  const rootCore=/^(deepak concept|deep concept 2|deepak%20final)\.md$/i.test(ent.name);
  if(rootCore || (includeName.test(ent.name)&&!excludeName.test(ent.name))) out.push({sourceId,path:p,relativePath:rel});
 }
}
let shardIdx=0,stream=null,shardBytes=0;const shards=[];
function open(){if(stream)stream.end();const file='sections-'+String(shardIdx++).padStart(4,'0')+'.jsonl';stream=fs.createWriteStream(path.join(outDir,file));shardBytes=0;shards.push({file,records:0,bytes:0});}
function emit(o){const line=JSON.stringify(o)+'\n',n=Buffer.byteLength(line);if(!stream||shardBytes+n>MAX)open();stream.write(line);shardBytes+=n;const s=shards.at(-1);s.records++;s.bytes+=n;}
const tags=[
 ['requirement',/\b(must|shall|required|requirement|non-negotiable)\b/i],
 ['rule',/\b(rule|policy|constraint|approval|compliance|governance)\b/i],
 ['algorithm',/\b(algorithm|formula|optimization|solver|forecast|simulation|scoring|model)\b/i],
 ['workflow',/\b(workflow|process|state machine|handoff|approval|escalation|journey)\b/i],
 ['decision',/\b(decision|choose|selection|routing|router|strategy)\b/i],
 ['ai',/\b(ai|agent|llm|machine learning|knowledge graph|retrieval|vision|ocr|speech)\b/i],
 ['erp',/\b(erp|finance|inventory|warehouse|procurement|crm|hrms|manufacturing)\b/i],
 ['agri',/\b(farmer|fpo|agriculture|crop|village|farm|harvest|seed|livestock)\b/i],
 ['commerce',/\b(marketplace|commerce|buyer|seller|order|pricing|retail|consumer)\b/i],
 ['logistics',/\b(logistics|fleet|transport|cold chain|warehouse|delivery|route)\b/i],
 ['finance',/\b(finance|credit|loan|insurance|payment|escrow|subsidy|grant)\b/i],
 ['engineering',/\b(engineering|digital twin|dpr|bom|equipment|maintenance|energy)\b/i]
];
function classify(text){return tags.filter(([,re])=>re.test(text)).map(([t])=>t);}
function sections(text){
 const lines=text.split(/\r?\n/);const out=[];let title='[preamble]',buf=[];
 function flush(){if(!buf.length)return;let body=buf.join('\n').trim();buf=[];if(!body)return;for(let i=0;i<body.length;i+=MAX_SECTION)out.push({heading:title,text:body.slice(i,i+MAX_SECTION),chunk:i/MAX_SECTION});}
 for(const line of lines){
  const m=line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*$/);
  if(m){flush();title=m[2].trim();}else buf.push(line);
 }
 flush();return out;
}
async function run(){
 const candidates=[];for(const s of sources)list(s.root,'',s.id,candidates);
 const seen=new Map(),duplicateSources=[];let uniqueFiles=0,totalSections=0,totalChars=0;
 const fileSummaries=[];
 for(const c of candidates){
  let text;try{text=fs.readFileSync(c.path,'utf8');}catch{continue;}
  const h=sha(text);
  if(seen.has(h)){duplicateSources.push({sourceId:c.sourceId,relativePath:c.relativePath,identicalTo:seen.get(h)});continue;}
  seen.set(h,{sourceId:c.sourceId,relativePath:c.relativePath});uniqueFiles++;
  const ss=sections(text);const fileTags=new Set();
  ss.forEach((s,i)=>{const t=classify(s.heading+'\n'+s.text);t.forEach(x=>fileTags.add(x));emit({sourceId:c.sourceId,relativePath:c.relativePath,fileSha256:h,sectionIndex:i,heading:s.heading,chunk:s.chunk,tags:t,text:s.text});totalSections++;totalChars+=s.text.length;});
  fileSummaries.push({sourceId:c.sourceId,relativePath:c.relativePath,sha256:h,bytes:Buffer.byteLength(text),sections:ss.length,tags:[...fileTags]});
 }
 if(stream)await new Promise(r=>stream.end(r));
 const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),candidateFiles:candidates.length,uniqueFiles,exactDuplicateSources:duplicateSources.length,totalSections,totalChars,fileSummaries,duplicateSources,maxShardBytes:MAX,shards,rule:'Raw files were read directly; generated indexes/audits/reports were excluded by discovery policy.'};
 fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({ok:true,candidateFiles:candidates.length,uniqueFiles,exactDuplicateSources:duplicateSources.length,totalSections,totalChars,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
