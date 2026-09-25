#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');

const root=path.resolve(process.argv[2]||'.');
const output=process.argv[3]?path.resolve(process.argv[3]):null;
const label=process.argv[4]||path.basename(root);
const prune=new Set(['.git','node_modules','dist','build','coverage','.cache','.vite','.turbo','.next','out','__pycache__','.pytest_cache','.parcel-cache']);
const extCounts={};
const extBytes={};
const top={};
const notable=[];
const conceptCandidates=[];
const largest=[];
let files=0,dirs=0,bytes=0,errors=0;

function addLargest(item){
  largest.push(item);
  largest.sort((a,b)=>b.bytes-a.bytes);
  if(largest.length>60) largest.length=60;
}
function classify(name,ext){
  const n=name.toLowerCase();
  if(['.js','.jsx','.ts','.tsx','.py','.java','.go','.rs','.cs','.ps1','.sh'].includes(ext)) return 'code';
  if(['.md','.txt','.pdf','.docx','.pptx'].includes(ext)) return 'document';
  if(['.json','.csv','.tsv','.xlsx','.xls','.xml','.yaml','.yml'].includes(ext)) return 'data-config';
  if(['.png','.jpg','.jpeg','.webp','.gif','.svg'].includes(ext)) return 'image';
  if(['.db','.sqlite','.sqlite3'].includes(ext)) return 'database';
  if(['.zip','.7z','.rar','.tar','.gz'].includes(ext)) return 'archive';
  if(n.startsWith('.env')) return 'secret-config';
  return 'other';
}
function walk(dir,relBase=''){
  let entries;
  try{entries=fs.readdirSync(dir,{withFileTypes:true});}catch(e){errors++;return;}
  for(const ent of entries){
    if(ent.name==='.'||ent.name==='..') continue;
    const abs=path.join(dir,ent.name);
    const rel=relBase?path.join(relBase,ent.name):ent.name;
    if(ent.isDirectory()){
      if(prune.has(ent.name)) continue;
      dirs++;
      walk(abs,rel);
      continue;
    }
    if(!ent.isFile()) continue;
    let st;
    try{st=fs.statSync(abs);}catch(e){errors++;continue;}
    files++; bytes+=st.size;
    const ext=path.extname(ent.name).toLowerCase()||'<none>';
    extCounts[ext]=(extCounts[ext]||0)+1;
    extBytes[ext]=(extBytes[ext]||0)+st.size;
    const first=rel.split(/[\\/]/)[0]||'.';
    if(!top[first]) top[first]={files:0,bytes:0};
    top[first].files++; top[first].bytes+=st.size;
    const lower=ent.name.toLowerCase();
    if(/^(package(-lock)?\.json|docker-compose.*\.ya?ml|compose.*\.ya?ml|vite\.config\.|tsconfig.*\.json|requirements.*\.txt|pyproject\.toml|pom\.xml|go\.mod|cargo\.toml)$/i.test(ent.name)){
      notable.push(rel.replace(/\\/g,'/'));
    }
    if(/concept|architecture|specification|blueprint|directive|strategy|operating.?system|anatomy|intelligence|framework|roadmap|design/i.test(ent.name)
       && !/index|audit|report|status|summary|inventory|manifest/i.test(ent.name)){
      if(conceptCandidates.length<500) conceptCandidates.push(rel.replace(/\\/g,'/'));
    }
    addLargest({path:rel.replace(/\\/g,'/'),bytes:st.size,classification:classify(ent.name,ext)});
  }
}
walk(root);
const ext=Object.keys(extCounts).map(k=>({extension:k,files:extCounts[k],bytes:extBytes[k]})).sort((a,b)=>b.files-a.files);
const topLevel=Object.entries(top).map(([name,v])=>({name,...v})).sort((a,b)=>b.bytes-a.bytes);
const report={
  schemaVersion:1,
  generatedAt:new Date().toISOString(),
  label,
  root,
  pruning:[...prune],
  note:'Counts exclude pruned dependency/build/cache directories and therefore represent authored/relevant discovery surface, not raw disk occupancy.',
  totals:{files,directories:dirs,bytes,gb:Number((bytes/1024/1024/1024).toFixed(3)),errors},
  byExtension:ext.slice(0,80),
  topLevel:topLevel.slice(0,100),
  notableManifests:[...new Set(notable)].sort(),
  conceptCandidates:[...new Set(conceptCandidates)].sort(),
  largestAuthoredFiles:largest
};
const json=JSON.stringify(report,null,2)+'\n';
if(output){fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,json);}
else process.stdout.write(json);
if(output) console.log(JSON.stringify({ok:true,output,totals:report.totals,conceptCandidates:report.conceptCandidates.length,notableManifests:report.notableManifests.length}));
