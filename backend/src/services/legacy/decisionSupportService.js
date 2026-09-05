/**
 * Decision Support Service
 * 
 * This service contains the 8 critical business logic functions extracted from
 * the v42 HTML prototype that were missing from the backend implementation.
 * 
 * These functions are exposed via /api/v1/decision-support endpoints and provide
 * core business logic for pricing, logistics, finance, and governance decisions.
 */

const express = require('express');
const decisionSupportRoutes = require('../../../routes/decisionSupportRoutes');

class DecisionSupportService {
  /**
   * 1. corpCreditEligible - Corporate credit gating for B2B buyers
   * 
   * @param {number} turnoverCr - Annual turnover in crores
   * @param {number} vintageYrs - Business vintage in years
   * @returns {object} Credit term eligibility with explanation
   */
  corpCreditEligible(turnoverCr, vintageYrs) {
    if (turnoverCr >= 5 && vintageYrs >= 3) {
      return {
        term: 'net60',
        days: 60,
        why: 'Turnover ≥₹5Cr and 3+ years vintage — full NET 60 eligible'
      };
    }
    
    if (turnoverCr >= 1 && vintageYrs >= 1) {
      return {
        term: 'net30',
        days: 30,
        why: 'Meets the NET 30 threshold'
      };
    }
    
    return {
      term: 'net0',
      days: 0,
      why: 'New or small account — pay-on-delivery until a track record builds'
    };
  }

  /**
   * buyVsRentDecision - simple economics to choose buy vs rent
   */
  buyVsRentDecision({ priceNew, rentDay, usesPerSeason, cashTight } = {}) {
    if (!priceNew || !rentDay || !usesPerSeason) throw new Error('invalid input');

    // simple subsidy rule for small/marginal farmers
    const subsidyPct = priceNew >= 200000 && cashTight ? 50 : priceNew >= 100000 ? 25 : 0;
    const netPurchaseCost = Math.round(priceNew * (1 - subsidyPct / 100));
    const breakEvenUses = Math.round(priceNew / (rentDay * usesPerSeason));

    return {
      recommendation: netPurchaseCost <= rentDay * usesPerSeason ? 'buy' : 'rent',
      options: [
        { type: 'buy', cost: netPurchaseCost },
        { type: 'rent', cost: rentDay * usesPerSeason }
      ],
      economics: { subsidyPct, netPurchaseCost, breakEvenUses }
    };
  }

  /**
   * farmerSelectionDecision - rank farmers preferring development (FDI) over raw price
   */
  farmerSelectionDecision({ candidates = [] } = {}) {
    if (!Array.isArray(candidates) || candidates.length === 0) return null;

    const scored = candidates.map(c => {
      const priceScore = 1 / (c.price || 1);
      const fdi = c.fdiScore || 50;
      const orders = c.fulfilledOrders || 0;
      const score = fdi * 0.4 + orders * 2 + priceScore * 0.3;

      const criteria = [
        { name: 'FDI', value: fdi, dataQuality: 'real' },
        { name: 'Fulfilment', value: orders, dataQuality: orders === 0 ? 'assumed' : 'real' },
        { name: 'Price', value: c.price, dataQuality: 'real' }
      ];

      return { farmer: c.farmer, score, result: { criteria } };
    });

    scored.sort((a, b) => b.score - a.score);
    return { ranked: scored };
  }

