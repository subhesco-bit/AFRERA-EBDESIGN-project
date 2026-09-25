#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const { buildAICapabilityCatalog, summarize }=require(path.join(root,'backend','src','core','ai','aiCapabilityCatalog'));
const outDir=path.join(root,'.audit','phase-program','ai-engine-catalog');
fs.mkdirSync(outDir,{recursive:true});
const records=buildAICapabilityCatalog();
const candidates=[];
const skip=new Set(['node_modules','.git','dist','build','coverage','.cache']);
function classify(rel,text){const s=(rel+' '+text.slice(0,5000)).toLowerCase();if(/ocr|tesseract/.test(s))return 'ocr';if(/vision|image|computer_vision/.test(s))return 'vision';if(/speech|voice|transcrib|tts|stt/.test(s))return 'speech';if(/agent|orchestrat|coordinator/.test(s))return 'agent-orchestrator';if(/embedding|vector|semantic|rerank|knowledge/.test(s))return 'retrieval-knowledge';if(/forecast|predict/.test(s))return 'forecasting-ml';if(/recommend/.test(s))return 'recommendation';if(/fraud|credit|risk/.test(s))return 'risk-ml';if(/llm|claude|openai|gemini|deepseek|grok/.test(s))return 'llm-adapter';return 'ai-other';}
function walk(dir){
 for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
  if(skip.has(ent.name))continue;const p=path.join(dir,ent.name);
  if(ent.isDirectory())walk(p);
  else if(ent.isFile()&&/\.(js|ts|json)$/i.test(ent.name)){
   const rel=path.relative(root,p).replace(/\\/g,'/');
   if(!/(ai|agent|vision|ocr|speech|model|forecast|predict|recommend|embedding|knowledge|ml)/i.test(rel))continue;
   let text='';try{text=fs.readFileSync(p,'utf8')}catch{continue;}
   const flags={usesMathRandom:/Math\.random\s*\(/.test(text),notImplemented:/NOT_IMPLEMENTED|not[_ ]configured|call_intentionally_not_implemented|TODO:\s*Implement/i.test(text),hardcodedConfidence:/confidence\s*[:=]\s*0\.\d+|accuracy\s*[:=]\s*0\.\d+/i.test(text),networkCapable:/axios\.|fetch\s*\(|https:\/\//i.test(text),providerSecrets:/ANTHROPIC_API_KEY|OPENAI_API_KEY|GEMINI_API_KEY|DEEPSEEK_API_KEY|XAI_API_KEY|AZURE_SPEECH_KEY|GOOGLE_SPEECH_API_KEY/.test(text)};
   candidates.push({file:rel,class:classify(rel,text),bytes:Buffer.byteLength(text),flags});
  }
 }
}
walk(path.join(root,'backend','src'));
const stats=summarize(records);
const byClass={};for(const c of candidates)byClass[c.class]=(byClass[c.class]||0)+1;
const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),normalizedRecords:records,summary:stats,discoveredCandidateCount:candidates.length,discoveredByClass:byClass,randomnessCandidates:candidates.filter(x=>x.flags.usesMathRandom).length,stubOrUnconfiguredCandidates:candidates.filter(x=>x.flags.notImplemented).length,hardcodedConfidenceCandidates:candidates.filter(x=>x.flags.hardcodedConfidence).length,providerSecretReferenceCandidates:candidates.filter(x=>x.flags.providerSecrets).length,candidates,rules:['Runtime available means executable backing exists now; provider configuration alone is not live availability.','Legacy static accuracy/confidence metadata is not runtime evidence or routing authority.','High/elevated-risk AI requires human/governance gates defined by later phases.','Provider secret names may be catalogued; secret values are never read or stored.','Discovered files are candidates only; filenames do not certify model capability.']};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({ok:true,normalizedRecords:records.length,available:stats.available,autoExecutionEligible:stats.autoExecutionEligible,unverifiedAccuracyClaims:stats.unverifiedAccuracyClaims,discoveredCandidateCount:candidates.length,randomnessCandidates:manifest.randomnessCandidates,stubOrUnconfiguredCandidates:manifest.stubOrUnconfiguredCandidates,bytes:fs.statSync(path.join(outDir,'manifest.json')).size}));
