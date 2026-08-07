/**
 * Commerce Rules Service — the last business logic worth recovering from the
 * pre-v43 lineage (`ne (3).zip`).
 *
 * SELECTION RATIONALE
 * Of 213 functions found in the lineage but absent from v43, only ~10 carried
 * business logic; the rest were DOM/render helpers belonging to a single-file
 * HTML app, which React replaces by design. Six were recovered into
 * neProductIntelligenceService. These four are the remainder, chosen because
 * each encodes a RULE (what the business does and why), not a rendering.
 *
 *   priceFreeze       <- cartLinePrice / cartLineLocked  (ne_harvest_v9_os)
 *   loyaltyRedemption <- redeemPoints                    (ne_harvest_v8_os 13)
 *   subscriptionPlan  <- runSIP + SIP_PLANS              (ao_system_v2)
 *   deliveryZone      <- checkPincode + DELIVERY_ZONES   (ne_harvest_v8_os 13)
 *
 * The price-freeze rule is the most important of the four and carried an
 * explicit ethical comment in the original, preserved below.
 */

const express = require('express');
const { logger } = require('../utils/logger');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// ---------------------------------------------------------------------------
// 1. Price freeze — a consumer-protection rule, not a caching optimisation
// ---------------------------------------------------------------------------

/** How long a quoted price is honoured once it is in the buyer's cart. */
const PRICE_FREEZE_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Which price actually applies to a cart line.
 *
 * The original carried this reasoning verbatim, and it is the reason this
 * function is worth recovering at all:
 *
 *   "the locked price while inside the freeze window, the current live price
 *    once the freeze has expired (re-locked silently is wrong — the person
 *    should see and accept a changed price, not be charged a new amount
 *    without knowing)."
 *
 * So on expiry this does NOT quietly re-lock at the new price. It returns the
 * live price together with `requiresBuyerAcknowledgement`, so the interface is
 * obliged to show the change before the buyer pays. Silently re-locking would
 * be easier to implement and would be a quiet price rise.
 */
function priceFreeze({ lockedPrice, livePrice, lockedAtIso, nowIso } = {}) {
  const locked = Number(lockedPrice);
  const live = Number(livePrice);

  if (!Number.isFinite(locked) || locked < 0) throw new Error('lockedPrice must be a non-negative number');
  if (!Number.isFinite(live) || live < 0) throw new Error('livePrice must be a non-negative number');
  if (!lockedAtIso) throw new Error('lockedAtIso is required');

  const lockedAt = new Date(lockedAtIso).getTime();
  if (!Number.isFinite(lockedAt)) throw new Error('lockedAtIso must be a valid ISO timestamp');

  const now = nowIso ? new Date(nowIso).getTime() : Date.now();
  const elapsed = now - lockedAt;
  const stillFrozen = elapsed >= 0 && elapsed < PRICE_FREEZE_MS;

  if (stillFrozen) {
    return {
      applicablePrice: locked,
      frozen: true,
      msRemaining: PRICE_FREEZE_MS - elapsed,
      priceChanged: false,
      requiresBuyerAcknowledgement: false
    };
  }

  const changed = live !== locked;
  return {
    applicablePrice: live,
    frozen: false,
    msRemaining: 0,
    priceChanged: changed,
    previousPrice: changed ? locked : undefined,
    delta: changed ? Math.round((live - locked) * 100) / 100 : 0,
    // The interface MUST surface this before charging.
    requiresBuyerAcknowledgement: changed,
    message: changed
      ? `The held price expired and this item is now ₹${live} (was ₹${locked}). Please confirm before checkout.`
      : 'The held price expired but the price has not changed.'
  };
}

// ---------------------------------------------------------------------------
// 2. Loyalty redemption
// ---------------------------------------------------------------------------

const LOYALTY_MIN_REDEEM = 100;   // minimum points redeemable
const LOYALTY_POINTS_PER_RUPEE = 10; // 100 points -> ₹10

/**
 * Redeem loyalty points for wallet credit.
 * Redeems in whole blocks of 100 and returns the remainder rather than
 * rounding it away — a farmer's or buyer's unredeemed points are theirs.
 */
function loyaltyRedemption({ availablePoints } = {}) {
  const points = Number(availablePoints);
  if (!Number.isFinite(points) || points < 0) throw new Error('availablePoints must be a non-negative number');

  if (points < LOYALTY_MIN_REDEEM) {
    return {
      redeemed: false,
      pointsRedeemed: 0,
      creditRupees: 0,
      pointsRemaining: Math.floor(points),
      minimumRequired: LOYALTY_MIN_REDEEM,
      message: `A minimum of ${LOYALTY_MIN_REDEEM} points is needed to redeem (you have ${Math.floor(points)}).`
    };
  }

  const redeemable = Math.floor(points / LOYALTY_MIN_REDEEM) * LOYALTY_MIN_REDEEM;
  const credit = redeemable / LOYALTY_POINTS_PER_RUPEE;

  return {
    redeemed: true,
    pointsRedeemed: redeemable,
    creditRupees: credit,
    pointsRemaining: Math.floor(points - redeemable),
    conversionRate: `${LOYALTY_POINTS_PER_RUPEE} points = ₹1`,
    message: `Redeemed ${redeemable} points for ₹${credit} wallet credit.`
  };
}

// ---------------------------------------------------------------------------
// 3. Subscription (SIP) produce plan
// ---------------------------------------------------------------------------

/**
 * Base weekly basket per dietary emphasis, sized for a 4-person household.
 * Scaled linearly by household size, matching the original `scale = size/4`.
 * Source: ao_system_v2 SIP_PLANS.
 */
