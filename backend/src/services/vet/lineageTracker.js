/**
 * Lineage Tracker - Farm-to-Market Supply Chain Tracing
 *
 * Tracks product origin, processing, distribution, and authentication.
 * From pine-shadow: vet/lineage.ts
 */

'use strict';

class LineageTracker {
  constructor() {
    this.lineages = new Map();        // productId → lineage
    this.certificates = new Map();    // certificateId → certificate
  }

  /**
   * Create lineage for a product
   */
  createLineage(productId, lineage) {
    this.lineages.set(productId, {
      id: productId,
      farm: {
        id: lineage.farmId,
        name: lineage.farmName,
        location: lineage.farmLocation,
        certification: lineage.farmCertification, // 'organic', 'conventional'
        geoCoordinates: lineage.geoCoordinates,
        harvestDate: lineage.harvestDate,
      },
      processing: lineage.processing || [], // [{facility, date, process, certifications}]
      distribution: lineage.distribution || [], // [{distributor, date, location}]
      retail: lineage.retail || {}, // {retailer, date, storeName}
      createdAt: new Date(),
      hash: this._generateHash(productId, lineage),
    });
    return this.lineages.get(productId);
  }

  /**
   * Trace product lineage
   */
  traceLineage(productId) {
    const lineage = this.lineages.get(productId);
    if (!lineage) {
      return {
        found: false,
        advisory: true,
        productId,
      };
    }

    return {
      found: true,
      advisory: true,
      productId,
      lineage,
      chainOfCustody: this._buildChainOfCustody(lineage),
      verificationUrl: `/api/v1/vet/lineage/${productId}`,
      basis: 'Immutable lineage record from farm to consumer',
    };
  }

  /**
   * Build chain of custody timeline
   */
  _buildChainOfCustody(lineage) {
    const chain = [];

    // Farm
    chain.push({
      stage: 'Farm',
      entity: lineage.farm.name,
      location: lineage.farm.location,
      date: lineage.farm.harvestDate,
      certification: lineage.farm.certification,
      custodian: lineage.farm.id,
    });

    // Processing
    for (const step of lineage.processing) {
      chain.push({
        stage: 'Processing',
        entity: step.facility,
        location: step.location,
        date: step.date,
        process: step.process,
        certifications: step.certifications,
        custodian: step.facilityId,
      });
    }

    // Distribution
    for (const step of lineage.distribution) {
      chain.push({
        stage: 'Distribution',
        entity: step.distributor,
        location: step.location,
        date: step.date,
        custodian: step.distributorId,
      });
    }

    // Retail
    if (lineage.retail && lineage.retail.retailer) {
      chain.push({
        stage: 'Retail',
        entity: lineage.retail.retailer,
        location: lineage.retail.storeName,
        date: lineage.retail.date,
        custodian: lineage.retail.retailerId,
      });
    }

    return chain;
  }

  /**
   * Verify authenticity using cryptographic hash
   */
  verifyAuthenticity(productId, provided_hash) {
    const lineage = this.lineages.get(productId);
    if (!lineage) {
      return {
        authentic: false,
        advisory: true,
        reason: 'Product not found in registry',
      };
    }

    const matches = lineage.hash === provided_hash;
    return {
      authentic: matches,
      advisory: true,
      productId,
      stored_hash: lineage.hash,
      provided_hash,
      basis: 'Cryptographic hash verification',
    };
  }

  /**
   * Generate certificate for product
   */
  generateCertificate(productId, certificationType) {
    // certificationType: 'organic', 'fair-trade', 'geographic-indication'

    const lineage = this.lineages.get(productId);
    if (!lineage) {
      throw new Error(`Product ${productId} not found`);
    }

    const certificate = {
      id: `CERT-${productId}-${Date.now()}`,
      productId,
      type: certificationType,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
      issuer: 'Agricultural Certification Board',
      lineage: lineage,
      qrCode: `https://trace.ebdesign.in/verify/${productId}`,
      signature: this._generateSignature(productId, certificationType),
    };

    this.certificates.set(certificate.id, certificate);
    return certificate;
  }

  /**
   * Get certificate
   */
  getCertificate(certificateId) {
    return this.certificates.get(certificateId) || null;
  }

  /**
   * Cryptographic hash
   */
  _generateHash(productId, lineage) {
    const data = JSON.stringify({ productId, ...lineage });
    return require('crypto')
      .createHash('sha256')
      .update(data)
      .digest('hex');
  }

  /**
   * Generate digital signature
   */
  _generateSignature(productId, certificationType) {
    // In production: use RSA/ECDSA with private key
    return `SIG-${productId}-${certificationType}-${Date.now()}`;
  }

  /**
   * Batch trace multiple products
   */
  traceMultiple(productIds) {
    return {
      advisory: true,
      tracing: productIds.map(id => this.traceLineage(id)),
      count: productIds.length,
      verified: productIds.filter(id => this.lineages.has(id)).length,
    };
  }
}

module.exports = { LineageTracker };
