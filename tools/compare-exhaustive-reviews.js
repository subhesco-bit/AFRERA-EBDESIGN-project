#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const readline=require('readline');
const root=path.resolve(__dirname,'..');
const oldDir=path.join(root,'.audit','phase-program','exhaustive-file-review');
const newDir=path.join(root,'.audit','phase-program','exhaustive-file-review-rerun-20260925-172329');

async function load(dir){
  const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  const map=new Map();
  for(const shard of m.shards){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(dir,shard.file)),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;
      const r=JSON.parse(line);
      if(!r.relativePath)continue;
      map.set(r.sourceId+'\0'+r.relativePath,{sha256:r.sha256||null,bytes:r.bytes||null,sourceId:r.sourceId,path:r.relativePath,contentMode:r.contentMode||null});
    }
  }
  return {manifest:m,map};
}

(async()=>{
  const old=await load(oldDir),cur=await load(newDir);
  let unchanged=0,changed=0,missing=0,added=0;
  const missingSample=[],changedSample=[],addedSample=[];
  for(const [k,a] of old.map){
    const b=cur.map.get(k);
    if(!b){missing++;if(missingSample.length<200)missingSample.push(a);continue;}
    if(a.sha256===b.sha256){unchanged++;}else{changed++;if(changedSample.length<200)changedSample.push({sourceId:a.sourceId,path:a.path,oldSha256:a.sha256,newSha256:b.sha256,oldBytes:a.bytes,newBytes:b.bytes});}
  }
  for(const [k,b] of cur.map){if(!old.map.has(k)){added++;if(addedSample.length<200)addedSample.push(b);}}
  const out={schemaVersion:1,generatedAt:new Date().toISOString(),oldFiles:old.manifest.files,newFiles:cur.manifest.files,oldTotalGB:old.manifest.totalGB,newTotalGB:cur.manifest.totalGB,unchanged,changed,missing,added,missingSample,changedSample,addedSample,passCondition:'missing === 0; changed files are retained and must be reconciled, not deleted',oldManifest:path.relative(root,path.join(oldDir,'manifest.json')).replace(/\\/g,'/'),newManifest:path.relative(root,path.join(newDir,'manifest.json')).replace(/\\/g,'/')};
  const outFile=path.join(root,'.audit','phase-program','phase-016-rerun-comparison.json');
  fs.writeFileSync(outFile,JSON.stringify(out,null,2)+'\n');
  console.log(JSON.stringify({ok:missing===0,oldFiles:out.oldFiles,newFiles:out.newFiles,unchanged,changed,missing,added,outFile}));
  if(missing!==0)process.exitCode=2;
})().catch(e=>{console.error(e.stack||e);process.exit(1);});
