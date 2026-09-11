'use strict';

const pool = require('../../database/pool');
const { ValidationError, NotFoundError } = require('../../utils/errors');

function villageId(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new ValidationError('Valid village id is required');
  return n;
}

async function getPotential(village, commodityCode) {
  const params = [villageId(village)];
  const filter = commodityCode ? ` AND c.commodity_code=$2` : '';
  if (commodityCode) params.push(String(commodityCode));

  const result = await pool.query(`
    WITH current AS (
      SELECT p.village_id,p.commodity_id,
             SUM(p.quantity) current_quantity,
             SUM(COALESCE(p.production_area_acres,0)) current_area,
             CASE WHEN SUM(COALESCE(p.production_area_acres,0)) > 0
                  THEN SUM(p.quantity)/SUM(p.production_area_acres) END current_yield
      FROM village_production_records p
      JOIN village_production_commodities c ON c.id=p.commodity_id
      WHERE p.village_id=$1${filter}
      GROUP BY p.village_id,p.commodity_id
    )
    SELECT v.id village_id,v.name village_name,v.state,v.district,v.block,
           c.commodity_code,c.commodity_name,c.category,c.default_unit,
           x.current_quantity,x.current_area,x.current_yield,
           COALESCE(pp.potential_area_acres, x.current_area) potential_area_acres,
           COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre) benchmark_yield_per_acre,
           COALESCE(pp.benchmark_unit,b.benchmark_unit,c.default_unit) benchmark_unit,
           COALESCE(pp.potential_production_quantity,
             CASE WHEN COALESCE(pp.potential_area_acres,x.current_area)>0 AND COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre)>0
                  THEN COALESCE(pp.potential_area_acres,x.current_area)*COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre) END) potential_quantity,
           COALESCE(pp.production_gap_quantity,
             GREATEST(0,COALESCE(pp.potential_area_acres,x.current_area)*COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre)-x.current_quantity)) production_gap,
           CASE WHEN COALESCE(pp.potential_area_acres,x.current_area)>0 AND COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre)>0
                THEN ROUND((x.current_quantity/NULLIF(COALESCE(pp.potential_area_acres,x.current_area)*COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre),0)*100)::numeric,2) END utilization_pct,
           CASE WHEN COALESCE(pp.potential_area_acres,x.current_area)>0 AND COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre)>0
                THEN ROUND(LEAST(100,GREATEST(0,100-(x.current_quantity/NULLIF(COALESCE(pp.potential_area_acres,x.current_area)*COALESCE(pp.benchmark_yield_per_acre,b.benchmark_yield_per_acre),0)*100)))::numeric,2) END opportunity_score,
           COALESCE(pp.calculation_source,CASE WHEN b.id IS NULL THEN 'area_only' ELSE 'benchmark' END) calculation_source,
           b.source_name,b.source_reference
    FROM current x
    JOIN villages v ON v.id=x.village_id
    JOIN village_production_commodities c ON c.id=x.commodity_id
    LEFT JOIN LATERAL (
      SELECT b.* FROM village_production_benchmarks b
      WHERE b.commodity_id=c.id AND b.active=true
        AND (b.state IS NULL OR lower(b.state)=lower(v.state))
        AND (b.district IS NULL OR lower(b.district)=lower(v.district))
        AND (b.block IS NULL OR lower(b.block)=lower(v.block))
      ORDER BY (CASE WHEN b.block IS NOT NULL THEN 4 ELSE 0 END + CASE WHEN b.district IS NOT NULL THEN 2 ELSE 0 END + CASE WHEN b.state IS NOT NULL THEN 1 ELSE 0 END) DESC, b.verified_at DESC NULLS LAST
      LIMIT 1
    ) b ON TRUE
    LEFT JOIN village_commodity_potential_profiles pp ON pp.village_id=v.id AND pp.commodity_id=c.id
    ORDER BY opportunity_score DESC NULLS LAST,c.category,c.commodity_name`, params);

  return result.rows.map((r) => ({
    ...r,
    current_quantity: Number(r.current_quantity || 0),
    current_area_acres: Number(r.current_area || 0),
    current_yield_per_acre: r.current_yield == null ? null : Number(Number(r.current_yield).toFixed(4)),
    potential_area_acres: Number(r.potential_area_acres || 0),
    benchmark_yield_per_acre: r.benchmark_yield_per_acre == null ? null : Number(r.benchmark_yield_per_acre),
    potential_quantity: r.potential_quantity == null ? null : Number(r.potential_quantity),
    production_gap: r.production_gap == null ? null : Number(r.production_gap),
    utilization_pct: r.utilization_pct == null ? null : Number(r.utilization_pct),
    opportunity_score: r.opportunity_score == null ? null : Number(r.opportunity_score),
  }));
}

