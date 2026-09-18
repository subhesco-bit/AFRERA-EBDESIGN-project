'use strict';
const pool = require('../../database/pool');
const { withTransaction } = require('../../core/withTransaction');
const aiGateway = require('../aiGatewayService');

const TYPES = new Set(['cold_storage','warehouse','machinery','rental','mobile_processing','laboratory','road','rail','air','courier','freight_pool']);
const r4 = (n) => Math.round((Number(n) + Number.EPSILON) * 10000) / 10000;
const nonnegative = (value, field) => { const n=Number(value); if(!Number.isFinite(n)||n<0){const e=new Error(`${field} must be non-negative`);e.statusCode=400;throw e;} return n; };

function scoreOption(option, demand) {
  if (demand.originState && option.originState !== demand.originState) return { eligible:false, reason:'origin_not_served' };
  if (demand.destinationState && option.destinationState !== demand.destinationState) return { eligible:false, reason:'destination_not_served' };
  const capacity = nonnegative(option.availableCapacity, 'availableCapacity');
  const quantity = nonnegative(demand.quantity, 'quantity');
  if (capacity < quantity) return { eligible:false, reason:'insufficient_capacity' };
  if (demand.coldChainRequired && !option.coldChain) return { eligible:false, reason:'cold_chain_required' };
  if (option.departureAt && demand.readyAt && new Date(option.departureAt) < new Date(demand.readyAt)) return { eligible:false, reason:'departs_before_ready' };
  if (option.arrivalAt && demand.deliverBy && new Date(option.arrivalAt) > new Date(demand.deliverBy)) return { eligible:false, reason:'misses_delivery_window' };
  const hours = nonnegative(option.transitHours, 'transitHours');
  if (demand.remainingShelfLifeHours != null && hours > nonnegative(demand.remainingShelfLifeHours, 'remainingShelfLifeHours')) return { eligible:false, reason:'shelf_life_exceeded' };
  const cost = nonnegative(option.landedCost, 'landedCost');
  const reliability = Math.min(1, Math.max(0, Number(option.reliability ?? 0)));
  const risk = Math.min(1, Math.max(0, Number(option.risk ?? 1)));
  const emissions = nonnegative(option.emissionsKgCo2e ?? 0, 'emissionsKgCo2e');
  const perishability = Math.min(1, Math.max(0, Number(demand.perishability ?? 0)));
  const weights = demand.weights || {};
  const score = r4(cost * (weights.cost ?? 1) + hours * (1 + perishability * 4) * (weights.time ?? 1) +
    risk * 1000 * (weights.risk ?? 1) + (1-reliability) * 1000 * (weights.reliability ?? 1) + emissions * (weights.emissions ?? 0.1));
  return { eligible:true, score, components:{ landedCost:cost, transitHours:hours, risk, reliability, emissionsKgCo2e:emissions } };
}

