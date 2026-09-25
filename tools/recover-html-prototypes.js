#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const crypto=require('crypto');
const root=path.resolve(__dirname,'..');
const neRoot='C:\\Users\\DIYA GOEL\\Desktop\\ne';
const outDir=path.join(root,'.audit','phase-program','html-prototypes');
fs.mkdirSync(outDir,{recursive:true});

function hashFile(p){const h=crypto.createHash('sha256');h.update(fs.readFileSync(p));return h.digest('hex');}
function textClean(s){return s.replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/\s+/g,' ').trim();}
function uniq(a,limit=500){return [...new Set(a.filter(Boolean))].slice(0,limit);}
function matches(re,s,group=1,limit=500){const out=[];for(const m of s.matchAll(re)){out.push(m[group]);if(out.length>=limit)break;}return out;}
function files(dir,out=[]){for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())files(p,out);else if(e.isFile()&&/\.html?$/i.test(e.name))out.push(p);}return out;}
function tagsFromText(s){
 const dict={farmer:/\bfarmer|fpo|farm|village\b/i,marketplace:/\bmarketplace|catalog|cart|checkout|buyer|seller\b/i,procurement:/\bprocurement|rfq|purchase|supplier|vendor\b/i,logistics:/\blogistics|fleet|delivery|shipment|route|pod\b/i,coldchain:/\bcold.?chain|cold storage|temperature|reefer\b/i,insurance:/\binsurance|policy|claim|underwriting|premium\b/i,finance:/\bfinance|credit|loan|payment|escrow|wallet\b/i,quality:/\bquality|inspection|capa|coa|grade\b/i,ai:/\bai|agent|copilot|intelligence|prediction|recommendation\b/i,governance:/\bgovernance|compliance|audit|consent\b/i};
 return Object.entries(dict).filter(([,r])=>r.test(s)).map(([k])=>k);
}
function analyze(p,hash){
 const html=fs.readFileSync(p,'utf8');
 const rel=path.relative(neRoot,p).replace(/\\/g,'/');
 const title=(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'';
 const headings=matches(/<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi,html).map(textClean);
 const buttons=matches(/<button[^>]*>([\s\S]*?)<\/button>/gi,html).map(textClean);
 const links=matches(/<a[^>]*>([\s\S]*?)<\/a>/gi,html).map(textClean);
 const ids=matches(/\bid\s*=\s*["']([^"']+)["']/gi,html);
 const dataPages=matches(/\bdata-(?:page|screen|section|view)\s*=\s*["']([^"']+)["']/gi,html);
 const forms=matches(/<form[^>]*(?:id|name)\s*=\s*["']([^"']+)["'][^>]*>/gi,html);
 const inputNames=matches(/<(?:input|select|textarea)[^>]*(?:name|id)\s*=\s*["']([^"']+)["']/gi,html);
 const imgSrc=matches(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi,html);
 const storage=matches(/(?:localStorage|sessionStorage)\.(?:getItem|setItem|removeItem)\s*\(\s*["']([^"']+)["']/gi,html);
 const fetches=matches(/\bfetch\s*\(\s*["']([^"']+)["']/gi,html);
 const axios=matches(/\baxios\.(?:get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/gi,html);
 const functions=matches(/\bfunction\s+([A-Za-z_$][\w$]*)\s*\(/g,html);
 const arrows=matches(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>/g,html);
 const handlers=matches(/\bon(?:click|change|submit|input|load)\s*=\s*["']([^"']+)["']/gi,html,1);
 const listeners=matches(/addEventListener\s*\(\s*["']([^"']+)["']/gi,html);
 const prompts=uniq(matches(/\b(?:systemPrompt|prompt|aiPrompt)\s*[:=]\s*["']([^"']{1,500})["']/gi,html));
 const arrays=matches(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*\[/g,html);
 let catalog=null;
 const cm=html.match(/window\.CATALOG_RAW\s*=\s*(\[[^\r\n]*\])\s*;/);
 if(cm){try{const a=JSON.parse(cm[1]);catalog={count:a.length,sample:a.slice(0,5)};}catch(e){catalog={parseError:e.message};}}
 return {relativePath:rel,sha256:hash,bytes:Buffer.byteLength(html),title:textClean(title),headings:uniq(headings),buttons:uniq(buttons),links:uniq(links),screenIds:uniq([...ids,...dataPages]),forms:uniq(forms),inputNames:uniq(inputNames),imageRefs:uniq(imgSrc),storageKeys:uniq(storage),networkCalls:uniq([...fetches,...axios]),functions:uniq([...functions,...arrows]),inlineHandlers:uniq(handlers),eventTypes:uniq(listeners),promptSnippets:prompts,arrayNames:uniq(arrays),workflowTags:tagsFromText(html),catalog};
}
const all=files(neRoot);
const byHash=new Map();
for(const p of all){const h=hashFile(p);let g=byHash.get(h);if(!g){g=[];byHash.set(h,g);}g.push(p);}
const records=[];let totalCatalogEntries=0;
for(const [h,paths] of byHash){const rec=analyze(paths[0],h);rec.duplicatePaths=paths.slice(1).map(p=>path.relative(neRoot,p).replace(/\\/g,'/'));records.push(rec);if(rec.catalog&&rec.catalog.count)totalCatalogEntries=Math.max(totalCatalogEntries,rec.catalog.count);}
records.sort((a,b)=>a.relativePath.localeCompare(b.relativePath));
const outPath=path.join(outDir,'prototypes.json');
fs.writeFileSync(outPath,JSON.stringify(records,null,2)+'\n');
const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),htmlFiles:all.length,uniqueHtmlHashes:byHash.size,exactDuplicateCopies:all.length-byHash.size,largestEmbeddedCatalogCount:totalCatalogEntries,recordsFile:'prototypes.json',aggregate:{screenIds:uniq(records.flatMap(r=>r.screenIds),5000).length,functions:uniq(records.flatMap(r=>r.functions),5000).length,networkCalls:uniq(records.flatMap(r=>r.networkCalls),5000).length,imageRefs:uniq(records.flatMap(r=>r.imageRefs),5000).length,storageKeys:uniq(records.flatMap(r=>r.storageKeys),5000).length},preservationRule:'Prototype features are requirements/recovery evidence; no HTML version is deleted or promoted automatically.'};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({ok:true,...manifest,recordsBytes:fs.statSync(outPath).size}));
