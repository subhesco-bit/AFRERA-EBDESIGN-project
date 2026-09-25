#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const parser=require(path.resolve(__dirname,'../frontend/node_modules/@babel/parser'));
const root=path.resolve(__dirname,'..');
const src=path.join(root,'frontend','src');
const routesFile=path.join(src,'config','routes.js');
const appFile=path.join(src,'App.jsx');
const legacyRouter=path.join(src,'router','routes.jsx');
const outDir=path.join(root,'.audit','phase-program','ui-experience-catalog');
fs.mkdirSync(outDir,{recursive:true});

function parse(file){return parser.parse(fs.readFileSync(file,'utf8'),{sourceType:'module',plugins:['jsx','dynamicImport']});}
function lit(node){if(!node)return null;if(node.type==='StringLiteral'||node.type==='BooleanLiteral'||node.type==='NumericLiteral')return node.value;return null;}
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const [k,v] of Object.entries(node)){if(['loc','start','end','extra','errors'].includes(k))continue;if(Array.isArray(v)){for(const x of v)if(x&&typeof x==='object'&&x.type)walk(x,fn);}else if(v&&typeof v==='object'&&v.type)walk(v,fn);}}

const ast=parse(routesFile);
const lazyMap=new Map();
walk(ast,n=>{if(n.type==='VariableDeclarator'&&n.id?.type==='Identifier'&&n.init?.type==='CallExpression'&&n.init.callee?.name==='lazy'){let importPath=null;walk(n.init,x=>{if(x.type==='CallExpression'&&x.callee?.type==='Import'&&x.arguments?.[0]?.type==='StringLiteral')importPath=x.arguments[0].value;});if(importPath)lazyMap.set(n.id.name,importPath);}});

const routeGroups={};
for(const node of ast.program.body){
 if(node.type!=='ExportNamedDeclaration'||node.declaration?.type!=='VariableDeclaration')continue;
 for(const decl of node.declaration.declarations||[]){
  if(decl.id?.type!=='Identifier'||decl.init?.type!=='ArrayExpression'||!/Routes$/.test(decl.id.name))continue;
  const name=decl.id.name; routeGroups[name]=[];
  for(const el of decl.init.elements||[]){
   if(!el||el.type!=='ObjectExpression')continue;
   const rec={group:name,path:null,component:null,title:null,description:null,role:null,transition:null,permissions:null};
   for(const prop of el.properties||[]){
    if(prop.type!=='ObjectProperty')continue;
    const key=prop.key.name||prop.key.value;
    if(key==='component'&&prop.value.type==='Identifier')rec.component=prop.value.name;
    else if(key==='permissions'&&prop.value.type==='ArrayExpression')rec.permissions=prop.value.elements.map(lit).filter(x=>x!=null);
    else if(Object.prototype.hasOwnProperty.call(rec,key))rec[key]=lit(prop.value);
   }
   rec.importPath=rec.component?lazyMap.get(rec.component)||null:null;
   routeGroups[name].push(rec);
  }
 }
}

const protection={publicRoutes:'public',protectedRoutes:'authenticated',farmerRoutes:'roles:farmer|admin',adminRoutes:'roles:admin',dashboardRoutes:'role-specific+admin',managementRoutes:'role-configured'};
const explicit=[];for(const [g,rows] of Object.entries(routeGroups))for(const r of rows)explicit.push(Object.assign({},r,{protection:protection[g]||'unknown'}));

