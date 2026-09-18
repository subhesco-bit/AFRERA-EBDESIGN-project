/** M041 — Village Connectivity Mapping Service
 * Maps villages to postal, road, railway, airport, logistics, market and public-service nodes.
 * Uses stored GIS coordinates/route data; external geocoding or routing providers can populate nodes.
 */
const pool = require('../../database/pool');

function id(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function createNode(data) {
  const nodeId = data.node_id || id('NODE');
  const result = await pool.query(
    `INSERT INTO village_connectivity_nodes
      (node_id,node_type,name,official_code,latitude,longitude,address,district,state,country,service_area_km,metadata,status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
    [nodeId,data.node_type,data.name,data.official_code || null,data.latitude || null,data.longitude || null,
     data.address || null,data.district || null,data.state || null,data.country || 'India',
     data.service_area_km || null,data.metadata || {},data.status || 'active']
  );
  return result.rows[0];
}

async function linkVillage(villageId, data) {
  const linkId = data.link_id || id('LINK');
  const result = await pool.query(
    `INSERT INTO village_connectivity_links
      (link_id,village_id,node_id,access_type,distance_km,estimated_travel_minutes,route_quality,seasonal_access,route_geometry,is_primary,verified_at,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
     ON CONFLICT (village_id,node_id,access_type) DO UPDATE SET
       distance_km=EXCLUDED.distance_km,
       estimated_travel_minutes=EXCLUDED.estimated_travel_minutes,
       route_quality=EXCLUDED.route_quality,
       seasonal_access=EXCLUDED.seasonal_access,
       route_geometry=EXCLUDED.route_geometry,
       is_primary=EXCLUDED.is_primary,
       verified_at=EXCLUDED.verified_at,
       metadata=EXCLUDED.metadata,
       updated_at=NOW()
     RETURNING *`,
    [linkId,villageId,data.node_id,data.access_type,data.distance_km || null,data.estimated_travel_minutes || null,
     data.route_quality || null,data.seasonal_access || null,data.route_geometry || {},!!data.is_primary,
     data.verified_at || null,data.metadata || {}]
  );
  return result.rows[0];
}

async function addRoad(villageId, data) {
  const roadId = data.road_link_id || id('ROAD');
  const result = await pool.query(
    `INSERT INTO village_road_links
      (road_link_id,village_id,road_name,road_class,surface_type,condition,distance_km,all_weather,connectivity_status,route_geometry,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *`,
    [roadId,villageId,data.road_name || null,data.road_class || null,data.surface_type || null,data.condition || null,
     data.distance_km || null,data.all_weather == null ? null : !!data.all_weather,data.connectivity_status || null,
     data.route_geometry || {},data.metadata || {}]
  );
  return result.rows[0];
}

async function getMap(villageId) {
  const village = await pool.query('SELECT * FROM villages WHERE village_id=$1',[villageId]);
  if (!village.rows.length) throw new Error('Village not found');
  const links = await pool.query(`SELECT l.*,n.node_type,n.name,n.official_code,n.latitude,n.longitude,n.address,n.district,n.state
    FROM village_connectivity_links l JOIN village_connectivity_nodes n ON n.node_id=l.node_id
    WHERE l.village_id=$1 ORDER BY l.access_type,l.distance_km NULLS LAST`,[villageId]);
  const roads = await pool.query('SELECT * FROM village_road_links WHERE village_id=$1 ORDER BY distance_km NULLS LAST',[villageId]);
  return { village: village.rows[0], nodes: links.rows, roads: roads.rows };
}

async function upsertAssessment(villageId, data) {
  const assessmentId = data.assessment_id || id('ASSESS');
  const score = (data.road_access_score || 0) + (data.postal_access_score || 0) + (data.rail_access_score || 0) +
    (data.airport_access_score || 0) + (data.logistics_access_score || 0);
  const overall = data.overall_connectivity_score == null ? Math.min(100, score / 5) : data.overall_connectivity_score;
  const result = await pool.query(
    `INSERT INTO village_connectivity_assessments
      (assessment_id,village_id,nearest_post_office_node_id,nearest_railway_station_node_id,nearest_airport_node_id,nearest_logistics_node_id,nearest_market_node_id,primary_road_link_id,road_access_score,postal_access_score,rail_access_score,airport_access_score,logistics_access_score,overall_connectivity_score,bottlenecks,recommendations,metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
     ON CONFLICT (assessment_id) DO UPDATE SET
       nearest_post_office_node_id=EXCLUDED.nearest_post_office_node_id,
       nearest_railway_station_node_id=EXCLUDED.nearest_railway_station_node_id,
       nearest_airport_node_id=EXCLUDED.nearest_airport_node_id,
       nearest_logistics_node_id=EXCLUDED.nearest_logistics_node_id,
       nearest_market_node_id=EXCLUDED.nearest_market_node_id,
       primary_road_link_id=EXCLUDED.primary_road_link_id,
       road_access_score=EXCLUDED.road_access_score,postal_access_score=EXCLUDED.postal_access_score,
       rail_access_score=EXCLUDED.rail_access_score,airport_access_score=EXCLUDED.airport_access_score,
       logistics_access_score=EXCLUDED.logistics_access_score,overall_connectivity_score=EXCLUDED.overall_connectivity_score,
       bottlenecks=EXCLUDED.bottlenecks,recommendations=EXCLUDED.recommendations,metadata=EXCLUDED.metadata,assessed_at=NOW()
     RETURNING *`,
    [assessmentId,villageId,data.nearest_post_office_node_id || null,data.nearest_railway_station_node_id || null,
     data.nearest_airport_node_id || null,data.nearest_logistics_node_id || null,data.nearest_market_node_id || null,
     data.primary_road_link_id || null,data.road_access_score || 0,data.postal_access_score || 0,data.rail_access_score || 0,
     data.airport_access_score || 0,data.logistics_access_score || 0,overall,data.bottlenecks || [],data.recommendations || [],data.metadata || {}]
  );
  return result.rows[0];
}

async function getAssessment(villageId) {
  const result = await pool.query(`SELECT a.*,
    p.name AS post_office_name,r.name AS railway_station_name,ap.name AS airport_name,
    lh.name AS logistics_hub_name,m.name AS market_name
    FROM village_connectivity_assessments a
    LEFT JOIN village_connectivity_nodes p ON p.node_id=a.nearest_post_office_node_id
    LEFT JOIN village_connectivity_nodes r ON r.node_id=a.nearest_railway_station_node_id
    LEFT JOIN village_connectivity_nodes ap ON ap.node_id=a.nearest_airport_node_id
    LEFT JOIN village_connectivity_nodes lh ON lh.node_id=a.nearest_logistics_node_id
    LEFT JOIN village_connectivity_nodes m ON m.node_id=a.nearest_market_node_id
    WHERE a.village_id=$1 ORDER BY assessed_at DESC LIMIT 1`,[villageId]);
  return result.rows[0] || null;
}

module.exports = { createNode, linkVillage, addRoad, getMap, upsertAssessment, getAssessment };
