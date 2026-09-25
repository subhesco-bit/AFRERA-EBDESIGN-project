#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const cp=require('child_process');

const root=path.resolve(__dirname,'..');
const phase=process.argv[2]||'unknown';
const note=process.argv.slice(3).join(' ')||'checkpoint';

function git(args){
  return cp.execFileSync('git',args,{cwd:root,encoding:'utf8',maxBuffer:64*1024*1024});
}
function stamp(){
  return new Date().toISOString().replace(/[:.]/g,'-');
}
function sha(file){
  const h=crypto.createHash('sha256');
  h.update(fs.readFileSync(file));
  return h.digest('hex');
}
const dir=path.join(root,'.audit','phase-program','checkpoints',stamp()+'-phase-'+phase);
fs.mkdirSync(dir,{recursive:true});
const head=git(['rev-parse','HEAD']).trim();
const branch=git(['branch','--show-current']).trim();
const status=git(['status','--porcelain=v2','--branch']);
const working=git(['diff','--binary']);
const staged=git(['diff','--cached','--binary']);
const untracked=git(['ls-files','--others','--exclude-standard']).split(/\r?\n/).filter(Boolean);

fs.writeFileSync(path.join(dir,'status.txt'),status);
fs.writeFileSync(path.join(dir,'working.patch'),working);
fs.writeFileSync(path.join(dir,'staged.patch'),staged);
fs.writeFileSync(path.join(dir,'untracked.txt'),untracked.join('\n')+(untracked.length?'\n':''));

const untrackedMeta=untracked.map(rel=>{
  const abs=path.join(root,rel);
  const st=fs.statSync(abs);
  return {
    path:rel.replace(/\\/g,'/'),
    bytes:st.isFile()?st.size:null,
    sha256:st.isFile()?sha(abs):null,
    kind:st.isFile()?'file':st.isDirectory()?'directory':'other'
  };
});
const meta={
  createdAt:new Date().toISOString(),
  phase,
  note,
  branch,
  head,
  files:{
    status:'status.txt',
    workingPatch:'working.patch',
    stagedPatch:'staged.patch',
    untrackedList:'untracked.txt'
  },
  untracked:untrackedMeta,
  rollback:{
    instructions:[
      'Do not run reset/clean automatically.',
      'Review status.txt and patches first.',
      'Use git apply --reverse only for changes produced after this checkpoint and only after protecting user edits.',
      'Untracked files require explicit file-by-file review before removal.'
    ]
  }
};
fs.writeFileSync(path.join(dir,'checkpoint.json'),JSON.stringify(meta,null,2)+'\n');
console.log(JSON.stringify({ok:true,dir:path.relative(root,dir).replace(/\\/g,'/'),branch,head,untracked:untracked.length},null,2));
