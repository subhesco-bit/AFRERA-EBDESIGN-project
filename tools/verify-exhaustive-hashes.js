#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),readline=require('readline');
const root=path.resolve(__dirname,'..');
const dir=process.argv[2]?path.resolve(process.argv[2]):path.join(root,'.audit','phase-program','exhaustive-file-review');
const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
const aggregate=crypto.createHash('sha256');
let records=0,valid=0,missing=0,bytes=0;
(async()=>{
 for(const shard of m.shards){
  const rl=readline.createInterface({input:fs.createReadStream(path.join(dir,shard.file)),crlfDelay:Infinity});
  for await(const line of rl){
   if(!line)continue;const r=JSON.parse(line);
   if(r.relativePath&&r.sha256){
    records++;bytes+=r.bytes||0;
    if(/^[a-f0-9]{64}$/i.test(r.sha256)){valid++;aggregate.update(r.sourceId+'\0'+r.relativePath+'\0'+r.sha256+'\n');}else missing++;
   } else if(r.kind!=='symlink'){missing++;}
  }
 }
 const out={schemaVersion:1,generatedAt:new Date().toISOString(),records,validSha256:valid,missingOrInvalid:missing,totalBytes:bytes,totalGB:Number((bytes/1024/1024/1024).toFixed(3)),aggregateDigest:aggregate.digest('hex'),sourceManifest:path.relative(root,path.join(dir,'manifest.json')).replace(/\\\\/g,'/'),verificationRule:'Every regular file from exhaustive Phase 16 must have a syntactically valid SHA-256 fingerprint.'};
 const output=process.argv[3]?path.resolve(process.argv[3]):path.join(root,'.audit','phase-program','phase-018-exhaustive-fingerprint-verification.json'); fs.writeFileSync(output,JSON.stringify(out,null,2)+'\n');
 console.log(JSON.stringify({ok:missing===0&&valid===m.files,...out}));
 if(missing!==0||valid!==m.files)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