  /**
   * claimFraudScore - lightweight explainable fraud scoring
   */
  claimFraudScore({ documentsSubmitted = 0, documentsRequired = 0, lateDays = 0, amount = 0, sumInsured = 1, priorClaims = 0 } = {}) {
    let score = 0;
    const reasons = [];

    const missingDocs = Math.max(0, documentsRequired - documentsSubmitted);
    if (missingDocs > 0) { score += missingDocs * 10; reasons.push(`${missingDocs} documents missing`); }
    if (lateDays > 30) { const p = Math.min(30, Math.floor(lateDays / 3)); score += p; reasons.push(`Late by ${lateDays} days`); }
    const amountRatio = amount / Math.max(1, sumInsured);
    if (amountRatio > 0.8) { score += 30; reasons.push('Large claim relative to sum insured'); }
    if (priorClaims > 0) { score += priorClaims * 5; reasons.push(`${priorClaims} prior claims`); }

    score = Math.min(100, Math.round(score));

    const band = score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
    const action = score < 20 ? 'auto_process' : 'investigate';
    if (score < 20 && reasons.length === 0) reasons.unshift('No risk flags — clean claim');

    return { score, band, reasons, explainable: true, action };
  }

  /**
   * moqPrice - returns discount tiers and unit price
   */
  moqPrice({ basePrice = 0, qty = 0 } = {}) {
    let discountPct = 0;
    if (qty >= 5000) discountPct = 14;
    else if (qty >= 600) discountPct = 9;
    else if (qty >= 300) discountPct = 5;

    const unit = Math.round(basePrice * (1 - discountPct / 100));
    const savings = (basePrice - unit) * qty;
    return { discountPct, unit, savings };
  }

  /**
   * benchmarkVerdict - bench peer-price evaluation
   */
  benchmarkVerdict({ myFloor, benchmark } = {}) {
    if (!benchmark || typeof benchmark.count !== 'number' || benchmark.count === 0) return { level: 'none', message: 'no peer data' };
    if (myFloor < benchmark.min) return { level: 'info', message: 'You may be underselling relative to peers' };
    if (myFloor > benchmark.max) return { level: 'warn', message: 'Your price is high relative to peers' };
    return { level: 'ok', message: 'Price within peer range' };
  }

  /**
   * 2. floorBenchmark - Peer floor-price comparison for farmers setting MAP-A
   * 
   * @param {string} categoryOrName - Product category or name
   * @param {array} catalog - Product catalog with floor prices
   * @returns {object} Min, max, average floor prices from peer farmers
   */
  floorBenchmark(categoryOrName, catalog = []) {
    const q = (categoryOrName || '').toLowerCase();
    if (!q) {
      return { min: null, max: null, avg: null, count: 0, note: 'No category provided' };
    }
    
    const vals = [];
    catalog.forEach(p => {
      if (p.off) return; // Skip offline products
      if (p.cat?.toLowerCase().includes(q) || p.n?.toLowerCase().includes(q)) {
        vals.push(p.floor);
      }
    });
    
    if (vals.length < 2) {
      return {
        min: vals.length > 0 ? vals[0] : null,
        max: vals.length > 0 ? vals[0] : null,
        avg: vals.length > 0 ? vals[0] : null,
        count: vals.length,
        note: 'not enough data - need at least 2 peer farmers'
      };
    }
    
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
    
    return { min, max, avg, count: vals.length, note: 'sufficient data' };
  }

  /**
   * 3. ecoLogisticsMiles - Emissions/ESG calculation per logistics lane
   * 
   * @param {object} ctx - Transaction context with lane selection
   * @param {array} lanes - Available logistics lanes
   * @returns {object} ESG score (0-100) with explanation
   */
  ecoLogisticsMiles(ctx, lanes = []) {
    if (ctx.kind !== 'booking') {
      return {
        score: 60,
        why: 'No lane chosen for this transaction'
      };
    }
    
    const lane = lanes.find(l => l.k === ctx.lane) || lanes[0];
    if (!lane) {
      return {
        score: 50,
        why: 'Lane not found in available corridors'
      };
    }
    
    const shortest = Math.min(...lanes.map(l => l.km));
    
    if (lane.km <= shortest * 1.15) {
      return {
        score: 95,
        why: `${lane.o} → ${lane.d} (${lane.km}km) is at or near the shortest corridor lane on record`
      };
    }
    
    const extra = Math.round((lane.km - shortest) / shortest * 100);
    let score = Math.max(10, 95 - extra);
    const reason = `${extra}% longer than shortest lane — extra emissions penalty`;
    
    return {
      score: Math.max(10, Math.min(100, score)),
      why: reason
    };
  }

