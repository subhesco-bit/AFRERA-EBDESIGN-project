'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_DATA_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.jsonl');
const DEFAULT_MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.manifest.json');
const EVIDENCE_PERMISSION = 'catalog.enrichment.evidence.read';

function hasEvidencePermission(context={}) {
  return new Set((context.permissions||[]).map(String)).has(EVIDENCE_PERMISSION);
}

class NeVarietyEnrichmentService {
  constructor(options={}) {
    this.dataFile=options.dataFile||DEFAULT_DATA_FILE;
    this.manifestFile=options.manifestFile||DEFAULT_MANIFEST_FILE;
    this.records=[];this.byProductId=new Map();this.manifest=null;this.loaded=false;
  }

  ensureLoaded() {
    if(this.loaded)return;
    const bytes=fs.readFileSync(this.dataFile);
    this.manifest=JSON.parse(fs.readFileSync(this.manifestFile,'utf8'));
    const digest=crypto.createHash('sha256').update(bytes).digest('hex');
    if(digest!==this.manifest.dataFileSha256)throw new Error('NE variety enrichment SHA-256 mismatch');
    this.records=bytes.toString('utf8').split(/\r?\n/).filter(Boolean).map((line)=>JSON.parse(line));
    if(this.records.length!==this.manifest.productCount)throw new Error('NE variety enrichment count does not match manifest');
    for(const record of this.records){
      if(this.byProductId.has(record.productId))throw new Error('Duplicate productId in NE variety enrichment: '+record.productId);
      this.byProductId.set(record.productId,record);
    }
    this.loaded=true;
  }

  _traitSummary(items=[]) {
    return items.map((item)=>({trait:item.trait,evidenceStatus:item.evidenceStatus,evidenceCount:Array.isArray(item.evidence)?item.evidence.length:0}));
  }

  _publicView(record) {
    if(!record)return null;
    return {
      productId:record.productId,
      taxonomy:{...record.taxonomy},
      geography:{...record.geography},
      gi:{...record.gi},
      biochemicalTraits:this._traitSummary(record.biochemicalTraits),
      quantitativeBiochemicalClaims:(record.quantitativeBiochemicalClaims||[]).map((claim)=>({metric:claim.metric,reportedValueText:claim.reportedValueText,verificationStatus:claim.verificationStatus})),
      agronomyTraits:this._traitSummary(record.agronomyTraits),
      processingTraits:this._traitSummary(record.processingTraits),
      valueChainTraits:this._traitSummary(record.valueChainTraits),
      categoryProfile:{...record.categoryProfile},
      evidenceSummary:{count:record.evidenceSummary?.count||0,sourceKinds:record.evidenceSummary?.sourceKinds||{}},
      fieldTruth:{...record.fieldTruth},
    };
  }

  getByProductId(productId, context={}) {
    this.ensureLoaded();
    const record=this.byProductId.get(String(productId))||null;
    if(!record)return null;
    return hasEvidencePermission(context)?JSON.parse(JSON.stringify(record)):this._publicView(record);
  }

  stats() {
    this.ensureLoaded();
    const stats={productCount:this.records.length,scientificNameExplicit:0,scientificNameCandidates:0,biochemicalEnriched:0,agronomyEnriched:0,processingEnriched:0,valueChainEnriched:0,quantitativeClaimProducts:0};
    for(const r of this.records){
      if(r.taxonomy?.scientificName)stats.scientificNameExplicit+=1;
      if(r.taxonomy?.scientificNameCandidate)stats.scientificNameCandidates+=1;
      if((r.biochemicalTraits||[]).length)stats.biochemicalEnriched+=1;
      if((r.agronomyTraits||[]).length)stats.agronomyEnriched+=1;
      if((r.processingTraits||[]).length)stats.processingEnriched+=1;
      if((r.valueChainTraits||[]).length)stats.valueChainEnriched+=1;
      if((r.quantitativeBiochemicalClaims||[]).length)stats.quantitativeClaimProducts+=1;
    }
    return {...stats,dataFileSha256:this.manifest.dataFileSha256,truthRules:[...(this.manifest.truthRules||[])]};
  }
}

const singleton=new NeVarietyEnrichmentService();
module.exports=singleton;
module.exports.NeVarietyEnrichmentService=NeVarietyEnrichmentService;
module.exports.EVIDENCE_PERMISSION=EVIDENCE_PERMISSION;
