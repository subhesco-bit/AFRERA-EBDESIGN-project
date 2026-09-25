#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const cp=require('child_process');

const root=path.resolve(__dirname,'..');
const LIMIT=25*1024*1024;
const args=new Set(process.argv.slice(2));
const violations=[];

function add(file,source){
  try{
    const st=fs.statSync(file);
    if(st.isFile() && st.size>LIMIT){
      violations.push({path:path.relative(root,file).replace(/\\/g,'/'),bytes:st.size,mb:Number((st.size/1024/1024).toFixed(2)),source});
    }
  }catch{}
}
function walk(dir,source){
  if(!fs.existsSync(dir))return;
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const p=path.join(dir,ent.name);
    if(ent.isDirectory())walk(p,source);
    else if(ent.isFile())add(p,source);
  }
}

if(args.has('--staged')){
  const out=cp.execFileSync('git',['diff','--cached','--name-only','--diff-filter=ACMR'],{cwd:root,encoding:'utf8'});
  out.split(/\r?\n/).filter(Boolean).forEach(rel=>add(path.join(root,rel),'staged'));
} else {
  walk(path.join(root,'.ai','autonomous-program'),'program');
  walk(path.join(root,'.audit','phase-program'),'evidence');
  for(const f of ['checkpoint.js','evidence-record.js','phase-controller.js','source-inventory.js','tree-compare.js','file-size-guard.js']){
    add(path.join(root,'tools',f),'tooling');
  }
}
if(violations.length){
  console.error(JSON.stringify({ok:false,limitMB:25,violations},null,2));
  process.exit(1);
}
console.log(JSON.stringify({ok:true,limitMB:25,checked:args.has('--staged')?'staged-files':'program-evidence-tooling'}));
