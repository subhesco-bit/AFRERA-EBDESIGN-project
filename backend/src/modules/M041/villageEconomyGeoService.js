'use strict';

const pool = require('../../database/pool');
const { ValidationError, NotFoundError } = require('../../utils/errors');

const FACILITY_TYPES = ['post_office','railway_station','airport','market','warehouse','cold_store','collection_center','processing_unit','road_hub','other'];
const FLOW_TYPES = ['household_consumption','village_consumption','production_input','processing','storage','donation','loss','market','external_purchase'];

function id(value, label = 'village id') {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new ValidationError(`Valid ${label} is required`);
  return n;
}

function latLon(payload) {
  const latitude = Number(payload.latitude);
  const longitude = Number(payload.longitude);
  if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90 || !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    throw new ValidationError('Valid latitude and longitude are required');
  }
  return { latitude, longitude };
}

async function getVillageGeo(villageId) {
  const village = await pool.query(`SELECT id, name, village_code, state, district, block, tehsil, gram_panchayat, pincode, address_line, locality, latitude, longitude, geocode_source, geocode_accuracy_m, geocode_verified_at, logistics_profile FROM villages WHERE id = $1`, [id(villageId)]);
  if (!village.rows.length) throw new NotFoundError(`Village not found: ${villageId}`);
  return village.rows[0];
}

async function updateVillageGeo(villageId, payload) {
  const village = await getVillageGeo(villageId);
  const { latitude, longitude } = latLon(payload);
  const source = String(payload.geocode_source || 'manual').slice(0, 50);
  const accuracy = payload.geocode_accuracy_m == null ? null : Number(payload.geocode_accuracy_m);
  if (accuracy !== null && (!Number.isFinite(accuracy) || accuracy < 0)) throw new ValidationError('geocode_accuracy_m must be non-negative');
  const result = await pool.query(`UPDATE villages SET latitude=$1, longitude=$2, geocode_source=$3, geocode_accuracy_m=$4, geocode_verified_at=NOW(), address_line=COALESCE($5,address_line), locality=COALESCE($6,locality), updated_at=NOW() WHERE id=$7 RETURNING *`, [latitude, longitude, source, accuracy, payload.address_line || null, payload.locality || null, village.id]);
  return result.rows[0];
}

async function upsertFacility(payload) {
  const type = String(payload.facility_type || '').trim();
  const name = String(payload.name || '').trim();
  if (!FACILITY_TYPES.includes(type)) throw new ValidationError(`facility_type must be one of: ${FACILITY_TYPES.join(', ')}`);
  if (!name) throw new ValidationError('Facility name is required');
  const { latitude, longitude } = latLon(payload);
  const result = await pool.query(`INSERT INTO village_logistics_facilities (facility_type,name,facility_code,state,district,block,address,pincode,latitude,longitude,phone,operating_status,capacity,source,source_reference,verified_at,metadata) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,COALESCE($12,'active'),COALESCE($13,'{}'::jsonb),$14,$15,$16,$17) ON CONFLICT (facility_type,facility_code) DO UPDATE SET name=EXCLUDED.name,state=EXCLUDED.state,district=EXCLUDED.district,block=EXCLUDED.block,address=EXCLUDED.address,pincode=EXCLUDED.pincode,latitude=EXCLUDED.latitude,longitude=EXCLUDED.longitude,phone=EXCLUDED.phone,operating_status=EXCLUDED.operating_status,capacity=EXCLUDED.capacity,source=EXCLUDED.source,source_reference=EXCLUDED.source_reference,verified_at=EXCLUDED.verified_at,metadata=EXCLUDED.metadata,updated_at=NOW() RETURNING *`, [type,name,payload.facility_code || null,payload.state || null,payload.district || null,payload.block || null,payload.address || null,payload.pincode || null,latitude,longitude,payload.phone || null,payload.operating_status || 'active',payload.capacity || {},payload.source || 'manual',payload.source_reference || null,payload.verified_at || null,payload.metadata || {}]);
  return result.rows[0];
}

