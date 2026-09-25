'use strict';

const express = require('express');
const productMaster = require('../services/catalog/neProductMasterService');
const varietyEnrichment = require('../services/catalog/neVarietyEnrichmentService');
const giProvenance = require('../services/catalog/neGiProvenanceService');

const router = express.Router();

function truthStatus() {
  const gi = giProvenance.stats();
  return {
    gi: 'PHASE_047_OFFICIAL_REGISTER_RECONCILED',
    giRegisterEffectiveThrough: gi.registerEffectiveThrough,
    pricing: 'PROTOTYPE_VALUES_PENDING_PHASE_048',
    taxonomy: 'PHASE_045_LOCAL_EVIDENCE_AND_UNRESOLVED_CANDIDATES',
    farmerMap: 'PRIVATE_NOT_EXPOSED',
  };
}

router.get('/stats', (req, res) => {
  res.json({ success: true, data: productMaster.stats(), truthStatus: truthStatus() });
});

router.get('/enrichment/stats', (req, res) => {
  res.json({ success: true, data: varietyEnrichment.stats() });
});

router.get('/gi/stats', (req, res) => {
  res.json({ success: true, data: giProvenance.stats() });
});

router.get('/gi/issues', (req, res) => {
  res.json({ success: true, count: giProvenance.issues().length, data: giProvenance.issues() });
});

router.get('/gi/false-negatives', (req, res) => {
  const rows = giProvenance.falseNegatives();
  res.json({ success: true, count: rows.length, data: rows });
});

router.get('/categories', (req, res) => {
  res.json({ success: true, data: productMaster.categories() });
});

router.get('/origins', (req, res) => {
  res.json({ success: true, data: productMaster.origins() });
});

router.get('/products', (req, res) => {
  const giClaim = req.query.giClaim == null ? null : String(req.query.giClaim).toLowerCase() === 'true';
  const giRegistered = req.query.giRegistered == null ? null : String(req.query.giRegistered).toLowerCase() === 'true';
  const result = productMaster.search(req.query.q || '', {
    category: req.query.category,
    origin: req.query.origin,
    giClaim,
    giRegistered,
    limit: req.query.limit,
    offset: req.query.offset,
  });
  const includeEnrichment = String(req.query.includeEnrichment || '').toLowerCase() === 'true';
  if (includeEnrichment) {
    result.results = result.results.map((product) => ({
      ...product,
      enrichment: varietyEnrichment.getByProductId(product.productId),
    }));
  }
  res.json({ success: true, data: result, truthStatus: truthStatus() });
});

router.get('/products/:productId/enrichment', (req, res) => {
  const product = productMaster.getById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const enrichment = varietyEnrichment.getByProductId(req.params.productId);
  if (!enrichment) return res.status(404).json({ success: false, error: 'Product enrichment not found' });
  return res.json({
    success: true,
    product: { productId: product.productId, identity: product.identity, gi: product.gi },
    enrichment,
    truthStatus: {
      taxonomy: enrichment.fieldTruth.taxonomy,
      gi: product.gi.verificationStatus,
      giRegisterEffectiveThrough: product.gi.sourceSnapshot?.registerEffectiveThrough || null,
      quantitativeClaims: 'LOCAL_CLAIMS_NOT_EXTERNALLY_VERIFIED',
      internalEvidence: 'NOT_EXPOSED',
    },
  });
});

router.get('/products/:productId/gi', (req, res) => {
  const product = productMaster.getById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  const gi = giProvenance.getByProductId(req.params.productId);
  if (!gi) return res.status(404).json({ success: false, error: 'GI provenance not found' });
  return res.json({ success: true, product: { productId: product.productId, identity: product.identity }, gi });
});

router.get('/products/:productId', (req, res) => {
  const product = productMaster.getById(req.params.productId);
  if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
  return res.json({ success: true, data: product, truthStatus: truthStatus() });
});

module.exports = router;
