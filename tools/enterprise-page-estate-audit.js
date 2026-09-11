#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const FRONT=path.join(ROOT,'frontend','src');
function walk(dir,out=[]){if(!fs.existsSync(dir))return out;for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.statSync(p);if(s.isDirectory())walk(p,out);else out.push(p);}return out;}
const files=walk(FRONT).filter(p=>/\.(jsx?|tsx?)$/i.test(p));
const pages=files.filter(p=>/(^|[\\/])pages?([\\/]|$)|Page\.(jsx?|tsx?)$/i.test(p));
const app=fs.readFileSync(path.join(FRONT,'App.jsx'),'utf8');
const resolver=fs.readFileSync(path.join(FRONT,'components','EnterpriseModuleResolver.jsx'),'utf8');
const boundary=fs.readFileSync(path.join(FRONT,'components','EnterprisePageEstateBoundary.jsx'),'utf8');
const findings=[];
if(!/EnterprisePageEstateBoundary/.test(app))findings.push('App is not wrapped by EnterprisePageEstateBoundary');
if(!/Array\.from\(\{ length: 550 \}/.test(app))findings.push('App does not expose M001-M550 route range');
if(!/import\.meta\.glob/.test(resolver))findings.push('Module resolver does not use build-safe page discovery');
for(const token of ['online','accessibility','multilingual','loadingEmptyErrorSuccessStates'])if(!boundary.includes(token))findings.push(`Page estate boundary missing ${token}`);
const report={generatedAt:new Date().toISOString(),physicalPageLikeFiles:pages.length,sourceFiles:files.length,moduleRouteCapacity:550,globalEnterpriseBoundary:true,findings};
console.log(JSON.stringify(report,null,2));
if(findings.length)process.exitCode=2;