async function nearestFacilities(villageId, types = FACILITY_TYPES) {
  const village = await getVillageGeo(villageId);
  if (village.latitude == null || village.longitude == null) return { village, nearest: {}, routes: [] };
  const requested = types.filter((x) => FACILITY_TYPES.includes(x));
  const params = [Number(village.latitude), Number(village.longitude), requested];
  const { rows } = await pool.query(`SELECT f.*, ROUND((6371 * acos(LEAST(1, GREATEST(-1, cos(radians($1))*cos(radians(f.latitude))*cos(radians(f.longitude)-radians($2))+sin(radians($1))*sin(radians(f.latitude))))))::numeric, 3) AS distance_km FROM village_logistics_facilities f WHERE f.operating_status='active' AND f.facility_type = ANY($3::varchar[]) ORDER BY distance_km ASC`, params);
  const nearest = {};
  for (const row of rows) if (!nearest[row.facility_type]) nearest[row.facility_type] = row;
  const routes = [];
  for (const row of rows) {
    const minutes = row.distance_km == null ? null : Math.max(1, Math.round(Number(row.distance_km) / 35 * 60));
    await pool.query(`INSERT INTO village_logistics_routes(village_id,facility_id,route_type,distance_km,estimated_minutes,distance_source,last_calculated_at) VALUES($1,$2,'road',$3,$4,'geodesic',NOW()) ON CONFLICT(village_id,facility_id,route_type) DO UPDATE SET distance_km=EXCLUDED.distance_km,estimated_minutes=EXCLUDED.estimated_minutes,last_calculated_at=NOW()`, [village.id,row.id,row.distance_km,minutes]);
    routes.push({ facility_id: row.id, facility_type: row.facility_type, name: row.name, distance_km: Number(row.distance_km), estimated_road_minutes: minutes });
  }
  const profile = {
    nearest_post_office_id: nearest.post_office?.id || null,
    nearest_post_office_distance_km: nearest.post_office ? Number(nearest.post_office.distance_km) : null,
    nearest_railway_station_id: nearest.railway_station?.id || null,
    nearest_railway_station_distance_km: nearest.railway_station ? Number(nearest.railway_station.distance_km) : null,
    nearest_airport_id: nearest.airport?.id || null,
    nearest_airport_distance_km: nearest.airport ? Number(nearest.airport.distance_km) : null,
    nearest_market_id: nearest.market?.id || null,
    nearest_market_distance_km: nearest.market ? Number(nearest.market.distance_km) : null,
    nearest_warehouse_id: nearest.warehouse?.id || null,
    nearest_warehouse_distance_km: nearest.warehouse ? Number(nearest.warehouse.distance_km) : null,
    nearest_cold_store_id: nearest.cold_store?.id || null,
    nearest_cold_store_distance_km: nearest.cold_store ? Number(nearest.cold_store.distance_km) : null,
    nearest_collection_center_id: nearest.collection_center?.id || null,
    nearest_collection_center_distance_km: nearest.collection_center ? Number(nearest.collection_center.distance_km) : null,
    last_calculated_at: new Date().toISOString(),
  };
  await pool.query(`INSERT INTO village_logistics_profiles(village_id,nearest_post_office_id,nearest_post_office_distance_km,nearest_railway_station_id,nearest_railway_station_distance_km,nearest_airport_id,nearest_airport_distance_km,nearest_market_id,nearest_market_distance_km,nearest_warehouse_id,nearest_warehouse_distance_km,nearest_cold_store_id,nearest_cold_store_distance_km,nearest_collection_center_id,nearest_collection_center_distance_km,last_calculated_at) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW()) ON CONFLICT(village_id) DO UPDATE SET nearest_post_office_id=EXCLUDED.nearest_post_office_id,nearest_post_office_distance_km=EXCLUDED.nearest_post_office_distance_km,nearest_railway_station_id=EXCLUDED.nearest_railway_station_id,nearest_railway_station_distance_km=EXCLUDED.nearest_railway_station_distance_km,nearest_airport_id=EXCLUDED.nearest_airport_id,nearest_airport_distance_km=EXCLUDED.nearest_airport_distance_km,nearest_market_id=EXCLUDED.nearest_market_id,nearest_market_distance_km=EXCLUDED.nearest_market_distance_km,nearest_warehouse_id=EXCLUDED.nearest_warehouse_id,nearest_warehouse_distance_km=EXCLUDED.nearest_warehouse_distance_km,nearest_cold_store_id=EXCLUDED.nearest_cold_store_id,nearest_cold_store_distance_km=EXCLUDED.nearest_cold_store_distance_km,nearest_collection_center_id=EXCLUDED.nearest_collection_center_id,nearest_collection_center_distance_km=EXCLUDED.nearest_collection_center_distance_km,last_calculated_at=NOW()`, [village.id,profile.nearest_post_office_id,profile.nearest_post_office_distance_km,profile.nearest_railway_station_id,profile.nearest_railway_station_distance_km,profile.nearest_airport_id,profile.nearest_airport_distance_km,profile.nearest_market_id,profile.nearest_market_distance_km,profile.nearest_warehouse_id,profile.nearest_warehouse_distance_km,profile.nearest_cold_store_id,profile.nearest_cold_store_distance_km,profile.nearest_collection_center_id,profile.nearest_collection_center_distance_km]);
  return { village, nearest, profile, routes };
}

