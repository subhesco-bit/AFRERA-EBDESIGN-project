#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const readline=require('readline');
const root=path.resolve(__dirname,'..');
const reviewDir=path.resolve(process.argv[2]||path.join(root,'.audit','phase-program','exhaustive-file-review-rerun-20260925-172329'));
const outDir=path.resolve(process.argv[3]||path.join(root,'.audit','phase-program','near-duplicate-families-exhaustive-rerun-20260925-172329'));
const manifest=JSON.parse(fs.readFileSync(path.join(reviewDir,'manifest.json'),'utf8'));
const MAX=20*1024*1024;
fs.mkdirSync(outDir,{recursive:true});

function logicalPath(sourceId,p){
  p=p.replace(/\\/g,'/');
  if(sourceId==='LOCAL.EBDESIGN'){
    const patterns=[
      /^\.claude\/worktrees\/[^/]+\/(.+)$/i,
      /^\.archive\/old_projects\/(?:_ACTIVE_PROJECT|_UNIFIED_PROJECT|_MERGE_LAB)\/(?:current\/)?(.+)$/i,
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
  const ext=path.posix.extname(p).toLowerCase();
  let stem=path.posix.basename(p,ext).toLowerCase();
  stem=stem.replace(/\s+-\s+copy$/i,'').replace(/\s*\(\d+\)$/,'').replace(/_\d+$/,'').replace(/([_-])v\d+(?:[_-].*)?$/i,'$1v*').replace(/\s+/g,' ').trim();
  return dir+'/'+stem+ext;
}

const logical=new Map(),ne=new Map();
async function load(){
  for(const shard of manifest.shards){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(reviewDir,shard.file)),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;
      const r=JSON.parse(line);
      if(!r.relativePath||!r.sha256)continue;
      const ext=(r.extension||path.extname(r.relativePath)).toLowerCase();
      const lp=logicalPath(r.sourceId,r.relativePath);
      const key=ext+'|'+lp.toLowerCase();
      let a=logical.get(key);if(!a){a=[];logical.set(key,a);}a.push({sourceId:r.sourceId,path:r.relativePath,logicalPath:lp,bytes:r.bytes,sha256:r.sha256,contentMode:r.contentMode});
      if(r.sourceId==='LOCAL.NE'&&['.html','.htm','.pdf','.docx','.jpg','.jpeg','.png','.webp'].includes(ext)){
        const fam=neFamily(r.relativePath),nk=ext+'|'+fam;
        let b=ne.get(nk);if(!b){b=[];ne.set(nk,b);}b.push({sourceId:r.sourceId,path:r.relativePath,versionFamily:fam,bytes:r.bytes,sha256:r.sha256,contentMode:r.contentMode});
      }
    }
  }
}

let idx=0,out=null,outBytes=0;const shards=[];
function open(){if(out)out.end();const file='families-'+String(idx++).padStart(4,'0')+'.jsonl';out=fs.createWriteStream(path.join(outDir,file));outBytes=0;shards.push({file,records:0,bytes:0});}
function emit(obj){const line=JSON.stringify(obj)+'\n',n=Buffer.byteLength(line);if(!out||outBytes+n>MAX)open();out.write(line);outBytes+=n;const s=shards[shards.length-1];s.records++;s.bytes+=n;}

(async()=>{
  await load();
  let logicalFamilies=0,neFamilies=0,totalMembers=0;
  const samples=[];
  function processMap(map,basis){
    let count=0;
    for(const [key,members] of map){
      if(members.length<2)continue;
      const hashes=[...new Set(members.map(x=>x.sha256))];
      if(hashes.length<2)continue;
      count++;totalMembers+=members.length;
      const sizes=members.map(x=>x.bytes||0);
      const family={basis,key,memberCount:members.length,distinctContentVersions:hashes.length,minBytes:Math.min(...sizes),maxBytes:Math.max(...sizes),members};
      emit(family);
      if(samples.length<100)samples.push({basis,key,memberCount:members.length,distinctContentVersions:hashes.length});
    }
    return count;
  }
  logicalFamilies=processMap(logical,'logical-path-version');
  neFamilies=processMap(ne,'ne-explicit-version-family');
  if(out)await new Promise(r=>out.end(r));
  const summary={schemaVersion:1,generatedAt:new Date().toISOString(),sourceFiles:manifest.files,sourceManifest:path.relative(root,path.join(reviewDir,'manifest.json')).replace(/\\/g,'/'),logicalFamilies,neFamilies,totalFamilies:logicalFamilies+neFamilies,totalMembers,basis:['same logical path after known wrapper/worktree normalization','NE explicit version/copy naming normalization'],preservationRule:'Candidate versions only; no automatic winner, deletion, move, or overwrite.',samples,maxShardBytes:MAX,shards};
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({ok:true,sourceFiles:manifest.files,logicalFamilies,neFamilies,totalFamilies:summary.totalFamilies,totalMembers,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
