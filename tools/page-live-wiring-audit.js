#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const FRONT=path.join(ROOT,'frontend','src');
function walk(dir,out=[]){if(!fs.existsSync(dir))return out;for(const name of fs.readdirSync(dir)){const p=path.join(dir,name),s=fs.statSync(p);if(s.isDirectory())walk(p,out);else out.push(p);}return out;}
const files=walk(FRONT).filter(p=>/\.(jsx?|tsx?)$/i.test(p));
const pages=files.filter(p=>/(^|[\\/])pages?([\\/]|$)|Page\.(jsx?|tsx?)$/i.test(p));
const normalize=p=>path.relative(ROOT,p).replace(/\\/g,'/');
const results=[];
for(const p of pages){
 const raw=fs.readFileSync(p,'utf8');
 const apiImports=[...raw.matchAll(/from\s+['"]([^'"]*(?:services\/api|\/api|api\.js)[^'"]*)['"]/g)].map(m=>m[1]);
 const directHttp=/(fetch\s*\(|axios\.|XMLHttpRequest)/.test(raw);
 const hardcodedApi=[...raw.matchAll(/['"](\/api\/[^'"]+|https?:\/\/[^'"]+)['"]/g)].map(m=>m[1]).slice(0,10);
 const placeholders=/\b(TODO|FIXME|placeholder|not implemented|coming soon|Route operational)\b/i.test(raw);
 const stateEvidence={loading:/loading/i.test(raw),empty:/empty|no data|no records|no results/i.test(raw),error:/error/i.test(raw),success:/success/i.test(raw)};
 const interactive=/<button\b|<form\b|onClick=|onSubmit=/i.test(raw);
 const a11y=interactive?(/aria-|role=|htmlFor=|<label\b/i.test(raw)):true;
 results.push({file:normalize(p),bytes:Buffer.byteLength(raw),apiImports,directHttp,hardcodedApi,placeholders,stateEvidence,interactive,a11ySignal:a11y,wiring:apiImports.length?'shared_api_client':directHttp?'direct_http':'no_network_detected'});
}
const summary={
 generatedAt:new Date().toISOString(),
 physicalPageLikeFiles:results.length,
 sharedApiClient:results.filter(x=>x.wiring==='shared_api_client').length,
 directHttp:results.filter(x=>x.wiring==='direct_http').length,
 noNetworkDetected:results.filter(x=>x.wiring==='no_network_detected').length,
 placeholderSignals:results.filter(x=>x.placeholders).length,
 interactiveWithoutA11ySignal:results.filter(x=>x.interactive&&!x.a11ySignal).length,
 hardcodedApiPages:results.filter(x=>x.hardcodedApi.length).length,
};
const report={summary,pages:results};
console.log(JSON.stringify(report,null,2));
const boundary=fs.readFileSync(path.join(FRONT,'components','EnterprisePageEstateBoundary.jsx'),'utf8');
const required=['focusManagement','loadingEmptyErrorSuccessStates','offlineDegradedStateAwareness','enterprise:page-state','aria-live','tabIndex={-1}'];
const missing=required.filter(x=>!boundary.includes(x));
if(missing.length){console.error(`Global page runtime missing: ${missing.join(', ')}`);process.exitCode=2;}