async function recordProduction(villageId, payload) {
  const village = await getVillageGeo(villageId);
  const commodity = String(payload.commodity_code || '').trim();
  if (!commodity) throw new ValidationError('commodity_code is required');
  const c = await pool.query(`SELECT id FROM village_production_commodities WHERE commodity_code=$1 AND active=true`, [commodity]);
  if (!c.rows.length) throw new ValidationError(`Unknown active commodity: ${commodity}`);
  const quantity = Number(payload.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) throw new ValidationError('quantity must be non-negative');
  const result = await pool.query(`INSERT INTO village_production_records(village_id,commodity_id,producer_type,producer_id,production_period_start,production_period_end,quantity,unit,quality_grade,estimated_value,source,notes,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`, [village.id,c.rows[0].id,payload.producer_type || 'farmer',payload.producer_id || null,payload.production_period_start,payload.production_period_end || null,quantity,payload.unit || 'kg',payload.quality_grade || null,payload.estimated_value == null ? null : Number(payload.estimated_value),payload.source || 'manual',payload.notes || null,payload.metadata || {}]);
  return result.rows[0];
}

async function recordFlow(villageId, payload) {
  const village = await getVillageGeo(villageId);
  const type = String(payload.flow_type || '');
  if (!FLOW_TYPES.includes(type)) throw new ValidationError(`flow_type must be one of: ${FLOW_TYPES.join(', ')}`);
  const quantity = Number(payload.quantity);
  if (!Number.isFinite(quantity) || quantity < 0) throw new ValidationError('quantity must be non-negative');
  const commodity = await pool.query(`SELECT id FROM village_production_commodities WHERE commodity_code=$1 AND active=true`, [payload.commodity_code]);
  if (!commodity.rows.length) throw new ValidationError(`Unknown active commodity: ${payload.commodity_code}`);
  const result = await pool.query(`INSERT INTO village_economic_flows(village_id,production_record_id,commodity_id,flow_type,destination_type,destination_id,period_start,period_end,quantity,unit,value_amount,source,notes,metadata) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`, [village.id,payload.production_record_id || null,commodity.rows[0].id,type,payload.destination_type || null,payload.destination_id || null,payload.period_start, payload.period_end || null,quantity,payload.unit || 'kg',payload.value_amount == null ? null : Number(payload.value_amount),payload.source || 'manual',payload.notes || null,payload.metadata || {}]);
  return result.rows[0];
}

async function economicBalance(villageId, period = {}) {
  const village = await getVillageGeo(villageId);
  const params = [village.id];
  const conditions = ['village_id=$1'];
  if (period.start) { params.push(period.start); conditions.push(`production_period_start >= $${params.length}`); }
  if (period.end) { params.push(period.end); conditions.push(`production_period_start <= $${params.length}`); }
  const result = await pool.query(`SELECT * FROM village_economic_balance WHERE village_id=$1 ORDER BY category,commodity_name`, [village.id]);
  return { village, period, commodities: result.rows };
}

module.exports = { getVillageGeo, updateVillageGeo, upsertFacility, nearestFacilities, recordProduction, recordFlow, economicBalance };
