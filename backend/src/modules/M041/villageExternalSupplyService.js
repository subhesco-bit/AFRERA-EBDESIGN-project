'use strict';

const pool = require('../../database/pool');
const { ValidationError, NotFoundError } = require('../../utils/errors');

const LAYERS = ['household', 'village', 'agro'];
const PRIORITIES = ['critical', 'high', 'normal', 'low'];
const ORDER_STATUSES = ['draft', 'submitted', 'approved', 'sourcing', 'in_transit', 'delivered', 'cancelled', 'closed'];

function villageId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new ValidationError('Valid village id is required');
  return n;
}
function layer(value) {
  const v = String(value || '').trim().toLowerCase();
  if (!LAYERS.includes(v)) throw new ValidationError(`demand_layer must be one of: ${LAYERS.join(', ')}`);
  return v;
}
function positive(value, label) {
  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) throw new ValidationError(`${label} must be greater than zero`);
  return n;
}
async function ensureVillage(id) {
  const r = await pool.query('SELECT id,name,state,district,block,gram_panchayat,pincode,address_line,latitude,longitude FROM villages WHERE id=$1', [id]);
  if (!r.rows.length) throw new NotFoundError(`Village not found: ${id}`);
  return r.rows[0];
}

async function upsertCatalogItem(payload) {
  const itemCode = String(payload.item_code || '').trim();
  const itemName = String(payload.item_name || '').trim();
  if (!itemCode || !itemName) throw new ValidationError('item_code and item_name are required');
  const demandLayer = layer(payload.demand_layer);
  const unit = String(payload.unit || 'unit').trim();
  const r = await pool.query(`
    INSERT INTO village_supply_catalog(item_code,item_name,demand_layer,category,subcategory,unit,description,standard_price,price_source,taxable,regulated,active,metadata)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,COALESCE($10,false),COALESCE($11,false),COALESCE($12,true),$13)
    ON CONFLICT(item_code) DO UPDATE SET item_name=EXCLUDED.item_name,demand_layer=EXCLUDED.demand_layer,category=EXCLUDED.category,subcategory=EXCLUDED.subcategory,unit=EXCLUDED.unit,description=EXCLUDED.description,standard_price=EXCLUDED.standard_price,price_source=EXCLUDED.price_source,taxable=EXCLUDED.taxable,regulated=EXCLUDED.regulated,active=EXCLUDED.active,metadata=EXCLUDED.metadata,updated_at=NOW()
    RETURNING *`, [itemCode,itemName,demandLayer,String(payload.category || 'other'),payload.subcategory || null,unit,payload.description || null,payload.standard_price == null ? null : Number(payload.standard_price),payload.price_source || null,Boolean(payload.taxable),Boolean(payload.regulated),payload.active !== false,payload.metadata || {}]);
  return r.rows[0];
}

async function listCatalog(options = {}) {
  const params = [];
  const where = ['active=true'];
  if (options.demand_layer) { params.push(layer(options.demand_layer)); where.push(`demand_layer=$${params.length}`); }
  if (options.category) { params.push(String(options.category)); where.push(`category=$${params.length}`); }
  if (options.search) { params.push(`%${String(options.search)}%`); where.push(`(item_name ILIKE $${params.length} OR item_code ILIKE $${params.length})`); }
  const r = await pool.query(`SELECT * FROM village_supply_catalog WHERE ${where.join(' AND ')} ORDER BY demand_layer,category,item_name`, params);
  return r.rows;
}

async function createDemand(villageIdValue, payload) {
  const id = villageId(villageIdValue);
  await ensureVillage(id);
  const demandLayer = layer(payload.demand_layer);
  const item = await pool.query('SELECT id,unit FROM village_supply_catalog WHERE item_code=$1 AND active=true', [payload.item_code]);
  if (!item.rows.length) throw new ValidationError(`Unknown active supply item: ${payload.item_code}`);
  const required = positive(payload.required_quantity, 'required_quantity');
  const fulfilled = payload.fulfilled_quantity == null ? 0 : Number(payload.fulfilled_quantity);
  if (!Number.isFinite(fulfilled) || fulfilled < 0 || fulfilled > required) throw new ValidationError('fulfilled_quantity must be between 0 and required_quantity');
  const priority = payload.priority || 'normal';
  if (!PRIORITIES.includes(priority)) throw new ValidationError(`priority must be one of: ${PRIORITIES.join(', ')}`);
  if (!payload.need_period_start) throw new ValidationError('need_period_start is required');
  const r = await pool.query(`INSERT INTO village_external_demands(village_id,demand_layer,household_id,requester_type,requester_id,item_id,required_quantity,fulfilled_quantity,unit,need_period_start,need_period_end,priority,source,purpose,metadata)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING *`, [id,demandLayer,payload.household_id || null,payload.requester_type || null,payload.requester_id || null,item.rows[0].id,required,fulfilled,payload.unit || item.rows[0].unit,payload.need_period_start,payload.need_period_end || null,priority,payload.source || 'manual',payload.purpose || null,payload.metadata || {}]);
  return r.rows[0];
}

async function supplyPlan(villageIdValue, options = {}) {
  const id = villageId(villageIdValue);
  const village = await ensureVillage(id);
  const params = [id];
  const conditions = ['village_id=$1'];
  if (options.demand_layer) { params.push(layer(options.demand_layer)); conditions.push(`demand_layer=$${params.length}`); }
  const r = await pool.query(`SELECT * FROM village_external_supply_plan WHERE ${conditions.join(' AND ')} ORDER BY earliest_need_date, demand_layer, category, item_name`, params);
  const totals = await pool.query(`SELECT demand_layer, SUM(required_quantity) required_quantity, SUM(fulfilled_quantity) fulfilled_quantity, SUM(outstanding_quantity) outstanding_quantity, SUM(demand_records) demand_records FROM village_external_supply_plan WHERE ${conditions.join(' AND ')} GROUP BY demand_layer ORDER BY demand_layer`, params);
  return { village, layers: r.rows, totals: totals.rows };
}