class SharedCapacityService {
  constructor(){this.pool=pool;}
  optimize(demand, options){
    if(!demand||!Array.isArray(options)||!options.length){const e=new Error('demand and options[] are required');e.statusCode=400;throw e;}
    const evaluated=options.map(o=>({optionId:o.id,...scoreOption(o,demand)})).sort((a,b)=>(a.eligible===b.eligible?a.score-b.score:a.eligible?-1:1));
    return { recommendation:evaluated.find(x=>x.eligible)||null, evaluated, deterministic:true,
      guarantee:'ranked feasible alternatives; global optimality is not claimed' };
  }
  async explain(result){return aiGateway.run({moduleId:'EBD-SHARED-CAPACITY',capability:'explain_fulfillment',prompt:`Explain without changing this deterministic recommendation: ${JSON.stringify(result)}`});}
  async registerResource(input, actor){
    if(!TYPES.has(input.resourceType)){const e=new Error('Unsupported resourceType');e.statusCode=400;throw e;}
    const {rows}=await this.pool.query(`INSERT INTO shared_capacity_resources (tenant_id,resource_type,name,location,cold_chain,unit,metadata,created_by)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[actor.tenantId||actor.tenant_id||null,input.resourceType,input.name,input.location||null,Boolean(input.coldChain),input.unit,input.metadata||{},actor.id]); return rows[0];
  }
  async createSlot(input, actor){
    const capacity=nonnegative(input.capacity,'capacity'); if(capacity<=0||new Date(input.endAt)<=new Date(input.startAt)){const e=new Error('Positive capacity and a valid time window are required');e.statusCode=400;throw e;}
    const {rows}=await this.pool.query(`INSERT INTO shared_capacity_slots (resource_id,start_at,end_at,total_capacity,available_capacity,unit,price_per_unit,created_by)
      SELECT id,$2,$3,$4,$4,$5,$6,$7 FROM shared_capacity_resources WHERE id=$1 AND (tenant_id=$8 OR $9=TRUE) RETURNING *`,
      [input.resourceId,input.startAt,input.endAt,capacity,input.unit,nonnegative(input.pricePerUnit||0,'pricePerUnit'),actor.id,actor.tenantId||actor.tenant_id||null,['admin','super_admin'].includes(actor.role)]); if(!rows[0]){const e=new Error('Resource not found');e.statusCode=404;throw e;} return rows[0];
  }
  async reserve(input, actor){
    const quantity=nonnegative(input.quantity,'quantity'); if(quantity<=0){const e=new Error('quantity must be positive');e.statusCode=400;throw e;}
    if(!input.idempotencyKey){const e=new Error('idempotencyKey is required');e.statusCode=400;throw e;}
    return withTransaction(async client=>{
      const replay=await client.query('SELECT * FROM shared_capacity_reservations WHERE requester_id=$1 AND idempotency_key=$2',[actor.id,input.idempotencyKey]);
      if(replay.rows[0]) return replay.rows[0];
      const found=await client.query(`SELECT s.*,r.tenant_id FROM shared_capacity_slots s JOIN shared_capacity_resources r ON r.id=s.resource_id WHERE s.id=$1 AND (r.tenant_id IS NULL OR r.tenant_id=$2) FOR UPDATE`,[input.slotId,actor.tenantId||actor.tenant_id||null]); const slot=found.rows[0];
      if(!slot){const e=new Error('Capacity slot not found');e.statusCode=404;throw e;}
      const status=Number(slot.available_capacity)>=quantity?'confirmed':'waitlisted';
      const inserted=await client.query(`INSERT INTO shared_capacity_reservations (slot_id,tenant_id,requester_id,quantity,status,hold_expires_at,idempotency_key,purpose)
        VALUES ($1,$2,$3,$4,$5,CASE WHEN $5='confirmed' THEN NOW()+INTERVAL '15 minutes' END,$6,$7)
        ON CONFLICT (requester_id,idempotency_key) DO NOTHING RETURNING *`,
        [input.slotId,actor.tenantId||actor.tenant_id||null,actor.id,quantity,status,input.idempotencyKey,input.purpose||null]);
      if(!inserted.rows[0]) return (await client.query('SELECT * FROM shared_capacity_reservations WHERE requester_id=$1 AND idempotency_key=$2',[actor.id,input.idempotencyKey])).rows[0];
      if(status==='confirmed') await client.query('UPDATE shared_capacity_slots SET available_capacity=available_capacity-$2,updated_at=NOW() WHERE id=$1',[input.slotId,quantity]);
      await client.query('INSERT INTO shared_capacity_events (reservation_id,event_type,actor_id,details) VALUES ($1,$2,$3,$4)',[inserted.rows[0].id,status,actor.id,{quantity}]); return inserted.rows[0];
    },{name:'sharedCapacity.reserve'});
  }
  async cancel(id,actor){return withTransaction(async client=>{
    const found=await client.query('SELECT * FROM shared_capacity_reservations WHERE id=$1 FOR UPDATE',[id]); const r=found.rows[0];
    if(!r||(!['admin','super_admin'].includes(actor.role)&&r.requester_id!==actor.id)){const e=new Error('Reservation not found');e.statusCode=404;throw e;}
    if(['cancelled','expired'].includes(r.status)) return r;
    const updated=await client.query("UPDATE shared_capacity_reservations SET status='cancelled',updated_at=NOW() WHERE id=$1 RETURNING *",[id]);
    if(['confirmed','held'].includes(r.status)) await client.query('UPDATE shared_capacity_slots SET available_capacity=LEAST(total_capacity,available_capacity+$2),updated_at=NOW() WHERE id=$1',[r.slot_id,r.quantity]);
    await client.query('INSERT INTO shared_capacity_events (reservation_id,event_type,actor_id,details) VALUES ($1,$2,$3,$4)',[id,'cancelled',actor.id,{}]); return updated.rows[0];
  },{name:'sharedCapacity.cancel'});}
}
module.exports=new SharedCapacityService(); module.exports.scoreOption=scoreOption;
