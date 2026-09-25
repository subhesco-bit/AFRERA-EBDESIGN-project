#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const readline=require('readline');

const root=path.resolve(__dirname,'..');
const identityDir=path.join(root,'.audit','phase-program','identity-registry-exhaustive-rerun-20260925-172329');
const exactDir=path.join(root,'.audit','phase-program','exact-duplicate-families-exhaustive-rerun-20260925-172329');
const nearDir=path.join(root,'.audit','phase-program','near-duplicate-families-exhaustive-rerun-20260925-172329');
const conceptDir=path.join(root,'.audit','phase-program','concept-sections');
const htmlDir=path.join(root,'.audit','phase-program','html-prototypes');
const richDir=path.join(root,'.audit','phase-program','rich-concept-documents-complete');
const visualDir=path.join(root,'.audit','phase-program','all-visual-assets');
const outDir=path.join(root,'.audit','phase-program','source-provenance-graph');
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});

const idManifest=JSON.parse(fs.readFileSync(path.join(identityDir,'manifest.json'),'utf8'));
const artifactByPath=new Map();
const artifactMeta=new Map();
async function loadArtifacts(){
 for(const sh of idManifest.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(identityDir,sh.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;
   const r=JSON.parse(line), key=r.sourceId+'\0'+r.relativePath;
   artifactByPath.set(key,r.artifactId);
   artifactMeta.set(r.artifactId,{sourceId:r.sourceId,path:r.relativePath,sha256:r.sha256});
  }
 }
}
function aid(sourceId,p){return artifactByPath.get(sourceId+'\0'+p);}
function hashId(prefix,s){return prefix+crypto.createHash('sha256').update(s).digest('hex');}
let idx=0,out=null,outBytes=0;const shards=[];
function open(){if(out)out.end();const file='graph-'+String(idx++).padStart(4,'0')+'.jsonl';out=fs.createWriteStream(path.join(outDir,file));outBytes=0;shards.push({file,records:0,bytes:0});}
function emit(o){const line=JSON.stringify(o)+'\n',n=Buffer.byteLength(line);if(!out||outBytes+n>MAX)open();out.write(line);outBytes+=n;const s=shards.at(-1);s.records++;s.bytes+=n;}
const counts={nodes:0,edges:0,missingArtifactRefs:0,exactFamilies:0,nearFamilies:0,conceptSections:0,htmlPrototypes:0,richDocuments:0,visualArtifacts:0};
function node(id,type,data={}){emit({kind:'node',id,type,...data});counts.nodes++;}
function edge(from,to,type,data={}){emit({kind:'edge',from,to,type,...data});counts.edges++;}
async function exactFamilies(){
 const m=JSON.parse(fs.readFileSync(path.join(exactDir,'manifest.json'),'utf8'));
 for(const sh of m.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(exactDir,sh.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;const f=JSON.parse(line);const fid='exact:'+f.sha256;
   node(fid,'exact-content-family',{sha256:f.sha256,bytes:f.bytes,count:f.count});counts.exactFamilies++;
   for(const mem of f.members){const a=aid(mem.sourceId,mem.path);if(a)edge(a,fid,'BYTE_IDENTICAL_TO');else counts.missingArtifactRefs++;}
  }
 }
}
async function nearFamilies(){
 const m=JSON.parse(fs.readFileSync(path.join(nearDir,'manifest.json'),'utf8'));
 for(const sh of m.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(nearDir,sh.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;const f=JSON.parse(line);const fid=hashId('version:',f.basis+'\0'+f.key);
   node(fid,'version-family',{basis:f.basis,key:f.key,memberCount:f.memberCount,distinctContentVersions:f.distinctContentVersions});counts.nearFamilies++;
   for(const mem of f.members){const a=aid(mem.sourceId,mem.path);if(a)edge(a,fid,'VERSION_OF');else counts.missingArtifactRefs++;}
  }
 }
}
async function conceptSections(){
 const m=JSON.parse(fs.readFileSync(path.join(conceptDir,'manifest.json'),'utf8'));
 for(const sh of m.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(conceptDir,sh.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;const s=JSON.parse(line);
   const sid=hashId('section:',s.sourceId+'\0'+s.relativePath+'\0'+s.sectionIndex+'\0'+(s.chunk||0));
   node(sid,'concept-section',{heading:s.heading,sectionIndex:s.sectionIndex,chunk:s.chunk||0,fileSha256:s.fileSha256,tags:s.tags});counts.conceptSections++;
   const a=aid(s.sourceId,s.relativePath);if(a)edge(sid,a,'EXTRACTED_FROM');else counts.missingArtifactRefs++;
   for(const tag of s.tags||[]){const tid='capability-tag:'+tag;edge(sid,tid,'EXPRESSES_CAPABILITY');}
  }
 }
}
function htmlPrototypes(){
 const file=path.join(htmlDir,'prototypes.json');if(!fs.existsSync(file))return;
 const records=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const r of records){
  const pid='html-prototype:'+r.sha256;node(pid,'html-prototype',{sha256:r.sha256,title:r.title,bytes:r.bytes,workflowTags:r.workflowTags,catalogCount:r.catalog&&r.catalog.count||null});counts.htmlPrototypes++;
  for(const p of [r.relativePath,...(r.duplicatePaths||[])]){const a=aid('LOCAL.NE',p);if(a)edge(pid,a,'REPRESENTED_BY');else counts.missingArtifactRefs++;}
  for(const tag of r.workflowTags||[])edge(pid,'capability-tag:'+tag,'EXPRESSES_CAPABILITY');
 }
}
function richDocuments(){
 const file=path.join(richDir,'manifest.json');if(!fs.existsSync(file))return;
 const m=JSON.parse(fs.readFileSync(file,'utf8'));
 for(const r of m.fileSummaries||[]){
  if(!r.sha256)continue;const did='rich-document:'+r.sha256;
  node(did,'rich-document',{sha256:r.sha256,bytes:r.bytes||null,blocks:r.blocks||null});counts.richDocuments++;
  const a=aid(r.sourceId,r.relativePath);if(a)edge(did,a,'REPRESENTED_BY');else counts.missingArtifactRefs++;
  if(r.duplicateOf){const target=aid(r.duplicateOf.sourceId,r.duplicateOf.relativePath);if(target)edge(did,target,'DUPLICATE_PROVENANCE');}
 }
}
async function visualArtifacts(){
 const m=JSON.parse(fs.readFileSync(path.join(visualDir,'manifest.json'),'utf8'));
 for(const sh of m.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(visualDir,sh.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;const r=JSON.parse(line);const a=aid(r.sourceId,r.relativePath);
   if(a){edge(a,'capability-tag:visual-asset','HAS_ROLE',{roleCandidate:r.roleCandidate});counts.visualArtifacts++;}else counts.missingArtifactRefs++;
  }
 }
}
(async()=>{
 await loadArtifacts();
 for(const tag of ['requirement','rule','algorithm','workflow','decision','ai','erp','agri','commerce','logistics','finance','engineering','farmer','marketplace','procurement','coldchain','insurance','quality','governance','visual-asset'])node('capability-tag:'+tag,'capability-tag',{tag});
 await exactFamilies();
 await nearFamilies();
 await conceptSections();
 htmlPrototypes();
 richDocuments();
 await visualArtifacts();
 if(out)await new Promise(r=>out.end(r));
 const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),artifactNodeStore:path.relative(root,path.join(identityDir,'manifest.json')).replace(/\\/g,'/'),inputs:{exact:path.relative(root,path.join(exactDir,'manifest.json')).replace(/\\/g,'/'),near:path.relative(root,path.join(nearDir,'manifest.json')).replace(/\\/g,'/'),concept:path.relative(root,path.join(conceptDir,'manifest.json')).replace(/\\/g,'/'),html:path.relative(root,path.join(htmlDir,'manifest.json')).replace(/\\/g,'/'),rich:path.relative(root,path.join(richDir,'manifest.json')).replace(/\\/g,'/'),visual:path.relative(root,path.join(visualDir,'manifest.json')).replace(/\\/g,'/')},counts,maxShardBytes:MAX,shards,rule:'Graph records provenance and recoverable lineage only. It does not select winners or authorize deletion.'};
 fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({ok:counts.missingArtifactRefs===0,counts,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
