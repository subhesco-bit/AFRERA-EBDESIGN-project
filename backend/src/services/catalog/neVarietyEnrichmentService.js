'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_DATA_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.jsonl');
const DEFAULT_MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-variety-enrichment.manifest.json');
const EVIDENCE_PERMISSION = 'catalog.enrichment.evidence.read';

function stripEvidenceDetail(entry = {}) {
  const copy = { ...entry };
  if (Array.isArray(copy.evidence)) {
    copy.evidence = copy.evidence.map((e) => ({
      sourceType: String(e.source || '').startsWith('LOCAL.NE:') ? 'local-ne-prototype' :
        String(e.source || '').includes('product-master') ? 'canonical-product-master' : 'local-project-evidence',
      evidenceHash: e.textSha256 || null,
      locatorType: String(e.locator || '').split(':')[0] || null,
    }));
  }
  return copy;
}

function publicView(record) {
  if (!record) return null;
  return {
    productId: record.productId,
    taxonomy: { ...record.taxonomy },
    geography: { ...record.geography },
    gi: { ...record.gi },
    biochemicalTraits: (record.biochemicalTraits || []).map(stripEvidenceDetail),
    quantitativeBiochemicalClaims: (record.quantitativeBiochemicalClaims || []).map((claim) => ({
      metric: claim.metric,
      reportedValueText: claim.reportedValueText,
      verificationStatus: claim.verificationStatus,
      source: claim.source ? {
        sourceType: String(claim.source.source || '').startsWith('LOCAL.NE:') ? 'local-ne-prototype' : 'local-project-evidence',
        evidenceHash: claim.source.textSha256 || null,
        locatorType: String(claim.source.locator || '').split(':')[0] || null,
      } : null,
    })),
    agronomyTraits: (record.agronomyTraits || []).map(stripEvidenceDetail),
    processingTraits: (record.processingTraits || []).map(stripEvidenceDetail),
    valueChainTraits: (record.valueChainTraits || []).map(stripEvidenceDetail),
    categoryProfile: { ...record.categoryProfile, source: undefined },
    evidenceSummary: {
      count: record.evidenceSummary?.count || 0,
      sourceKinds: { ...(record.evidenceSummary?.sourceKinds || {}) },
    },
    fieldTruth: { ...record.fieldTruth },
  };
}

class NeVarietyEnrichmentService {
  constructor(options = {}) {
    this.dataFile = options.dataFile || DEFAULT_DATA_FILE;
    this.manifestFile = options.manifestFile || DEFAULT_MANIFEST_FILE;
    this.loaded = false;
    this.records = [];
    this.byId = new Map();
    this.manifest = null;
  }

  ensureLoaded() {
    if (this.loaded) return;
    const dataBytes = fs.readFileSync(this.dataFile);
    this.manifest = JSON.parse(fs.readFileSync(this.manifestFile, 'utf8'));
    const digest = crypto.createHash('sha256').update(dataBytes).digest('hex');
    if (digest !== this.manifest.dataFileSha256) throw new Error('NE variety enrichment SHA-256 mismatch');
    this.records = dataBytes.toString('utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    if (this.records.length !== this.manifest.productCount) throw new Error('NE variety enrichment count does not match manifest');
    for (const record of this.records) {
      if (!record.productId) throw new Error('NE variety enrichment record missing productId');
      if (this.byId.has(record.productId)) throw new Error('Duplicate productId in NE variety enrichment: ' + record.productId);
      this.byId.set(record.productId, record);
    }
    this.loaded = true;
  }

  getByProductId(productId, context = {}) {
    this.ensureLoaded();
    const record = this.byId.get(String(productId)) || null;
    if (!record) return null;
    const permissions = new Set((context.permissions || []).map(String));
    const includeInternalEvidence = context.includeInternalEvidence === true || permissions.has(EVIDENCE_PERMISSION);
    return includeInternalEvidence ? JSON.parse(JSON.stringify(record)) : publicView(record);
  }

  getById(productId, context = {}) {
    return this.getByProductId(productId, context);
  }

  stats() {
    this.ensureLoaded();
    let explicitScientificNames = 0;
    let unresolvedScientificNameCandidates = 0;
    let biochemical = 0;
    let agronomy = 0;
    let processing = 0;
    let valueChain = 0;
    let quantitativeClaimProducts = 0;
    for (const record of this.records) {
      if (record.taxonomy?.scientificName) explicitScientificNames += 1;
      if (record.taxonomy?.scientificNameCandidate) unresolvedScientificNameCandidates += 1;
      if ((record.biochemicalTraits || []).length) biochemical += 1;
      if ((record.agronomyTraits || []).length) agronomy += 1;
      if ((record.processingTraits || []).length) processing += 1;
      if ((record.valueChainTraits || []).length) valueChain += 1;
      if ((record.quantitativeBiochemicalClaims || []).length) quantitativeClaimProducts += 1;
    }
    return {
      productCount: this.records.length,
      scientificNameExplicit: explicitScientificNames,
      scientificNameCandidates: unresolvedScientificNameCandidates,
      explicitScientificNames,
      unresolvedScientificNameCandidates,
      biochemicalEnrichedProducts: biochemical,
      agronomyEnrichedProducts: agronomy,
      processingEnrichedProducts: processing,
      valueChainEnrichedProducts: valueChain,
      quantitativeClaimProducts,
      dataFileSha256: this.manifest.dataFileSha256,
      truthRules: [...(this.manifest.truthRules || [])],
    };
  }

  search(options = {}) {
    this.ensureLoaded();
    const limit = Math.max(1, Math.min(Number(options.limit) || 50, 200));
    const filter = options.filter || 'any';
    const matches = this.records.filter((r) => {
      if (filter === 'taxonomy-explicit') return Boolean(r.taxonomy?.scientificName);
      if (filter === 'taxonomy-candidate') return Boolean(r.taxonomy?.scientificNameCandidate);
      if (filter === 'biochemical') return (r.biochemicalTraits || []).length > 0;
      if (filter === 'agronomy') return (r.agronomyTraits || []).length > 0;
      if (filter === 'processing') return (r.processingTraits || []).length > 0;
      if (filter === 'value-chain') return (r.valueChainTraits || []).length > 0;
      if (filter === 'quantitative') return (r.quantitativeBiochemicalClaims || []).length > 0;
      return true;
    });
    return { total: matches.length, results: matches.slice(0, limit).map(publicView) };
  }
}

const singleton = new NeVarietyEnrichmentService();
module.exports = singleton;
module.exports.NeVarietyEnrichmentService = NeVarietyEnrichmentService;
module.exports.publicView = publicView;

module.exports.EVIDENCE_PERMISSION = EVIDENCE_PERMISSION;
