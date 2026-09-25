#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const repoRoot=path.resolve(__dirname,'..');
const outDir=path.join(repoRoot,'.audit','phase-program','exhaustive-file-review');
const MAX_SHARD=20*1024*1024;
const READ_CHUNK=1024*1024;
const roots=[
  {id:'LOCAL.EBDESIGN',root:'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN'},
  {id:'LOCAL.CONSOLIDATED',root:'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN-consolidated'},
  {id:'LOCAL.NE',root:'C:\\Users\\DIYA GOEL\\Desktop\\ne'}
];
fs.mkdirSync(outDir,{recursive:true});
const textExt=new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs','.py','.java','.go','.rs','.cs','.ps1','.sh','.md','.txt','.json','.jsonl','.xml','.yaml','.yml','.csv','.tsv','.sql','.html','.htm','.css','.scss','.less','.env','.ini','.toml','.properties','.graphql','.gql','.vue','.svelte','.log']);
const signals={
 concept:/\b(concept|architecture|specification|blueprint|requirement|workflow|strategy)\b/gi,
 ai:/\b(ai|agent|llm|model|retrieval|embedding|knowledge graph|prompt)\b/gi,
 erp:/\b(erp|finance|inventory|warehouse|procurement|crm|hrms|manufacturing|scm|wms|tms|eam)\b/gi,
 agri:/\b(farmer|fpo|agriculture|crop|seed|livestock|village|harvest|cold chain)\b/gi,
 product:/\b(product|catalog|sku|marketplace|price|variant|gi registered)\b/gi,
 integration:/\b(api|webhook|integration|connector|oauth|oidc|socket|queue|event)\b/gi,
 test:/\b(test|spec|assert|expect|fixture|mock)\b/gi,
 secretHint:/\b(api[_-]?key|secret|password|token|private[_-]?key)\b/gi
};
let shardIndex=0,stream=null,shardBytes=0;
const shards=[];
function openShard(){
 if(stream)stream.end();
 const file='review-'+String(shardIndex++).padStart(4,'0')+'.jsonl';
 stream=fs.createWriteStream(path.join(outDir,file),{encoding:'utf8'});
 shardBytes=0; shards.push({file,records:0,bytes:0});
}
function emit(rec){
 const line=JSON.stringify(rec)+'\n',n=Buffer.byteLength(line);
 if(!stream||shardBytes+n>MAX_SHARD)openShard();
 stream.write(line); shardBytes+=n;
 const s=shards[shards.length-1];s.records++;s.bytes+=n;
}
function isInsideOut(p){
 const a=path.resolve(p).toLowerCase(),b=path.resolve(outDir).toLowerCase();
 return a===b||a.startsWith(b+path.sep);
}
function walk(sourceId,dir,relBase,cb){
 let entries;
 try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch(e){cb({kind:'walk-error',sourceId,path:relBase,error:e.message});return;}
 for(const ent of entries){
  const abs=path.join(dir,ent.name),rel=(relBase?path.join(relBase,ent.name):ent.name).replace(/\\/g,'/');
  if(isInsideOut(abs))continue;
  let st;try{st=fs.lstatSync(abs);}catch(e){cb({kind:'stat-error',sourceId,path:rel,error:e.message});continue;}
  if(st.isSymbolicLink()){let target=null;try{target=fs.readlinkSync(abs);}catch{};cb({kind:'symlink',sourceId,path:rel,target});continue;}
  if(st.isDirectory()){walk(sourceId,abs,rel,cb);continue;}
  if(st.isFile())cb({kind:'file',sourceId,path:rel,abs,stat:st});
 }
}
function inspectFile(item){
 const ext=path.extname(item.path).toLowerCase();
 const expectedText=textExt.has(ext)||path.basename(item.path).toLowerCase().startsWith('.env');
 const hash=crypto.createHash('sha256');
 const fd=fs.openSync(item.abs,'r'),buf=Buffer.allocUnsafe(READ_CHUNK);
 let bytes=0,newlines=0,nuls=0,controls=0,sampled=0,printable=0;
 let magic=Buffer.alloc(0),tail='',semantic={};for(const k of Object.keys(signals))semantic[k]=0;
 try{
  let n;
  while((n=fs.readSync(fd,buf,0,buf.length,null))>0){
   const chunk=buf.subarray(0,n);hash.update(chunk);bytes+=n;
   if(magic.length<32)magic=Buffer.concat([magic,chunk.subarray(0,32-magic.length)]);
   for(let i=0;i<n;i++){const b=chunk[i];if(b===10)newlines++;if(b===0)nuls++;if(sampled<65536){sampled++;if(b===9||b===10||b===13||(b>=32&&b<=126))printable++;else if(b<32)controls++;}}
   if(expectedText){
    const txt=tail+chunk.toString('utf8');
    for(const [k,re] of Object.entries(signals)){re.lastIndex=0;let c=0,m;while((m=re.exec(txt))&&c<5000)c++;semantic[k]+=c;}
    tail=txt.slice(-256);
   }
  }
 } finally{fs.closeSync(fd);}
 const textConfidence=sampled?printable/sampled:1;
 const contentMode=expectedText&&nuls===0&&textConfidence>0.80?'TEXT_STREAM_INSPECTED':'BINARY_OR_OPAQUE_FULLY_HASHED';
 return {
  sourceId:item.sourceId,relativePath:item.path,bytes,modifiedTime:item.stat.mtime.toISOString(),
  extension:ext,sha256:hash.digest('hex'),magicHex:magic.toString('hex'),
  contentMode,textConfidence:Number(textConfidence.toFixed(4)),newlines,nulBytes:nuls,
  semanticSignals:contentMode==='TEXT_STREAM_INSPECTED'?semantic:null,
  decisionState:'UNDECIDED',dispositionAllowed:false
 };
}
async function run(){
 const started=new Date().toISOString();
 let files=0,symlinks=0,errors=0,totalBytes=0,textReviewed=0,binaryReviewed=0;
 const bySource={};
 for(const source of roots){
  bySource[source.id]={files:0,bytes:0,symlinks:0,errors:0};
  walk(source.id,source.root,'',item=>{
   if(item.kind==='file'){
    try{
     const rec=inspectFile(item);emit(rec);files++;totalBytes+=rec.bytes;bySource[source.id].files++;bySource[source.id].bytes+=rec.bytes;
     if(rec.contentMode==='TEXT_STREAM_INSPECTED')textReviewed++;else binaryReviewed++;
     if(files%10000===0)process.stderr.write('reviewed '+files+' files / '+(totalBytes/1024/1024/1024).toFixed(2)+' GB\n');
    }catch(e){errors++;bySource[source.id].errors++;emit({sourceId:source.id,relativePath:item.path,reviewError:e.message,decisionState:'UNDECIDED',dispositionAllowed:false});}
   }else if(item.kind==='symlink'){symlinks++;bySource[source.id].symlinks++;emit({...item,decisionState:'UNDECIDED',dispositionAllowed:false});}
   else{errors++;bySource[source.id].errors++;emit({...item,decisionState:'UNDECIDED',dispositionAllowed:false});}
  });
 }
 if(stream)await new Promise(r=>stream.end(r));
 const manifest={schemaVersion:1,startedAt:started,completedAt:new Date().toISOString(),scopeRoots:roots,outputDirectoryExcludedBecauseCreatedByThisScan:outDir,rule:'Every pre-existing regular file was read byte-for-byte for SHA-256. Text-like files were also streamed for content signals. No disposition decision was made.',files,symlinks,errors,totalBytes,totalGB:Number((totalBytes/1024/1024/1024).toFixed(3)),textReviewed,binaryReviewed,bySource,maxShardBytes:MAX_SHARD,shards};
 fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({ok:errors===0,files,symlinks,errors,totalGB:manifest.totalGB,textReviewed,binaryReviewed,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
