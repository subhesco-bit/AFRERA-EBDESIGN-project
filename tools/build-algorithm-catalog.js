#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const { buildDeterministicAlgorithmRegistry }=require(path.join(root,'backend','src','core','deterministicAlgorithmCatalog'));
const outDir=path.join(root,'.audit','phase-program','algorithm-catalog');
fs.mkdirSync(outDir,{recursive:true});
const skip=new Set(['node_modules','.git','dist','build','coverage','.cache','legacy','tests','test','__tests__']);
const candidates=[];
function classify(rel,text){
 const low=(rel+' '+text.slice(0,4000)).toLowerCase();
 if(/tax|gst|tds|vat/.test(low))return 'tax-regulatory';
 if(/thermal|structural|mep|engineering/.test(low))return 'engineering-formula';
 if(/price|pricing|waterfall|cost/.test(low))return 'pricing-economics';
 if(/massbalance|mass_balance|mass-balance|yield/.test(low))return 'mass-yield';
 if(/risk|score|rating/.test(low))return 'scoring-risk';
 if(/optim|route|allocation|schedule/.test(low))return 'optimization';
 if(/forecast|prediction/.test(low))return 'forecasting';
 if(/simulation|digitaltwin|digital_twin/.test(low))return 'simulation';
 if(/rule|eligib|gate/.test(low))return 'rules-policy';
 return 'calculation-general';
}
function walk(dir){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(skip.has(ent.name))continue;
  const p=path.join(dir,ent.name);
  if(ent.isDirectory())walk(p);
  else if(ent.isFile()&&/\.(js|ts)$/i.test(ent.name)){
   let text='';try{text=fs.readFileSync(p,'utf8')}catch{continue;}
   const rel=path.relative(root,p).replace(/\\/g,'/');
   const nameSignal=/(engine|calculator|formula|optimization|forecast|score|pricing|simulation|risk|rule|massbalance|mass_balance)/i.test(ent.name);
   const codeSignal=/(basis\s*:|Math\.(round|pow|abs|sqrt|log|exp)|calculate|compute|reconcile|score|optimiz|eligib|formula)/i.test(text);
   if(!nameSignal&&!codeSignal)continue;
   const flags={
    usesMathRandom:/Math\.random\s*\(/.test(text),
    advisory:/advisory\s*:\s*true|\badvisory\b/i.test(text),
    explicitBasis:/basis\s*:/i.test(text),
    assumptionMarker:/\bassum(?:e|ed|ption)|proxy|default/i.test(text),
    regulatoryTerms:/\bGST\b|\bTDS\b|\bVAT\b|\bHSN\b|regulat|compliance/i.test(text),
    aiTerms:/\bLLM\b|OpenAI|Anthropic|Gemini|TensorFlow|model\.predict|embedding/i.test(text),
    ioCoupled:/pool\.query|fetch\s*\(|axios\.|http[s]?\.|repository\.|\.save\s*\(/i.test(text),
    notImplemented:/NOT_IMPLEMENTED|notImplemented|TODO:\s*Implement/i.test(text)
   };
   const functionNames=[...text.matchAll(/(?:function\s+|const\s+|async\s+function\s+)([A-Za-z_$][\w$]*)/g)].slice(0,100).map(m=>m[1]);
   candidates.push({file:rel,kind:classify(rel,text),bytes:Buffer.byteLength(text),flags,functionNames:[...new Set(functionNames)],deterministicCandidate:!flags.aiTerms&&!flags.usesMathRandom&&!flags.notImplemented});
  }
 }
}
walk(path.join(root,'backend','src'));
const canonical=buildDeterministicAlgorithmRegistry().list();
const summary={schemaVersion:1,generatedAt:new Date().toISOString(),canonicalCount:canonical.length,candidateCount:candidates.length,deterministicCandidates:candidates.filter(x=>x.deterministicCandidate).length,randomnessFlags:candidates.filter(x=>x.flags.usesMathRandom).length,notImplementedFlags:candidates.filter(x=>x.flags.notImplemented).length,regulatoryCandidates:candidates.filter(x=>x.flags.regulatoryTerms).length,advisoryCandidates:candidates.filter(x=>x.flags.advisory).length,ioCoupledCandidates:candidates.filter(x=>x.flags.ioCoupled).length,canonical,candidates,rules:['Canonical entries are executable deterministic primitives with explicit basis/source metadata.','Candidate classification is evidence for review, not certification.','Regulatory-rate engines require current-law validation before production authority.','Advisory/proxy engines must expose assumptions and limitations.','Math.random disqualifies a candidate from deterministic/auditable status until remediated.']};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({ok:true,canonicalCount:summary.canonicalCount,candidateCount:summary.candidateCount,deterministicCandidates:summary.deterministicCandidates,randomnessFlags:summary.randomnessFlags,notImplementedFlags:summary.notImplementedFlags,regulatoryCandidates:summary.regulatoryCandidates,advisoryCandidates:summary.advisoryCandidates,bytes:fs.statSync(path.join(outDir,'manifest.json')).size}));
