/**
 * Enterprise AI Routes
 *
 * 2026-08-10 audit: this router used to call `services/enterpriseAIService.js`
 * exclusively. That file was 100% fabricated — every method (including every
 * "helper" it called) returned a hardcoded constant or a canned literal
 * (`calculateCreditScore()` was commented "Simulated AI credit scoring",
 * `getStakeholder()` always returned the same farmer regardless of ID,
 * `detectAnomalies()` could never return anything because its baseline
 * lookup was `async getBaselinePatterns() { return {}; }`). It has been
 * deleted rather than kept as dead weight.
 *
 * Endpoint-by-endpoint disposition (see AFRERA audit notes for the full
 * reasoning): each handler below either delegates to a real, DB-backed
 * service that already exists elsewhere in the codebase, or — where no real
 * equivalent exists — fails honestly with `501 { implemented: false }`
 * rather than fabricating a result. This mirrors the pattern already used by
 * middleware/compliance.js's GDPR endpoints and core/aiOrchestrator.js's
 * ENGINES registry for capabilities that are not real yet.
 */
const express = require('express');
const { getBuyerCreditEligibility, farmerCreditRiskScore } = require('../services/legacy/financialService');
const governmentSchemeService = require('../services/legacy/governmentSchemeService');
const aiOrchestrationService = require('../services/legacy/aiOrchestrationService');
const aiOrchestrator = require('../core/aiOrchestrator');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

/**
 * Credit scoring. The old fake `calculateCreditScore()` invented a score
 * from `getFDIScore()`/`getTransactionHistory()`/etc, every one of which was
 * a hardcoded literal. Real replacements, both DB-backed:
 *   - farmerId  -> financialService.farmerCreditRiskScore() (MCDA over real
 *                  fdi_score, emi_schedule repayment, farmer_revenue,
 *                  fulfilled_orders/disputes)
 *   - buyerId   -> financialService.getBuyerCreditEligibility() (real
 *                  buyers.annual_turnover_cr / business_established_year
 *                  gated through decisionSupportService.corpCreditEligible)
 */