function listPages(dir,out=[]){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,ent.name);if(ent.isDirectory())listPages(p,out);else if(ent.isFile()&&/\.(jsx?|tsx?)$/.test(ent.name))out.push(p);}return out;}
function fileToAutoPath(file){let rel=path.relative(path.join(src,'pages'),file).replace(/\\/g,'/').replace(/\.(jsx?|tsx?)$/,'');const parts=rel.split('/').map(s=>s.replace(/Page$/,'').replace(/([a-z0-9])([A-Z])/g,'$1-$2').replace(/_/g,'-').toLowerCase());return '/'+parts.join('/');}
const pageFiles=listPages(path.join(src,'pages'));
const pages=[];
for(const file of pageFiles){
 const text=fs.readFileSync(file,'utf8');
 const rel=path.relative(root,file).replace(/\\/g,'/');
 const importStem='../pages/'+path.relative(path.join(src,'pages'),file).replace(/\\/g,'/').replace(/\.(jsx?|tsx?)$/,'');
 const explicitRoutes=explicit.filter(r=>r.importPath===importStem).map(r=>({path:r.path,group:r.group,protection:r.protection,role:r.role,permissions:r.permissions}));
 const apiRefs=[...text.matchAll(/\bapi\.(get|post|put|patch|delete)\s*\(\s*['"]([^'"]+)/g)].slice(0,50).map(m=>({method:m[1],path:m[2]}));
 const fetchRefs=[...text.matchAll(/\bfetch\s*\(\s*['"]([^'"]+)/g)].slice(0,50).map(m=>m[1]);
 const serviceImports=[...text.matchAll(/from\s+['"]([^'"]*(?:service|services)[^'"]*)['"]/gi)].slice(0,50).map(m=>m[1]);
 const responsive=/\b(sm|md|lg|xl|2xl):[A-Za-z0-9_[\]-]+|@media\s*\(/.test(text);
 const accessibility=/aria-[a-z-]+\s*=|role\s*=|<label\b|Accessibility/i.test(text);
 const loading=/loading|isLoading|LoadingSpinner|Skeleton/i.test(text);
 const error=/error|ErrorBoundary|catch\s*\(/i.test(text);
 const empty=/empty state|no data|no results|length\s*===\s*0|!\w+\.length/i.test(text);
 const enterpriseDynamic=rel.startsWith('frontend/src/pages/enterprise-generated/') && /\/P\d{3}Page\.jsx$/.test(rel);
 pages.push({file:rel,explicitRoutes,autoRoute:fileToAutoPath(file),enterpriseDynamic,dynamicRoute:enterpriseDynamic?'/enterprise/page/:pageId':null,apiRefs,fetchRefs,serviceImports,responsive,accessibility,loadingState:loading,errorState:error,emptyState:empty,bytes:Buffer.byteLength(text)});
}

const explicitPaths=new Set(explicit.map(r=>r.path));
const potentialAutoRoutes=pages.filter(p=>!explicitPaths.has(p.autoRoute)).map(p=>({path:p.autoRoute,file:p.file,role:p.autoRoute.startsWith('/admin')?'admin':null,active:false}));
const duplicatePaths=[];const byPath=new Map();for(const r of explicit){const a=byPath.get(r.path)||[];a.push(r);byPath.set(r.path,a);}for(const [p,a] of byPath)if(a.length>1)duplicatePaths.push({path:p,count:a.length,routes:a});
const orphanPages=pages.filter(p=>p.explicitRoutes.length===0&&!p.enterpriseDynamic);

const appText=fs.readFileSync(appFile,'utf8');
const legacyImported=appText.includes('./router/routes')||appText.includes('router/routes.jsx');
const summary={schemaVersion:2,generatedAt:new Date().toISOString(),explicitRouteCount:explicit.length,routeGroups:Object.fromEntries(Object.entries(routeGroups).map(([k,v])=>[k,v.length])),pageFileCount:pages.length,potentialAutoRouteCount:potentialAutoRoutes.length,activeAutoRouteCount:0,enterpriseDynamicPageCount:pages.filter(p=>p.enterpriseDynamic).length,duplicateExplicitPathCount:duplicatePaths.length,unroutedPageCount:orphanPages.length,pagesWithApiEvidence:pages.filter(p=>p.apiRefs.length||p.fetchRefs.length||p.serviceImports.length).length,pagesWithResponsiveEvidence:pages.filter(p=>p.responsive).length,pagesWithAccessibilityEvidence:pages.filter(p=>p.accessibility).length,pagesWithLoadingState:pages.filter(p=>p.loadingState).length,pagesWithErrorState:pages.filter(p=>p.errorState).length,pagesWithEmptyState:pages.filter(p=>p.emptyState).length,activeRouter:'frontend/src/App.jsx + frontend/src/config/routes.js',enterpriseDynamicRoute:'/enterprise/page/:pageId (ProtectedRoute)',legacyRouter:{file:'frontend/src/router/routes.jsx',importedByApp:legacyImported},canonicalGuard:'frontend/src/components/RouteGuard.jsx',compatibilityGuard:'frontend/src/components/ProtectedRoute.jsx',rules:['autoPageRoutes.js is currently unreferenced; generated paths are potential only and are not counted as live routes.','Enterprise-generated P001-P790 pages are live only through the authenticated dynamic resolver.','Unknown-role pages are not auto-exposed merely to eliminate routing gaps.','Page existence does not prove API/workflow integration.','Responsive/accessibility/state flags are source evidence only, not certification.']};
fs.writeFileSync(path.join(outDir,'explicit-routes.json'),JSON.stringify(explicit,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'potential-auto-routes.json'),JSON.stringify(potentialAutoRoutes,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'pages.jsonl'),pages.map(x=>JSON.stringify(x)).join('\n')+'\n');
fs.writeFileSync(path.join(outDir,'duplicates.json'),JSON.stringify(duplicatePaths,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'orphans.json'),JSON.stringify(orphanPages,null,2)+'\n');
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({ok:true,summary}));
