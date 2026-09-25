#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const parser=require(path.join(root,'frontend','node_modules','@babel','parser'));
const outDir=path.join(root,'.audit','phase-program','structural-code');
const MAX=20*1024*1024;
const activeRoots=['backend','frontend','tools','scripts','modules','afrera','infra'].map(x=>path.join(root,x)).filter(fs.existsSync);
const exts=new Set(['.js','.jsx','.ts','.tsx','.mjs','.cjs']);
const skip=new Set(['node_modules','.git','dist','build','coverage','.cache','.vite','.next','out']);
fs.mkdirSync(outDir,{recursive:true});

let idx=0,out=null,outBytes=0;const shards=[];
function open(){if(out)out.end();const file='structure-'+String(idx++).padStart(4,'0')+'.jsonl';out=fs.createWriteStream(path.join(outDir,file));outBytes=0;shards.push({file,records:0,bytes:0});}
function emit(obj){const line=JSON.stringify(obj)+'\n',n=Buffer.byteLength(line);if(!out||outBytes+n>MAX)open();out.write(line);outBytes+=n;const s=shards.at(-1);s.records++;s.bytes+=n;}
function listFiles(dir,arr){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(skip.has(ent.name))continue;
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())listFiles(p,arr);
  else if(ent.isFile()&&exts.has(path.extname(ent.name).toLowerCase()))arr.push(p);
 }
}
function strArg(n){return n&&((n.type==='StringLiteral'||n.type==='Literal')?n.value:null);}
function parseFile(file){
 const rel=path.relative(root,file).replace(/\\/g,'/');
 const code=fs.readFileSync(file,'utf8');
 const result={path:rel,bytes:Buffer.byteLength(code),parser:'babel',imports:[],requires:[],exports:[],classes:[],functions:[],routes:[],workers:[],schemas:[],dependencyEdges:[],parseErrors:[]};
 let ast;
 try{
  ast=parser.parse(code,{sourceType:'unambiguous',errorRecovery:true,allowReturnOutsideFunction:true,plugins:['jsx','typescript','classProperties','classPrivateProperties','classPrivateMethods','decorators-legacy','dynamicImport','importMeta','topLevelAwait','optionalChaining','nullishCoalescingOperator']});
  result.parseErrors=(ast.errors||[]).map(e=>({message:e.message,pos:e.pos})).slice(0,20);
}catch(e){
  result.parseErrors=[{message:e.message,pos:e.pos||null}];
  result.parser='fallback-regex';
  const add=(arr,v)=>{if(v!=null&&!arr.includes(v))arr.push(v);};
  for(const m of code.matchAll(/\brequire\s*\(\s*['"]([^'"]+)['"]\s*\)/g)) add(result.requires,m[1]);
  for(const m of code.matchAll(/\bimport(?:[\s\S]*?\bfrom\s*)?['"]([^'"]+)['"]/g)) add(result.imports,m[1]);
  for(const m of code.matchAll(/\bclass\s+([A-Za-z_$][\w$]*)/g)) add(result.classes,m[1]);
  for(const m of code.matchAll(/\bfunction\s+([A-Za-z_$][\w$]*)/g)) add(result.functions,m[1]);
  for(const m of code.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g)) add(result.functions,m[1]);
  for(const m of code.matchAll(/\b(?:router|app)\.(get|post|put|patch|delete|use|all)\s*\(\s*['"]([^'"]+)['"]/g)) result.routes.push({owner:'fallback',method:m[1],path:m[2]});
  result.dependencyEdges=[...new Set([...result.imports,...result.requires])];
  return result;
 }
 function addUnique(arr,v){if(v!=null&&!arr.includes(v))arr.push(v);}
 function nameOf(n){
   if(!n)return null;
   if(n.type==='Identifier')return n.name;
   if(n.type==='StringLiteral')return n.value;
   if(n.type==='MemberExpression')return (nameOf(n.object)||'?')+'.'+(nameOf(n.property)||'?');
   return null;
 }
 function visit(n){
  if(!n||typeof n!=='object')return;
  switch(n.type){
   case 'ImportDeclaration': addUnique(result.imports,n.source&&n.source.value); break;
   case 'ExportDefaultDeclaration': addUnique(result.exports,'default'); break;
   case 'ExportNamedDeclaration':
     if(n.declaration&&n.declaration.id)addUnique(result.exports,n.declaration.id.name);
     for(const s of n.specifiers||[])addUnique(result.exports,(s.exported&&nameOf(s.exported))||null);
     break;
   case 'ClassDeclaration': if(n.id)addUnique(result.classes,n.id.name); break;
   case 'FunctionDeclaration': if(n.id)addUnique(result.functions,n.id.name); break;
   case 'VariableDeclarator':
     if(n.id&&n.id.type==='Identifier'&&n.init&&['ArrowFunctionExpression','FunctionExpression'].includes(n.init.type)) addUnique(result.functions,n.id.name);
     if(n.id&&n.id.type==='Identifier'&&/schema/i.test(n.id.name)) addUnique(result.schemas,n.id.name);
     if(n.id&&n.id.type==='Identifier'&&/(worker|queue|job|processor)/i.test(n.id.name)) addUnique(result.workers,n.id.name);
     break;
   case 'CallExpression': {
     if(n.callee&&n.callee.type==='Identifier'&&n.callee.name==='require'){const s=strArg(n.arguments&&n.arguments[0]);if(s)addUnique(result.requires,s);}
     if(n.callee&&n.callee.type==='MemberExpression'){
       const method=nameOf(n.callee.property);
       const owner=nameOf(n.callee.object);
       if(['get','post','put','patch','delete','use','all'].includes(method)){
         const route=strArg(n.arguments&&n.arguments[0]);
         if(route!=null)result.routes.push({owner,method,path:route});
       }
     }
     break;
   }
   case 'AssignmentExpression': {
     const left=nameOf(n.left);
     if(left==='module.exports'||(left&&left.startsWith('exports.')))addUnique(result.exports,left);
     break;
   }
  }
  for(const [k,v] of Object.entries(n)){
    if(['loc','start','end','extra','errors'].includes(k))continue;
    if(Array.isArray(v)){for(const x of v)if(x&&typeof x==='object'&&x.type)visit(x);}
    else if(v&&typeof v==='object'&&v.type)visit(v);
  }
 }
 visit(ast.program);
 result.dependencyEdges=[...new Set([...result.imports,...result.requires])];
 return result;
}
async function run(){
 const files=[];for(const d of activeRoots)listFiles(d,files);
 let parsed=0,withErrors=0,totalRoutes=0,totalDeps=0;
 const errorSamples=[];
 for(const file of files){
  let rec;
  try{rec=parseFile(file);}catch(e){rec={path:path.relative(root,file).replace(/\\/g,'/'),parser:'babel',parseErrors:[{message:e.message}],imports:[],requires:[],exports:[],classes:[],functions:[],routes:[],workers:[],schemas:[],dependencyEdges:[]};}
  parsed++; if(rec.parseErrors.length){withErrors++;if(errorSamples.length<100)errorSamples.push({path:rec.path,errors:rec.parseErrors});}
  totalRoutes+=rec.routes.length;totalDeps+=rec.dependencyEdges.length;emit(rec);
 }
 if(out)await new Promise(r=>out.end(r));
 const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),activeRoots:activeRoots.map(x=>path.relative(root,x).replace(/\\/g,'/')),extensions:[...exts],filesDiscovered:files.length,filesParsed:parsed,filesWithParseErrors:withErrors,totalRoutes,totalDependencyEdges:totalDeps,errorSamples,maxShardBytes:MAX,shards};
 fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({ok:true,filesParsed:parsed,filesWithParseErrors:withErrors,totalRoutes,totalDependencyEdges:totalDeps,shards:shards.length,maxShardMB:Math.max(0,...shards.map(s=>s.bytes))/1024/1024}));
}
run().catch(e=>{console.error(e.stack||e);process.exit(1);});
