#!/usr/bin/env node
'use strict';

const fs=require('fs');
const path=require('path');
const readline=require('readline');
const {DependencyGraph}=require('../backend/src/core/dependencyGraph');

const root=path.resolve(__dirname,'..');
const outDir=path.join(root,'.audit','phase-program','dependency-graph');
fs.mkdirSync(outDir,{recursive:true});
const graph=new DependencyGraph();

function readJson(file){try{return JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));}catch{return null;}}
function rel(file){return path.relative(root,file).replace(/\\/g,'/');}

function addRuntimeModules(){
  const modulesRoot=path.join(root,'modules');
  if(fs.existsSync(modulesRoot)){
    for(const ent of fs.readdirSync(modulesRoot,{withFileTypes:true})){
      if(!ent.isDirectory())continue;
      const manifestPath=path.join(modulesRoot,ent.name,'module.json');
      if(!fs.existsSync(manifestPath))continue;
      const m=readJson(manifestPath);if(!m)continue;
      const id='MODULE:'+(m.moduleId||ent.name);
      graph.addNode(id,{kind:'module',path:rel(manifestPath),name:m.name||m.moduleId||ent.name,status:m.status||'unknown'});
      const deps=m.dependencies||{};
      for(const dep of deps.modules||[])graph.addEdge(id,'MODULE:'+dep,'module');
      for(const dep of deps.services||[])graph.addEdge(id,'SERVICE:'+dep,'service');
      for(const dep of deps.data||[])graph.addEdge(id,'DATA:'+dep,'data');
      for(const dep of deps.external||[])graph.addEdge(id,'EXTERNAL:'+dep,'external');
      for(const [pkg] of Object.entries(deps.libraries||{}))graph.addEdge(id,'EXTERNAL:'+pkg,'external-library');
    }
  }
  const backendRoot=path.join(root,'backend','src','modules');
  if(fs.existsSync(backendRoot)){
    for(const ent of fs.readdirSync(backendRoot,{withFileTypes:true})){
      if(!ent.isDirectory()||!/^M\d+/.test(ent.name))continue;
      const id='MODULE:BACKEND:'+ent.name;
      const modulePath=path.join(backendRoot,ent.name);
      graph.addNode(id,{kind:'module',path:rel(modulePath),name:ent.name,status:'unverified'});
      for(const f of ['service.js','routes.js','controller.js','model.sql']){
        const p=path.join(modulePath,f);if(fs.existsSync(p))graph.addEdge(id,(f==='model.sql'?'DATA:':'RUNTIME:')+rel(p),f==='model.sql'?'data':'runtime');
      }
    }
  }
}

async function addStructuralEdges(){
  const dir=path.join(root,'.audit','phase-program','structural-code');
  const manifest=readJson(path.join(dir,'manifest.json'));if(!manifest)return;
  for(const sh of manifest.shards||[]){
    const rl=readline.createInterface({input:fs.createReadStream(path.join(dir,sh.file)),crlfDelay:Infinity});
    for await(const line of rl){
      if(!line)continue;const rec=JSON.parse(line);
      let kind='runtime';
      if(rec.path.startsWith('backend/src/services/'))kind='service';
      else if(rec.path.startsWith('backend/src/routes/'))kind='route';
      else if(rec.path.startsWith('frontend/'))kind='ui';
      const id=kind.toUpperCase()+':'+rec.path;
      graph.addNode(id,{kind,path:rec.path});
      for(const dep of rec.dependencyEdges||[]){
        if(dep.startsWith('.')){
          const sourceAbs=path.join(root,rec.path);
          let target=path.resolve(path.dirname(sourceAbs),dep);
          const candidates=[target,target+'.js',target+'.json',path.join(target,'index.js')];
          const found=candidates.find(fs.existsSync);
          const targetRel=found?rel(found):rel(target);
          graph.addEdge(id,'RUNTIME:'+targetRel,'runtime-import',{raw:dep,resolved:Boolean(found)});
        }else{
          const pkg=dep.startsWith('@')?dep.split('/').slice(0,2).join('/'):dep.split('/')[0];
          graph.addEdge(id,'EXTERNAL:'+pkg,'external-import',{raw:dep});
        }
      }
    }
  }
}

async function run(){
  addRuntimeModules();await addStructuralEdges();
  const json=graph.toJSON();
  const cycles=json.cycles;
  const orphans=[...graph.nodes.values()].filter((n)=>['module','service','route','ui'].includes(n.kind)).filter((n)=>(graph.out.get(n.id)?.size||0)===0&&(graph.incoming.get(n.id)?.size||0)===0);
  const byKind={};for(const n of graph.nodes.values())byKind[n.kind||'unknown']=(byKind[n.kind||'unknown']||0)+1;
  const byType={};for(const e of graph.edges())byType[e.type]=(byType[e.type]||0)+1;
  const graphPath=path.join(outDir,'graph.jsonl');
  const stream=fs.createWriteStream(graphPath,{encoding:'utf8'});
  for(const n of graph.nodes.values())stream.write(JSON.stringify({kind:'node',...n})+'\n');
  for(const e of graph.edges())stream.write(JSON.stringify({kind:'edge',...e})+'\n');
  await new Promise((resolve)=>stream.end(resolve));
  const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),nodes:graph.nodes.size,edges:graph.edges().length,byKind,byType,cycles:cycles.length,cycleSamples:cycles.slice(0,100),orphans:orphans.length,orphanSamples:orphans.slice(0,200),graphFile:'graph.jsonl',rule:'Orphans and cycles are reconciliation findings only; no node is deleted or disabled by this phase.'};
  fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(JSON.stringify({ok:true,nodes:manifest.nodes,edges:manifest.edges,cycles:manifest.cycles,orphans:manifest.orphans,graphMB:fs.statSync(graphPath).size/1024/1024}));
}
run().catch((e)=>{console.error(e.stack||e);process.exit(1);});
