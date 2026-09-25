'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_DATA_FILE = path.resolve(__dirname, '../../data/product-master/ne-gi-provenance.jsonl');
const DEFAULT_MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-gi-provenance.manifest.json');

const STATUS_MAP = Object.freeze({
  REGISTERED_DIRECT_MATCH: 'VERIFIED_REGISTERED_DIRECT',
  DERIVATIVE_OF_REGISTERED_GI_NOT_DIRECT_REGISTRATION: 'DERIVATIVE_NOT_DIRECT_REGISTRATION',
  POSSIBLE_ALIAS_REQUIRES_IDENTITY_EVIDENCE: 'PENDING_PRODUCT_IDENTITY_EVIDENCE',
  POSSIBLE_NAME_MATCH_WITH_STATE_CONFLICT: 'CONFLICT_NAME_OR_GEOGRAPHY',
  PROTOTYPE_CLAIM_NOT_FOUND_IN_REGISTER: 'UNVERIFIED_NOT_FOUND_IN_REGISTER_SNAPSHOT',
  NO_OFFICIAL_MATCH_IN_SNAPSHOT: 'NO_MATCH_IN_REGISTER_SNAPSHOT',
});

class NeGiProvenanceService {
  constructor(options = {}) {
    this.dataFile = options.dataFile || DEFAULT_DATA_FILE;
    this.manifestFile = options.manifestFile || DEFAULT_MANIFEST_FILE;
    this.loaded = false;
    this.records = [];
    this.byProductId = new Map();
    this.manifest = null;
  }

  ensureLoaded() {
    if (this.loaded) return;
    const bytes = fs.readFileSync(this.dataFile);
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    this.manifest = JSON.parse(fs.readFileSync(this.manifestFile, 'utf8'));
    if (digest !== this.manifest.dataFileSha256) throw new Error('NE GI provenance SHA-256 mismatch');
    this.records = bytes.toString('utf8').split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    if (this.records.length !== this.manifest.productCount) throw new Error('NE GI provenance count does not match manifest');
    for (const record of this.records) {
      if (this.byProductId.has(record.productId)) throw new Error('Duplicate GI provenance productId: ' + record.productId);
      this.byProductId.set(record.productId, record);
    }
    this.loaded = true;
  }

  _decorate(record) {
    if (!record) return null;
    return {
      productId: record.productId,
      productName: record.productName,
      productOrigin: record.productOrigin,
      prototypeClaim: record.prototypeClaim,
      verificationOutcome: record.verificationOutcome,
      verificationStatus: STATUS_MAP[record.verificationOutcome] || 'UNKNOWN',
      registeredAsListedGood: Boolean(record.registeredAsListedGood),
      stateCompatible: record.stateCompatible,
      officialEvidence: record.officialEvidence ? JSON.parse(JSON.stringify(record.officialEvidence)) : null,
      candidateMatches: JSON.parse(JSON.stringify(record.candidateMatches || [])),
      notes: [...(record.notes || [])],
      sourceSnapshot: {
        publisherPage: record.sourceSnapshot.publisherPage,
        publisherPagePublishDate: record.sourceSnapshot.publisherPagePublishDate,
        registerEffectiveThrough: record.sourceSnapshot.registerEffectiveThrough,
        pdfSha256: record.sourceSnapshot.pdfSha256,
      },
    };
  }

  getByProductId(productId) {
    this.ensureLoaded();
    return this._decorate(this.byProductId.get(String(productId)) || null);
  }

  list(options = {}) {
    this.ensureLoaded();
    const outcome = options.outcome || null;
    const prototypeClaim = options.prototypeClaim == null ? null : Boolean(options.prototypeClaim);
    const registered = options.registered == null ? null : Boolean(options.registered);
    const limit = Math.max(1, Math.min(Number(options.limit) || 100, 500));
    const offset = Math.max(0, Number(options.offset) || 0);
    const rows = this.records.filter((row) => {
      if (outcome && row.verificationOutcome !== outcome) return false;
      if (prototypeClaim != null && Boolean(row.prototypeClaim) !== prototypeClaim) return false;
      if (registered != null && Boolean(row.registeredAsListedGood) !== registered) return false;
      return true;
    });
    return { total: rows.length, offset, limit, results: rows.slice(offset, offset + limit).map((row) => this._decorate(row)) };
  }

  issues() {
    this.ensureLoaded();
    return this.records
      .filter((row) => row.prototypeClaim && row.verificationOutcome !== 'REGISTERED_DIRECT_MATCH')
      .map((row) => this._decorate(row));
  }

  falseNegatives() {
    this.ensureLoaded();
    return this.records
      .filter((row) => !row.prototypeClaim && row.verificationOutcome === 'REGISTERED_DIRECT_MATCH')
      .map((row) => this._decorate(row));
  }

  stats() {
    this.ensureLoaded();
    const outcomes = {};
    const prototypeOutcomes = {};
    let registeredDirect = 0;
    let prototypeClaims = 0;
    let prototypeFalseNegatives = 0;
    for (const row of this.records) {
      outcomes[row.verificationOutcome] = (outcomes[row.verificationOutcome] || 0) + 1;
      if (row.registeredAsListedGood) registeredDirect += 1;
      if (row.prototypeClaim) {
        prototypeClaims += 1;
        prototypeOutcomes[row.verificationOutcome] = (prototypeOutcomes[row.verificationOutcome] || 0) + 1;
      } else if (row.verificationOutcome === 'REGISTERED_DIRECT_MATCH') {
        prototypeFalseNegatives += 1;
      }
    }
    return {
      productCount: this.records.length,
      registeredDirectCount: registeredDirect,
      prototypeClaimCount: prototypeClaims,
      prototypeFalseNegativeDirectCount: prototypeFalseNegatives,
      outcomes,
      prototypeOutcomes,
      registerEffectiveThrough: this.manifest.registerEffectiveThrough,
      sourcePdfSha256: this.manifest.sourcePdfSha256,
      truthRules: [...(this.manifest.truthRules || [])],
    };
  }
}

const singleton = new NeGiProvenanceService();
module.exports = singleton;
module.exports.NeGiProvenanceService = NeGiProvenanceService;
module.exports.STATUS_MAP = STATUS_MAP;
