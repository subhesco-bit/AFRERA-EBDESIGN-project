#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const ROOT=path.resolve(__dirname,'..');
const exists=p=>fs.existsSync(path.join(ROOT,p));
const read=p=>exists(p)?fs.readFileSync(path.join(ROOT,p),'utf8'):'';
const walk=(dir,out=[])=>{const abs=path.join(ROOT,dir);if(!fs.existsSync(abs))return out;for(const n of fs.readdirSync(abs)){const p=path.join(abs,n);const s=fs.statSync(p);if(s.isDirectory())walk(path.relative(ROOT,p),out);else out.push(path.relative(ROOT,p).replace(/\\/g,'/'));}return out;};
const findings=[];const add=(severity,area,message)=>findings.push({severity,area,message});

// Architecture/runtime
for(const p of ['backend/src/index.js','backend/src/core/dynamicRouteLoader.js','backend/src/routes/backendModulesRoutes.js','frontend/src/App.jsx'])if(!exists(p))add('critical','runtime',`Missing ${p}`);
const index=read('backend/src/index.js');
if(!/discoverAndMountRoutes/.test(index))add('critical','runtime','Dynamic route mounting is not initialized');

// Database/migrations
const migrate=read('backend/src/database/migrate.js');
if(!/DATABASE_URL/.test(migrate)||!/PG_PASSWORD/.test(migrate))add('critical','database','Migration runner is not aligned to runtime PG configuration');
const canonical=walk('backend/src/database/migrations').filter(x=>x.endsWith('.sql'));
const legacy=walk('backend/migrations').filter(x=>x.endsWith('.sql'));
if(legacy.length)add('high','database',`${legacy.length} SQL migrations remain in legacy backend/migrations and require reconciliation into the canonical migration stream`);
if(!canonical.length)add('critical','database','No canonical SQL migrations found');

// Security/configuration
const env=read('backend/.env.example');
for(const token of ['JWT_SECRET','REFRESH_TOKEN_SECRET','SESSION_SECRET','CORS_ORIGIN'])if(!env.includes(token))add('high','security',`Environment contract missing ${token}`);
const auth=read('backend/src/middleware/auth.js');if(!auth)add('critical','security','Authentication middleware missing');
if(!/SKIP_AUTH/.test(auth))add('medium','security','Auth bypass safety contract not visible in auth middleware');

// Health/operations
const health=read('backend/src/routes/healthRoutes.js');
for(const token of ["/ready","/live","/metrics"])if(!health.includes(token))add('high','operations',`Health routes missing ${token}`);
if(!exists('backend/src/database/connection.js'))add('critical','operations','Database connection manager missing');

// Frontend/page estate
const generated=walk('frontend/src/pages/enterprise-generated').filter(x=>/P\d{3}Page\.jsx$/.test(x));
if(generated.length!==790)add('critical','frontend',`Expected 790 generated physical pages, found ${generated.length}`);
if(!exists('frontend/src/components/EnterprisePageEstateBoundary.jsx'))add('critical','frontend','Enterprise page estate boundary missing');
if(!exists('frontend/src/components/EnterprisePhysicalPageResolver.jsx'))add('critical','frontend','Physical page resolver missing');

// Modules
const modules=walk('backend/src/modules').filter(x=>/\/service\.js$/.test(x)&&/\/M\d{3}\//.test('/'+x));
if(modules.length<100)add('high','modules',`Only ${modules.length} physical module service files discovered; universal runtime must not be mistaken for bespoke completion`);

// CI/toolchain
const workflow=read('.github/workflows/clone-m001-m541-enterprise-promotion.yml');
if(!/npm@12/.test(workflow))add('high','ci','CI does not explicitly satisfy frontend npm >=12 engine');
for(const audit of ['module-live-wiring-audit.js','physical-enterprise-page-audit.js','enterprise-page-estate-audit.js','page-live-wiring-audit.js'])if(!exists('tools/'+audit))add('high','ci',`Missing audit ${audit}`);

// Test evidence
const backendTests=walk('backend/tests').filter(x=>x.endsWith('.test.js')||x.endsWith('.spec.js'));
if(backendTests.length<20)add('medium','testing',`Backend test estate is small (${backendTests.length}) relative to system size`);

const summary={critical:findings.filter(x=>x.severity==='critical').length,high:findings.filter(x=>x.severity==='high').length,medium:findings.filter(x=>x.severity==='medium').length};
const report={generatedAt:new Date().toISOString(),summary,inventory:{canonicalMigrations:canonical.length,legacyMigrations:legacy.length,physicalGeneratedPages:generated.length,physicalModuleServices:modules.length,backendTests:backendTests.length},findings};
console.log(JSON.stringify(report,null,2));
if(summary.critical)process.exitCode=2;
