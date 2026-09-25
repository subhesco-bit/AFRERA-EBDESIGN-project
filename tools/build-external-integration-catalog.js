#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const { DEFINITIONS }=require(path.join(root,'backend','src','core','integration','externalIntegrationCatalog'));
const outDir=path.join(root,'.audit','phase-program','external-integration-catalog');
fs.mkdirSync(outDir,{recursive:true});
const skip=new Set(['node_modules','.git','dist','build','coverage','.cache','.next','.vite']);
const files=[];
function walk(dir){for(const ent of fs.readdirSync(dir,{withFileTypes:true})){if(skip.has(ent.name))continue;const p=path.join(dir,ent.name);if(ent.isDirectory())walk(p);else if(ent.isFile()&&/\.(js|jsx|ts|tsx|json)$/i.test(ent.name))files.push(p);}}
for(const rel of ['backend/src','frontend/src']){const d=path.join(root,rel);if(fs.existsSync(d))walk(d);}

const envRefs=new Map();const hosts=new Map();const imports=new Map();const direct=[];const stubFiles=[];
const envRe=/process\.env\.([A-Z0-9_]+)/g;
const urlRe=/https?:\/\/([A-Za-z0-9.-]+)(?::\d+)?/g;
const importRe=/(?:require\(['"]([^'"]+)['"]\)|from\s+['"]([^'"]+)['"])/g;
for(const file of files){
 let text='';try{text=fs.readFileSync(file,'utf8')}catch{continue;}
 const rel=path.relative(root,file).replace(/\\/g,'/');
 for(const m of text.matchAll(envRe)){const a=envRefs.get(m[1])||[];if(a.length<30&&!a.includes(rel))a.push(rel);envRefs.set(m[1],a);}
 for(const m of text.matchAll(urlRe)){const host=m[1].toLowerCase();if(['localhost','127.0.0.1'].includes(host))continue;const a=hosts.get(host)||[];if(a.length<30&&!a.includes(rel))a.push(rel);hosts.set(host,a);}
 for(const m of text.matchAll(importRe)){const spec=m[1]||m[2];if(!spec||spec.startsWith('.')||spec.startsWith('/'))continue;const a=imports.get(spec)||[];if(a.length<30&&!a.includes(rel))a.push(rel);imports.set(spec,a);}
 const externalCall=/\b(fetch|axios\.(get|post|put|patch|delete)|https?\.request|new\s+Stripe|twilio\s*\(|\.paymentIntents\.|\.messages\.create|\.calls\.create)\b/.test(text);
 if(externalCall)direct.push({file:rel,usesFetch:/\bfetch\s*\(/.test(text),usesAxios:/\baxios\./.test(text),usesHttpRequest:/\bhttps?\.request/.test(text),usesProviderSdk:/new\s+Stripe|twilio\s*\(|\.paymentIntents\.|\.messages\.create|\.calls\.create/.test(text)});
 if(/TODO:\s*Implement service calls|Stub:\s*In real implementation|connected:\s*true,\s*latency:\s*0/.test(text))stubFiles.push(rel);
}

const envToProvider=new Map();
for(const [id,def] of Object.entries(DEFINITIONS))for(const name of [...(def.requiredEnv||[]),...(def.optionalEnv||[])]){const a=envToProvider.get(name)||[];a.push(id);envToProvider.set(name,a);}
const providers=[];
for(const [id,def] of Object.entries(DEFINITIONS)){
 const allEnv=[...(def.requiredEnv||[]),...(def.optionalEnv||[])];
 const evidenceFiles=new Set();
 for(const name of allEnv)for(const f of envRefs.get(name)||[])evidenceFiles.add(f);
 if(def.source&&def.source!=='backend/src'&&fs.existsSync(path.join(root,def.source)))evidenceFiles.add(def.source);
 providers.push({id,provider:def.provider,category:def.category,transport:def.transport,authMode:def.authMode,capabilities:def.capabilities,requiredEnv:def.requiredEnv||[],optionalEnv:def.optionalEnv||[],dataClassifications:def.dataClassifications||[],source:def.source||null,configurationStatus:'NOT_CHECKED_SECRET_VALUES',codeEvidenceFiles:[...evidenceFiles].sort(),codeEvidenceCount:evidenceFiles.size});
}

const integrationLikeEnv=[...envRefs.keys()].filter(name=>/(API|KEY|TOKEN|SECRET|CLIENT|HOST|URL|ENDPOINT|WEBHOOK|SID|ACCOUNT|BUCKET|PROJECT|REGION|TENANT|SUBSCRIPTION)/.test(name));
const unmappedEnv=integrationLikeEnv.filter(name=>!envToProvider.has(name)).sort();
function classifyUnmappedEnv(name){
  if(/^AI_(ANALYSIS|OPTIMIZATION|PREDICTION|RECOMMENDATION)_ENDPOINT$/.test(name)||['USE_REAL_IMAGE_API','CLAUDE_MAX_TOKENS'].includes(name))return {class:'ai-runtime-internal',ownerPhase:'042/044',reason:'Internal AI routing/tuning, not a standalone external provider.'};
  if(/^(AMQP_HOST|DATABASE_URL|DB_|PG_|MONGODB_URL|REDIS_|JAEGER_HOST|TEST_DATABASE_URL)/.test(name))return {class:'platform-infrastructure',ownerPhase:'090+',reason:'Database, queue, cache or telemetry infrastructure configuration.'};
  if(/^AZURE_(CLIENT_ID|CLIENT_SECRET|REGION|SUBSCRIPTION_ID|TENANT_ID)$/.test(name)||/^GCP_(KEY_FILE|PROJECT_ID|REGION)$/.test(name))return {class:'cloud-control-plane',ownerPhase:'090+',reason:'Cloud infrastructure management rather than business-provider integration.'};
  if(['BASE_URL','FRONTEND_URL','PUBLIC_BASE_URL','REACT_APP_API_URL','REACT_APP_WS_URL','MARKETPLACE_URL','CDN_BASE_URL','HOST','HOSTNAME'].includes(name))return {class:'internal-application-endpoint',ownerPhase:'deployment',reason:'Self/application routing endpoint or hostname.'};
  if(/(ENCRYPTION_KEY|JWT_SECRET|JWT_REFRESH_SECRET|SESSION_SECRET|SYNC_SECRET|OFFLINE_PAYMENT_SECRET|MFA_SECRET_LENGTH|CORE_API_KEY)/.test(name))return {class:'security-secret-or-control',ownerPhase:'security',reason:'Internal security material/control; not an external provider.'};
  if(['DEFAULT_REGION','GDPR_DATA_REGION'].includes(name))return {class:'policy-or-region',ownerPhase:'governance',reason:'Deployment/data-governance policy metadata.'};
  if(['GOOGLE_API_KEY','GOOGLE_PROJECT_ID'].includes(name))return {class:'inactive-or-comment-only',ownerPhase:'reconciliation',reason:'No active production integration call site found in Phase 43 usage trace.'};
  return {class:'unclassified',ownerPhase:null,reason:'Requires review.'};
}
const unmappedClassified=unmappedEnv.map(name=>({name,...classifyUnmappedEnv(name)}));
const unexplainedEnv=unmappedClassified.filter(item=>item.class==='unclassified');
const packageJson=JSON.parse(fs.readFileSync(path.join(root,'backend','package.json'),'utf8'));
const deps={...(packageJson.dependencies||{}),...(packageJson.optionalDependencies||{})};
const integrationDeps=Object.entries(deps).filter(([name])=>/(stripe|twilio|aws|azure|google|passport|axios|amq|elastic|redis|mongodb|pg|nodemailer|openai|anthropic|razor|firebase|sentry|datadog)/i.test(name)).map(([name,version])=>({name,version,importEvidence:imports.get(name)||[]}));

const pluginPolicy=path.join(root,'.ai','autonomous-program','PLUGIN_TOOLCHAIN_POLICY.json');
const manifest={schemaVersion:1,generatedAt:new Date().toISOString(),filesScanned:files.length,canonicalProviders:providers.length,providers,environmentVariableNames:[...envRefs.keys()].sort(),integrationLikeEnvCount:integrationLikeEnv.length,unmappedIntegrationEnvNames:unmappedEnv,unmappedEnvClassifications:unmappedClassified,unexplainedIntegrationEnvNames:unexplainedEnv,outboundHosts:[...hosts.entries()].sort().map(([host,evidenceFiles])=>({host,evidenceFiles})),directIntegrationFiles:direct,stubIntegrationFiles:stubFiles,integrationDependencies:integrationDeps,governance:{hub:'backend/src/platform/integration/integrationHub.js',registry:'backend/src/core/integration/externalIntegrationRegistry.js',catalog:'backend/src/core/integration/externalIntegrationCatalog.js',pluginToolchainPolicy:fs.existsSync(pluginPolicy)?'.ai/autonomous-program/PLUGIN_TOOLCHAIN_POLICY.json':null},rules:['Secret values are never collected by this catalog.','Environment-variable presence is not checked; configuration remains unverified until a deployment/runtime phase explicitly checks presence.','A provider definition or installed SDK is not evidence of live connectivity.','Direct provider calls are discovery evidence for later adapter normalization, not automatic defects.','Third-party responses remain untrusted input and require validation at adapter boundaries.','Webhook integrations fail closed when verification is required.']};
fs.writeFileSync(path.join(outDir,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({ok:true,filesScanned:manifest.filesScanned,canonicalProviders:manifest.canonicalProviders,integrationLikeEnvCount:manifest.integrationLikeEnvCount,unmappedIntegrationEnvNames:manifest.unmappedIntegrationEnvNames.length,unexplainedIntegrationEnvNames:manifest.unexplainedIntegrationEnvNames.length,outboundHosts:manifest.outboundHosts.length,directIntegrationFiles:manifest.directIntegrationFiles.length,stubIntegrationFiles:manifest.stubIntegrationFiles.length,integrationDependencies:manifest.integrationDependencies.length,bytes:fs.statSync(path.join(outDir,'manifest.json')).size}));
