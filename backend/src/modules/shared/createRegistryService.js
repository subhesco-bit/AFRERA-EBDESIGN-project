'use strict';
const crypto=require('crypto');
const pool=require('../../database/pool');
function make(cfg){
 const cols=cfg.columns;
 function validate(data,partial=false){const missing=(cfg.required||[]).filter(k=>!partial&&(data[k]===undefined||data[k]===null||data[k]===''));if(missing.length){const e=new Error(`Missing required fields: ${missing.join(', ')}`);e.statusCode=400;throw e;}if(cfg.validate)cfg.validate(data,partial);return data;}
 async function create(data,actor={}){
  validate(data);
  const id=crypto.randomUUID();
  // Omit undefined optional columns so PostgreSQL applies authoritative schema defaults.
  // Explicit null is retained when the caller intentionally supplies it.
  const supplied=cols.filter(k=>data[k]!==undefined);
  const fields=['id',...supplied,'created_by'];
  const vals=[id,...supplied.map(k=>data[k]),actor.id||null];
  const marks=vals.map((_,i)=>`$${i+1}`);
  const q=await pool.query(`INSERT INTO ${cfg.table}(${fields.join(',')}) VALUES(${marks.join(',')}) RETURNING *`,vals);
  return q.rows[0];
 }
 async function get(id){return (await pool.query(`SELECT * FROM ${cfg.table} WHERE id=$1 AND deleted_at IS NULL`,[id])).rows[0]||null;}
 async function list({limit=100,offset=0,status}={}){const lim=Math.min(Math.max(Number(limit)||100,1),500),off=Math.max(Number(offset)||0,0);const vals=[];let where='deleted_at IS NULL';if(status){vals.push(status);where+=` AND status=$${vals.length}`;}vals.push(lim,off);return (await pool.query(`SELECT * FROM ${cfg.table} WHERE ${where} ORDER BY updated_at DESC LIMIT $${vals.length-1} OFFSET $${vals.length}`,vals)).rows;}
 async function update(id,data,actor={}){validate(data,true);const allowed=cols.filter(k=>Object.prototype.hasOwnProperty.call(data,k));if(!allowed.length){const e=new Error('No supported fields supplied');e.statusCode=400;throw e;}const vals=allowed.map(k=>data[k]);const sets=allowed.map((k,i)=>`${k}=$${i+1}`);vals.push(actor.id||null,id);sets.push(`updated_by=$${vals.length-1}`,`updated_at=NOW()`);const q=await pool.query(`UPDATE ${cfg.table} SET ${sets.join(',')} WHERE id=$${vals.length} AND deleted_at IS NULL RETURNING *`,vals);if(!q.rows[0]){const e=new Error(`${cfg.entity} not found`);e.statusCode=404;throw e;}return q.rows[0];}
 async function remove(id,actor={}){const q=await pool.query(`UPDATE ${cfg.table} SET deleted_at=NOW(),updated_by=$1,updated_at=NOW() WHERE id=$2 AND deleted_at IS NULL RETURNING *`,[actor.id||null,id]);if(!q.rows[0]){const e=new Error(`${cfg.entity} not found`);e.statusCode=404;throw e;}return q.rows[0];}
 return {create,get,list,update,remove,validate};
}
module.exports=make;
