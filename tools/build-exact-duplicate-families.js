#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const readline=require('readline');

const root=path.resolve(__dirname,'..');
const hashDir=path.join(root,'.audit','phase-program','content-hashes');
const manifest=JSON.parse(fs.readFileSync(path.join(hashDir,'manifest.json'),'utf8'));
const outDir=path.join(root,'.audit','phase-program','exact-duplicate-families');
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});

const groups=new Map();
async function load(){
  for(const shard of manifest.shards){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(hashDir,shard.file)),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;
      const r=JSON.parse(line);
      if(r.status!=='OK'||!r.sha256)continue;
      let g=groups.get(r.sha256);
      if(!g){g=[];groups.set(r.sha256,g);}
      g.push({artifactId:r.artifactId,sourceId:r.sourceId,path:r.relativePath,bytes:r.bytes});
    }
  }
}
let shardIndex=0,stream=null,shardBytes=0;
const shards=[];
function open(){
  if(stream)stream.end();
  const file='families-'+String(shardIndex++).padStart(4,'0')+'.jsonl';
  stream=fs.createWriteStream(path.join(outDir,file),{encoding:'utf8'});
  shardBytes=0;shards.push({file,records:0,bytes:0});
}
function emit(obj){
  const line=JSON.stringify(obj)+'\n'; const n=Buffer.byteLength(line);
  if(!stream||shardBytes+n>MAX)open();
  stream.write(line);shardBytes+=n;
  const s=shards[shards.length-1];s.records++;s.bytes+=n;
}
async function run(){
  await load();
  let familyCount=0,duplicateCopies=0,potentialDuplicateBytes=0,crossSourceFamilies=0;
  const byCount={};
  const largest=[];
  for(const [sha,members] of groups){
    if(members.length<2)continue;
    familyCount++;duplicateCopies+=members.length-1;
    const bytes=members[0].bytes||0;
    potentialDuplicateBytes+=bytes*(members.length-1);
    const sourceIds=[...new Set(members.map(m=>m.sourceId))];
    if(sourceIds.length>1)crossSourceFamilies++;
    byCount[members.length]=(byCount[members.length]||0)+1;
    const family={sha256:sha,bytes,count:members.length,sourceIds,members};
    emit(family);
    largest.push({sha256:sha,bytes,count:members.length,duplicateBytes:bytes*(members.length-1),sourceIds});
  }
  if(stream)await new Promise(r=>stream.end(r));
  largest.sort((a,b)=>b.duplicateBytes-a.duplicateBytes);
  const summary={
    schemaVersion:1,generatedAt:new Date().toISOString(),
    familyCount,duplicateCopies,crossSourceFamilies,
    potentialDuplicateBytes,potentialDuplicateGB:Number((potentialDuplicateBytes/1024/1024/1024).toFixed(3)),
    countDistribution:byCount,
    largestFamilies:largest.slice(0,100),
    preservationRule:'No member is deleted or moved. Families establish byte identity only.',
    maxShardBytes:MAX,shards
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({ok:true,familyCount,duplicateCopies,crossSourceFamilies,potentialDuplicateGB:summary.potentialDuplicateGB,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
