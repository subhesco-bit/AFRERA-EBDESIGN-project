#!/usr/bin/env node
'use strict';
const fs=require('fs');const path=require('path');
const ROOT=path.resolve(__dirname,'..');const DIR=path.join(ROOT,'frontend','src','pages','enterprise-generated');
function walk(dir,out=[]){if(!fs.existsSync(dir))return out;for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.statSync(p);if(s.isDirectory())walk(p,out);else out.push(p);}return out;}
const files=walk(DIR).filter(p=>/P\d{3}Page\.jsx$/.test(p));
const ids=files.map(p=>path.basename(p).match(/^(P\d{3})Page\.jsx$/)?.[1]).filter(Boolean).sort();
const expected=Array.from({length:790},(_,i)=>`P${String(i+1).padStart(3,'0')}`);
const missing=expected.filter(id=>!ids.includes(id));const duplicates=ids.filter((id,i)=>ids.indexOf(id)!==i);
const app=fs.readFileSync(path.join(ROOT,'frontend','src','App.jsx'),'utf8');
const resolver=fs.readFileSync(path.join(ROOT,'frontend','src','components','EnterprisePhysicalPageResolver.jsx'),'utf8');
const renderer=fs.readFileSync(path.join(ROOT,'frontend','src','components','EnterpriseGeneratedPage.jsx'),'utf8');
const findings=[];
if(files.length!==790)findings.push(`Expected 790 physical enterprise pages, found ${files.length}`);
if(missing.length)findings.push(`Missing page IDs: ${missing.join(', ')}`);
if(duplicates.length)findings.push(`Duplicate page IDs: ${[...new Set(duplicates)].join(', ')}`);
if(!app.includes('/enterprise/page/:pageId'))findings.push('Application route /enterprise/page/:pageId is missing');
if(!resolver.includes("import.meta.glob('../pages/enterprise-generated/**/*.jsx')"))findings.push('Physical page resolver does not discover generated page files');
for(const token of ['getEnterpriseModuleOverview','operations','workflow','analytics','decisions','integrations','evidence','useEnterprisePageEstate'])if(!renderer.includes(token))findings.push(`Shared production renderer missing ${token}`);
const report={generatedAt:new Date().toISOString(),physicalEnterprisePages:files.length,expected:790,sequential:missing.length===0,route:'/enterprise/page/:pageId',sharedProductionRenderer:true,findings};
console.log(JSON.stringify(report,null,2));if(findings.length)process.exitCode=2;