  /**
   * 4. harvestPoints - Loyalty/incentive economics for buyers
   * 
   * @param {object} user - User object with transaction history
   * @returns {object} Total points, current tier, next tier info
   */
  harvestPoints(user) {
    const HS_TIERS = [
      ['🌱', 'Seed', 0],
      ['🌿', 'Sprout', 100],
      ['🌳', 'Sapling', 300],
      ['🏔️', 'Grove', 600],
      ['👑', 'Forest Patron', 1000]
    ];

    // Calculate points from transaction history
    let orders = (user.orders || []).length;
    const subs = (user.subscriptions || []).length;
    const gifts = (user.giftOrders || []).length;
    
    const totalPoints = orders * 50 + subs * 120 + gifts * 40;
    
    // Determine current tier
    let currentTier = HS_TIERS[0];
    for (const tier of HS_TIERS) {
      if (totalPoints >= tier[2]) currentTier = tier;
    }
    
    // Find next tier
    const currentIndex = HS_TIERS.indexOf(currentTier);
    const nextTier = HS_TIERS[currentIndex + 1] || null;
    
    return {
      totalPoints,
      currentTier: {
        emoji: currentTier[0],
        name: currentTier[1],
        threshold: currentTier[2]
      },
      nextTier: nextTier ? {
        emoji: nextTier[0],
        name: nextTier[1],
        threshold: nextTier[2],
        pointsNeeded: nextTier[2] - totalPoints
      } : null,
      breakdown: {
        orders: orders * 50,
        subscriptions: subs * 120,
        gifts: gifts * 40
      }
    };
  }

  /**
   * 5. allocScore - Order-to-farmer allocation scoring
   * 
   * @param {object} lot - Farmer lot information
   * @param {string} dest - Destination
   * @param {object} regionDist - Regional distance matrix
   * @returns {object} Allocation score with component breakdown
   */
  allocScore(lot, dest, regionDist = {}) {
    const parts = [];
    
    // FDI component (30% weight)
    const fdiScore = lot.fdiScore || 50;
    const fdiGrade = lot.fdiGrade || 'C';
    const fdiPts = Math.round(fdiScore * 0.30);
    parts.push({ component: 'FDI grade ' + fdiGrade, points: fdiPts, weight: 30 });
    
    // Quality grade (20% weight)
    const gradePts = lot.grade === 'A' ? 20 : 12;
    parts.push({ component: 'Quality grade ' + lot.grade, points: gradePts, weight: 20 });
    
    // Distance penalty (20% weight)
    const dist = (regionDist[lot.region] || {})[dest] || 1500;
    const distPts = Math.round(Math.max(0, 20 - (dist / 2400) * 20));
    parts.push({ component: dist + ' km to destination', points: distPts, weight: 20 });
    
    // Price headroom (15% weight)
    const margin = lot.adv && lot.floor ? (lot.adv - lot.floor) / lot.adv : 0;
    const fairPts = Math.round(Math.min(15, margin * 25));
    parts.push({ component: 'Price headroom above farmer floor', points: fairPts, weight: 15 });
    
    // Freshness (15% weight)
    const freshPts = lot.perish ? 15 : 10;
    parts.push({ component: 'Freshness: ' + (lot.perish ? 'perishable' : 'durable'), points: freshPts, weight: 15 });
    
    const total = fdiPts + gradePts + distPts + fairPts + freshPts;
    
    return {
      total,
      parts,
      fdi: { score: fdiScore, grade: fdiGrade }
    };
  }

