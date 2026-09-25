'use strict';

const pool = require('../../database/pool');

const SOURCE_CATALOG = Object.freeze({
  AGMARKNET_OGD: {
    sourceType:'agmarknet', sourceName:'Agmarknet via data.gov.in', sourceAuthority:'official_government',
    collectionMethod:'public_api', marketLevel:'mandi_wholesale', verificationStatus:'OBSERVED_OFFICIAL',
    baseConfidence:0.96, freshnessDays:3, benchmarkEligible:true,
    sourceUrl:'https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi',
  },
  ENAM_TRADED: {
    sourceType:'enam', sourceName:'e-NAM', sourceAuthority:'official_government',
    collectionMethod:'partner_share', marketLevel:'realised_trade', verificationStatus:'OBSERVED_OFFICIAL',
    baseConfidence:0.97, freshnessDays:3, benchmarkEligible:true,
    sourceUrl:'https://enam.gov.in/',
    note:'Use only actual e-NAM traded-price data from an authorised integration/export. Public UI existence is not an API credential.',
  },
  DCA_PMS_RETAIL: {
    sourceType:'consumer_affairs_pms', sourceName:'Department of Consumer Affairs Price Monitoring System',
    sourceAuthority:'official_government', collectionMethod:'published_price_list', marketLevel:'retail',
    verificationStatus:'PUBLISHED_OFFICIAL', baseConfidence:0.92, freshnessDays:3, benchmarkEligible:true,
    sourceUrl:'https://fcainfoweb.nic.in/Default.aspx',
  },
  DCA_PMS_WHOLESALE: {
    sourceType:'consumer_affairs_pms', sourceName:'Department of Consumer Affairs Price Monitoring System',
    sourceAuthority:'official_government', collectionMethod:'published_price_list', marketLevel:'wholesale',
    verificationStatus:'PUBLISHED_OFFICIAL', baseConfidence:0.92, freshnessDays:3, benchmarkEligible:true,
    sourceUrl:'https://fcainfoweb.nic.in/Reports/DB/DBprices_W.aspx',
  },
  APMC_MANUAL: {
    sourceType:'apmc_manual', sourceName:'Manual APMC observation', sourceAuthority:'manual_observation',
    collectionMethod:'manual_observation', marketLevel:'mandi_wholesale', verificationStatus:'OBSERVED_MANUAL',
    baseConfidence:0.70, freshnessDays:3, benchmarkEligible:true,
  },
  TRADER_REPORT: {
    sourceType:'trader_report', sourceName:'Trader-reported market price', sourceAuthority:'reported_market',
    collectionMethod:'manual_observation', marketLevel:'mandi_wholesale', verificationStatus:'REPORTED_UNCORROBORATED',
    baseConfidence:0.55, freshnessDays:2, benchmarkEligible:false,
  },
  AFRERA_FARMER_LISTING_ASK: {
    sourceType:'afrera_farmer_listing', sourceName:'AFRERA farmer listing', sourceAuthority:'first_party_listing',
    collectionMethod:'partner_share', marketLevel:'farm_gate_ask', verificationStatus:'DECLARED_FIRST_PARTY',
    baseConfidence:0.78, freshnessDays:14, benchmarkEligible:true,
  },
  AFRERA_FARMER_LISTING_FLOOR: {
    sourceType:'afrera_farmer_listing', sourceName:'AFRERA farmer MAP/floor', sourceAuthority:'first_party_listing',
    collectionMethod:'partner_share', marketLevel:'farm_gate_floor', verificationStatus:'DECLARED_FIRST_PARTY',
    baseConfidence:0.76, freshnessDays:14, benchmarkEligible:true, private:true,
  },
  AFRERA_REALIZED_TRANSACTION: {
    sourceType:'afrera_transaction', sourceName:'AFRERA realised transaction', sourceAuthority:'first_party_transaction',
    collectionMethod:'partner_share', marketLevel:'realised_trade', verificationStatus:'OBSERVED_FIRST_PARTY',
    baseConfidence:0.97, freshnessDays:30, benchmarkEligible:true,
  },
  COMPETITOR_OBSERVATION: {
    sourceType:'competitor', sourceName:'Observed competitor price', sourceAuthority:'manual_observation',
    collectionMethod:'manual_observation', marketLevel:'competitor_retail', verificationStatus:'OBSERVED_MANUAL',
    baseConfidence:0.72, freshnessDays:7, benchmarkEligible:true,
  },
  AFRERA_PROTOTYPE_RETAIL: {
    sourceType:'prototype', sourceName:'NE prototype catalog', sourceAuthority:'prototype',
    collectionMethod:'published_price_list', marketLevel:'prototype', verificationStatus:'PROTOTYPE_ONLY',
    baseConfidence:0, freshnessDays:0, benchmarkEligible:false,
  },
  ESTIMATED: {
    sourceType:'estimated', sourceName:'Estimated price', sourceAuthority:'estimated',
    collectionMethod:'manual_observation', marketLevel:'estimated', verificationStatus:'ESTIMATED',
    baseConfidence:0.25, freshnessDays:1, benchmarkEligible:false,
  },
});

