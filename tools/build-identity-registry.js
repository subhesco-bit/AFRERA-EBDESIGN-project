#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(__dirname,'..');
const outDir=path.join(root,'.audit','phase-program','identity-registry');
const MAX=20*1024*1024;
const sources=[
  {id:'LOCAL.EBDESIGN',root:'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN'},
  {id:'LOCAL.CONSOLIDATED',root:'C:\\Users\\DIYA GOEL\\Downloads\\EBDESIGN-consolidated'},
  {id:'LOCAL.NE',root:'C:\\Users\\DIYA GOEL\\Desktop\\ne'}
];
const prune=new Set(['.git','node_modules','dist','build','coverage','.cache','.vite','.turbo','.next','out','__pycache__','.pytest_cache','.parcel-cache']);
fs.mkdirSync(outDir,{recursive:true});

function idFor(source,rel){return crypto.createHash('sha256').update(source+'\0'+rel).digest('hex');}
function role(rel,ext){
  const r=rel.toLowerCase();
  if(r.includes('/.archive/')||r.startsWith('.archive/'))return 'historical';
  if(r.includes('/worktree')||r.includes('/worktrees/'))return 'alternate-worktree';
  if(r.includes('_ebdesign_library'))return 'library-evidence';
  if(['.js','.jsx','.ts','.tsx','.py','.java','.go','.rs','.cs','.ps1','.sh'].includes(ext))return 'code';
  if(['.md','.txt','.pdf','.docx','.pptx'].includes(ext))return 'document';
  if(['.json','.csv','.tsv','.xlsx','.xls','.xml','.yaml','.yml','.sql'].includes(ext))return 'data-config';
  if(['.png','.jpg','.jpeg','.webp','.gif','.svg'].includes(ext))return 'visual-asset';
  if(['.zip','.7z','.rar','.tar','.gz'].includes(ext))return 'archive';
  return 'other';
}
let shard=0,bytes=0,stream=null,records=0;
const shards=[];
function openShard(){
  if(stream)stream.end();
  const name='identity-'+String(shard++).padStart(4,'0')+'.jsonl';
  const file=path.join(outDir,name);
  stream=fs.createWriteStream(file,{encoding:'utf8'});
  bytes=0;
  shards.push({file:name,records:0,bytes:0});
}
function write(rec){
  const line=JSON.stringify(rec)+'\n';
  const n=Buffer.byteLength(line);
  if(!stream||bytes+n>MAX)openShard();
  stream.write(line);
  bytes+=n;
  records++;
  const s=shards[shards.length-1];
  s.records++;s.bytes+=n;
}
function walk(source,dir,relBase=''){
  let entries;
  try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch{return;}
  for(const ent of entries){
    const abs=path.join(dir,ent.name);
    const rel=(relBase?path.join(relBase,ent.name):ent.name).replace(/\\/g,'/');
    if(ent.isDirectory()){
      if(prune.has(ent.name))continue;
      walk(source,abs,rel);
      continue;
    }
    if(!ent.isFile())continue;
    let st;try{st=fs.statSync(abs);}catch{continue;}
    const ext=path.extname(ent.name).toLowerCase();
    write({
      artifactId:idFor(source.id,rel),
      sourceId:source.id,
      relativePath:rel,
      extension:ext,
      bytes:st.size,
      modifiedTime:st.mtime.toISOString(),
      role:role(rel,ext)
    });
  }
}
for(const source of sources){walk(source,source.root);}
if(stream)stream.end();
setTimeout(()=>{
  const manifest={
    schemaVersion:1,
    generatedAt:new Date().toISOString(),
    identityRule:'sha256(sourceId + NUL + normalizedRelativePath)',
    contentHashDeferredToPhase018:true,
    maxShardBytes:MAX,
    sources,
    pruning:[...prune],
    totalRecords:records,
    shards
  };
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({ok:true,totalRecords:records,shards:shards.length,maxShardMB:Math.max(...shards.map(s=>s.bytes))/1024/1024,manifest:path.join(outDir,'manifest.json')}));
},500);
