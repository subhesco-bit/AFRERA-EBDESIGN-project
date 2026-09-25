'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DEFAULT_DATA_FILE = path.resolve(__dirname, '../../data/product-master/ne-products.jsonl');
const DEFAULT_MANIFEST_FILE = path.resolve(__dirname, '../../data/product-master/ne-products.manifest.json');
const MAP_PERMISSION = 'catalog.farmer_map.read';

function normalize(value) {
  return String(value || '').normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}

function clampLimit(value, fallback = 50) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(1, Math.min(Math.trunc(n), 200));
}

function hasMapPermission(context = {}) {
  const permissions = new Set([...(context.permissions || [])].map(String));
  return permissions.has(MAP_PERMISSION);
}

class NeProductMasterService {
  constructor(options = {}) {
    this.dataFile = options.dataFile || DEFAULT_DATA_FILE;
    this.manifestFile = options.manifestFile || DEFAULT_MANIFEST_FILE;
    this.loaded = false;
    this.products = [];
    this.byId = new Map();
    this.byName = new Map();
    this.manifest = null;
  }

  ensureLoaded() {
    if (this.loaded) return;
    const raw = fs.readFileSync(this.dataFile, 'utf8');
    this.products = raw.split(/\r?\n/).filter(Boolean).map((line) => JSON.parse(line));
    this.manifest = JSON.parse(fs.readFileSync(this.manifestFile, 'utf8'));
    for (const product of this.products) {
      if (this.byId.has(product.productId)) throw new Error('Duplicate productId in NE product master: ' + product.productId);
      this.byId.set(product.productId, product);
      const names = [product.identity.name, ...(product.identity.historicalNames || [])];
      for (const name of names) {
        const key = normalize(name);
        const bucket = this.byName.get(key) || [];
        bucket.push(product.productId);
        this.byName.set(key, bucket);
      }
    }
    if (this.products.length !== this.manifest.productCount) throw new Error('NE product master count does not match manifest');
    const digest = crypto.createHash('sha256').update(fs.readFileSync(this.dataFile)).digest('hex');
    if (digest !== this.manifest.dataFileSha256) throw new Error('NE product master SHA-256 mismatch');
    this.loaded = true;
  }

  stats() {
    this.ensureLoaded();
    const categories = new Set();
    const origins = new Set();
    let giPrototypeClaims = 0;
    let qualityFlagged = 0;
    for (const product of this.products) {
      categories.add(product.identity.category);
      origins.add(product.identity.originLabel);
      if (product.gi.prototypeClaim) giPrototypeClaims += 1;
      if ((product.qualityFlags || []).length) qualityFlagged += 1;
    }
    return {
      productCount: this.products.length,
      categoryCount: categories.size,
      originCount: origins.size,
      giPrototypeClaimCount: giPrototypeClaims,
      qualityFlaggedCount: qualityFlagged,
      catalogSha256: this.manifest.catalogSha256,
      sourceFile: this.manifest.sourceFile,
      privacyRule: this.manifest.privacyRule,
    };
  }

  _publicView(product) {
    if (!product) return null;
    return {
      productId: product.productId,
      identity: { ...product.identity },
      gi: {
        prototypeClaim: product.gi.prototypeClaim,
        verificationStatus: product.gi.verificationStatus,
        registryId: product.gi.registryId,
      },
      pricing: {
        currency: product.pricing.currency,
        unit: product.pricing.unit,
        retailPricePrototype: { ...product.pricing.retailPricePrototype },
        farmerMapFloorPrototype: { visibility: 'farmer_private', redacted: true },
      },
      positioning: { ...product.positioning },
      lifecycle: { ...product.lifecycle },
      qualityFlags: [...(product.qualityFlags || [])],
    };
  }

  _privilegedView(product) {
    return product ? JSON.parse(JSON.stringify(product)) : null;
  }

  serialize(product, context = {}) {
    return hasMapPermission(context) ? this._privilegedView(product) : this._publicView(product);
  }

  getById(productId, context = {}) {
    this.ensureLoaded();
    return this.serialize(this.byId.get(String(productId)) || null, context);
  }

  findByExactName(name, context = {}) {
    this.ensureLoaded();
    const ids = this.byName.get(normalize(name)) || [];
    return ids.map((id) => this.serialize(this.byId.get(id), context));
  }

  search(query = '', options = {}, context = {}) {
    this.ensureLoaded();
    const q = normalize(query);
    const category = normalize(options.category);
    const origin = normalize(options.origin);
    const giClaim = options.giClaim == null ? null : Boolean(options.giClaim);
    const limit = clampLimit(options.limit);
    const offset = Math.max(0, Math.trunc(Number(options.offset) || 0));

    const matches = this.products.filter((product) => {
      if (category && normalize(product.identity.category) !== category) return false;
      if (origin && normalize(product.identity.originLabel) !== origin) return false;
      if (giClaim != null && Boolean(product.gi.prototypeClaim) !== giClaim) return false;
      if (!q) return true;
      const haystack = normalize([
        product.identity.name,
        ...(product.identity.historicalNames || []),
        product.identity.originLabel,
        product.identity.category,
        product.positioning.uspPrototype,
      ].join(' '));
      return q.split(' ').every((term) => haystack.includes(term));
    });

    return {
      total: matches.length,
      offset,
      limit,
      results: matches.slice(offset, offset + limit).map((product) => this.serialize(product, context)),
    };
  }

  categories() {
    this.ensureLoaded();
    const counts = new Map();
    for (const product of this.products) counts.set(product.identity.category, (counts.get(product.identity.category) || 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }

  origins() {
    this.ensureLoaded();
    const counts = new Map();
    for (const product of this.products) counts.set(product.identity.originLabel, (counts.get(product.identity.originLabel) || 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name));
  }
}

const singleton = new NeProductMasterService();
module.exports = singleton;
module.exports.NeProductMasterService = NeProductMasterService;
module.exports.MAP_PERMISSION = MAP_PERMISSION;
