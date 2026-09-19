#!/usr/bin/env node
'use strict';
const fs=require('fs');
const path=require('path');
const {Pool}=require('pg');
require('dotenv').config();
const migrationsDir=path.join(__dirname,'migrations');
const files=[
 '20260911_m001_m050_assurance.sql',
 '20260911_m001_m050_enterprise_product.sql',
 '20260911_m001_m050_highest_standard.sql',
 '20260911_m001_m050_operational_erp.sql',
 '20260911_m034_m049_operational_completion.sql'
];
async function run(){
 const pool=new Pool({user:process.env.DB_USER||'ebdesign_user',password:process.env.DB_PASSWORD||'ebdesign_dev_password_change_in_prod',host:process.env.DB_HOST||'localhost',port:Number(process.env.DB_PORT||5432),database:process.env.DB_NAME||'ebdesign'});
 try{
  await pool.query('SELECT 1');
  for(const file of files){
   const full=path.join(migrationsDir,file);if(!fs.existsSync(full))throw new Error(`Required M001-M050 migration missing: ${file}`);
   const sql=fs.readFileSync(full,'utf8');
   await pool.query('BEGIN');
   try{await pool.query(sql);await pool.query('COMMIT');console.log(`M001-M050 migration applied: ${file}`);}catch(e){await pool.query('ROLLBACK');throw Object.assign(e,{migration:file});}
  }
  const required=['module_production_assurance','m001_m050_operational_tasks','m001_m050_kpi_snapshots','m001_m050_ai_native_evaluations','m001_m050_ai_decision_feedback','m001_m050_workflow_instances','m001_m050_workflow_transitions','m001_m050_decision_queue','m034_parcels','m035_gis_features','m037_water_resources','m038_geo_boundaries','m039_surveys','m049_community_assets'];
  const q=await pool.query('SELECT tablename FROM pg_tables WHERE schemaname=current_schema() AND tablename=ANY($1::text[])',[required]);
  const present=new Set(q.rows.map(x=>x.tablename));const missing=required.filter(x=>!present.has(x));if(missing.length)throw new Error(`M001-M050 schema incomplete: ${missing.join(', ')}`);
  console.log(`M001-M050 scoped schema verified: ${required.length} required tables`);
 }finally{await pool.end();}
}
run().catch(e=>{console.error(`M001-M050 migration failed${e.migration?` in ${e.migration}`:''}:`,e.message);process.exit(1);});
