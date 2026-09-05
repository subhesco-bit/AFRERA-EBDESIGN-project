/**
 * FOLU Benchmark Service — tracks farmer/platform improvement against the
 * real Food and Land Use Coalition "Ten Critical Transitions" framework
 * (Growing Better, 2019 — https://www.foodandlandusecoalition.org/global-report/).
 * Verified against the coalition's own published transition list before
 * building this (2026-08-15), not reconstructed from memory:
 *   1. Healthy diets
 *   2. Productive and regenerative agriculture
 *   3. Protecting and restoring nature
 *   4. Healthy and productive oceans
 *   5. Diversifying protein supply
 *   6. Reducing food loss and waste
 *   7. Local loops and linkages
 *   8. Harnessing the digital revolution
 *   9. Delivering stronger rural livelihoods
 *   10. Gender equality and the demographic transition
 *
 * DISCIPLINE: this is a benchmark, not a certification. AFRERA is not
 * affiliated with or endorsed by FOLU/WRI — every indicator below is
 * computed from this platform's own real data and labelled with which
 * transition it maps to; it is never presented as an official FOLU score.
 * Transitions with no real, computable data source in this codebase are
 * honestly marked `available: false` rather than estimated.
 */

'use strict';

const pool = require('../../database/pool');

const FOLU_TRANSITIONS = [
  { id: 1, name: 'Healthy diets' },
  { id: 2, name: 'Productive and regenerative agriculture' },
  { id: 3, name: 'Protecting and restoring nature' },
  { id: 4, name: 'Healthy and productive oceans' },
  { id: 5, name: 'Diversifying protein supply' },
  { id: 6, name: 'Reducing food loss and waste' },
  { id: 7, name: 'Local loops and linkages' },
  { id: 8, name: 'Harnessing the digital revolution' },
  { id: 9, name: 'Delivering stronger rural livelihoods' },
  { id: 10, name: 'Gender equality and the demographic transition' },
];

class FoluBenchmarkService {
  async listTransitions() {
    return FOLU_TRANSITIONS;
  }

  /** Transition 2: Productive and regenerative agriculture. */
  async regenerativeAgricultureIndicator() {
    const result = await pool.query(
      `SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE organic = TRUE) AS organic_count,
              COUNT(*) FILTER (WHERE gi_status = TRUE) AS gi_certified_count
         FROM products WHERE is_active = TRUE`
    );
    const row = result.rows[0];
    const total = Number(row.total);
    return {
      transition: 2,
      available: total > 0,
      organicProductShare: total > 0 ? Number((Number(row.organic_count) / total * 100).toFixed(1)) : null,
      giCertifiedProductCount: Number(row.gi_certified_count),
      totalActiveProducts: total,
      source: 'products.organic, products.gi_status',
    };
  }

  /** Transition 6: Reducing food loss and waste (proxy: real cold-storage booking volume). */
  async foodLossReductionIndicator() {
    let result = await pool.query(
      `SELECT COUNT(*) AS booking_count, COALESCE(SUM(quantity_units), 0) AS total_quantity_units,
              COUNT(DISTINCT farmer_id) AS farmers_using_cold_storage
         FROM cold_storage_bookings WHERE status IN ('checked_in', 'checked_out')`
    );
    let row = result.rows[0];
    return {
      transition: 6,
      available: Number(row.booking_count) > 0,
      coldStorageBookings: Number(row.booking_count),
      totalQuantityPreservedUnits: Number(row.total_quantity_units),
      farmersUsingColdStorage: Number(row.farmers_using_cold_storage),
      note: 'Proxy metric: real cold-storage utilization, not a measured spoilage-reduction percentage — no pre/post-cold-storage loss measurement exists in this codebase.',
      source: 'cold_storage_bookings',
    };
  }

  /** Transition 7: Local loops and linkages (proxy: real marketplace order volume). */
  async localLoopsIndicator() {
    let result = await pool.query(
      `SELECT COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_gmv_inr
         FROM orders WHERE status NOT IN ('cancelled', 'refunded')`
    );
    let row = result.rows[0];
    return {
      transition: 7,
      available: Number(row.order_count) > 0,
      totalOrders: Number(row.order_count),
      totalGmvInr: Number(row.total_gmv_inr),
      source: 'orders',
    };
  }

