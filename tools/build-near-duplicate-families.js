#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const readline=require('readline');

const root=path.resolve(__dirname,'..');
const identityDir=path.join(root,'.audit','phase-program','identity-registry');
const hashDir=path.join(root,'.audit','phase-program','content-hashes');
const outDir=path.join(root,'.audit','phase-program','near-duplicate-families');
const idManifest=JSON.parse(fs.readFileSync(path.join(identityDir,'manifest.json'),'utf8'));
const hashManifest=JSON.parse(fs.readFileSync(path.join(hashDir,'manifest.json'),'utf8'));
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});

function logicalPath(sourceId,p){
  p=p.replace(/\\/g,'/');
  if(sourceId==='LOCAL.EBDESIGN'){
    const patterns=[
      /^\.claude\/worktrees\/[^/]+\/(.+)$/i,
      /^\.archive\/old_projects\/(?:_ACTIVE_PROJECT|_UNIFIED_PROJECT)\/current\/(.+)$/i,
      /^New folder\/GitHub\/AFRERA-EBDESIGN-project\/(.+)$/i,
      /^New folder\/EBDESIGN\.worktrees\/[^/]+\/(.+)$/i,
      /^New folder\/claude_reorg_backup_[^/]+\/(?:\.claude\/worktrees\/[^/]+\/)?(.+)$/i
    ];
    for(const re of patterns){const m=p.match(re);if(m)return m[1];}
  }
  return p;
}
function neFamily(p){
  const dir=path.posix.dirname(p);
  let base=path.posix.basename(p).toLowerCase();
  const ext=path.posix.extname(base);
  let stem=base.slice(0,-ext.length);
  stem=stem.replace(/\s+-\s+copy$/i,'')
           .replace(/\s*\(\d+\)$/,'')
           .replace(/_\d+$/,'')
           .replace(/([_-])v\d+(?:[_-].*)?$/i,'$1v*')
           .replace(/\s+/g,' ')
           .trim();
  return dir+'/'+stem+ext;
}
async function loadHashes(){
  const map=new Map();
  for(const shard of hashManifest.shards){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(hashDir,shard.file)),crlfDelay:Infinity});
    for await(const line of rl){if(line){const r=JSON.parse(line);if(r.status==='OK')map.set(r.artifactId,r.sha256);}}
  }
  return map;
}
async function loadFamilies(hashById){
  const logical=new Map(), ne=new Map();
  for(const shard of idManifest.shards){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(identityDir,shard.file)),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;
      const r=JSON.parse(line); const sha=hashById.get(r.artifactId); if(!sha)continue;
      const lp=logicalPath(r.sourceId,r.relativePath);
      const key=r.extension+'|'+lp.toLowerCase();
      let a=logical.get(key);if(!a){a=[];logical.set(key,a);}
      a.push({...r,sha256:sha,logicalPath:lp});
      if(r.sourceId==='LOCAL.NE' && ['.html','.htm','.pdf','.docx','.webp','.jpg','.jpeg','.png'].includes(r.extension)){
        const nf=neFamily(r.relativePath);
        const nk=r.extension+'|'+nf;
        let b=ne.get(nk);if(!b){b=[];ne.set(nk,b);}
        b.push({...r,sha256:sha,versionFamily:nf});
      }
    }
  }
  return {logical,ne};
}
let idx=0,out=null,outBytes=0;const shards=[];
function open(){if(out)out.end();const file='families-'+String(idx++).padStart(4,'0')+'.jsonl';out=fs.createWriteStream(path.join(outDir,file));outBytes=0;shards.push({file,records:0,bytes:0});}
function emit(obj){const line=JSON.stringify(obj)+'\n',n=Buffer.byteLength(line);if(!out||outBytes+n>MAX)open();out.write(line);outBytes+=n;const s=shards.at(-1);s.records++;s.bytes+=n;}
async function run(){
  const hashById=await loadHashes();
  const {logical,ne}=await loadFamilies(hashById);
  let logicalFamilies=0,neFamilies=0,members=0;
  const samples=[];
  function processMap(map,basis){
    let count=0;
    for(const [key,arr] of map){
      const distinct=[...new Set(arr.map(x=>x.sha256))];
      if(arr.length<2||distinct.length<2)continue;
      count++;members+=arr.length;
      const sizes=arr.map(x=>x.bytes);
      const family={basis,key,memberCount:arr.length,distinctContentVersions:distinct.length,minBytes:Math.min(...sizes),maxBytes:Math.max(...sizes),members:arr};
      emit(family);if(samples.length<80)samples.push({basis,key,memberCount:arr.length,distinctContentVersions:distinct.length});
    }
    return count;
  }
  logicalFamilies=processMap(logical,'logical-path-version');
  neFamilies=processMap(ne,'ne-version-family');
  if(out)await new Promise(r=>out.end(r));
  const summary={schemaVersion:1,generatedAt:new Date().toISOString(),logicalFamilies,neFamilies,totalFamilies:logicalFamilies+neFamilies,totalMembers:members,basis:['same logical path after known wrapper/worktree normalization','NE explicit version/copy naming normalization'],preservationRule:'Near/version families are candidates for feature reconciliation only; no automatic winner or deletion.',samples,maxShardBytes:MAX,shards};
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({ok:true,logicalFamilies,neFamilies,totalFamilies:summary.totalFamilies,totalMembers:members,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
