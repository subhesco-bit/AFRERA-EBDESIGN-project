const path=require('path');
const fs=require('fs');
const crypto=require('crypto');
const hardening=require('./m051m100ProductionHardeningService');
const pool=require('../database/pool');

const MODULE_CODES=Array.from({length:50},(_,i)=>`M${String(i+51).padStart(3,'0')}`);

function resolveModule(code){
  const root=path.resolve(__dirname,'../modules',code);
  const service=path.join(root,'service.js');
  const controller=path.join(root,'controller.js');
  const routeCandidates=[path.join(root,'routes.js'),path.join(root,'route.js'),path.join(root,'index.js')];
  const uiRoot=path.resolve(__dirname,'../../../frontend/src/modules',code);
  const uiFiles=fs.existsSync(uiRoot)?fs.readdirSync(uiRoot).filter(f=>/\.(jsx|tsx|js|ts)$/.test(f)):[];
  return {code,name:hardening.get(code)?.name||code,service,controller,route:routeCandidates.find(fs.existsSync)||null,uiRoot,uiFiles,serviceExists:fs.existsSync(service),controllerExists:fs.existsSync(controller),uiExists:fs.existsSync(uiRoot)&&uiFiles.length>0};
}

function loadService(code){
 const info=resolveModule(code); if(!info.serviceExists)return null;
 try{return require(info.service);}catch(error){return {__loadError:error.message};}
}

async function validateAndRecord(code,input,{actorId=null,correlationId=crypto.randomUUID()}={}){
 const validation=hardening.validate(code,input);
 const moduleInfo=resolveModule(code);
 const audit=await pool.query(`INSERT INTO m051_m100_hardening_audits (id,module_code,entity_id,validation_result,ai_enhancements,actor_id,correlation_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,[crypto.randomUUID(),code,input.entityId||null,JSON.stringify({...validation,moduleInfo}),JSON.stringify(validation.aiEnhancements),actorId,correlationId]);
 if(!validation.valid){const err=new Error(`Validation failed for ${code}`);err.statusCode=422;err.validation=validation;throw err;}
 return {validation,moduleInfo,auditId:audit.rows[0].id,correlationId};
}

async function execute(code,operation,input,options={}){
 const wired=await validateAndRecord(code,input,options);
 const svc=loadService(code);
 if(!svc)return {...wired,executed:false,reason:'module_service_not_present'};
 if(svc.__loadError)throw new Error(`${code} service failed to load: ${svc.__loadError}`);
 const fn=svc[operation];
 if(typeof fn!=='function')return {...wired,executed:false,reason:`operation_not_exposed:${operation}`};
 const result=await fn(input);
 return {...wired,executed:true,result};
}

module.exports={MODULE_CODES,resolveModule,loadService,validateAndRecord,execute};