async function productionPotential(village, options = {}) {
  const rows = await getPotential(village, options.commodity_code);
  if (!rows.length) throw new NotFoundError(`No production records found for village: ${village}`);
  return {
    village_id: villageId(village),
    opportunities: rows,
    methodology: 'Current yield = production quantity / reported production acres. Potential production = potential acres × verified regional benchmark yield per acre. Production gap = potential production − current production. Opportunity score is the percentage of benchmark potential not yet realized.',
  };
}

async function upsertProfile(village, payload) {
  const vid = villageId(village);
  const code = String(payload.commodity_code || '').trim();
  if (!code) throw new ValidationError('commodity_code is required');
  const commodity = await pool.query(`SELECT id,default_unit FROM village_production_commodities WHERE commodity_code=$1 AND active=true`, [code]);
  if (!commodity.rows.length) throw new ValidationError(`Unknown active commodity: ${code}`);
  const area = payload.potential_area_acres == null ? null : Number(payload.potential_area_acres);
  const benchmark = payload.benchmark_yield_per_acre == null ? null : Number(payload.benchmark_yield_per_acre);
  if (area != null && (!Number.isFinite(area) || area < 0)) throw new ValidationError('potential_area_acres must be non-negative');
  if (benchmark != null && (!Number.isFinite(benchmark) || benchmark < 0)) throw new ValidationError('benchmark_yield_per_acre must be non-negative');
  const result = await pool.query(`
    INSERT INTO village_commodity_potential_profiles(village_id,commodity_id,potential_area_acres,benchmark_yield_per_acre,benchmark_unit,potential_production_quantity,production_gap_quantity,production_utilization_pct,potential_marketable_quantity,current_marketable_quantity,potential_market_value,current_market_value,opportunity_score,calculation_source,metadata)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
    ON CONFLICT(village_id,commodity_id) DO UPDATE SET potential_area_acres=EXCLUDED.potential_area_acres,benchmark_yield_per_acre=EXCLUDED.benchmark_yield_per_acre,benchmark_unit=EXCLUDED.benchmark_unit,potential_production_quantity=EXCLUDED.potential_production_quantity,production_gap_quantity=EXCLUDED.production_gap_quantity,production_utilization_pct=EXCLUDED.production_utilization_pct,potential_marketable_quantity=EXCLUDED.potential_marketable_quantity,current_marketable_quantity=EXCLUDED.current_marketable_quantity,potential_market_value=EXCLUDED.potential_market_value,current_market_value=EXCLUDED.current_market_value,opportunity_score=EXCLUDED.opportunity_score,calculation_source=EXCLUDED.calculation_source,metadata=EXCLUDED.metadata,calculated_at=NOW()
    RETURNING *`, [vid,commodity.rows[0].id,area,benchmark,payload.benchmark_unit || commodity.rows[0].default_unit,payload.potential_production_quantity == null && area != null && benchmark != null ? area*benchmark : payload.potential_production_quantity == null ? null : Number(payload.potential_production_quantity),payload.production_gap_quantity == null ? null : Number(payload.production_gap_quantity),payload.production_utilization_pct == null ? null : Number(payload.production_utilization_pct),payload.potential_marketable_quantity == null ? null : Number(payload.potential_marketable_quantity),payload.current_marketable_quantity == null ? null : Number(payload.current_marketable_quantity),payload.potential_market_value == null ? null : Number(payload.potential_market_value),payload.current_market_value == null ? null : Number(payload.current_market_value),payload.opportunity_score == null ? null : Number(payload.opportunity_score),payload.calculation_source || 'manual',payload.metadata || {}]);
  return result.rows[0];
}

module.exports = { productionPotential, upsertProfile };