  /**
   * 6. compostPlan - Residue → compost planning
   * 
   * @param {string} crop - Crop type
   * @param {number} acres - Acreage
   * @param {string} soilCond - Soil condition
   * @returns {array} Customized compost plan with quantities
   */
  compostPlan(crop, acres, soilCond) {
    const SOIL_ADJUST = {
      'Looks tired / low yield': { mult: 1.15, note: 'Slightly higher organic matter dressing' },
      'Normal / average': { mult: 1.0, note: 'Standard base dressing' },
      'Recently fallow / rested': { mult: 0.85, note: 'Lower dressing — residual fertility likely still present' }
    };

    const COMPOST_RATES = {
      'Vermicompost': { qty: 500, unit: 'kg', role: 'Primary organic base' },
      'Farmyard Manure': { qty: 2000, unit: 'kg', role: 'Bulk organic matter' },
      'Neem Cake': { qty: 100, unit: 'kg', role: 'Pest repellent + slow N' },
      'Bone Meal': { qty: 50, unit: 'kg', role: 'Phosphorus source' },
      'Rock Phosphate': { qty: 40, unit: 'kg', role: 'Long-term P' }
    };

    const soilAdjustment = SOIL_ADJUST[soilCond] || SOIL_ADJUST['Normal / average'];
    const mult = soilAdjustment.mult;
    
    return Object.entries(COMPOST_RATES).map(([name, r]) => ({
      name,
      qty: Math.round(r.qty * acres * mult * 100) / 100,
      unit: r.unit,
      role: r.role
    }));
  }

  /**
   * 7. schemeExpiryStatus - Scheme deadline exposure monitoring
   * 
   * @returns {array} All schemes with days remaining and status
   */
  schemeExpiryStatus() {
    const SCHEME_EXPIRY = [
      { id: 'PM-FME', label: 'PM-FME notified period', expiry: '2025-03-31' },
      { id: 'AIF', label: 'Agriculture Infrastructure Fund', expiry: '2028-03-31' },
      { id: 'AHIDF', label: 'AHIDF (already lapsed — tombstoned)', expiry: '2026-03-31' },
      { id: 'OPGREENS', label: 'Operation Greens (TOP to TOTAL)', expiry: '2027-03-31' }
    ];

    const now = Date.now();
    
    return SCHEME_EXPIRY.map(s => {
      const days = Math.round((new Date(s.expiry) - now) / 86400000);
      const state = days < 0 ? 'LAPSED' : days <= 60 ? 'EXPIRING SOON' : 'ACTIVE';
      
      return {
        ...s,
        days,
        state,
        urgency: state === 'LAPSED' ? 'critical' : state === 'EXPIRING SOON' ? 'high' : 'low'
      };
    });
  }

  /**
   * 8. complianceGaps - Compliance readiness checking
   * 
   * @param {object} complianceRecord - Current compliance record
   * @returns {object} Missing compliance items and readiness status
   */
  complianceGaps(complianceRecord = {}) {
    const REQUIRED_FIELDS = [
      ['fssaiLicence', 'FSSAI licence number'],
      ['grievanceOfficer', 'Grievance Officer name'],
      ['grievanceEmail', 'Grievance Officer e-mail'],
      ['grievancePhone', 'Grievance Officer phone'],
      ['nodalOfficer', 'Nodal Officer (IT Rules 2021)'],
      ['gstin', 'GSTIN']
    ];

    const missing = REQUIRED_FIELDS
      .filter(([field]) => !String(complianceRecord[field] || '').trim())
      .map(([, label]) => label);

    return {
      missing,
      totalRequired: REQUIRED_FIELDS.length,
      completed: REQUIRED_FIELDS.length - missing.length,
      isReady: missing.length === 0,
      readinessPercentage: Math.round(((REQUIRED_FIELDS.length - missing.length) / REQUIRED_FIELDS.length) * 100)
    };
  }

  /**
   * Setup routes for decision support service
   * This allows the service to be mounted in the main app
   */
  setupRoutes(app) {
    app.use('/api/v1/decision-support', decisionSupportRoutes);
  }
}

module.exports = new DecisionSupportService();
