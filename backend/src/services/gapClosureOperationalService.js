const crypto = require('crypto');
const { getPostgreSQL } = require('../database');
const id = () => crypto.randomUUID();

class GapClosureOperationalService {
  constructor() { this.db = getPostgreSQL(); }
  async createHousehold(villageId, data) {
    const q = await this.db.query(`INSERT INTO village_households (id,village_id,household_code,head_name,member_count,livelihood_summary,bank_access,digital_access,vulnerability) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [id(), villageId, data.household_code, data.head_name || null, data.member_count || 0, JSON.stringify(data.livelihood_summary || {}), data.bank_access ?? null, data.digital_access ?? null, JSON.stringify(data.vulnerability || {})]);
    return q.rows[0];
  }
  async villageReadiness(villageId) {
    const checks = await Promise.all([
      this.db.query('SELECT COUNT(*)::int count FROM village_households WHERE village_id=$1 AND is_active=true',[villageId]),
      this.db.query('SELECT COUNT(*)::int count FROM village_assets WHERE village_id=$1 AND status=\'active\'',[villageId]),
      this.db.query('SELECT COUNT(*)::int count FROM village_service_coverage WHERE village_id=$1',[villageId]),
      this.db.query('SELECT COUNT(*)::int count FROM village_skills WHERE village_id=$1',[villageId]),
      this.db.query('SELECT COUNT(*)::int count FROM village_hazards WHERE village_id=$1',[villageId]),
      this.db.query('SELECT COUNT(*)::int count FROM village_connectivity WHERE village_id=$1',[villageId]),
      this.db.query('SELECT COUNT(*)::int count FROM village_natural_resources WHERE village_id=$1',[villageId])
    ]);
    const values = checks.map(x=>x.rows[0].count);
    const populated = values.filter(v=>v>0).length;
    return { village_id:villageId, dimensions:{households:values[0],assets:values[1],services:values[2],skills:values[3],hazards:values[4],connectivity:values[5],natural_resources:values[6]}, readiness_score:Number((populated/values.length*100).toFixed(2)), methodology:'evidence_presence_v1', generated_at:new Date().toISOString() };
  }
  async inventoryReconciliation(input) {
    const q=await this.db.query(`INSERT INTO inventory_reconciliation_runs (id,correlation_id,warehouse_id,system_quantity,counted_quantity,status,evidence) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,[id(),input.correlationId||id(),input.warehouseId||null,Number(input.systemQuantity||0),Number(input.countedQuantity||0),'completed',JSON.stringify(input.evidence||{})]);
    return q.rows[0];
  }
  async createTrip(input) {
    const q=await this.db.query(`INSERT INTO logistics_trips (id,shipment_id,vehicle_id,driver_id,route,planned_start,status,freight_cost,metadata) VALUES ($1,$2,$3,$4,$5,$6,'planned',$7,$8) RETURNING *`,[id(),input.shipmentId||null,input.vehicleId||null,input.driverId||null,JSON.stringify(input.route||{}),input.plannedStart||null,Number(input.freightCost||0),JSON.stringify(input.metadata||{})]);
    return q.rows[0];
  }
}
module.exports = new GapClosureOperationalService();
