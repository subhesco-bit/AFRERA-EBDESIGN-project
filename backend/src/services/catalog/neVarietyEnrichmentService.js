'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.jsonl');
const MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.manifest.json');
const EVIDENCE_PERMISSION = 'catalog.enrichment.evidence.read';

function hasEvidencePermission(context={}){
  return new Set((context.permissions||[]).map(String)).has(EVIDENCE_PERMISSION);
}

function deepClone(value){return JSON.parse(JSON.stringify(value));}

function redactEvidenceRecord(record){
  const row=deepClone(record);
  const strip=(entries=[])=>entries.map((entry)=>({
    trait:entry.trait,
    evidenceStatus:entry.evidenceStatus,
    evidence:(entry.evidence||[]).map(()=>({redacted:true,status:'INTERNAL_EVIDENCE_NOT_EXPOSED'})),
  }));
  row.biochemicalTraits=strip(row.biochemicalTraits);
  row.agronomyTraits=strip(row.agronomyTraits);
  row.processingTraits=strip(row.processingTraits);
  row.valueChainTraits=strip(row.valueChainTraits);
  row.quantitativeBiochemicalClaims=(row.quantitativeBiochemicalClaims||[]).map((claim)=>{
    const {source,...safe}=claim;
    return {...safe,source:{redacted:true,status:'INTERNAL_EVIDENCE_NOT_EXPOSED'}};
  });
  if(row.categoryProfile?.source)row.categoryProfile.source={redacted:true,status:'INTERNAL_EVIDENCE_NOT_EXPOSED'};
  if(row.evidenceSummary){
    row.evidenceSummary={
      count:row.evidenceSummary.count,
      sourceKinds:row.evidenceSummary.sourceKinds,
      sourcesRedacted:true,
    };
  }
  return row;
}

class NeVarietyEnrichmentService {
  constructor(options={}) {
    this.dataFile=options.dataFile||DATA_FILE;
    this.manifestFile=options.manifestFile||MANIFEST_FILE;
    this.loaded=false;
    this.records=[];
    this.byProductId=new Map();
    this.manifest=null;
    this.dataFileSha256=null;
  }

  ensureLoaded(){
    if(this.loaded)return;
    const raw=fs.readFileSync(this.dataFile,'utf8');
    this.records=raw.split(/\r?\n/).filter(Boolean).map((line)=>JSON.parse(line));
    this.manifest=JSON.parse(fs.readFileSync(this.manifestFile,'utf8'));
    this.dataFileSha256=crypto.createHash('sha256').update(fs.readFileSync(this.dataFile)).digest('hex');
    if(this.dataFileSha256!==this.manifest.dataFileSha256)throw new Error('NE variety enrichment SHA-256 mismatch');
    if(this.records.length!==this.manifest.productCount)throw new Error('NE variety enrichment count does not match manifest');
    for(const record of this.records){
      if(this.byProductId.has(record.productId))throw new Error('Duplicate enrichment productId: '+record.productId);
      this.byProductId.set(record.productId,record);
    }
    this.loaded=true;
  }

  serialize(record,context={}){
    if(!record)return null;
    return hasEvidencePermission(context)?deepClone(record):redactEvidenceRecord(record);
  }

  get(productId,context={}){
    this.ensureLoaded();
    return this.serialize(this.byProductId.get(String(productId))||null,context);
  }

  getByProductId(productId,context={}){return this.get(productId,context);}

  list(options={},context={}){
    this.ensureLoaded();
    const truth=options.taxonomyTruth||null;
    const trait=options.trait||null;
    const limit=Math.max(1,Math.min(Number(options.limit)||50,200));
    const offset=Math.max(0,Number(options.offset)||0);
    const rows=this.records.filter((row)=>{
      if(truth&&row.fieldTruth?.taxonomy!==truth)return false;
      if(trait){
        const pools=[row.biochemicalTraits,row.agronomyTraits,row.processingTraits,row.valueChainTraits].flat().filter(Boolean);
        if(!pools.some((x)=>x.trait===trait))return false;
      }
      return true;
    });
    return {total:rows.length,offset,limit,results:rows.slice(offset,offset+limit).map((r)=>this.serialize(r,context))};
  }

  stats(){
    this.ensureLoaded();
    const out={productCount:this.records.length,scientificNameExplicit:0,scientificNameCandidates:0,quantitativeBiochemicalRecords:0,productsWithBiochemicalTraits:0,productsWithAgronomyTraits:0,productsWithProcessingTraits:0,productsWithValueChainTraits:0};
    for(const row of this.records){
      if(row.taxonomy?.scientificName)out.scientificNameExplicit+=1;
      if(row.taxonomy?.scientificNameCandidate)out.scientificNameCandidates+=1;
      if((row.quantitativeBiochemicalClaims||[]).length)out.quantitativeBiochemicalRecords+=1;
      if((row.biochemicalTraits||[]).length)out.productsWithBiochemicalTraits+=1;
      if((row.agronomyTraits||[]).length)out.productsWithAgronomyTraits+=1;
      if((row.processingTraits||[]).length)out.productsWithProcessingTraits+=1;
      if((row.valueChainTraits||[]).length)out.productsWithValueChainTraits+=1;
    }
    return {...out,dataFileSha256:this.dataFileSha256,truthRules:this.manifest.truthRules||[],truthModel:{taxonomyFacts:'explicit parenthetical local evidence only',taxonomyCandidates:'unresolved until external taxonomy validation',gi:'pending Phase 047',pricing:'pending Phase 048'}};
  }
}

const singleton=new NeVarietyEnrichmentService();
module.exports=singleton;
module.exports.NeVarietyEnrichmentService=NeVarietyEnrichmentService;
module.exports.EVIDENCE_PERMISSION=EVIDENCE_PERMISSION;
