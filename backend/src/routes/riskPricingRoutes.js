/**
 * Advance Rate Pricing routes.
 *
 * Endpoints for forward curves, basis decomposition and commitment advice.
 * Backed by services/riskPricingService.js, recovered from
 * afrera_platform_v44.html.
 *
 * A NOTE ON WHAT THESE ENDPOINTS ARE NOT
 *
 * Every response here is a decision aid. None of it is a hedging instrument,
 * a tradeable quote, or financial advice, and the service says so in its own
 * payloads. That wording travels with the number deliberately: an advance rate
 * on an unharvested crop is a commercial statement a farmer may act on, and
 * stripping the caveat off in transit is how a decision aid becomes a promise
 * nobody meant to make.
 *
 * Reads are public — a farmer should be able to see an indicative forward band
 * without an account, and the preview pattern in v44 exists for exactly that.
 * Anything that PERSISTS is authenticated, because a published rate and a
 * recorded piece of advice both attribute to someone.
 */

'use strict';

const express = require('express');

const router = express.Router();
const risk = require('../services/legacy/riskPricingService');
const { authMiddleware } = require('../middleware/auth');

/** Shared error shape. 400 for bad input, 500 only for genuine faults. */
function fail(res, error) {
  const badInput = /Unknown crop|requires|must be|Invalid/i.test(error.message);
  res.status(badInput ? 400 : 500).json({ success: false, error: error.message });
}

/** Crop parameters, with their provenance visible. */
router.get('/crops/:cropKey', async (req, res) => {
  try {
    res.json({ success: true, data: await risk.cropParams(req.params.cropKey) });
  } catch (error) { fail(res, error); }
});

/**
 * Indicative forward curve. Public.
 * GET /forward?crop=lakadong_turmeric&months=6&spot=180&state=..&district=..
 */
router.get('/forward', async (req, res) => {
  try {
    const { crop, months, spot, state, district, rainfall, temp, heatDays } = req.query;
    if (!crop || !months || !spot) {
      throw new Error('crop, months and spot are required');
    }
    const weather = rainfall
      ? {
        rainfallMm: Number(rainfall),
        meanTempC: Number(temp),
        heatDaysAboveThresh: Number(heatDays || 0),
      }
      : null;
    const data = await risk.computeAdvanceRate({
      cropKey: crop,
      monthsAhead: Number(months),
      spotPerKg: Number(spot),
      state, district, weather,
    });
    res.json({ success: true, data });
  } catch (error) { fail(res, error); }
});

/** Is the model entitled to speak about this district+crop at all? */
router.get('/calibration/:state/:district/:cropKey', async (req, res) => {
  try {
    const { state, district, cropKey } = req.params;
    const c = await risk.districtConfidence(state, district, cropKey);
    res.json({
      success: true,
      data: {
        ...c,
        mayAdvise: c.confidence >= 0.5,
        standing: c.confidence >= 0.8 ? 'calibrated'
          : c.confidence >= 0.5 ? 'usable with caveats'
            : 'must decline — advising here would be guessing with someone else\'s harvest',
      },
    });
  } catch (error) { fail(res, error); }
});

/**
 * Commitment advice. Authenticated, because it is recorded against a farmer
 * and later scored by the learning loop.
 *
 * May legitimately return advice: 'NO RECOMMENDATION' with commitPct null.
 * That is a 200, not an error — the model declining is a real answer, and
 * returning 4xx would make callers treat a correct refusal as a fault.
 */
router.post('/advise', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    for (const k of ['cropKey', 'qtyKg', 'floorPerKg', 'participationShare', 'spotPerKg', 'monthsAhead']) {
      if (b[k] === undefined || b[k] === null) throw new Error(`${k} is required`);
    }
    if (b.participationShare < 0 || b.participationShare > 1) {
      throw new Error('participationShare must be between 0 and 1');
    }
    const data = await risk.adviseCommitment({ ...b, farmerId: b.farmerId || req.user?.id });
    res.json({ success: true, data });
  } catch (error) { fail(res, error); }
});

/** Publish an advance rate. Authenticated and attributed. */
router.post('/publish', authMiddleware, async (req, res) => {
  try {
    const rate = await risk.computeAdvanceRate(req.body || {});
    // An uncalibrated rate is indicative only and must not be published as a
    // binding advance. Blocking here rather than relying on the DB constraint
    // gives the caller a reason instead of a constraint-violation string.
    if (!rate.calibrated) {
      return res.status(409).json({
        success: false,
        error: 'This district is not calibrated for this crop, so the rate cannot be '
             + 'published as binding.',
        confidence: rate.confidence,
        indicativeRate: rate,
      });
    }
    const saved = await risk.publish(rate, req.user?.id);
    return res.json({ success: true, data: { ...rate, ...saved } });
  } catch (error) { return fail(res, error); }
});

/** Record and decompose an observed farmgate-to-delivered spread. */
router.post('/basis', authMiddleware, async (req, res) => {
  try {
    const b = req.body || {};
    for (const k of ['cropKey', 'farmgatePerKg', 'ncrDeliveredPerKg', 'freightPerKg', 'expectedLossPct']) {
      if (b[k] === undefined) throw new Error(`${k} is required`);
    }
    res.json({ success: true, data: await risk.recordBasis(b) });
  } catch (error) { fail(res, error); }
});


// ---------------------------------------------------------------------------
// Yield management (059). Added to the existing pricing routes — one module
// owns pricing, so two endpoints cannot quote two prices for the same lot.
// ---------------------------------------------------------------------------
const dynamicPricing = require('../services/legacy/dynamicPricingService');

router.get('/lots/:lotCode/price', async (req, res) => {
  try {
    res.json({ success: true, data: await dynamicPricing.priceForLot(req.params.lotCode) });
  } catch (e) { fail(res, e); }
});

router.post('/lots/:lotCode/open-bucket', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await dynamicPricing.openNextBucket(req.params.lotCode) });
  } catch (e) { fail(res, e); }
});

router.get('/booking-curve/:cropKey', async (req, res) => {
  try {
    res.json({ success: true, data: await dynamicPricing.bookingCurve(req.params.cropKey) });
  } catch (e) { fail(res, e); }
});

router.post('/booking-curve', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await dynamicPricing.recordBookingPoint(req.body) });
  } catch (e) { fail(res, e); }
});

router.get('/lots/attention', authMiddleware, async (req, res) => {
  try {
    res.json({ success: true, data: await dynamicPricing.lotsNeedingAttention(req.query) });
  } catch (e) { fail(res, e); }
});

module.exports = router;