const SIP_BASE_PLANS = Object.freeze({
  balanced: [
    { item: 'Seasonal vegetables', costPerWeek: 420 },
    { item: 'Seasonal fruit', costPerWeek: 330 },
    { item: 'NE speciality (rotating)', costPerWeek: 260 },
    { item: 'Staples / pulses', costPerWeek: 290 }
  ],
  protein: [
    { item: 'Pulses & legumes', costPerWeek: 480 },
    { item: 'Seasonal vegetables', costPerWeek: 360 },
    { item: 'Seasonal fruit', costPerWeek: 260 },
    { item: 'NE speciality (rotating)', costPerWeek: 200 }
  ],
  immunity: [
    { item: 'Lakadong turmeric & spices', costPerWeek: 300 },
    { item: 'Citrus & vitamin-C fruit', costPerWeek: 380 },
    { item: 'Seasonal vegetables', costPerWeek: 380 },
    { item: 'Fermented / probiotic NE items', costPerWeek: 240 }
  ]
});

const SIP_FREQUENCY = Object.freeze({ weekly: 4.33, fortnightly: 2.17, monthly: 1 });

/**
 * Build a subscription plan for a household.
 *
 * Reports honestly when the budget cannot cover the basket rather than
 * silently trimming items to fit — a plan that quietly drops the vegetables to
 * hit a number is worse than one that says "this budget is short".
 */
function subscriptionPlan({ householdSize = 4, emphasis = 'balanced', monthlyBudget, frequency = 'weekly' } = {}) {
  const size = Number(householdSize);
  if (!Number.isFinite(size) || size <= 0) throw new Error('householdSize must be greater than zero');

  const base = SIP_BASE_PLANS[String(emphasis).toLowerCase()];
  if (!base) throw new Error(`emphasis must be one of: ${Object.keys(SIP_BASE_PLANS).join(', ')}`);

  const perMonth = SIP_FREQUENCY[String(frequency).toLowerCase()];
  if (!perMonth) throw new Error(`frequency must be one of: ${Object.keys(SIP_FREQUENCY).join(', ')}`);

  const scale = size / 4;
  const items = base.map((i) => ({
    item: i.item,
    costPerDelivery: Math.round(i.costPerWeek * scale)
  }));

  const perDelivery = items.reduce((s, i) => s + i.costPerDelivery, 0);
  const monthlyCost = Math.round(perDelivery * perMonth);
  const budget = Number(monthlyBudget);
  const hasBudget = Number.isFinite(budget) && budget > 0;

  return {
    householdSize: size,
    emphasis: String(emphasis).toLowerCase(),
    frequency: String(frequency).toLowerCase(),
    deliveriesPerMonth: perMonth,
    items,
    costPerDelivery: perDelivery,
    monthlyCost,
    budget: hasBudget ? budget : null,
    withinBudget: hasBudget ? monthlyCost <= budget : null,
    shortfall: hasBudget && monthlyCost > budget ? monthlyCost - budget : 0,
    note: hasBudget && monthlyCost > budget
      ? `This basket costs ₹${monthlyCost}/month, which is ₹${monthlyCost - budget} above the stated budget. Reduce household size, change frequency, or raise the budget — items have not been silently removed to fit.`
      : null
  };
}

// ---------------------------------------------------------------------------
// 4. Delivery zone lookup
// ---------------------------------------------------------------------------

/** NCR delivery zones. Source: ne_harvest_v8_os DELIVERY_ZONES. */
const DELIVERY_ZONES = Object.freeze({
  '122001': { area: 'DLF Phase 1-5, Gurugram', hub: 'Sohna Rd RWA hub', eta: 'Saturday 7-11AM', cod: true },
  '122002': { area: 'Sector 14-56, Gurugram', hub: 'Sohna Rd RWA hub', eta: 'Saturday 7-11AM', cod: true },
  '122003': { area: 'Sushant Lok, Gurugram', hub: 'Sohna Rd RWA hub', eta: 'Saturday 7-11AM', cod: true },
  '110030': { area: 'Vasant Vihar, Delhi', hub: 'South Delhi hub', eta: 'Sunday 8-12PM', cod: true }
});

function deliveryZone({ pincode } = {}) {
  const code = String(pincode || '').trim();
  if (!/^\d{6}$/.test(code)) {
    return { serviceable: false, valid: false, message: 'Enter a valid 6-digit pincode.' };
  }
  const zone = DELIVERY_ZONES[code];
  if (!zone) {
    return {
      serviceable: false,
      valid: true,
      pincode: code,
      message: 'Not currently serviceable. We deliver via RWA hubs and are adding areas as demand clusters.'
    };
  }
  return { serviceable: true, valid: true, pincode: code, ...zone };
}

function listServiceablePincodes() {
  return Object.entries(DELIVERY_ZONES).map(([pincode, z]) => ({ pincode, ...z }));
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------

const handle = (fn) => (req, res) => {
  try {
    res.json({ success: true, data: fn({ ...req.body, ...req.query }) });
  } catch (error) {
    logger.error('Commerce rules error', { error: error.message, stack: error.stack });
    res.status(400).json({ success: false, error: error.message });
  }
};

router.get('/delivery-zone', handle(deliveryZone));
router.get('/serviceable-pincodes', handle(listServiceablePincodes));
router.post('/subscription-plan', handle(subscriptionPlan));
router.post('/price-freeze', authMiddleware, handle(priceFreeze));
router.post('/loyalty-redemption', authMiddleware, handle(loyaltyRedemption));

function isHealthy() {
  return { status: 'ok', rules: 4, priceFreezeMinutes: PRICE_FREEZE_MS / 60000 };
}

module.exports = {
  router,
  isHealthy,
  priceFreeze,
  loyaltyRedemption,
  subscriptionPlan,
  deliveryZone,
  listServiceablePincodes,
  PRICE_FREEZE_MS,
  LOYALTY_MIN_REDEEM
};
