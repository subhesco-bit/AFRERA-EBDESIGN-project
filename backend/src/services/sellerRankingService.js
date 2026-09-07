/**
 * Seller Ranking / Trust Score Service.
 *
 * PRE-BUILD GATE: "buy-box" in the Amazon sense (multiple sellers
 * competing for one product listing, with an algorithm picking a winner)
 * has no real supporting data model in this codebase. products.created_by
 * (000_base_schema.sql) makes each product row single-seller — there is
 * no product_id shared across competing seller rows on the live
 * marketplace (product_listings in 3100_ecommerce_tables.sql has a
 * multi-seller shape, but it's a separate, unconnected table with no live
 * frontend and no product_id grouping key of its own — grouping its rows
 * by free-text product_name would fabricate false product-equivalence
 * between unrelated listings). Building a fake buy-box winner-selection UI
 * on top of that would be presenting invented competitive data.
 *
 * What IS real and buildable: ranking SELLERS by real, DB-backed
 * performance data (farmers.fdi_score, fulfilled_orders, disputes,
 * years_active, certification_count, training_completed — all real
 * columns, 000_base_schema.sql / 011_farmer_portal_enhancements.sql).
 * This is the actual trust-signal component any real buy-box would need
 * as an input, and it's independently useful today for sorting search
 * results and surfacing trustworthy sellers.
 */

'use strict';

const pool = require('../database/pool');

// ASSUMED weights (no historical conversion/complaint data exists yet to
// calibrate these against real outcomes) — labeled as such rather than
// presented as a validated model. All inputs are real; only the relative
// weighting is a judgment call, same discipline as
// costControlService.js's OVER_BUDGET_THRESHOLD_PCT.
const WEIGHTS = {
  fdiScore: 0.35,        // farmers.fdi_score, already a real composite index (0-100)
  fulfillmentRate: 0.30, // fulfilled_orders relative to disputes
  experience: 0.15,      // years_active, capped
  certification: 0.10,   // certification_count, capped
  training: 0.10,        // training_completed boolean
};

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

/** Real, deterministic trust score (0-100) from a farmer's actual recorded performance columns. */
function computeTrustScore(farmer) {
  const fdiComponent = clamp(Number(farmer.fdi_score) || 0, 0, 100);

  const fulfilled = Number(farmer.fulfilled_orders) || 0;
  const disputes = Number(farmer.disputes) || 0;
  const totalOrders = fulfilled + disputes;
  const fulfillmentComponent = totalOrders > 0 ? (fulfilled / totalOrders) * 100 : 50; // neutral midpoint for no history, not a guess at quality

  const experienceComponent = clamp((Number(farmer.years_active) || 0) / 10 * 100, 0, 100); // 10+ years = full marks

  const certificationComponent = clamp((Number(farmer.certification_count) || 0) / 5 * 100, 0, 100); // 5+ certs = full marks

  const trainingComponent = farmer.training_completed ? 100 : 0;

  const score =
    fdiComponent * WEIGHTS.fdiScore +
    fulfillmentComponent * WEIGHTS.fulfillmentRate +
    experienceComponent * WEIGHTS.experience +
    certificationComponent * WEIGHTS.certification +
    trainingComponent * WEIGHTS.training;

  return {
    trustScore: Number(score.toFixed(1)),
    components: {
      fdiComponent: Number(fdiComponent.toFixed(1)),
      fulfillmentComponent: Number(fulfillmentComponent.toFixed(1)),
      experienceComponent: Number(experienceComponent.toFixed(1)),
      certificationComponent: Number(certificationComponent.toFixed(1)),
      trainingComponent,
    },
    dataAvailable: totalOrders > 0 || Number(farmer.years_active) > 0 || Number(farmer.certification_count) > 0,
    weightsNote: 'Relative weights are an assumed starting point, not calibrated against real conversion/complaint outcomes — recalibrate once enough order history exists.',
  };
}

class SellerRankingService {
  async getSellerTrustScore(userId) {
    const result = await pool.query('SELECT * FROM farmers WHERE user_id = $1', [userId]);
    if (result.rows.length === 0) throw new Error('No farmer/seller profile found for this user');
    return { userId, ...computeTrustScore(result.rows[0]) };
  }

  /**
   * Real sellers ranked by trust score, optionally scoped to sellers who
   * have at least one active product in a category (real join against
   * products, not invented).
   */
  async getRankedSellers({ categoryId, stateId, limit = 20 } = {}) {
    const conditions = ['f.status = $1'];
    const params = ['active'];
    let joinClause = '';

    if (categoryId || stateId) {
      joinClause = 'JOIN products p ON p.created_by = f.user_id AND p.is_active = TRUE';
      if (categoryId) { params.push(categoryId); conditions.push(`p.category_id = $${params.length}`); }
      if (stateId) { params.push(stateId); conditions.push(`p.state_id = $${params.length}`); }
    }

    const result = await pool.query(
      `SELECT DISTINCT f.id, f.user_id, u.name, f.fdi_score, f.fulfilled_orders, f.disputes,
              f.years_active, f.certification_count, f.training_completed
         FROM farmers f
         JOIN users u ON u.id = f.user_id
         ${joinClause}
        WHERE ${conditions.join(' AND ')}`,
      params
    );

    const ranked = result.rows
      .map((farmer) => ({
        farmerId: farmer.id,
        userId: farmer.user_id,
        name: farmer.name,
        ...computeTrustScore(farmer),
      }))
      .sort((a, b) => b.trustScore - a.trustScore)
      .slice(0, limit);

    return ranked;
  }
}

module.exports = new SellerRankingService();
