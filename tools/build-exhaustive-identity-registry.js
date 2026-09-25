#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const readline=require('readline');

const root=path.resolve(__dirname,'..');
const reviewDir=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'.audit','phase-program','exhaustive-file-review');
const reviewManifest=JSON.parse(fs.readFileSync(path.join(reviewDir,'manifest.json'),'utf8'));
const outDir=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'.audit','phase-program','identity-registry-exhaustive');
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});
function artifactId(sourceId,relativePath){
 return crypto.createHash('sha256').update(sourceId+'\0'+relativePath.replace(/\\/g,'/')).digest('hex');
}
let idx=0,out=null,outBytes=0,total=0,errors=0;const shards=[];
function open(){if(out)out.end();const file='identity-'+String(idx++).padStart(4,'0')+'.jsonl';out=fs.createWriteStream(path.join(outDir,file));outBytes=0;shards.push({file,records:0,bytes:0});}
function emit(rec){const line=JSON.stringify(rec)+'\n',n=Buffer.byteLength(line);if(!out||outBytes+n>MAX)open();out.write(line);outBytes+=n;const s=shards.at(-1);s.records++;s.bytes+=n;}
async function run(){
 for(const shard of reviewManifest.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(reviewDir,shard.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;
   const r=JSON.parse(line);
   if(!r.sourceId||!r.relativePath){errors++;continue;}
   emit({
    artifactId:artifactId(r.sourceId,r.relativePath),
    sourceId:r.sourceId,
    relativePath:r.relativePath,
    bytes:r.bytes??null,
    modifiedTime:r.modifiedTime??null,
    extension:r.extension??'',
    sha256:r.sha256??null,
    contentMode:r.contentMode??r.kind??null,
    reviewState:r.decisionState||'UNDECIDED',
    dispositionAllowed:false
   });
   total++;
  }
 }
 if(out)await new Promise(r=>out.end(r));
 const manifest={schemaVersion:2,generatedAt:new Date().toISOString(),sourceReviewManifest:path.relative(root,path.join(reviewDir,'manifest.json')).replace(/\\/g,'/'),identityRule:'sha256(sourceId + NUL + normalizedRelativePath)',records:total,errors,maxShardBytes:MAX,shards,rule:'Identity includes every file from exhaustive Phase 16 ledger; no file role/disposition inferred from path.'};
 fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({ok:errors===0,records:total,errors,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
