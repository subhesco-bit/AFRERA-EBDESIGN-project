#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const { WorkflowDefinitionRegistry }=require(path.join(root,'backend','src','core','workflowDefinitionRegistry'));
const { registerCanonicalWorkflows }=require(path.join(root,'backend','src','core','workflowCatalog'));
const outDir=path.join(root,'.audit','phase-program','workflow-catalog');
fs.mkdirSync(outDir,{recursive:true});

const registry=new WorkflowDefinitionRegistry();
const canonical=registerCanonicalWorkflows(registry);
const candidates=[];
const roots=[path.join(root,'backend','src'),path.join(root,'modules')];
const skip=new Set(['node_modules','.git','dist','build','coverage','.cache']);
function walk(dir){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(skip.has(ent.name))continue;
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())walk(p);
  else if(ent.isFile()&&/\.(js|ts|json|md)$/i.test(ent.name)){
   let text='';try{text=fs.readFileSync(p,'utf8')}catch{continue;}
   const rel=path.relative(root,p).replace(/\\/g,'/');
   const score=[/workflow/i,/state\s*machine/i,/TRANSITIONS/,/SLA/i,/compensation/i,/approval/i].reduce((n,re)=>n+(re.test(text)?1:0),0);
   if(score>=2)candidates.push({file:rel,signals:score,hasTransitions:/TRANSITIONS|allowedTransitions|_STATES/.test(text),hasSla:/SLA|sla_/i.test(text),hasCompensation:/compensation/i.test(text),hasApproval:/approval/i.test(text)});
  }
 }
}
for(const dir of roots)if(fs.existsSync(dir))walk(dir);
candidates.sort((a,b)=>b.signals-a.signals||a.file.localeCompare(b.file));
const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),canonicalCount:canonical.length,canonical,discoveredCandidateCount:candidates.length,discoveredCandidates:candidates.slice(0,1000),governance:{validator:'backend/src/core/workflowDefinitionRegistry.js',engine:'backend/src/services/flows/workflowEngine.js',catalog:'backend/src/core/workflowCatalog.js'},rules:['Canonical means validated by registry; it does not imply every specialist workflow has been normalized yet.','Discovered candidates remain preserved and are later migrated/bridged, not deleted.','Step workflows and state machines are both supported.','SLA, approvals, exceptions and compensation remain explicit metadata.']};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({ok:true,canonicalCount:canonical.length,discoveredCandidateCount:candidates.length,bytes:fs.statSync(path.join(outDir,'manifest.json')).size}));