const MASS_TO_KG = Object.freeze({
  kg:1, kilogram:1, kilograms:1,
  g:0.001, gram:0.001, grams:0.001,
  qtl:100, quintal:100, quintals:100, '100 kg':100, '100kg':100,
  tonne:1000, tonnes:1000, ton:1000, tons:1000,
});

function round(value, places=3){const p=10**places;return Math.round((Number(value)+Number.EPSILON)*p)/p;}

function normalizeUnit(unit){return String(unit||'').trim().toLowerCase();}

function pricePerKg(price, unit, quantity=1){
  const p=Number(price);
  const q=Number(quantity);
  const factor=MASS_TO_KG[normalizeUnit(unit)];
  if(!(p>0)||!(q>0)||!factor)return null;
  return round(p/(q*factor),2);
}

function geographySpecificity(geo={}){
  if(geo.market||geo.apmc)return 1;
  if(geo.district)return 0.95;
  if(geo.state)return 0.9;
  if(geo.region)return 0.8;
  if(geo.country)return 0.7;
  return 0.6;
}

function recencyFactor(observedAt, freshnessDays, now=new Date()){
  if(!observedAt||!freshnessDays)return freshnessDays===0?0:0.5;
  const t=new Date(observedAt);
  if(Number.isNaN(t.getTime()))return 0;
  const ageDays=Math.max(0,(now.getTime()-t.getTime())/86400000);
  if(ageDays<=freshnessDays)return 1;
  if(ageDays<=freshnessDays*2)return 0.75;
  if(ageDays<=freshnessDays*4)return 0.5;
  return 0.25;
}

function completenessFactor(input={}){
  let score=0.75;
  if(input.variety)score+=0.08;
  if(input.grade)score+=0.05;
  if(input.geography?.market||input.geography?.district)score+=0.06;
  if(input.sourceRecordId)score+=0.06;
  return Math.min(1,round(score,3));
}

function buildObservation(input={}, options={}){
  const source=SOURCE_CATALOG[input.sourceKey];
  if(!source){const e=new Error('Unknown market-price sourceKey');e.code='PRICE_SOURCE_UNKNOWN';throw e;}
  const price=Number(input.price);
  if(!(price>0)){const e=new Error('price must be positive');e.code='PRICE_INVALID';throw e;}
  const observedAt=input.observedAt?new Date(input.observedAt):null;
  if(!observedAt||Number.isNaN(observedAt.getTime())){const e=new Error('observedAt is required and must be a valid date');e.code='PRICE_OBSERVED_AT_INVALID';throw e;}
  const currency=String(input.currency||'INR').toUpperCase();
  if(currency!=='INR'){const e=new Error('Phase 048 accepts INR observations only; FX conversion must be explicit upstream');e.code='PRICE_CURRENCY_UNSUPPORTED';throw e;}
  const normalized=pricePerKg(price,input.unit,input.quantity||1);
  const matchConfidence=input.matchConfidence==null?1:Number(input.matchConfidence);
  if(!(matchConfidence>=0&&matchConfidence<=1)){const e=new Error('matchConfidence must be 0..1');e.code='PRICE_MATCH_CONFIDENCE_INVALID';throw e;}
  const geoFactor=geographySpecificity(input.geography||{});
  const recency=recencyFactor(observedAt,source.freshnessDays,options.now||new Date());
  const completeness=completenessFactor(input);
  const confidence=source.baseConfidence===0?0:round(source.baseConfidence*recency*matchConfidence*geoFactor*completeness,3);
  const stale=source.freshnessDays===0?true:recency<1;
  const eligible=Boolean(source.benchmarkEligible&&normalized!=null&&!stale&&confidence>=0.6&&matchConfidence>=0.6);
  return {
    productId:input.productId||null,
    productName:input.productName||null,
    commodity:input.commodity||input.productName||null,
    variety:input.variety||null,
    grade:input.grade||null,
    sourceKey:input.sourceKey,
    sourceType:source.sourceType,
    sourceName:input.sourceName||source.sourceName,
    sourceAuthority:source.sourceAuthority,
    collectionMethod:input.collectionMethod||source.collectionMethod,
    sourceUrl:input.sourceUrl||source.sourceUrl||null,
    sourceRecordId:input.sourceRecordId||null,
    sourcePublishedAt:input.sourcePublishedAt||null,
    marketLevel:input.marketLevel||source.marketLevel,
    priceKind:input.priceKind||'observed',
    currency,
    rawPrice:price,
    rawUnit:input.unit,
    quantity:Number(input.quantity||1),
    pricePerKgInr:normalized,
    geography:input.geography||{},
    observedAt:observedAt.toISOString(),
    verificationStatus:source.verificationStatus,
    matchConfidence:round(matchConfidence,3),
    confidenceScore:confidence,
    confidenceLabel:confidence>=0.8?'high':confidence>=0.6?'medium':confidence>0?'low':'none',
    confidenceBasis:{
      sourceBase:source.baseConfidence,recencyFactor:recency,matchConfidence:round(matchConfidence,3),
      geographySpecificity:geoFactor,completenessFactor:completeness,freshnessDays:source.freshnessDays,
    },
    stale,
    eligibleForBenchmark:eligible,
    private:Boolean(source.private),
    note:source.note||null,
  };
}

