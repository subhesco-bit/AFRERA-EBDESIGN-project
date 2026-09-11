const crypto=require('crypto');
const {getPostgreSQL}=require('../database');
const id=()=>crypto.randomUUID();

class M051M100AgricultureProductionService{
 constructor(){this.db=getPostgreSQL();}

 async recordFpoProcurement(input){
  if(!input.fpoId||!input.farmerId||!(Number(input.quantity)>0)) throw new Error('FPO procurement requires fpoId, farmerId and positive quantity');
  const q=await this.db.query(`INSERT INTO agricultural_production_records (id,module_code,entity_type,entity_id,data,status,created_at) VALUES ($1,'M051','fpo_procurement',$2,$3,'recorded',NOW()) RETURNING *`,[id(),input.fpoId,JSON.stringify({...input,farmer_id:input.farmerId})]);
  return q.rows[0];
 }

 validateProduction(input){
  const quantity=Number(input.quantity); const area=Number(input.area);
  if(!(quantity>=0)||!(area>0)) throw new Error('Production requires non-negative quantity and positive area');
  const yieldPerArea=quantity/area;
  return {valid:true,yield_per_area:yieldPerArea,production_loss_risk:yieldPerArea===0?'high':yieldPerArea<Number(input.expectedYield||0)*0.6?'high':'normal'};
 }

 classifyHarvest(input){
  const grade=String(input.grade||'').toUpperCase();
  const allowed=['A','B','C','REJECT'];
  if(!allowed.includes(grade)) throw new Error('Unsupported harvest grade');
  return {grade,marketable:grade!=='REJECT',quality_gate:grade==='REJECT'?'failed':'passed'};
 }

 async recordOperation(moduleCode,input){
  if(!/^M(0[5-9][0-9]|100)$/.test(moduleCode)) throw new Error('Module code outside M051-M100');
  if(!input.entityId) throw new Error(`${moduleCode} requires entityId`);
  const q=await this.db.query(`INSERT INTO agricultural_production_records (id,module_code,entity_type,entity_id,data,status,created_at) VALUES ($1,$2,$3,$4,$5,'recorded',NOW()) RETURNING *`,[id(),moduleCode,input.entityType||'agricultural_operation',String(input.entityId),JSON.stringify(input)]);
  return q.rows[0];
 }
}
module.exports=new M051M100AgricultureProductionService();
