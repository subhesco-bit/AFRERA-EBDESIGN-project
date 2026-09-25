#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const readline=require('readline');

const root=path.resolve(__dirname,'..');
const identityDir=path.join(root,'.audit','phase-program','identity-registry');
const outDir=path.join(root,'.audit','phase-program','content-hashes');
const manifest=JSON.parse(fs.readFileSync(path.join(identityDir,'manifest.json'),'utf8'));
const sourceRoots=Object.fromEntries(manifest.sources.map(s=>[s.id,s.root]));
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});

function hashFile(file){
  const h=crypto.createHash('sha256');
  const fd=fs.openSync(file,'r');
  const buf=Buffer.allocUnsafe(1024*1024);
  try{
    let n;
    while((n=fs.readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,n));
  } finally {fs.closeSync(fd);}
  return h.digest('hex');
}
let shardIndex=0, shardBytes=0, out=null, total=0, errors=0, hashedBytes=0;
const shards=[];
function openShard(){
  if(out)out.end();
  const file='hashes-'+String(shardIndex++).padStart(4,'0')+'.jsonl';
  out=fs.createWriteStream(path.join(outDir,file),{encoding:'utf8'});
  shardBytes=0;
  shards.push({file,records:0,bytes:0});
}
function emit(rec){
  const line=JSON.stringify(rec)+'\n';
  const n=Buffer.byteLength(line);
  if(!out||shardBytes+n>MAX)openShard();
  out.write(line); shardBytes+=n;
  const s=shards[shards.length-1];s.records++;s.bytes+=n;
}
async function run(){
  for(const shard of manifest.shards){
    const file=path.join(identityDir,shard.file);
    const rl=readline.createInterface({input:fs.createReadStream(file),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;
      const rec=JSON.parse(line);
      const sourceRoot=sourceRoots[rec.sourceId];
      const abs=path.join(sourceRoot,...rec.relativePath.split('/'));
      let sha256=null,status='OK',actualBytes=null;
      try{
        const st=fs.statSync(abs);
        actualBytes=st.size;
        sha256=hashFile(abs);
        hashedBytes+=st.size;
      }catch(e){
        status='ERROR';errors++;
      }
      emit({
        artifactId:rec.artifactId,
        sourceId:rec.sourceId,
        relativePath:rec.relativePath,
        bytes:actualBytes,
        sha256,
        status
      });
      total++;
      if(total%10000===0)process.stderr.write('hashed '+total+' files\n');
    }
  }
  if(out) await new Promise(resolve=>out.end(resolve));
  const result={
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    algorithm:'SHA-256',
    totalRecords:total,
    errors,
    hashedBytes,
    hashedGB:Number((hashedBytes/1024/1024/1024).toFixed(3)),
    maxShardBytes:MAX,
    shards
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(result,null,2)+'\n');
  console.log(JSON.stringify({ok:errors===0,total,errors,hashedGB:result.hashedGB,shards:shards.length,maxShardMB:Math.max(...shards.map(x=>x.bytes))/1024/1024}));
}
run().catch(err=>{console.error(err.stack||err);process.exit(1);});
