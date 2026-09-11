const crypto=require('crypto');
const {getPostgreSQL}=require('../database');
class E2EVerificationService{
 constructor(){this.db=getPostgreSQL();}
 async start(input){const id=crypto.randomUUID(), correlationId=input.correlationId||crypto.randomUUID();const q=await this.db.query(`INSERT INTO e2e_flow_runs (id,correlation_id,flow_type,status,metadata) VALUES ($1,$2,$3,'started',$4) RETURNING *`,[id,correlationId,input.flowType||'village_to_settlement',JSON.stringify(input)]);return q.rows[0];}
 async stage(runId,stage,status,details={}){const q=await this.db.query(`UPDATE e2e_flow_runs SET metadata=jsonb_set(COALESCE(metadata,'{}'::jsonb),ARRAY[$2],$3::jsonb,TRUE),status=CASE WHEN $4='failed' THEN 'failed' ELSE status END,updated_at=NOW() WHERE id=$1 RETURNING *`,[runId,stage,JSON.stringify({status,details,at:new Date().toISOString()}),status]);return q.rows[0];}
 async complete(runId){const q=await this.db.query(`UPDATE e2e_flow_runs SET status='completed',updated_at=NOW() WHERE id=$1 RETURNING *`,[runId]);return q.rows[0];}
}
module.exports=new E2EVerificationService();