function rankObservations(observations=[]){
  return [...observations].sort((a,b)=>
    Number(b.eligibleForBenchmark)-Number(a.eligibleForBenchmark)||
    Number(b.confidenceScore||0)-Number(a.confidenceScore||0)||
    new Date(b.observedAt||0)-new Date(a.observedAt||0)
  );
}

function summarizeSeries(observations=[]){
  const eligible=rankObservations(observations.filter((x)=>x.eligibleForBenchmark&&Number.isFinite(Number(x.pricePerKgInr))));
  if(!eligible.length)return {observations:observations.length,benchmarkObservations:0,current:null,range:null,mean:null,seasonality:{},note:'No benchmark-eligible observed prices. Missing market evidence is not a zero or flat market.'};
  const prices=eligible.map((x)=>Number(x.pricePerKgInr));
  const months={};
  for(const row of eligible){
    const month=String(new Date(row.observedAt).getUTCMonth()+1).padStart(2,'0');
    (months[month]=months[month]||[]).push(Number(row.pricePerKgInr));
  }
  const seasonality={};
  for(const [month,vals] of Object.entries(months)){seasonality[month]={observations:vals.length,meanInrPerKg:round(vals.reduce((a,b)=>a+b,0)/vals.length,2),minInrPerKg:Math.min(...vals),maxInrPerKg:Math.max(...vals)};}
  return {
    observations:observations.length,benchmarkObservations:eligible.length,current:eligible[0],
    range:{minInrPerKg:Math.min(...prices),maxInrPerKg:Math.max(...prices)},
    mean:round(prices.reduce((a,b)=>a+b,0)/prices.length,2),seasonality,
  };
}

async function persistObservation(input, options={}){
  const db=options.db||pool;
  const obs=input.confidenceBasis?input:buildObservation(input,options);
  const sql=`INSERT INTO price_intelligence
    (product_id, product_name, commodity, variety, grade, source_type, source_name,
     listed_price, effective_price, unit, price_per_kg_inr, match_confidence,
     collection_method, source_url, market_level, price_kind, observed_at,
     source_authority, verification_status, confidence_score, confidence_basis,
     source_record_id, source_published_at, eligible_for_benchmark, currency, geography, source_location)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$8,'kg',$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$24)
    ON CONFLICT DO NOTHING RETURNING *`;
  const params=[obs.productId,obs.productName,obs.commodity,obs.variety,obs.grade,obs.sourceType,obs.sourceName,
    obs.rawPrice,obs.pricePerKgInr,obs.matchConfidence,obs.collectionMethod,obs.sourceUrl,obs.marketLevel,obs.priceKind,
    obs.observedAt,obs.sourceAuthority,obs.verificationStatus,obs.confidenceScore,JSON.stringify(obs.confidenceBasis),
    obs.sourceRecordId,obs.sourcePublishedAt,obs.eligibleForBenchmark,obs.currency,JSON.stringify(obs.geography||{})];
  const {rows}=await db.query(sql,params);
  return {inserted:rows.length===1,observation:obs,row:rows[0]||null};
}

function prototypeObservation(product, now=new Date()){
  const amount=product?.pricing?.retailPricePrototype?.amount;
  if(!(Number(amount)>0))return null;
  return buildObservation({
    sourceKey:'AFRERA_PROTOTYPE_RETAIL',productId:product.productId,productName:product.identity?.name,
    commodity:product.identity?.name,price:Number(amount),unit:'kg',quantity:1,
    observedAt:now.toISOString(),sourceRecordId:`prototype:${product.productId}`
  },{now});
}

function sourceCatalogPublic(){
  return Object.entries(SOURCE_CATALOG).map(([key,s])=>({key,sourceType:s.sourceType,sourceName:s.sourceName,sourceAuthority:s.sourceAuthority,collectionMethod:s.collectionMethod,marketLevel:s.marketLevel,verificationStatus:s.verificationStatus,freshnessDays:s.freshnessDays,benchmarkEligible:s.benchmarkEligible,private:Boolean(s.private),sourceUrl:s.sourceUrl||null,note:s.note||null}));
}


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

module.exports={SOURCE_CATALOG,MASS_TO_KG,pricePerKg,recencyFactor,geographySpecificity,completenessFactor,buildObservation,rankObservations,summarizeSeries,persistObservation,prototypeObservation,sourceCatalogPublic,rowToObservation,loadProductObservations,marketSnapshot,sourceCoverage};
