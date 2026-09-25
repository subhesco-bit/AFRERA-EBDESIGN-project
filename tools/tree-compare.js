#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const source=path.resolve(process.argv[2]||'.');
const target=path.resolve(process.argv[3]||'.');
const outDir=path.resolve(process.argv[4]||'.');
const prune=new Set(['.git','node_modules','dist','build','coverage','.cache','.vite','.turbo','.next','out','__pycache__','.pytest_cache','.parcel-cache']);
fs.mkdirSync(outDir,{recursive:true});
const mapPath=path.join(outDir,'file-map.jsonl');
const stream=fs.createWriteStream(mapPath,{encoding:'utf8'});
const counts={sourceFiles:0,exact:0,changed:0,sourceOnly:0,errors:0};
const byExt={};
const changedSample=[];
const sourceOnlySample=[];

function hashFile(file){
  const h=crypto.createHash('sha256');
  const fd=fs.openSync(file,'r');
  const buf=Buffer.allocUnsafe(1024*1024);
  try{
    let n;
    while((n=fs.readSync(fd,buf,0,buf.length,null))>0)h.update(buf.subarray(0,n));
  }finally{fs.closeSync(fd);}
  return h.digest('hex');
}
function walk(dir,relBase=''){
  let entries;
  try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch(e){counts.errors++;return;}
  for(const ent of entries){
    const src=path.join(dir,ent.name);
    const rel=relBase?path.join(relBase,ent.name):ent.name;
    if(ent.isDirectory()){
      if(prune.has(ent.name))continue;
      walk(src,rel);
      continue;
    }
    if(!ent.isFile())continue;
    counts.sourceFiles++;
    const ext=path.extname(ent.name).toLowerCase()||'<none>';
    byExt[ext]=(byExt[ext]||0)+1;
    const dst=path.join(target,rel);
    let rec={path:rel.replace(/\\/g,'/'),sourceBytes:null,targetExists:false,targetBytes:null,status:null,sha256:null,targetSha256:null};
    try{
      const ss=fs.statSync(src);
      rec.sourceBytes=ss.size;
      if(fs.existsSync(dst)&&fs.statSync(dst).isFile()){
        rec.targetExists=true;
        const ts=fs.statSync(dst);
        rec.targetBytes=ts.size;
        if(ss.size!==ts.size){
          rec.status='CHANGED';
          counts.changed++;
        }else{
          rec.sha256=hashFile(src);
          rec.targetSha256=hashFile(dst);
          if(rec.sha256===rec.targetSha256){rec.status='EXACT';counts.exact++;}
          else{rec.status='CHANGED';counts.changed++;}
        }
      }else{
        rec.status='SOURCE_ONLY';
        counts.sourceOnly++;
      }
    }catch(e){
      rec.status='ERROR';
      rec.error=String(e.message||e);
      counts.errors++;
    }
    if(rec.status==='CHANGED'&&changedSample.length<300)changedSample.push(rec);
    if(rec.status==='SOURCE_ONLY'&&sourceOnlySample.length<300)sourceOnlySample.push(rec);
    stream.write(JSON.stringify(rec)+'\n');
  }
}
walk(source);
stream.end();
stream.on('finish',()=>{
  const summary={
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    source,
    target,
    pruning:[...prune],
    counts,
    exactPercent:counts.sourceFiles?Number((counts.exact*100/counts.sourceFiles).toFixed(2)):0,
    byExtension:Object.entries(byExt).map(([extension,files])=>({extension,files})).sort((a,b)=>b.files-a.files),
    changedSample,
    sourceOnlySample,
    mapFile:path.basename(mapPath)
  };
  fs.writeFileSync(path.join(outDir,'summary.json'),JSON.stringify(summary,null,2)+'\n');
  console.log(JSON.stringify({ok:true,counts,exactPercent:summary.exactPercent,summary:path.join(outDir,'summary.json'),map:mapPath}));
});
