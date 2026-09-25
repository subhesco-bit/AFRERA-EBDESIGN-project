#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const readline=require('readline');
const root=path.resolve(__dirname,'..');
const reviewDir=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'.audit','phase-program','exhaustive-file-review');
const manifest=JSON.parse(fs.readFileSync(path.join(reviewDir,'manifest.json'),'utf8'));
const outDir=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'.audit','phase-program','exact-duplicate-families-exhaustive');
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});
const groups=new Map();

async function load(){
  for(const shard of manifest.shards){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(reviewDir,shard.file)),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;
      const r=JSON.parse(line);
      if(!r.sha256)continue;
      let g=groups.get(r.sha256);
      if(!g){g=[];groups.set(r.sha256,g);}
      g.push({sourceId:r.sourceId,path:r.relativePath,bytes:r.bytes,extension:r.extension,contentMode:r.contentMode});
    }
  }
}
let idx=0,out=null,outBytes=0;const shards=[];
function open(){if(out)out.end();const file='families-'+String(idx++).padStart(4,'0')+'.jsonl';out=fs.createWriteStream(path.join(outDir,file));outBytes=0;shards.push({file,records:0,bytes:0});}
function emit(obj){const line=JSON.stringify(obj)+'\n';const n=Buffer.byteLength(line);if(!out||outBytes+n>MAX)open();out.write(line);outBytes+=n;const s=shards[shards.length-1];s.records++;s.bytes+=n;}

async function run(){
  await load();
  let familyCount=0,duplicateCopies=0,crossSourceFamilies=0,potentialDuplicateBytes=0;
  const countDistribution={};const largest=[];
  for(const [sha,members] of groups){
    if(members.length<2)continue;
    familyCount++;duplicateCopies+=members.length-1;
    const bytes=members[0].bytes||0;potentialDuplicateBytes+=bytes*(members.length-1);
    const sourceIds=[...new Set(members.map(x=>x.sourceId))];
    if(sourceIds.length>1)crossSourceFamilies++;
    countDistribution[members.length]=(countDistribution[members.length]||0)+1;
    emit({sha256:sha,bytes,count:members.length,sourceIds,members});
    largest.push({sha256:sha,bytes,count:members.length,duplicateBytes:bytes*(members.length-1),sourceIds});
  }
  if(out)await new Promise(r=>out.end(r));
  largest.sort((a,b)=>b.duplicateBytes-a.duplicateBytes);
  const summary={schemaVersion:1,generatedAt:new Date().toISOString(),sourceFiles:manifest.files,familyCount,duplicateCopies,crossSourceFamilies,potentialDuplicateBytes,potentialDuplicateGB:Number((potentialDuplicateBytes/1024/1024/1024).toFixed(3)),countDistribution,largestFamilies:largest.slice(0,150),preservationRule:'Byte-identical families only. No member deletion/move/disposition is permitted.',maxShardBytes:MAX,shards};
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({ok:true,sourceFiles:manifest.files,familyCount,duplicateCopies,crossSourceFamilies,potentialDuplicateGB:summary.potentialDuplicateGB,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
