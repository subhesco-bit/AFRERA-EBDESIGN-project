#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');

function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
function write(rel,text){fs.writeFileSync(path.join(root,rel),text,{encoding:'utf8'});}

{
  const rel='backend/scripts/batch_complete_modules.js';
  let t=read(rel);
  const re=/      console\.log\('   Controller: COMPLETED'\);\r?\n    \}\r?\n\}\);/;
  if(!re.test(t)) throw new Error('batch closure pattern not found');
  t=t.replace(re,"      console.log('   Controller: COMPLETED');\n    }\n  }\n});");
  write(rel,t);
}
{
  const rel='backend/src/services/engineering/structuralEngine.js';
  const rows=read(rel).split(/\r?\n/);
  const replacements=new Map([
    [81,'    throw new Error(`${name} must be a positive number`);'],
    [89,'    throw new Error(`Unknown wind zone "${zone}". Expected one of: ${Object.keys(WIND_ZONES).join(", ")}`);'],
    [111,'    throw new Error(`Unknown seismic zone "${zone}". Expected one of: ${Object.keys(SEISMIC_ZONES).join(", ")}`);'],
    [132,'    throw new Error(`Unknown steel grade "${grade}". Expected one of: ${Object.keys(STEEL_GRADES).join(", ")}`);'],
    [163,'    throw new Error(`Unknown steel grade "${grade}". Expected one of: ${Object.keys(STEEL_GRADES).join(", ")}`);'],
    [175,'    throw new Error(`Unknown bucklingClass "${bucklingClass}". Expected one of: ${Object.keys(BUCKLING_CLASS_ALPHA).join(", ")}`);'],
    [208,'    throw new Error(`Unknown concrete grade "${concreteGrade}". Expected one of: ${Object.keys(CONCRETE_GRADES).join(", ")}`);'],
    [216,'    basis: "Rankine bearing check: A = P/(SBC/FoS), FoS = 2.5 (IS 456 / IS 6403)",'],
    [230,'    if (!Number.isFinite(Number(value))) throw new Error(`${name} must be a number`);']
  ]);
  for(const [i,v] of replacements){if(i>=rows.length)throw new Error('structuralEngine line '+i+' missing');rows[i]=v;}
  write(rel,rows.join('\n'));
}
for(const rel of ['backend/tests/m001-m541-enterprise-promotion.test.js','backend/tests/m051-m150-enterprise-promotion.test.js']){
  const rows=read(rel).split(/\r?\n/);
  const idx=rows.findIndex(x=>x.includes('all modules receive the same enterprise control depth')||x.includes('every module exposes complete enterprise product surfaces'));
  if(idx<0)throw new Error('target test line missing: '+rel);
  if(!rows[idx].trimEnd().endsWith(');'))rows[idx]+=');';
  write(rel,rows.join('\n'));
}
{
  const rel='frontend/src/services/authService.js';
  let t=read(rel);
  if(t.startsWith("import { api } from './api';}"))t=t.replace("import { api } from './api';}","import { api } from './api';");
  write(rel,t);
}
console.log('phase21 targeted syntax repairs applied');
