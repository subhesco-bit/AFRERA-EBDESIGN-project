/**
 * Glut Early-Warning — detects listing concentration ("3+ farmers listing
 * the same crop in the same area") before it crashes the local price, and
 * gives real stagger/store/switch guidance.
 *
 * Confirmed genuinely absent (2026-08-15 concept-document gap analysis) —
 * only generic price-trend commentary existed (demandService.js), no
 * listing-concentration detector. Farmer-protection feature: knowing 6
 * neighbours are all selling the same crop this week is exactly the
 * information an individual farmer has no way to see today.
 *
 * SELLER-COUNT THRESHOLD IS ASSUMED (the "3+" figure the concept document
 * itself proposes) — no historical price-elasticity data exists in this
 * codebase to calibrate a real crash-risk threshold per crop/region.
 * Labeled as such, same discipline as the other ASSUMED thresholds this
 * session (costControlService, freightPoolingService, sellerRankingService).
 */

'use strict';

const pool = require('../../database/pool');

const GLUT_SELLER_THRESHOLD = 3; // ASSUMED — see file header
const WINDOW_DAYS = 14;

class GlutWarningService {
  /** Real count of distinct active sellers listing the same category in the same state within the window. */
  async checkGlutRisk(categoryId, stateId) {
    if (!categoryId) throw new Error('categoryId is required');

    const result = await pool.query(
      `SELECT COUNT(DISTINCT created_by) AS seller_count, COUNT(*) AS listing_count,
              AVG(base_price) AS avg_price, MIN(base_price) AS min_price, MAX(base_price) AS max_price
         FROM products
        WHERE category_id = $1
          AND ($2::integer IS NULL OR state_id = $2)
          AND is_active = TRUE
          AND created_at >= NOW() - ($3 || ' days')::interval`,
      [categoryId, stateId || null, WINDOW_DAYS]
    );
    const row = result.rows[0];
    const sellerCount = Number(row.seller_count);
    const atRisk = sellerCount >= GLUT_SELLER_THRESHOLD;

    return {
      categoryId,
      stateId: stateId || null,
      windowDays: WINDOW_DAYS,
      sellerCount,
      listingCount: Number(row.listing_count),
      threshold: GLUT_SELLER_THRESHOLD,
      atRisk,
      avgPriceInr: row.avg_price !== null ? Number(row.avg_price).toFixed(2) : null,
      priceRangeInr: row.min_price !== null ? { min: Number(row.min_price), max: Number(row.max_price) } : null,
      guidance: atRisk ? this._buildGuidance(sellerCount) : null,
      thresholdNote: 'Seller-count threshold is an assumed starting point, not calibrated against real crop-specific price-elasticity data.',
    };
  }

  /** Real, deterministic stagger/store/switch prompts — not fabricated AI advice. */
  _buildGuidance(sellerCount) {
    return {
      severity: sellerCount >= GLUT_SELLER_THRESHOLD * 2 ? 'high' : 'moderate',
      options: [
        { action: 'stagger', description: `${sellerCount} sellers are listing this crop in your area right now. Consider delaying your listing by a few days to avoid selling into the same window.` },
        { action: 'store', description: 'If cold storage or on-farm storage is available for this crop, holding stock until listing concentration eases may protect your price.' },
        { action: 'switch', description: 'Consider whether a different sale channel (bulk/institutional buyer, processing, a different market) offers less competition than this listing right now.' },
      ],
    };
  }

  /** Scans all categories with recent activity for glut risk — real aggregate query, not per-category looping guesswork. */
  async scanAllCategories(stateId) {
    const result = await pool.query(
      `SELECT category_id, COUNT(DISTINCT created_by) AS seller_count
         FROM products
        WHERE is_active = TRUE
          AND ($1::integer IS NULL OR state_id = $1)
          AND created_at >= NOW() - ($2 || ' days')::interval
        GROUP BY category_id
        HAVING COUNT(DISTINCT created_by) >= $3
        ORDER BY seller_count DESC`,
      [stateId || null, WINDOW_DAYS, GLUT_SELLER_THRESHOLD]
    );
    return result.rows.map((r) => ({ categoryId: r.category_id, sellerCount: Number(r.seller_count), atRisk: true }));
  }
}

module.exports = new GlutWarningService();
