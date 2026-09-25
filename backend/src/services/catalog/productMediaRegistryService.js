'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.resolve(__dirname, '../../data/product-master/ne-product-media.json');
const MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-product-media.manifest.json');

class ProductMediaRegistryService {
  constructor(options = {}) {
    this.dataFile = options.dataFile || DATA_FILE;
    this.manifestFile = options.manifestFile || MANIFEST_FILE;
    this.loaded = false;
    this.data = null;
    this.byProduct = new Map();
  }

  ensureLoaded() {
    if (this.loaded) return;
    const bytes = fs.readFileSync(this.dataFile);
    const manifest = JSON.parse(fs.readFileSync(this.manifestFile, 'utf8'));
    const digest = crypto.createHash('sha256').update(bytes).digest('hex');
    if (digest !== manifest.dataFileSha256) throw new Error('NE product media registry SHA-256 mismatch');
    this.data = JSON.parse(bytes.toString('utf8'));
    if (this.data.mappingCount !== manifest.mappingCount) throw new Error('NE product media registry mapping count mismatch');
    for (const mapping of this.data.mappings || []) {
      const pid = mapping.canonicalProduct?.productId;
      if (!pid) continue;
      const bucket = this.byProduct.get(pid) || [];
      bucket.push(mapping);
      this.byProduct.set(pid, bucket);
    }
    this.manifest = manifest;
    this.loaded = true;
  }

  _safeMapping(mapping) {
    return {
      prototypeKey: mapping.prototypeKey,
      prototypeName: mapping.prototypeName,
      assetSha256: mapping.assetSha256,
      dimensions: mapping.dimensions,
      canonicalProduct: mapping.canonicalProduct,
      mappingConfidence: mapping.mappingConfidence,
      mappingReason: mapping.mappingReason,
      license: {
        status: mapping.license?.status || 'LICENSE_UNKNOWN',
        sourceClass: mapping.license?.sourceClass || null,
        productionCleared: Boolean(mapping.license?.productionCleared),
      },
      productionStatus: mapping.productionStatus,
      variantRole: mapping.variantRole,
    };
  }

  getCandidates(productId, options = {}) {
    this.ensureLoaded();
    const rows = this.byProduct.get(String(productId)) || [];
    const productionOnly = options.productionOnly === true;
    return rows
      .filter((m) => !productionOnly || m.license?.productionCleared === true)
      .map((m) => this._safeMapping(m));
  }

  hasProductionMedia(productId) {
    return this.getCandidates(productId, { productionOnly: true }).length > 0;
  }

  coverage() {
    this.ensureLoaded();
    const total = Array.isArray(this.data.coverageBacklog) ? this.data.coverageBacklog.length : 0;
    const withRecovered = (this.data.coverageBacklog || []).filter((x) => x.hasRecoveredCandidate).length;
    const productionClearedProducts = new Set(
      (this.data.mappings || [])
        .filter((m) => m.license?.productionCleared && m.canonicalProduct?.productId)
        .map((m) => m.canonicalProduct.productId),
    ).size;
    return {
      totalProducts: total,
      productsWithRecoveredCandidates: withRecovered,
      productionClearedProducts,
      productsNeedingLicensedOrGeneratedMedia: total - productionClearedProducts,
      recoveredMappingCount: this.data.mappingCount || 0,
      truth: 'Recovered candidates are not public-production assets until license/provenance clearance is explicit.',
    };
  }

  backlog(options = {}) {
    this.ensureLoaded();
    const limit = Math.max(1, Math.min(Number(options.limit) || 50, 200));
    const onlyMissing = options.onlyMissing !== false;
    const rows = (this.data.coverageBacklog || []).filter((x) => !onlyMissing || !this.hasProductionMedia(x.productId));
    return { total: rows.length, results: rows.slice(0, limit) };
  }

  status() {
    this.ensureLoaded();
    return {
      status: 'healthy',
      service: 'productMediaRegistryService',
      mappingCount: this.data.mappingCount || 0,
      canonicalProductsWithRecoveredCandidates: this.data.canonicalProductsWithRecoveredCandidates || 0,
      productionClearedMappings: this.data.productionClearedMappings || 0,
      dataFileSha256: this.manifest.dataFileSha256,
    };
  }
}

const singleton = new ProductMediaRegistryService();
module.exports = singleton;
module.exports.ProductMediaRegistryService = ProductMediaRegistryService;