  /** Transition 8: Harnessing the digital revolution (proxy: real platform-training adoption). */
  async digitalAdoptionIndicator() {
    let result = await pool.query(
      `SELECT COUNT(*) AS total_farmers, COUNT(*) FILTER (WHERE training_completed = TRUE) AS trained_count
         FROM farmers WHERE status = 'active'`
    );
    let row = result.rows[0];
    let total = Number(row.total_farmers);
    return {
      transition: 8,
      available: total > 0,
      trainedFarmerShare: total > 0 ? Number((Number(row.trained_count) / total * 100).toFixed(1)) : null,
      totalActiveFarmers: total,
      source: 'farmers.training_completed',
    };
  }

  /** Transition 9: Delivering stronger rural livelihoods (real FDI scores + real cooperative dividends + real DPR/financing reach). */
  async ruralLivelihoodsIndicator() {
    const fdiResult = await pool.query(
      `SELECT AVG(fdi_score) AS avg_fdi_score, COUNT(*) AS total_farmers
         FROM farmers WHERE status = 'active' AND fdi_score > 0`
    );
    const dprResult = await pool.query(
      `SELECT COUNT(*) AS dpr_count, COALESCE(SUM(financing_ask_inr), 0) AS total_financing_ask_inr
         FROM dpr_documents`
    );
    let dividendResult = { rows: [{ distribution_count: 0, total_dividends_inr: 0 }] };
    try {
      dividendResult = await pool.query(
        `SELECT COUNT(*) AS distribution_count, COALESCE(SUM(total_surplus_inr), 0) AS total_dividends_inr
           FROM fpo_profit_distributions`
      );
    } catch (error) {
      // Table exists via migration 3106 — if it hasn't been applied yet in
      // this environment, report zero rather than fail the whole indicator.
    }
    return {
      transition: 9,
      available: Number(fdiResult.rows[0].total_farmers) > 0,
      avgFarmerDevelopmentIndexScore: fdiResult.rows[0].avg_fdi_score !== null ? Number(Number(fdiResult.rows[0].avg_fdi_score).toFixed(1)) : null,
      dprGeneratedCount: Number(dprResult.rows[0].dpr_count),
      totalFinancingRequestedInr: Number(dprResult.rows[0].total_financing_ask_inr),
      cooperativeDividendDistributionCount: Number(dividendResult.rows[0].distribution_count),
      totalCooperativeDividendsInr: Number(dividendResult.rows[0].total_dividends_inr),
      source: 'farmers.fdi_score, dpr_documents, fpo_profit_distributions',
    };
  }

  /**
   * Full benchmark report: the 5 transitions this platform can honestly
   * compute real indicators for, plus explicit "not yet trackable" entries
   * for the other 5 (no data source exists — never estimated).
   */
  async getBenchmarkReport() {
    const [regenerativeAg, foodLoss, localLoops, digital, ruralLivelihoods] = await Promise.all([
      this.regenerativeAgricultureIndicator(),
      this.foodLossReductionIndicator(),
      this.localLoopsIndicator(),
      this.digitalAdoptionIndicator(),
      this.ruralLivelihoodsIndicator(),
    ]);

    const trackedTransitionIds = [2, 6, 7, 8, 9];
    const untracked = FOLU_TRANSITIONS.filter((t) => !trackedTransitionIds.includes(t.id)).map((t) => ({
      ...t,
      available: false,
      reason: 'No real, computable data source exists in this platform for this transition (e.g. diet composition, ocean/protein-diversity data, gender-disaggregated records). Not estimated.',
    }));

    return {
      framework: 'FOLU (Food and Land Use Coalition) — Ten Critical Transitions',
      frameworkSource: 'https://www.foodandlandusecoalition.org/global-report/',
      disclaimer: 'AFRERA is not affiliated with or endorsed by FOLU/WRI. This is an internal benchmark mapping this platform\'s own real, computed data onto FOLU\'s published transition categories — not an official FOLU assessment or certification.',
      generatedAt: new Date().toISOString(),
      indicators: {
        productiveAndRegenerativeAgriculture: regenerativeAg,
        reducingFoodLossAndWaste: foodLoss,
        localLoopsAndLinkages: localLoops,
        harnessingTheDigitalRevolution: digital,
        strongerRuralLivelihoods: ruralLivelihoods,
      },
      untrackedTransitions: untracked,
    };
  }
}

module.exports = new FoluBenchmarkService();
