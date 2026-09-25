from pathlib import Path
p=Path(r'C:\Users\DIYA GOEL\Downloads\EBDESIGN\backend\src\services\commerce\marketPriceTruthService.js')
t=p.read_text(encoding='utf-8')
anchor="module.exports={SOURCE_CATALOG,MASS_TO_KG,pricePerKg,recencyFactor,geographySpecificity,completenessFactor,buildObservation,rankObservations,summarizeSeries,persistObservation,prototypeObservation,sourceCatalogPublic};"
if anchor not in t: raise RuntimeError('market price export anchor missing')
insert=r'''
function rowToObservation(row){
  return {
    id:row.id, productId:row.product_id||null, productName:row.product_name||null,
    commodity:row.commodity||row.product_name||null, variety:row.variety||null, grade:row.grade||null,
    sourceType:row.source_type, sourceName:row.source_name, sourceAuthority:row.source_authority,
    collectionMethod:row.collection_method, sourceUrl:row.source_url||null, sourceRecordId:row.source_record_id||null,
    marketLevel:row.market_level, priceKind:row.price_kind, currency:row.currency||'INR',
    pricePerKgInr:row.price_per_kg_inr==null?null:Number(row.price_per_kg_inr),
    geography:row.geography||row.source_location||{},
    observedAt:row.observed_at?new Date(row.observed_at).toISOString():null,
    verificationStatus:row.verification_status,
    matchConfidence:row.match_confidence==null?null:Number(row.match_confidence),
    confidenceScore:row.confidence_score==null?null:Number(row.confidence_score),
    confidenceBasis:row.confidence_basis||{},
    eligibleForBenchmark:Boolean(row.eligible_for_benchmark),
    private:row.market_level==='farm_gate_floor',
  };
}

async function loadProductObservations({productId,productName,days=730,marketLevel,db=pool}={}){
  if(!productId&&!productName)throw new Error('productId or productName is required');
  const params=[productId||null,productName?'%'+productName+'%':null,Math.max(1,Math.min(Number(days)||730,3650)),marketLevel||null];
  const {rows}=await db.query(
    `SELECT * FROM v_market_price_truth
      WHERE ($1::text IS NULL OR product_id::text=$1)
        AND ($2::text IS NULL OR product_name ILIKE $2)
        AND ($4::text IS NULL OR market_level=$4)
        AND (observed_at IS NULL OR observed_at >= CURRENT_TIMESTAMP - ($3 || ' days')::interval)
      ORDER BY eligible_for_benchmark DESC, confidence_score DESC NULLS LAST, observed_at DESC NULLS LAST`,
    params
  );
  return rows.map(rowToObservation);
}

async function marketSnapshot({productId,productName,days=730,db=pool}={}){
  const observations=await loadProductObservations({productId,productName,days,db});
  const publicRows=observations.filter((x)=>!x.private);
  const byLevel={};
  for(const row of publicRows)(byLevel[row.marketLevel]=byLevel[row.marketLevel]||[]).push(row);
  const levels={};
  for(const [level,rows] of Object.entries(byLevel))levels[level]=summarizeSeries(rows);
  const all=summarizeSeries(publicRows);
  return {
    productId:productId||null, productName:productName||null, days,
    observations:publicRows.length, benchmarkObservations:all.benchmarkObservations,
    current:all.current, range:all.range, mean:all.mean, seasonality:all.seasonality,
    byMarketLevel:levels, privateFarmGateFloorExcluded:true, note:all.note||null,
  };
}

async function sourceCoverage({days=30,db=pool}={}){
  const {rows}=await db.query(
    `SELECT source_type, source_name, source_authority, market_level,
            COUNT(*)::int AS observations,
            COUNT(*) FILTER (WHERE eligible_for_benchmark)::int AS benchmark_observations,
            MAX(observed_at) AS latest_observed_at,
            ROUND(AVG(confidence_score)::numeric,3) AS mean_confidence
       FROM v_market_price_truth
      WHERE observed_at IS NULL OR observed_at >= CURRENT_TIMESTAMP - ($1 || ' days')::interval
      GROUP BY source_type, source_name, source_authority, market_level
      ORDER BY benchmark_observations DESC, observations DESC`,
    [Math.max(1,Math.min(Number(days)||30,3650))]
  );
  return rows.map((r)=>({
    sourceType:r.source_type, sourceName:r.source_name, sourceAuthority:r.source_authority, marketLevel:r.market_level,
    observations:Number(r.observations), benchmarkObservations:Number(r.benchmark_observations),
    latestObservedAt:r.latest_observed_at?new Date(r.latest_observed_at).toISOString():null,
    meanConfidence:r.mean_confidence==null?null:Number(r.mean_confidence),
  }));
}

'''
export_line="module.exports={SOURCE_CATALOG,MASS_TO_KG,pricePerKg,recencyFactor,geographySpecificity,completenessFactor,buildObservation,rankObservations,summarizeSeries,persistObservation,prototypeObservation,sourceCatalogPublic,rowToObservation,loadProductObservations,marketSnapshot,sourceCoverage};"
t=t.replace(anchor,insert+export_line,1)
p.write_text(t,encoding='utf-8')
print('market price snapshot and coverage queries added')