const { getPostgreSQL } = require('../database/connection');

const TRANSITIONS = {
  planned: ['allocated','cancelled'], allocated: ['picked_up','cancelled'], picked_up: ['in_transit','failed'], in_transit: ['out_for_delivery','failed','returned'], out_for_delivery: ['delivered','failed'], delivered: [], failed: ['returned'], returned: [], cancelled: []
};
function db(){ const pg=getPostgreSQL(); if(!pg) throw new Error('Database not initialized'); return pg; }
function shipmentNumber(){ return `SHP-${Date.now()}-${Math.floor(Math.random()*10000)}`; }
async function createShipment({orderId, origin, destination, plannedWeight=0, trackingReference, carrierId, vehicleId}){
  const pg=db();
  const result=await pg.query(`INSERT INTO fulfillment_shipments (shipment_number,order_id,origin,destination,planned_weight,tracking_reference,carrier_id,vehicle_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,[shipmentNumber(),orderId,origin||{},destination||{},plannedWeight,trackingReference||null,carrierId||null,vehicleId||null]);
  return result.rows[0];
}
async function allocate({shipmentId,allocations=[],actorId}){
  if(!allocations.length) throw new Error('At least one allocation is required');
  const pg=db(); const client=await pg.connect();
  try { await client.query('BEGIN');
    const shipment=await client.query('SELECT * FROM fulfillment_shipments WHERE id=$1 FOR UPDATE',[shipmentId]);
    if(!shipment.rows[0]) throw new Error('Shipment not found');
    for(const a of allocations){ if(!(Number(a.quantity)>0)) throw new Error('Allocation quantity must be positive'); if(!a.orderItemId) throw new Error('orderItemId is required'); await client.query(`INSERT INTO fulfillment_allocations (shipment_id,order_item_id,supply_lot_id,allocated_quantity,unit) VALUES ($1,$2,$3,$4,$5)`,[shipmentId,a.orderItemId,a.supplyLotId||null,a.quantity,a.unit||'kg']); }
    const updated=await client.query(`UPDATE fulfillment_shipments SET status='allocated',updated_at=NOW() WHERE id=$1 RETURNING *`,[shipmentId]);
    await client.query(`INSERT INTO delivery_events (shipment_id,event_type,actor_id,notes) VALUES ($1,'allocated',$2,$3)`,[shipmentId,actorId||null,'Allocation completed']);
    await client.query('COMMIT'); return updated.rows[0];
  } catch(e){ await client.query('ROLLBACK'); throw e; } finally { client.release(); }
}
async function transition(shipmentId,toStatus,actorId,notes){ const pg=db(); const client=await pg.connect(); try{ await client.query('BEGIN'); const current=await client.query('SELECT status FROM fulfillment_shipments WHERE id=$1 FOR UPDATE',[shipmentId]); if(!current.rows[0]) throw new Error('Shipment not found'); const from=current.rows[0].status; if(!(TRANSITIONS[from]||[]).includes(toStatus)) throw new Error(`Invalid shipment transition: ${from} -> ${toStatus}`); const updated=await client.query(`UPDATE fulfillment_shipments SET status=$1,delivered_at=CASE WHEN $1='delivered' THEN NOW() ELSE delivered_at END,updated_at=NOW() WHERE id=$2 RETURNING *`,[toStatus,shipmentId]); await client.query(`INSERT INTO delivery_events (shipment_id,event_type,actor_id,notes) VALUES ($1,$2,$3,$4)`,[shipmentId,toStatus,actorId||null,notes||null]); await client.query('COMMIT'); return updated.rows[0]; }catch(e){await client.query('ROLLBACK');throw e;}finally{client.release();} }
async function getShipment(id){ const pg=db(); const s=await pg.query('SELECT * FROM fulfillment_shipments WHERE id=$1',[id]); if(!s.rows[0]) return null; const a=await pg.query('SELECT * FROM fulfillment_allocations WHERE shipment_id=$1 ORDER BY created_at',[id]); const e=await pg.query('SELECT * FROM delivery_events WHERE shipment_id=$1 ORDER BY event_time',[id]); return {...s.rows[0],allocations:a.rows,events:e.rows}; }
module.exports={createShipment,allocate,transition,getShipment,TRANSITIONS};