router.post('/credit-score', async (req, res, next) => {
  try {
    const { farmerId, buyerId } = req.body || {};
    if (farmerId) {
      const actorId = req.user?.id ? `user:${req.user.id}` : undefined;
      const result = await farmerCreditRiskScore(farmerId, { actorId });
      return res.json({ success: true, data: result });
    }
    if (buyerId) {
      const result = await getBuyerCreditEligibility(buyerId);
      return res.json({ success: true, data: result });
    }
    return res.status(400).json({
      success: false,
      error: 'Provide either farmerId (farmer credit-risk score) or buyerId (buyer B2B credit eligibility) in the request body.'
    });
  } catch (error) {
    if (error.message === 'Farmer not found' || error.message === 'Buyer not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
});

/**
 * Scheme eligibility. The old fake version checked geographic/financial/
 * operational/compliance "eligibility" that were each `{ passed: true }`
 * literals — every stakeholder was always eligible for everything.
 * Real replacement is grounded in the verified `government_schemes`
 * registry (migration 9995), never in AI-invented eligibility criteria:
 *   - schemeId given            -> governmentSchemeService.getSchemeByCode()
 *                                   (real verified status/expiry — eligible
 *                                   only if status === 'active')
 *   - category/state/farm_size  -> governmentSchemeService.checkSchemeEligibility()
 *                                   (real filtered registry listing)
 */
router.post('/scheme-eligibility', async (req, res, next) => {
  try {
    const { schemeId, category, state, farm_size } = req.body || {};

    if (schemeId) {
      const scheme = await governmentSchemeService.getSchemeByCode(schemeId);
      return res.json({
        success: true,
        data: {
          schemeId,
          scheme,
          eligible: scheme.status === 'active',
          status: scheme.status,
          expiry: scheme.expiry_date,
          notes: scheme.status === 'conditional'
            ? 'Scheme is conditional — confirm current-year allocation with the primary source before committing.'
            : scheme.status === 'expired'
              ? 'Scheme has lapsed and is not eligible.'
              : undefined
        }
      });
    }

    if (category || state || farm_size) {
      const result = await governmentSchemeService.checkSchemeEligibility({ category, state, farm_size });
      return res.json({ success: true, data: result });
    }

    return res.status(400).json({
      success: false,
      error: 'Provide either schemeId (verified single-scheme check) or category/state/farm_size (registry filter).'
    });
  } catch (error) {
    if (error.message === 'Scheme not found') {
      return res.status(404).json({ success: false, error: error.message });
    }
    next(error);
  }
});

/**
 * Risk assessment. The old fake version combined `assessFinancialRisk()` /
 * `assessOperationalRisk()` / `assessMarketRisk()` / etc, every one of which
 * returned the exact same hardcoded score no matter which stakeholder,
 * transaction type, or amount was passed in. No real equivalent exists in
 * this codebase for generic cross-domain stakeholder/transaction risk
 * (riskPricingService.js is crop forward-pricing risk, a different domain;
 * decisionSupportService.claimFraudScore() is insurance-claim-specific).
 * Reported honestly rather than reviving the fabricated formula.
 */
router.post('/assess-risk', async (req, res, next) => {
  res.status(501).json({
    implemented: false,
    error: 'Not Implemented',
    message: 'Generic cross-domain stakeholder/transaction risk assessment does not exist yet. '
      + 'The previous implementation returned hardcoded constants regardless of input and has been '
      + 'removed rather than kept as a fabricated result. For crop price/forward-pricing risk see '
      + '/api/v1/pricing (riskPricingService); for insurance claim fraud scoring see '
      + 'decisionSupportService.claimFraudScore().',
    code: 'ENTERPRISE_AI_RISK_ASSESSMENT_NOT_IMPLEMENTED'
  });
});

/**
 * Cross-stakeholder recommendations. The old fake version returned two
 * hardcoded recommendation objects per stakeholder type, identical for every
 * caller regardless of context. No real cross-stakeholder recommendation
 * engine exists in this codebase today.
 */
router.post('/recommendations', async (req, res, next) => {
  res.status(501).json({
    implemented: false,
    error: 'Not Implemented',
    message: 'Cross-stakeholder recommendation generation does not exist yet. The previous '
      + 'implementation returned two hardcoded recommendations per stakeholder type regardless of '
      + 'context and has been removed rather than kept as a fabricated result.',
    code: 'ENTERPRISE_AI_RECOMMENDATIONS_NOT_IMPLEMENTED'
  });
});

/**
 * Entity profile / knowledge-graph enrichment. The old fake version's
 * `getEntity()`, `getEntityRelationships()`, `generateEntityEmbeddings()`,
 * `calculateInfluenceScore()`, `clusterEntity()`, `findSimilarEntities()`
 * all returned empty/zero literals unconditionally. services/knowledgeGraphService.js
 * is real and DB-backed, but it operates on `knowledge_nodes` rows addressed
 * by internal node ID, not on arbitrary (entityId, entityType) pairs from
 * every other business table — there is no mapping layer from farmer/buyer/
 * FPO IDs to knowledge-graph node IDs, so delegating here would silently
 * misrepresent one capability as the other. Reported honestly instead.
 */
router.post('/entity-profile', async (req, res, next) => {
  res.status(501).json({
    implemented: false,
    error: 'Not Implemented',
    message: 'Entity relationship/embedding profiles for arbitrary business entities do not exist '
      + 'yet. services/knowledgeGraphService.js is real but operates on registered knowledge_nodes '
      + 'by internal node ID, not on arbitrary (entityId, entityType) pairs — there is no mapping '
      + 'layer between the two, so this endpoint is not wired rather than faked. Use '
      + 'GET /api/v1/knowledge-graph/knowledge-nodes/:nodeId/related if you already hold a '
      + 'knowledge_nodes ID.',
    code: 'ENTERPRISE_AI_ENTITY_PROFILE_NOT_IMPLEMENTED'
  });
});

/**
 * Generic transaction anomaly detection. The old fake version's
 * `getBaselinePatterns()` always returned `{}` and `calculateDeviations()`
 * always returned `[]`, so this endpoint could structurally never detect
 * anything, ever, for any input. No generic real equivalent exists;
 * services/insuranceFraudDetectionService.js is real but scoped specifically
 * to insurance claims, not arbitrary transactions.
 */
router.post('/anomaly-detection', async (req, res, next) => {
  res.status(501).json({
    implemented: false,
    error: 'Not Implemented',
    message: 'Generic transaction anomaly detection does not exist yet. The previous implementation '
      + 'was structurally incapable of ever flagging anything (its baseline lookup always returned '
      + 'an empty object) and has been removed rather than kept as dead code. For insurance-claim '
      + 'fraud scoring specifically, see services/insuranceFraudDetectionService.js.',
    code: 'ENTERPRISE_AI_ANOMALY_DETECTION_NOT_IMPLEMENTED'
  });
});

/**
 * predict-yield / predict-demand / predict-price. The old fake versions
 * built a "prediction" out of helper methods that were all `return {}` /
 * `return 0` / `return ''` stubs. services/predictiveAnalyticsService.js is
 * real and DB-backed, but it is storage/retrieval infrastructure for
 * predictions and forecasts computed elsewhere (createPrediction,
 * getForecasts, ...) — it does not itself compute crop yield, demand, or
 * price forecasts. Chaining a fake computation onto real storage would still
 * be a fake computation, so these are reported honestly instead.
 */
function notImplementedPrediction(code, subject) {
  return (req, res) => {
    res.status(501).json({
      implemented: false,
      error: 'Not Implemented',
      message: `No real ${subject} prediction model exists yet. services/predictiveAnalyticsService.js `
        + 'stores and retrieves predictions/forecasts computed elsewhere; it does not itself compute '
        + `${subject} forecasts. The previous implementation fabricated one from stub helpers that all `
        + 'returned empty/zero literals and has been removed.',
      code
    });
  };
}

router.post('/predict-yield', notImplementedPrediction('ENTERPRISE_AI_PREDICT_YIELD_NOT_IMPLEMENTED', 'crop yield'));
router.post('/predict-demand', notImplementedPrediction('ENTERPRISE_AI_PREDICT_DEMAND_NOT_IMPLEMENTED', 'demand'));
router.post('/predict-price', notImplementedPrediction('ENTERPRISE_AI_PREDICT_PRICE_NOT_IMPLEMENTED', 'price'));

// Model slot registry / unserved-intent introspection — already real,
// DB-backed (ai_model_registry, migration 058), unchanged by this audit.
router.get('/model-slots', async (req, res, next) => {
  try {
    const result = await aiOrchestrationService.listModelSlots();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.get('/unserved-intents', async (req, res, next) => {
  try {
    const result = await aiOrchestrationService.listUnservedIntents();
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

router.post('/model-slots', async (req, res, next) => {
  try {
    const result = await aiOrchestrationService.upsertModelSlot(req.body || {});
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

/**
 * Conversational query. The old fake `processQuery()` ran `detectIntent()`
 * (always `{ type: 'general_inquiry', confidence: 0.5 }`) and
 * `extractEntities()` (always `[]`) before handing off to handlers that were
 * all `return {}` stubs — it could never produce a real answer.
 *
 * Real replacement: core/aiOrchestrator.js's `llm` engine, invoked with
 * `allowTemplateFallback: true`. That engine is itself an honestly-labelled
 * rule-based template responder (services/aiCopilotService.js
 * generateCopilotResponse — the same function whatsappService.js's
 * handleFarmerQuery() already uses for its default fallback), NOT an LLM
 * call (backend/package.json has zero LLM SDKs). The orchestrator marks the
 * result `usedTemplateFallbackNotLLM: true` and logs the dispatch to
 * ai_invocations, so this is reported as what it actually is rather than
 * sold as conversational AI.
 */
router.post('/query', async (req, res, next) => {
  try {
    const { query, context } = req.body || {};
    if (!query) {
      return res.status(400).json({ success: false, error: 'query is required' });
    }
    const actorId = req.user?.id ? `user:${req.user.id}` : 'enterpriseAIRoutes:/query';
    const result = await aiOrchestrator.route(
      'llm',
      { message: query, context: context || {}, allowTemplateFallback: true },
      { actorId }
    );
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