async function createSupplyOrder(villageIdValue, payload) {
  const id = villageId(villageIdValue);
  await ensureVillage(id);
  const demandLayer = layer(payload.demand_layer);
  const number = `SUBH-VIL-${id}-${Date.now()}`;
  const r = await pool.query(`INSERT INTO village_supply_orders(order_number,village_id,demand_layer,requested_by_type,requested_by_id,supplier_type,supplier_id,status,required_by,delivery_address,notes,metadata)
    VALUES($1,$2,$3,$4,$5,COALESCE($6,'subh_network'),$7,'draft',$8,$9,$10,$11) RETURNING *`, [number,id,demandLayer,payload.requested_by_type || 'village',payload.requested_by_id || null,payload.supplier_type || 'subh_network',payload.supplier_id || null,payload.required_by || null,payload.delivery_address || null,payload.notes || null,payload.metadata || {}]);
  return r.rows[0];
}

async function addOrderLine(orderId, payload) {
  const oid = Number(orderId);
  if (!Number.isInteger(oid) || oid < 1) throw new ValidationError('Valid order id is required');
  const item = await pool.query('SELECT id,unit,standard_price FROM village_supply_catalog WHERE item_code=$1 AND active=true', [payload.item_code]);
  if (!item.rows.length) throw new ValidationError(`Unknown active supply item: ${payload.item_code}`);
  const quantity = positive(payload.quantity, 'quantity');
  const unitPrice = payload.unit_price == null ? Number(item.rows[0].standard_price || 0) : Number(payload.unit_price);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) throw new ValidationError('unit_price must be non-negative');
  const tax = payload.tax_amount == null ? 0 : Number(payload.tax_amount);
  if (!Number.isFinite(tax) || tax < 0) throw new ValidationError('tax_amount must be non-negative');
  const total = quantity * unitPrice + tax;
  const order = await pool.query('SELECT id FROM village_supply_orders WHERE id=$1', [oid]);
  if (!order.rows.length) throw new NotFoundError(`Supply order not found: ${oid}`);
  const r = await pool.query(`INSERT INTO village_supply_order_lines(order_id,demand_id,item_id,quantity,unit,unit_price,tax_amount,line_total,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [oid,payload.demand_id || null,item.rows[0].id,quantity,payload.unit || item.rows[0].unit,unitPrice,tax,total,payload.metadata || {}]);
  await pool.query(`UPDATE village_supply_orders SET estimated_subtotal=(SELECT COALESCE(SUM(quantity*unit_price),0) FROM village_supply_order_lines WHERE order_id=$1), estimated_tax=(SELECT COALESCE(SUM(tax_amount),0) FROM village_supply_order_lines WHERE order_id=$1), estimated_total=(SELECT COALESCE(SUM(line_total),0) FROM village_supply_order_lines WHERE order_id=$1), updated_at=NOW() WHERE id=$1`, [oid]);
  return r.rows[0];
}

async function listOrders(villageIdValue, options = {}) {
  const id = villageId(villageIdValue);
  await ensureVillage(id);
  const params = [id];
  const where = ['village_id=$1'];
  if (options.demand_layer) { params.push(layer(options.demand_layer)); where.push(`demand_layer=$${params.length}`); }
  if (options.status) { const s = String(options.status); if (!ORDER_STATUSES.includes(s)) throw new ValidationError(`Invalid order status: ${s}`); params.push(s); where.push(`status=$${params.length}`); }
  const r = await pool.query(`SELECT * FROM village_supply_order_summary WHERE ${where.join(' AND ')} ORDER BY order_date DESC,id DESC`, params);
  return r.rows;
}

async function updateOrder(orderId, payload) {
  const oid = Number(orderId);
  if (!Number.isInteger(oid) || oid < 1) throw new ValidationError('Valid order id is required');
  if (payload.status && !ORDER_STATUSES.includes(payload.status)) throw new ValidationError(`Invalid order status: ${payload.status}`);
  const fields = [];
  const values = [];
  for (const key of ['status','required_by','delivery_address','supplier_type','supplier_id','notes','payment_status','actual_total']) {
    if (payload[key] !== undefined) { values.push(payload[key]); fields.push(`${key}=$${values.length}`); }
  }
  if (!fields.length) throw new ValidationError('No order fields supplied');
  values.push(oid);
  const r = await pool.query(`UPDATE village_supply_orders SET ${fields.join(',')},updated_at=NOW() WHERE id=$${values.length} RETURNING *`, values);
  if (!r.rows.length) throw new NotFoundError(`Supply order not found: ${oid}`);
  return r.rows[0];
}

async function aiSupplyContext(villageIdValue) {
  const id = villageId(villageIdValue);
  const plan = await supplyPlan(id);
  const geo = await pool.query('SELECT * FROM village_logistics_profiles WHERE village_id=$1', [id]);
  return { village: plan.village, external_supply_plan: plan.layers, layer_totals: plan.totals, logistics_profile: geo.rows[0] || null, instruction: 'Use this context to identify what the village/households/Agro OS need from outside, prioritise gaps, and propose SUBH sourcing and delivery actions. Do not fabricate prices, suppliers, eligibility, or availability.' };
}

module.exports = { upsertCatalogItem, listCatalog, createDemand, supplyPlan, createSupplyOrder, addOrderLine, listOrders, updateOrder, aiSupplyContext };
